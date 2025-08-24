package config

import (
	"time"

	"github.com/samusafe/genericapi/internal/utils"
)

// Core tunable constants (defaults; can be overridden via env)
const (
	defaultRateLimitIntervalMs = 1000
	defaultRateLimitBurst      = 5
	defaultHTTPClientTimeout   = 90 * time.Second
	defaultMaxUploadBytes      = 5 * 1024 * 1024 // 5MB
	defaultQuizMaxChars        = 100_000
	SwaggerAlwaysEnabled       = true // serve swagger endpoints unconditionally
)

var (
	// overridable via env
	RateLimitInterval = time.Duration(utils.IntFromEnv("RATE_LIMIT_INTERVAL_MS", defaultRateLimitIntervalMs)) * time.Millisecond
	RateLimitBurst    = utils.IntFromEnv("RATE_LIMIT_BURST", defaultRateLimitBurst)
	HTTPClientTimeout = utils.DurationFromEnvSeconds("HTTP_CLIENT_TIMEOUT_SECONDS", defaultHTTPClientTimeout)
	MaxUploadBytes    = int64(utils.IntFromEnv("MAX_UPLOAD_BYTES", int(defaultMaxUploadBytes)))
	QuizMaxChars      = utils.IntFromEnv("QUIZ_MAX_CHARS", defaultQuizMaxChars)
)

// Core string settings
var (
	Port             = utils.UseEnvOrDefault("BACKEND_PORT", "8080")
	PythonServiceURL = utils.UseEnvOrDefault("PYTHON_SERVICE_URL", "http://python:5000")
	DatabaseURL      = utils.UseEnvOrDefault("DATABASE_URL", "postgres://postgres:postgres@db:5432/docanalyzer?sslmode=disable")
)

// Supported static lists
var (
	SupportedLanguages = []string{"en", "pt"}
	SupportedFileTypes = []string{".txt", ".md", ".pdf", ".docx"}
)
