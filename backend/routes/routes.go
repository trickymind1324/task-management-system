// ABOUTME: API route definitions and handler registration
// ABOUTME: Configures all HTTP endpoints with middleware

package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/synapse/backend/config"
	"github.com/synapse/backend/handlers"
	"github.com/synapse/backend/middleware"
	"gorm.io/gorm"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB) {
	// Apply global middleware
	router.Use(middleware.CORS())
	router.Use(middleware.Logger())

	// Get config for JWT secret
	cfg := config.GetConfig()

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(db)
	authHandler := handlers.NewAuthHandler(db)

	// Public routes
	router.GET("/health", healthHandler.HealthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Health check
		v1.GET("/health", healthHandler.HealthCheck)

		// Authentication routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
		}

		// Protected routes (require authentication)
		authenticated := v1.Group("")
		authenticated.Use(middleware.RequireAuth(cfg.JWTSecret))
		{
			// Auth - get current user
			authenticated.GET("/auth/me", authHandler.Me)

			// TODO: Add more protected routes here as we implement them
			// Tasks
			// authenticated.GET("/tasks", taskHandler.GetTasks)
			// authenticated.POST("/tasks", taskHandler.CreateTask)
			// authenticated.GET("/tasks/:id", taskHandler.GetTask)
			// authenticated.PUT("/tasks/:id", taskHandler.UpdateTask)
			// authenticated.DELETE("/tasks/:id", taskHandler.DeleteTask)
		}
	}
}
