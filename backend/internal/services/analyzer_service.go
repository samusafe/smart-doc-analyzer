package services

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"mime/multipart"
	"path"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/samusafe/genericapi/internal/config"
	"github.com/samusafe/genericapi/internal/httpclient"
	"github.com/samusafe/genericapi/internal/models"
	"github.com/samusafe/genericapi/internal/repositories"
	"github.com/samusafe/genericapi/internal/utils"
)

// Analyzer service overview (flow):
// 1. For each file (parallel goroutines) validate extension (whitelist) early → fast fail.
// 2. Open + buffer file once while hashing (sha256) to compute content hash.
// 3. Reuse path: if (user, optional collection, contentHash) already exists → fetch latest analysis
//    and still insert a new analysis history row (audit / batch grouping) then return reused=true.
// 4. New path: call Python microservice; classify transport errors into a generic user‑facing
//    "PythonServiceUnavailable" (details stay in logs). On success persist document + analysis.
// 5. Always include timing + reused flag in structured logs (cid correlation).
// Quiz generation is a simple passthrough (no persistence) guarded at handler level by length limit.

// FileOpener abstraction enables in‑memory test doubles (avoids disk IO in tests).
type FileOpener interface {
	Open(*multipart.FileHeader) (multipart.File, error)
}

type defaultFileOpener struct{}

func (defaultFileOpener) Open(fh *multipart.FileHeader) (multipart.File, error) { return fh.Open() }

// AnalyzerServiceInterface exported for handler/service boundary & test mocks.
type AnalyzerServiceInterface interface {
	AnalyzeFiles(files []*multipart.FileHeader, lang string, userID string, collectionID *int) []models.AnalysisResult
	AnalyzeFilesWithContext(ctx context.Context, files []*multipart.FileHeader, lang string, userID string, collectionID *int) []models.AnalysisResult
	GenerateQuiz(text string, lang string) (*models.QuizResponse, error)
	GenerateQuizWithContext(ctx context.Context, text string, lang string) (*models.QuizResponse, error)
}

// concrete implementation (not exported)
type analyzerService struct {
	analysisRepo repositories.AnalysisRepository
	pyClient     httpclient.PythonClient
	fileOpener   FileOpener
}

// Factory helpers (tiered for differing injection depth: prod vs tests)
func NewAnalyzerService() AnalyzerServiceInterface {
	return &analyzerService{analysisRepo: repositories.NewAnalysisRepository(), pyClient: httpclient.NewPythonClient(config.PythonServiceURL, config.HTTPClientTimeout), fileOpener: defaultFileOpener{}}
}
func NewAnalyzerServiceWithRepo(repo repositories.AnalysisRepository) AnalyzerServiceInterface {
	return &analyzerService{analysisRepo: repo, pyClient: httpclient.NewPythonClient(config.PythonServiceURL, config.HTTPClientTimeout), fileOpener: defaultFileOpener{}}
}
func NewAnalyzerServiceWithDeps(repo repositories.AnalysisRepository, py httpclient.PythonClient) AnalyzerServiceInterface {
	return &analyzerService{analysisRepo: repo, pyClient: py, fileOpener: defaultFileOpener{}}
}
func NewAnalyzerServiceFull(repo repositories.AnalysisRepository, py httpclient.PythonClient, opener FileOpener) AnalyzerServiceInterface {
	if opener == nil {
		opener = defaultFileOpener{}
	}
	return &analyzerService{analysisRepo: repo, pyClient: py, fileOpener: opener}
}

// bufferAndHash reads the stream once producing both full bytes and a sha256 hex hash.
func bufferAndHash(r io.Reader) ([]byte, string, error) {
	var buf bytes.Buffer
	tee := io.TeeReader(r, &buf)
	h := sha256.New()
	if _, err := io.Copy(h, tee); err != nil {
		return nil, "", err
	}
	return buf.Bytes(), hex.EncodeToString(h.Sum(nil)), nil
}

// AnalyzeFiles public convenience without external ctx.
func (s *analyzerService) AnalyzeFiles(files []*multipart.FileHeader, lang string, userID string, collectionID *int) []models.AnalysisResult {
	return s.AnalyzeFilesWithContext(context.Background(), files, lang, userID, collectionID)
}

func (s *analyzerService) AnalyzeFilesWithContext(ctx context.Context, files []*multipart.FileHeader, lang string, userID string, collectionID *int) []models.AnalysisResult {
	var wg sync.WaitGroup
	resultsChan := make(chan models.AnalysisResult, len(files))
	var batchID *string
	var batchSize *int
	if len(files) > 1 {
		id := uuid.New().String()
		batchID = &id
		sz := len(files)
		batchSize = &sz
	}

	for _, file := range files {
		wg.Add(1)
		go func(fh *multipart.FileHeader) {
			defer wg.Done()
			resultsChan <- s.analyzeSingleFile(ctx, fh, lang, userID, collectionID, batchID, batchSize)
		}(file)
	}

	// Wait for all goroutines to finish.
	wg.Wait()
	close(resultsChan)

	// Collect all results from the channel.
	var finalResults []models.AnalysisResult
	for r := range resultsChan {
		finalResults = append(finalResults, r)
	}
	return finalResults
}

// analyzeSingleFile encapsulates per-file branching (unsupported, reuse, remote new, failure).
func (s *analyzerService) analyzeSingleFile(ctx context.Context, fileHeader *multipart.FileHeader, lang string, userID string, collectionID *int, batchID *string, batchSize *int) models.AnalysisResult {
	start := time.Now()
	cid := utils.CorrelationIDFromCtx(ctx)

	// Validate file type
	ext := strings.ToLower(path.Ext(fileHeader.Filename))
	if !slices.Contains(config.SupportedFileTypes, ext) {
		log.Info().Str("cid", cid).Str("file", fileHeader.Filename).Str("ext", ext).Msg("skip unsupported file type")
		return models.AnalysisResult{FileName: fileHeader.Filename, Error: utils.GetMessage(lang, "UnsupportedFileType")}
	}

	f, err := s.fileOpener.Open(fileHeader)
	if err != nil {
		log.Error().Str("cid", cid).Str("file", fileHeader.Filename).Err(err).Msg("open file error")
		return models.AnalysisResult{FileName: fileHeader.Filename, Error: utils.GetMessage(lang, "InternalError")}
	}
	defer f.Close()

	origBytes, contentHash, err := bufferAndHash(f)
	if err != nil {
		log.Error().Str("cid", cid).Str("file", fileHeader.Filename).Err(err).Msg("hash file error")
		return models.AnalysisResult{FileName: fileHeader.Filename, Error: utils.GetMessage(lang, "InternalError")}
	}

	// Reuse path (only if a valid docID was found and existing analysis exists)
	if docID, err := s.analysisRepo.FindDocument(userID, collectionID, contentHash); err == nil && docID > 0 {
		if existing, err2 := s.analysisRepo.GetLatestAnalysisByDocument(userID, docID); err2 == nil && existing != nil {
			_, _ = s.analysisRepo.InsertAnalysis(userID, docID, existing.Summary, existing.Keywords, existing.Sentiment, existing.SummaryPoints, batchID, batchSize)
			log.Info().Str("cid", cid).Str("file", fileHeader.Filename).Bool("reused", true).Dur("duration", time.Since(start)).Msg("analysis reused")
			return models.AnalysisResult{FileName: fileHeader.Filename, Reused: true, Data: &models.AnalysisResponse{Summary: existing.Summary, Keywords: existing.Keywords, Sentiment: existing.Sentiment, FullText: existing.FullText, SummaryPoints: existing.SummaryPoints}}
		}
	}

	// Remote analyze
	resp, err := s.pyClient.AnalyzeWithCtx(ctx, origBytes, fileHeader.Filename, cid)
	if err != nil {
		errType := "python_unavailable"
		if errors.Is(err, httpclient.ErrBadStatus) {
			errType = "python_bad_status"
		}
		log.Error().Str("cid", cid).Str("file", fileHeader.Filename).Str("errorType", errType).Err(err).Dur("duration", time.Since(start)).Msg("python analyze error")
		return models.AnalysisResult{FileName: fileHeader.Filename, Error: utils.GetMessage(lang, "PythonServiceUnavailable")}
	}
	defer resp.Body.Close()

	var out models.AnalysisResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		log.Error().Str("cid", cid).Str("file", fileHeader.Filename).Err(err).Dur("duration", time.Since(start)).Msg("decode python response error")
		return models.AnalysisResult{FileName: fileHeader.Filename, Error: utils.GetMessage(lang, "InternalError")}
	}

	analysisData := models.AnalysisResponse{Summary: out.Summary, Keywords: out.Keywords, Sentiment: out.Sentiment, FullText: out.FullText, SummaryPoints: out.SummaryPoints}
	if out.FullText != "" {
		if docID, err := s.analysisRepo.InsertDocument(userID, collectionID, fileHeader.Filename, out.FullText, contentHash); err == nil {
			_, _ = s.analysisRepo.InsertAnalysis(userID, docID, out.Summary, out.Keywords, out.Sentiment, out.SummaryPoints, batchID, batchSize)
		}
	}
	log.Info().Str("cid", cid).Str("file", fileHeader.Filename).Bool("reused", false).Dur("duration", time.Since(start)).Msg("analysis complete")
	return models.AnalysisResult{FileName: fileHeader.Filename, Data: &analysisData}
}

// Quiz generation: simple proxy (no persistence / reuse path).
func (s *analyzerService) GenerateQuiz(text string, lang string) (*models.QuizResponse, error) {
	return s.GenerateQuizWithContext(context.Background(), text, lang)
}
func (s *analyzerService) GenerateQuizWithContext(ctx context.Context, text string, lang string) (*models.QuizResponse, error) {
	requestBody, err := json.Marshal(map[string]string{"text": text})
	if err != nil {
		return nil, err
	}
	cid := utils.CorrelationIDFromCtx(ctx)
	resp, err := s.pyClient.GenerateQuizWithCtx(ctx, requestBody, cid)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var quizResp models.QuizResponse
	if err := json.NewDecoder(resp.Body).Decode(&quizResp); err != nil {
		return nil, err
	}
	return &quizResp, nil
}
