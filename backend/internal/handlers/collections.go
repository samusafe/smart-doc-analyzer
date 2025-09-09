package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/repositories"
	"github.com/samusafe/genericapi/internal/utils"
)

type CollectionsHandler struct {
	Repo         repositories.CollectionsRepository
	AnalysisRepo repositories.AnalysisRepository
}

func NewCollectionsHandler(repo repositories.CollectionsRepository, analysisRepo repositories.AnalysisRepository) *CollectionsHandler {
	return &CollectionsHandler{Repo: repo, AnalysisRepo: analysisRepo}
}

func (h *CollectionsHandler) List(c *gin.Context) {
	userID := c.GetString("userID")
	cols, err := h.Repo.List(userID)
	if err != nil {
		utils.GinError(c, http.StatusInternalServerError, "InternalError", err.Error())
		return
	}
	utils.GinData(c, http.StatusOK, gin.H{"collections": cols})
}

func (h *CollectionsHandler) Create(c *gin.Context) {
	userID := c.GetString("userID")
	var body struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", err.Error())
		return
	}
	col, err := h.Repo.Create(userID, body.Name)
	if err != nil {
		if err.Error() == "exists" {
			utils.GinError(c, http.StatusConflict, "CollectionExists", nil)
		} else {
			utils.GinError(c, http.StatusBadRequest, "CollectionInvalidName", err.Error())
		}
		return
	}

	utils.GinData(c, http.StatusCreated, gin.H{"collection": col})
}

func (h *CollectionsHandler) Delete(c *gin.Context) {
	userID := c.GetString("userID")
	id, ok := parsePositiveIntParam(c, "id")
	if !ok {
		return
	}
	if err := h.Repo.Delete(userID, id); err != nil {
		if err == sql.ErrNoRows {
			utils.GinMsg(c, http.StatusNotFound, "NotFound")
		} else {
			utils.GinError(c, http.StatusInternalServerError, "InternalError", err)
		}
		return
	}

	utils.GinMsg(c, http.StatusOK, "CollectionDeleted")
}

func (h *CollectionsHandler) ListDocuments(c *gin.Context) {
	userID := c.GetString("userID")

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		utils.GinError(c, http.StatusBadRequest, "InvalidRequest", nil)
		return
	}

	exists, err := h.Repo.ExistsForUser(userID, id)
	if err != nil {
		utils.GinError(c, http.StatusInternalServerError, "InternalError", err)
		return
	}
	if !exists {
		utils.GinMsg(c, http.StatusNotFound, "NotFound")
		return
	}

	docs, err := h.AnalysisRepo.ListDocumentsByCollection(userID, &id)
	if err != nil {
		utils.GinError(c, http.StatusInternalServerError, "InternalError", err)
		return
	}
	start, end := paginateSlice(len(docs), 50, c)
	utils.GinData(c, http.StatusOK, gin.H{"items": docs[start:end], "total": len(docs)})
}
