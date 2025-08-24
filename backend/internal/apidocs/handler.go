package apidocs

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Register mounts the documentation endpoints.
func Register(r *gin.Engine) {
	r.GET("/openapi.yaml", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/yaml; charset=utf-8", Spec)
	})

	r.GET("/docs", func(c *gin.Context) {
		html := `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Document Analyzer API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin:0; padding:0; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: '/openapi.yaml',
          dom_id: '#swagger-ui'
        });
      };
    </script>
  </body>
</html>`
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
	})
}
