package analyze

import (
	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/handlers"
)

// RegisterAnalyzeRoutes sets up the routes for the analysis feature.
func RegisterAnalyzeRoutes(r gin.IRoutes, h *handlers.AnalyzeHandler) {
	r.POST("/analyze", h.Analyze)
	r.POST("/generate-quiz", h.GenerateQuiz)
}
