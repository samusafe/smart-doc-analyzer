package user

import (
	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/handlers"
	"github.com/samusafe/genericapi/internal/middleware"
)

func RegisterUserRoutes(r *gin.Engine) {
	// Protected user routes
	rUser := r.Group("/users", middleware.ClerkAuth())
	rUser.GET("/me", handlers.GetMe)
}
