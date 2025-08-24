package handlers

import (
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/samusafe/genericapi/internal/utils"
)

var startTime = time.Now()
var version = func() string {
	if v := os.Getenv("APP_VERSION"); v != "" {
		return v
	}
	return "dev"
}()

func Health(c *gin.Context) {
	uptime := time.Since(startTime).Seconds()
	utils.GinData(c, 200, gin.H{
		"status":  "ok",
		"version": version,
		"uptime":  uptime,
		"ready":   true,
	})
}
