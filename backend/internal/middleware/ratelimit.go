package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/config"
	"github.com/samusafe/genericapi/internal/utils"
	"golang.org/x/time/rate"
)

// RateLimiter enforces a simple token bucket (interval defines refill frequency, burst immediate capacity).
func RateLimiter() gin.HandlerFunc {
	limiter := rate.NewLimiter(rate.Every(config.RateLimitInterval), config.RateLimitBurst)
	return func(c *gin.Context) {
		if !limiter.Allow() {
			utils.GinMsg(c, http.StatusTooManyRequests, "TooManyRequests")
			c.Abort()
			return
		}
		c.Next()
	}
}
