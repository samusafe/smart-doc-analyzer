package routes

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/samusafe/genericapi/internal/apidocs"
	"github.com/samusafe/genericapi/internal/config"
	"github.com/samusafe/genericapi/internal/handlers"
	"github.com/samusafe/genericapi/internal/middleware"
	"github.com/samusafe/genericapi/internal/repositories"
	"github.com/samusafe/genericapi/internal/routes/analyze"
	"github.com/samusafe/genericapi/internal/routes/base"
	"github.com/samusafe/genericapi/internal/routes/collections"
	"github.com/samusafe/genericapi/internal/services"
	"github.com/samusafe/genericapi/internal/utils"
)

func SetupRouter() *gin.Engine {
	r := gin.New()

	// Recovery (custom) placed first to catch panics from later middleware/handlers
	r.Use(middleware.Recovery())

	// Global multipart memory limit (in-memory parsing before temporary file spill)
	// Use half of MaxUploadBytes as a safeguard per single request form parsing buffer.
	r.MaxMultipartMemory = config.MaxUploadBytes / 2

	// Simple body size guard using Content-Length (best effort; still rely on per-handler checks for accuracy)
	r.Use(func(c *gin.Context) {
		if cl := c.Request.Header.Get("Content-Length"); cl != "" {
			if v, err := strconv.ParseInt(cl, 10, 64); err == nil && v > config.MaxUploadBytes {
				cid := c.GetString(utils.CorrelationIDHeader)
				log.Warn().Str("cid", cid).Int64("content_length", v).Msg("request rejected: body too large")
				c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, gin.H{"message": "Payload too large"})
				return
			}
		}
		c.Next()
	})

	// Correlation ID
	r.Use(middleware.CorrelationID())

	// Request logging
	r.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()
		latency := time.Since(start)
		status := c.Writer.Status()
		cid := c.GetString(utils.CorrelationIDHeader)
		logEvt := log.Info()
		if status >= 500 {
			logEvt = log.Error()
		}
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}
		logEvt.
			Str("method", c.Request.Method).
			Str("path", path).
			Int("status", status).
			Dur("latency", latency).
			Str("cid", cid).
			Msg("request")
	})

	// Restrict trusted proxies (only localhost) for improved security
	if err := r.SetTrustedProxies([]string{"127.0.0.1"}); err != nil {
		log.Error().Err(err).Msg("error setting trusted proxies")
	}

	// CORS (restricted)
	corsCfg := cors.Config{
		AllowOrigins:  config.AllowedOrigins,
		AllowMethods:  []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:  []string{"Origin", "Content-Type", "Accept", "Authorization", "Accept-Language", "X-Request-ID"},
		ExposeHeaders: []string{"Content-Length", "X-Request-ID"},
		MaxAge:        12 * time.Hour,
	}
	r.Use(cors.New(corsCfg))

	// Other Middlewares
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.DetectLanguage())
	r.Use(middleware.ClerkAuthOptional())
	r.Use(middleware.RateLimiter())

	// Repositories
	analysisRepo := repositories.NewAnalysisRepository()
	collectionsRepo := repositories.NewCollectionsRepository()

	// Services (inject repo)
	analyzerService := services.NewAnalyzerServiceWithRepo(analysisRepo)

	// Handlers
	analyzeHandler := handlers.NewAnalyzeHandler(analyzerService)
	collectionsHandler := handlers.NewCollectionsHandler(collectionsRepo, analysisRepo)
	analysisHistoryHandler := handlers.NewAnalysisHistoryHandler(analysisRepo, collectionsRepo)

	// Routes
	base.RegisterBaseRoutes(r)

	// Protected group
	authGroup := r.Group("")
	authGroup.Use(middleware.ClerkAuth())
	{
		analyze.RegisterAnalyzeRoutes(authGroup, analyzeHandler)
		collections.Register(authGroup, collectionsHandler)
		analyze.RegisterHistoryRoutes(authGroup, analysisHistoryHandler)
	}

	// External OpenAPI YAML + UI
	apidocs.Register(r)

	return r
}
