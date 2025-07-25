package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/config"
)

func DetectLanguage() gin.HandlerFunc {
	return func(c *gin.Context) {
		lang := c.GetHeader("Accept-Language")
		if lang == "" {
			lang = config.SupportedLanguages[0] // Default to the first supported language
		}
		c.Set("lang", lang)
		c.Next()
	}
}
