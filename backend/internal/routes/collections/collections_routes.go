package collections

import (
	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/handlers"
)

type CollectionsRoutes struct {
	Handler *handlers.CollectionsHandler
}

func Register(r gin.IRoutes, h *handlers.CollectionsHandler) {
	r.GET("/collections", h.List)
	r.POST("/collections", h.Create)
	r.DELETE("/collections/:id", h.Delete)
	r.GET("/collections/:id/documents", h.ListDocuments)
}
