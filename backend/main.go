// ABOUTME: Main entry point for Synapse backend API server
// ABOUTME: Initializes Gin router, database connection, and starts HTTP server

package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/synapse/backend/config"
	"github.com/synapse/backend/routes"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using system environment variables")
	}

	// Get configuration
	cfg := config.GetConfig()

	// Setup database
	db, err := config.SetupDatabase(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	log.Println("✓ database connected successfully")

	// Set Gin mode
	if cfg.GinMode != "" {
		gin.SetMode(cfg.GinMode)
	}

	// Initialize router
	router := gin.Default()

	// Setup routes
	routes.SetupRoutes(router, db)

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("✓ server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
