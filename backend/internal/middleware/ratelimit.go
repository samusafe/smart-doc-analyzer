package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/utils"
	"golang.org/x/time/rate"
)

func RateLimiter(r rate.Limit, b int) gin.HandlerFunc {
	limiter := rate.NewLimiter(r, b)
	return func(c *gin.Context) {
		if !limiter.Allow() {
			lang := c.GetString("lang")
			c.AbortWithStatusJSON(utils.StatusTooManyRequests, gin.H{"message": utils.GetMessage(lang, "TooManyRequests")})
			return
		}
		c.Next()
	}
}
