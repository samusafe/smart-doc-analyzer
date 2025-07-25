package base

import (
	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/handlers"
)

func RegisterBaseRoutes(r *gin.Engine) {
	r.GET("/health", handlers.Health)
}
