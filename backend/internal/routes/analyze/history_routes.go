package analyze

import (
	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/handlers"
)

func RegisterHistoryRoutes(r gin.IRoutes, h *handlers.AnalysisHistoryHandler) {
	r.GET("/documents/:documentId/latest-analysis", h.GetLatestByDocument)
	r.GET("/documents", h.ListAllDocuments)
	r.POST("/documents/save", h.SaveDocumentToCollection)
}
