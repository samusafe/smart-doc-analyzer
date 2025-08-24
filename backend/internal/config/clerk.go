package config

import (
	"log"
	"os"

	"github.com/clerkinc/clerk-sdk-go/clerk"
)

// Clerk client instance
var ClerkClient clerk.Client

func init() {
	apiKey := os.Getenv("CLERK_SECRET_KEY")
	if apiKey == "" {
		log.Println("CLERK_SECRET_KEY environment variable not set, skipping Clerk initialization")
		return
	}

	var err error
	ClerkClient, err = clerk.NewClient(apiKey)
	if err != nil {
		log.Fatalf("Error initializing Clerk client: %v", err)
	}
}
