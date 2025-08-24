package utils

import (
	"os"
	"strconv"
	"time"
)

// UseEnvOrDefault retrieves the value of the environment variable named by the key.
func UseEnvOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func IntFromEnv(key string, def int) int {
	if v := UseEnvOrDefault(key, ""); v != "" {
		if iv, err := strconv.Atoi(v); err == nil && iv > 0 {
			return iv
		}
	}
	return def
}

func DurationFromEnvSeconds(key string, def time.Duration) time.Duration {
	if v := UseEnvOrDefault(key, ""); v != "" {
		if iv, err := strconv.Atoi(v); err == nil && iv > 0 {
			return time.Duration(iv) * time.Second
		}
	}
	return def
}
