package tests

import (
	"bytes"
	"context"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"testing"

	"github.com/samusafe/genericapi/internal/httpclient"
	"github.com/samusafe/genericapi/internal/models"
	"github.com/samusafe/genericapi/internal/services"
)

// mockRepo implements AnalysisRepository with minimal behavior for tests.
type mockRepo struct {
	findDocID           int
	findErr             error
	latest              *models.AnalysisDetail
	insertDocCalls      int
	insertAnalysisCalls int
	listAllFn           func(userID string, limit, offset int) ([]models.DocumentItem, int, error)
}

func (m *mockRepo) InsertDocument(userID string, collectionID *int, fileName, fullText string, contentHash string) (int, error) {
	m.insertDocCalls++
	return 101, nil
}
func (m *mockRepo) InsertAnalysis(userID string, documentID int, summary string, keywords []string, sentiment string, summaryPoints []string, batchID *string, batchSize *int) (int, error) {
	m.insertAnalysisCalls++
	return 201, nil
}
func (m *mockRepo) FindDocument(userID string, collectionID *int, contentHash string) (int, error) {
	return m.findDocID, m.findErr
}
func (m *mockRepo) GetLatestAnalysisByDocument(userID string, documentID int) (*models.AnalysisDetail, error) {
	return m.latest, nil
}
func (m *mockRepo) ListDocumentsByCollection(userID string, collectionID *int) ([]models.DocumentItem, error) {
	return nil, nil
}
func (m *mockRepo) ListAllDocuments(userID string, limit, offset int) ([]models.DocumentItem, int, error) {
	if m.listAllFn != nil {
		return m.listAllFn(userID, limit, offset)
	}
	return nil, 0, nil
}
func (m *mockRepo) UpdateDocumentCollection(userID string, documentID int, collectionID int) error {
	return nil
}

// mockPythonClient simulates python client responses.
type mockPythonClient struct {
	respBody string
	respErr  error
	status   int
}

func (m *mockPythonClient) AnalyzeWithCtx(ctx context.Context, file []byte, filename string, correlationID string) (*http.Response, error) {
	if m.respErr != nil {
		return nil, m.respErr
	}
	if m.status == 0 {
		m.status = http.StatusOK
	}
	return &http.Response{StatusCode: m.status, Body: io.NopCloser(bytes.NewBufferString(m.respBody))}, nil
}
func (m *mockPythonClient) GenerateQuizWithCtx(ctx context.Context, body []byte, correlationID string) (*http.Response, error) {
	return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(bytes.NewBufferString(`{"questions":[]}`))}, nil
}

// memFile implements multipart.File (Read, ReadAt, Seek, Close)
type memFile struct {
	data []byte
	off  int64
}

func (m *memFile) Read(p []byte) (int, error) {
	if m.off >= int64(len(m.data)) {
		return 0, io.EOF
	}
	n := copy(p, m.data[m.off:])
	m.off += int64(n)
	return n, nil
}
func (m *memFile) ReadAt(p []byte, off int64) (int, error) {
	if off >= int64(len(m.data)) {
		return 0, io.EOF
	}
	n := copy(p, m.data[off:])
	if n < len(p) {
		return n, io.EOF
	}
	return n, nil
}
func (m *memFile) Seek(offset int64, whence int) (int64, error) {
	var base int64
	switch whence {
	case io.SeekStart:
		base = 0
	case io.SeekCurrent:
		base = m.off
	case io.SeekEnd:
		base = int64(len(m.data))
	default:
		return 0, errors.New("bad whence")
	}
	n := base + offset
	if n < 0 {
		return 0, errors.New("neg pos")
	}
	m.off = n
	return n, nil
}
func (m *memFile) Close() error { return nil }

// mockFileOpener returns an in-memory reader for provided content map.
type mockFileOpener struct{ contents map[string]string }

func (m mockFileOpener) Open(fh *multipart.FileHeader) (multipart.File, error) {
	if v, ok := m.contents[fh.Filename]; ok {
		return &memFile{data: []byte(v)}, nil
	}
	return nil, errors.New("not found")
}

// helper to build a *multipart.FileHeader without disk IO
func buildMemFileHeader(name string, content string) *multipart.FileHeader {
	return &multipart.FileHeader{Filename: name, Size: int64(len(content))}
}

func TestAnalyze_ReusedFlow(t *testing.T) {
	repo := &mockRepo{findDocID: 1, latest: &models.AnalysisDetail{Summary: "cached sum", Keywords: []string{"k"}, Sentiment: "pos", FullText: "full"}}
	py := &mockPythonClient{}
	opener := mockFileOpener{contents: map[string]string{"doc.txt": "content"}}
	service := services.NewAnalyzerServiceFull(repo, py, opener)
	res := service.AnalyzeFilesWithContext(context.Background(), []*multipart.FileHeader{buildMemFileHeader("doc.txt", "content")}, "en", "user", nil)
	if len(res) != 1 {
		t.Fatalf("expected 1 result, got %d", len(res))
	}
	if !res[0].Reused {
		t.Fatalf("expected reused=true, got false")
	}
	if res[0].Data == nil || res[0].Data.Summary != "cached sum" {
		t.Fatalf("expected summary 'cached sum', got %+v", res[0].Data)
	}
	if repo.insertAnalysisCalls == 0 {
		t.Fatalf("expected an analysis insert call for history")
	}
}

func TestAnalyze_PythonError(t *testing.T) {
	repo := &mockRepo{findDocID: 0}
	py := &mockPythonClient{respErr: httpclient.ErrPythonUnavailable}
	opener := mockFileOpener{contents: map[string]string{"doc.txt": "content"}}
	service := services.NewAnalyzerServiceFull(repo, py, opener)
	res := service.AnalyzeFilesWithContext(context.Background(), []*multipart.FileHeader{buildMemFileHeader("doc.txt", "content")}, "en", "user", nil)
	if len(res) != 1 || res[0].Error == "" {
		t.Fatalf("expected python error propagated in result")
	}
}

func TestAnalyze_UnsupportedExtension(t *testing.T) {
	repo := &mockRepo{}
	py := &mockPythonClient{respBody: `{"summary":"s","keywords":[],"sentiment":"neutral","full_text":"x"}`}
	opener := mockFileOpener{contents: map[string]string{"doc.exe": "content"}}
	service := services.NewAnalyzerServiceFull(repo, py, opener)
	res := service.AnalyzeFilesWithContext(context.Background(), []*multipart.FileHeader{buildMemFileHeader("doc.exe", "content")}, "en", "user", nil)
	if len(res) != 1 || res[0].Error == "" {
		t.Fatalf("expected unsupported file type error")
	}
	if repo.insertDocCalls != 0 {
		t.Fatalf("expected no document insertion for unsupported type")
	}
}

func TestAnalyze_NewDocumentSuccess(t *testing.T) {
	repo := &mockRepo{findDocID: 0}
	py := &mockPythonClient{respBody: `{"summary":"ok","keywords":["a"],"sentiment":"neutral","fullText":"full content"}`}
	opener := mockFileOpener{contents: map[string]string{"doc.txt": "content"}}
	service := services.NewAnalyzerServiceFull(repo, py, opener)
	res := service.AnalyzeFilesWithContext(context.Background(), []*multipart.FileHeader{buildMemFileHeader("doc.txt", "content")}, "en", "user", nil)
	if len(res) != 1 {
		t.Fatalf("expected 1 result, got %d", len(res))
	}
	if res[0].Error != "" {
		t.Fatalf("no error expected, got %s", res[0].Error)
	}
	if res[0].Reused {
		t.Fatalf("expected reused=false")
	}
	if res[0].Data == nil || res[0].Data.Summary != "ok" {
		t.Fatalf("unexpected data: %+v", res[0].Data)
	}
	if repo.insertDocCalls == 0 || repo.insertAnalysisCalls == 0 {
		t.Fatalf("expected inserts doc=%d analysis=%d", repo.insertDocCalls, repo.insertAnalysisCalls)
	}
}

// ensure mockPythonClient errors propagate classification
func TestAnalyze_PythonBadStatus(t *testing.T) {
	badStatusErr := httpclient.ErrBadStatus
	repo := &mockRepo{findDocID: 0}
	py := &mockPythonClient{respErr: badStatusErr}
	opener := mockFileOpener{contents: map[string]string{"doc.txt": "content"}}
	service := services.NewAnalyzerServiceFull(repo, py, opener)
	res := service.AnalyzeFilesWithContext(context.Background(), []*multipart.FileHeader{buildMemFileHeader("doc.txt", "content")}, "en", "user", nil)
	if len(res) != 1 || res[0].Error == "" {
		t.Fatalf("expected error for bad status")
	}
	if !errors.Is(py.respErr, httpclient.ErrBadStatus) && py.respErr != httpclient.ErrPythonUnavailable {
		t.Fatalf("unexpected error type classification")
	}
}
