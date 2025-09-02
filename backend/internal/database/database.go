package database

import (
	"database/sql"
	"errors"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
	"github.com/rs/zerolog/log"
	"github.com/samusafe/genericapi/internal/config"
)

var DB *sql.DB

func Connect() error {
	if DB != nil {
		return nil
	}

	dsn := config.DatabaseURL
	conn, err := sql.Open("postgres", dsn)
	if err != nil {
		return err
	}
	conn.SetMaxOpenConns(10)
	conn.SetMaxIdleConns(5)
	conn.SetConnMaxLifetime(30 * time.Minute)

	if err := conn.Ping(); err != nil {
		return err
	}

	DB = conn
	log.Info().Msg("database connected")

	return runMigrations(dsn)
}

func runMigrations(dsn string) error {
	log.Info().Msg("running database migrations")

	m, err := migrate.New(
		"file://internal/database/migrations",
		dsn,
	)
	if err != nil {
		return err
	}

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}

	log.Info().Msg("database migrations finished")
	return nil
}
