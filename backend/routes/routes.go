// ABOUTME: API route definitions and handler registration
// ABOUTME: Configures all HTTP endpoints with middleware

package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/synapse/backend/handlers"
	"github.com/synapse/backend/middleware"
	"gorm.io/gorm"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB) {
	// Apply global middleware
	router.Use(middleware.CORS())
	router.Use(middleware.Logger())

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(db)

	// Public routes
	router.GET("/health", healthHandler.HealthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Health check
		v1.GET("/health", healthHandler.HealthCheck)

		// TODO: Add more routes here as we implement them
		// Auth routes
		// v1.POST("/auth/login", authHandler.Login)
		// v1.POST("/auth/refresh", authHandler.RefreshToken)

		// Protected routes
		// authenticated := v1.Group("")
		// authenticated.Use(middleware.RequireAuth(cfg.JWTSecret))
		// {
		//     authenticated.GET("/tasks", taskHandler.GetTasks)
		//     authenticated.POST("/tasks", taskHandler.CreateTask)
		// }
	}
}
