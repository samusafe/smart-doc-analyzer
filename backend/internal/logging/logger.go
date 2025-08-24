package logging

import (
	"os"
	"time"

	"github.com/rs/zerolog"
)

var Logger zerolog.Logger

func Init() {
	lvl := zerolog.InfoLevel
	if v := os.Getenv("LOG_LEVEL"); v != "" {
		if l, err := zerolog.ParseLevel(v); err == nil {
			lvl = l
		}
	}
	zerolog.TimeFieldFormat = time.RFC3339Nano
	Logger = zerolog.New(os.Stdout).Level(lvl).With().Timestamp().Logger()
}
