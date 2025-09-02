package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/unrolled/secure"
)

func SecurityHeaders() gin.HandlerFunc {
	secureMiddleware := secure.New(secure.Options{
		FrameDeny:             true,
		ContentTypeNosniff:    true,
		BrowserXssFilter:      true,
		ContentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-src 'none'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; manifest-src 'none'; upgrade-insecure-requests",
	})
	return func(c *gin.Context) {
		err := secureMiddleware.Process(c.Writer, c.Request)
		if err != nil {
			c.Abort()
			return
		}
		c.Next()
	}
}
