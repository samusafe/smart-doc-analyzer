package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/config"
	"github.com/samusafe/genericapi/internal/i18n"
	"github.com/samusafe/genericapi/internal/services"
	"github.com/samusafe/genericapi/internal/utils"
)

// AnalyzeHandler handles the HTTP requests for file analysis.
type AnalyzeHandler struct {
	Service services.AnalyzerServiceInterface
}

// NewAnalyzeHandler creates a new instance of AnalyzeHandler.
func NewAnalyzeHandler(service services.AnalyzerServiceInterface) *AnalyzeHandler {
	return &AnalyzeHandler{
		Service: service,
	}
}

// Analyze is the main handler function for the /analyze endpoint.
// Its only job is to handle the request/response cycle and call the service.
func (h *AnalyzeHandler) Analyze(c *gin.Context) {
	lang := c.GetString("lang")
	userID := c.GetString("userID")
	cid := c.GetString(utils.CorrelationIDHeader)

	files, ok := validateUploadedFiles(c, "documents", 10)
	if !ok {
		return
	}
	collectionID := parseCollectionIDForm(c, "collectionId")

	var total int64
	for _, f := range files {
		total += f.Size
		if total > config.MaxUploadBytes {
			utils.GinError(c, http.StatusBadRequest, "InvalidRequest", "total size exceeds limit")
			return
		}
	}

	ctx := utils.WithCorrelationID(c.Request.Context(), cid)
	results := h.Service.AnalyzeFilesWithContext(ctx, files, lang, userID, collectionID)

	// Check for Python service unavailability
	pyServiceUnavailable := false
	for _, result := range results {
		if result.Error == i18n.GetMessage(lang, "PythonServiceUnavailable") {
			pyServiceUnavailable = true
			break
		}
	}

	if pyServiceUnavailable {
		utils.GinError(c, http.StatusServiceUnavailable, "PythonServiceUnavailable", results)
		return
	}

	utils.GinData(c, http.StatusOK, gin.H{"results": results})
}

// GenerateQuiz handles the request to generate a quiz from text.
func (h *AnalyzeHandler) GenerateQuiz(c *gin.Context) {
	lang := c.GetString("lang")
	cid := c.GetString(utils.CorrelationIDHeader)

	var requestBody struct {
		Text string `json:"text"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", err.Error())
		return
	}

	if requestBody.Text == "" {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", "empty text")
		return
	}

	// Input size guard using config.QuizMaxChars
	if len(requestBody.Text) > config.QuizMaxChars {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", "text too large")
		return
	}

	ctx := utils.WithCorrelationID(c.Request.Context(), cid)
	quiz, err := h.Service.GenerateQuizWithContext(ctx, requestBody.Text, lang)
	if err != nil {
		utils.GinError(c, http.StatusInternalServerError, "InternalError", err.Error())
		return
	}

	utils.GinData(c, http.StatusOK, quiz)
}
