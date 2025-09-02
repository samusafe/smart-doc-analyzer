package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/config"
	"github.com/samusafe/genericapi/internal/utils"
)

// ClerkAuth enforces authentication (hard fail without valid token)
func ClerkAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			utils.GinError(c, http.StatusUnauthorized, "Unauthorized", "missing bearer token")
			c.Abort()
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := config.ClerkClient.VerifyToken(token)
		if err != nil {
			utils.GinError(c, http.StatusUnauthorized, "Unauthorized", err.Error())
			c.Abort()
			return
		}
		c.Set("userID", claims.Subject)
		c.Next()
	}
}

// ClerkAuthOptional sets userID if valid token presented, but does not require auth
func ClerkAuthOptional() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.Next()
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if claims, err := config.ClerkClient.VerifyToken(token); err == nil {
			c.Set("userID", claims.Subject)
		}
		c.Next()
	}
}
