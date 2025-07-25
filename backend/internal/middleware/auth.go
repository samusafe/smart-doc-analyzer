package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/config"
	"github.com/samusafe/genericapi/internal/utils"
)

// ClerkAuth validates Clerk tokens and injects the user ID into context
func ClerkAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract Bearer token
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(utils.StatusUnauthorized, gin.H{"error": utils.GetMessage(c.GetString("lang"), "Unauthorized")})
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")

		// Verify token with Clerk SDK
		claims, err := config.ClerkClient.VerifyToken(token)
		if err != nil {
			c.AbortWithStatusJSON(utils.StatusUnauthorized, gin.H{"error": utils.GetMessage(c.GetString("lang"), "Unauthorized")})
			return
		}

		// Inject user ID (subject) into context
		c.Set("userID", claims.Subject)
		c.Next()
	}
}
