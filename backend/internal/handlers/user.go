package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/utils"
)

// GetMe retrieves the authenticated user's ID from the context
func GetMe(c *gin.Context) {
	userID, _ := c.Get("userID")
	c.JSON(utils.StatusOK, gin.H{"userID": userID})
}
