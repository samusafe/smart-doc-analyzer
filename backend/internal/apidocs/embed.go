package apidocs

import (
	"embed"
	"io/fs"
)

//go:embed spec/openapi.yaml
var Spec []byte

// Single source for updating swagger-ui assets: runs local fetch script (pinned version inside fetch/main.go)
// Update version by editing .env and re-running go generate.
//go:generate go run ./cmd/fetch

//go:embed assets/dist/*
var assets embed.FS

// Assets returns a sub filesystem with the embedded swagger-ui assets.
func Assets() fs.FS {
	sub, err := fs.Sub(assets, "assets/dist")
	if err != nil { // should not happen if generation succeeded
		return assets
	}
	return sub
}
