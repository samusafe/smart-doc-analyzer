package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/samusafe/genericapi/internal/utils"
)

// CorrelationID attaches / echoes a request ID (from header or generated).
// Must run before logging & any outbound calls to ensure cid propagation.
func CorrelationID() gin.HandlerFunc {
	return func(c *gin.Context) {
		cid := c.GetHeader(utils.CorrelationIDHeader)
		if cid == "" {
			cid = uuid.NewString()
		}
		c.Set(utils.CorrelationIDHeader, cid)
		c.Writer.Header().Set(utils.CorrelationIDHeader, cid)
		c.Next()
	}
}
