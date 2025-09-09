package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/samusafe/genericapi/internal/config"
	"github.com/samusafe/genericapi/internal/database"
	"github.com/samusafe/genericapi/internal/i18n"
	"github.com/samusafe/genericapi/internal/logging"
	"github.com/samusafe/genericapi/internal/routes"
)

// @consumes json
func main() {
	logging.Init()
	i18n.Init()

	start := time.Now()
	if err := database.Connect(); err != nil {
		log.Fatal().Err(err).Msg("database connection failed")
	}

	r := routes.SetupRouter()
	port := config.Port

	srv := &http.Server{Addr: ":" + port, Handler: r}

	// Channel for termination signals
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	// Server run goroutine
	go func() {
		log.Info().Str("port", port).Msg("starting api server")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server listen error")
		}
	}()

	// Wait for signal
	sig := <-sigCh
	log.Info().Str("signal", sig.String()).Msg("shutdown initiated")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("graceful shutdown failed")
	} else {
		log.Info().Msg("server stopped cleanly")
	}
	log.Info().Dur("uptime", time.Since(start)).Msg("process exit")
}
