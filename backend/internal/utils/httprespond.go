package utils

import (
	"context"

	"github.com/gin-gonic/gin"
)

// CorrelationIDHeader is the canonical header key for request correlation.
const CorrelationIDHeader = "X-Request-ID"

// context key type to avoid collisions
type ctxKey string

const correlationIDCtxKey ctxKey = "correlation-id"

func WithCorrelationID(parent context.Context, id string) context.Context {
	return context.WithValue(parent, correlationIDCtxKey, id)
}
func CorrelationIDFromCtx(ctx context.Context) string {
	if v, ok := ctx.Value(correlationIDCtxKey).(string); ok {
		return v
	}
	return ""
}

type JSONErrorResponse struct {
	Message       string      `json:"message"`
	Detail        interface{} `json:"detail,omitempty"`
	CorrelationID string      `json:"correlationId,omitempty"`
}

func GinError(c *gin.Context, status int, key string, detail interface{}) {
	lang := c.GetString("lang")
	cid := c.GetString(CorrelationIDHeader)
	c.JSON(status, JSONErrorResponse{Message: GetMessage(lang, key), Detail: detail, CorrelationID: cid})
}

// GinMsg sends a standard message-only response
func GinMsg(c *gin.Context, status int, key string) {
	lang := c.GetString("lang")
	cid := c.GetString(CorrelationIDHeader)
	c.JSON(status, JSONErrorResponse{Message: GetMessage(lang, key), CorrelationID: cid})
}

// GinDataWithMsg sends a data payload and includes a top-level message inside the data object.
func GinDataWithMsg(c *gin.Context, status int, data gin.H, key string) {
	lang := c.GetString("lang")
	cid := c.GetString(CorrelationIDHeader)
	data["message"] = GetMessage(lang, key)
	c.JSON(status, gin.H{"data": data, "correlationId": cid})
}

func GinData(c *gin.Context, status int, payload interface{}) {
	cid := c.GetString(CorrelationIDHeader)
	c.JSON(status, gin.H{"data": payload, "correlationId": cid})
}
