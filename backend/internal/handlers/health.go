package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/utils"
)

func Health(c *gin.Context) {
	langAny, _ := c.Get("lang")
	lang, _ := langAny.(string)
	c.JSON(utils.StatusOK, gin.H{"status": utils.GetMessage(lang, "InternalError")})
	println("Health check endpoint hit")
}
