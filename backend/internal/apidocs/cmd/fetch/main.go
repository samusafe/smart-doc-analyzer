package main

// Small fetcher to download pinned swagger-ui-dist assets locally for embedding.
// Usage: go run ./internal/apidocs/cmd/fetch
// This pins version via const swaggerVersion; adjust carefully.
// License: swagger-ui is Apache 2.0.

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/samusafe/genericapi/internal/config"
)

var swaggerVersion = config.SwaggerUIVersion

var files = []struct {
	Name   string
	URL    string
	SHA256 string
}{
	{"swagger-ui.css", "https://unpkg.com/swagger-ui-dist@" + swaggerVersion + "/swagger-ui.css", ""},
	{"swagger-ui-bundle.js", "https://unpkg.com/swagger-ui-dist@" + swaggerVersion + "/swagger-ui-bundle.js", ""},
	{"swagger-ui-standalone-preset.js", "https://unpkg.com/swagger-ui-dist@" + swaggerVersion + "/swagger-ui-standalone-preset.js", ""},
	{"favicon-16x16.png", "https://unpkg.com/swagger-ui-dist@" + swaggerVersion + "/favicon-16x16.png", ""},
	{"favicon-32x32.png", "https://unpkg.com/swagger-ui-dist@" + swaggerVersion + "/favicon-32x32.png", ""},
}

func main() {
	outDir := filepath.Join("internal", "apidocs", "assets", "dist")
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		panic(err)
	}

	client := &http.Client{Timeout: 20 * time.Second}
	for _, f := range files {
		fmt.Printf("Downloading %s...\n", f.Name)
		if err := download(client, f.URL, filepath.Join(outDir, f.Name), f.SHA256); err != nil {
			panic(err)
		}
	}
	// Create a minimal NOTICE file referencing Apache 2.0 license.
	noticePath := filepath.Join(outDir, "NOTICE")
	if _, err := os.Stat(noticePath); errors.Is(err, os.ErrNotExist) {
		_ = os.WriteFile(noticePath, []byte("Includes swagger-ui-dist (Apache License 2.0). See https://github.com/swagger-api/swagger-ui"), 0o644)
	}
	fmt.Println("Swagger UI assets fetched.")
}

func download(client *http.Client, url, dst, wantHash string) error {
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status %s for %s", resp.Status, url)
	}
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if wantHash != "" {
		sum := sha256.Sum256(data)
		got := hex.EncodeToString(sum[:])
		if !strings.EqualFold(got, wantHash) {
			return fmt.Errorf("checksum mismatch for %s: got %s want %s", url, got, wantHash)
		}
	}
	return os.WriteFile(dst, data, 0o644)
}
