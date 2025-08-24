package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/repositories"
	"github.com/samusafe/genericapi/internal/utils"
)

type AnalysisHistoryHandler struct {
	Repo            repositories.AnalysisRepository
	CollectionsRepo repositories.CollectionsRepository
}

func NewAnalysisHistoryHandler(analysisRepo repositories.AnalysisRepository, collectionsRepo repositories.CollectionsRepository) *AnalysisHistoryHandler {
	return &AnalysisHistoryHandler{Repo: analysisRepo, CollectionsRepo: collectionsRepo}
}

// GetLatestByDocument returns the most recent analysis for a document
func (h *AnalysisHistoryHandler) GetLatestByDocument(c *gin.Context) {
	userID := c.GetString("userID")
	id, ok := parsePositiveIntParam(c, "documentId")
	if !ok {
		return
	}
	detail, err := h.Repo.GetLatestAnalysisByDocument(userID, id)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.GinError(c, http.StatusNotFound, "NotFound", err.Error())
			return
		}
		utils.GinError(c, http.StatusInternalServerError, "InternalError", err.Error())
		return
	}
	utils.GinData(c, http.StatusOK, gin.H{"analysis": detail})
}

// ListAllDocuments returns all documents (with or without collection) for the user ordered by last analysis desc.
func (h *AnalysisHistoryHandler) ListAllDocuments(c *gin.Context) {
	userID := c.GetString("userID")
	docs, err := h.Repo.ListAllDocuments(userID)
	if err != nil {
		utils.GinError(c, http.StatusInternalServerError, "InternalError", err.Error())
		return
	}
	utils.GinData(c, http.StatusOK, gin.H{"items": docs, "total": len(docs)})
}

// SaveDocumentToCollection assigns an uncategorized document to a collection.
func (h *AnalysisHistoryHandler) SaveDocumentToCollection(c *gin.Context) {
	userID := c.GetString("userID")
	var body struct {
		DocumentID   int `json:"documentId"`
		CollectionID int `json:"collectionId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.DocumentID <= 0 || body.CollectionID <= 0 {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", err.Error())
		return
	}
	exists, err := h.CollectionsRepo.ExistsForUser(userID, body.CollectionID)
	if err != nil {
		utils.GinError(c, http.StatusInternalServerError, "InternalError", err.Error())
		return
	}
	if !exists {
		utils.GinError(c, http.StatusNotFound, "NotFound", "collection not found for user")
		return
	}
	if err := h.Repo.UpdateDocumentCollection(userID, body.DocumentID, body.CollectionID); err != nil {
		if errors.Is(err, sql.ErrNoRows) || err.Error() == "already_assigned" {
			utils.GinError(c, http.StatusConflict, "DocumentAlreadyInCollection", err.Error())
			return
		}
		utils.GinError(c, http.StatusInternalServerError, "InternalError", err.Error())
		return
	}
	utils.GinMsg(c, http.StatusOK, "DocumentSaved")
}
