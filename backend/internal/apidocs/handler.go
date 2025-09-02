package apidocs

import (
	"io/fs"
	"net/http"
	"path"
	"strings"

	"github.com/gin-gonic/gin"
)

// Register mounts the documentation endpoints.
func Register(r *gin.Engine) {
	// Spec endpoint
	r.GET("/spec/openapi.yaml", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/yaml; charset=utf-8", Spec)
	})

	// Static embedded swagger-ui assets
	assetFS := Assets()
	r.GET("/docs/assets/*filepath", func(c *gin.Context) {
		p := c.Param("filepath")
		if p == "" || p == "/" {
			c.Status(http.StatusNotFound)
			return
		}
		clean := path.Clean(p)
		if len(clean) == 0 {
			c.Status(http.StatusNotFound)
			return
		}
		if clean[0] == '/' {
			clean = clean[1:]
		}
		// Block any attempt of directory traversal
		if strings.Contains(clean, "..") {
			c.Status(http.StatusNotFound)
			return
		}
		data, err := fs.ReadFile(assetFS, clean)
		if err != nil {
			c.Status(http.StatusNotFound)
			return
		}
		ext := path.Ext(clean)
		mimeMap := map[string]string{
			".css": "text/css; charset=utf-8",
			".js":  "application/javascript; charset=utf-8",
			".png": "image/png",
			".svg": "image/svg+xml",
		}
		ct := mimeMap[ext]
		if ct == "" {
			ct = "application/octet-stream"
		}
		c.Header("Cache-Control", "public, max-age=31536000, immutable")
		c.Data(http.StatusOK, ct, data)
	})

	// HTML wrapper
	r.GET("/docs", func(c *gin.Context) {
		html := `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<title>Document Analyzer API Docs</title>
		<link rel="stylesheet" href="/docs/assets/swagger-ui.css" />
		<link rel="icon" type="image/png" href="/docs/assets/favicon-32x32.png" sizes="32x32" />
		<link rel="icon" type="image/png" href="/docs/assets/favicon-16x16.png" sizes="16x16" />
		<link rel="stylesheet" href="/docs/assets/docs.css" />
	</head>
	<body>
		<div id="swagger-ui"></div>
		<script src="/docs/assets/swagger-ui-bundle.js"></script>
		<script src="/docs/assets/swagger-ui-standalone-preset.js"></script>
		<script src="/docs/assets/init.js"></script>
	</body>
</html>`
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
	})
}
