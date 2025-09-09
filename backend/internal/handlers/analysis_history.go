package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/config"
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

// SaveDocumentToCollection assigns an uncategorized document to a collection.
func (h *AnalysisHistoryHandler) SaveDocumentToCollection(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		DocumentID   int `json:"documentId"`
		CollectionID int `json:"collectionId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", nil)
		return
	}

	exists, err := h.CollectionsRepo.ExistsForUser(userID, req.CollectionID)
	if err != nil {
		utils.GinError(c, http.StatusInternalServerError, "InternalError", err)
		return
	}
	if !exists {
		utils.GinMsg(c, http.StatusNotFound, "NotFound")
		return
	}

	err = h.Repo.UpdateDocumentCollection(userID, req.DocumentID, req.CollectionID)
	if err != nil {
		if err.Error() == "already_assigned" {
			utils.GinError(c, http.StatusConflict, "DocumentAlreadyInCollection", nil)
		} else {
			utils.GinError(c, http.StatusInternalServerError, "InternalError", err)
		}
		return
	}

	utils.GinMsg(c, http.StatusOK, "DocumentSaved")
}

func (h *AnalysisHistoryHandler) GetLatestByDocument(c *gin.Context) {
	userID := c.GetString("userID")

	docID, err := strconv.Atoi(c.Param("documentId"))
	if err != nil {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", nil)
		return
	}

	analysis, err := h.Repo.GetLatestAnalysisByDocument(userID, docID)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.GinMsg(c, http.StatusNotFound, "NotFound")
		} else {
			utils.GinError(c, http.StatusInternalServerError, "InternalError", err)
		}
		return
	}

	utils.GinData(c, http.StatusOK, gin.H{"analysis": analysis})
}

func (h *AnalysisHistoryHandler) ListAllDocuments(c *gin.Context) {
	userID := c.GetString("userID")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	allowedLimits := make(map[int]bool)
	for _, l := range config.AllowedPageLimits {
		allowedLimits[l] = true
	}

	if _, ok := allowedLimits[limit]; !ok {
		limit = config.AllowedPageLimits[0]
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	items, total, err := h.Repo.ListAllDocuments(userID, limit, offset)
	if err != nil {
		utils.GinError(c, http.StatusInternalServerError, "InternalError", err)
		return
	}

	utils.GinData(c, http.StatusOK, gin.H{"items": items, "total": total})
}
