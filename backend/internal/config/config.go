package config

import (
	"os"
	"time"
)

// Default port for the API, can be overridden by environment variable
var Port = func() string {
	if p := os.Getenv("PORT"); p != "" {
		return p
	}
	return "8080"
}()

// Supported languages for the API
var SupportedLanguages = []string{"en", "pt"}

// Rate limiting configuration: interval between tokens and burst size
const (
	RateLimitInterval = time.Second
	RateLimitBurst    = 5
)

// Example: Prices for different features/products
var Prices = map[string]float64{
	"basic_plan":   9.99,
	"premium_plan": 19.99,
	"ai_feature":   4.99,
}

// Example: Generic API variables
var Variables = map[string]interface{}{
	"MaxRequestSize": 1048576, // 1MB
	"DefaultCountry": "PT",
}
