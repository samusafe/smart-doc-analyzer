package middleware

import (
	"runtime/debug"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/samusafe/genericapi/internal/utils"
)

// Recovery is a custom recovery middleware that logs the panic with stack trace and returns a structured error.
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if rec := recover(); rec != nil {
				cid := c.GetString(utils.CorrelationIDHeader)
				log.Error().Str("cid", cid).Interface("panic", rec).Bytes("stack", debug.Stack()).Msg("panic recovered")
				utils.GinError(c, 500, "InternalError", nil)
				c.Abort()
			}
		}()
		c.Next()
	}
}
