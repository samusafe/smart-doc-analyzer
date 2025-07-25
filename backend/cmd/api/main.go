package main

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/samusafe/genericapi/internal/config"
	"github.com/samusafe/genericapi/internal/routes"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println(".env file not found, using system environment variables")
	}

	r := routes.SetupRouter()

	port := config.Port

	r.Run(":" + port)
}
