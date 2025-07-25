package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/config"
	"github.com/samusafe/genericapi/internal/middleware"
	"github.com/samusafe/genericapi/internal/routes/base"
	"github.com/samusafe/genericapi/internal/routes/user"
	"golang.org/x/time/rate"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Apply Middlewares
	r.Use(cors.Default())
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.DetectLanguage())
	r.Use(middleware.RateLimiter(rate.Every(config.RateLimitInterval), config.RateLimitBurst))

	// Register Routes
	base.RegisterBaseRoutes(r)
	user.RegisterUserRoutes(r)

	return r
}
