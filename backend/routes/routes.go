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
	taskHandler := handlers.NewTaskHandler(db)
	userHandler := handlers.NewUserHandler(db)
	departmentHandler := handlers.NewDepartmentHandler(db)
	projectHandler := handlers.NewProjectHandler(db)

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

			// Task routes
			tasks := authenticated.Group("/tasks")
			{
				tasks.GET("", taskHandler.GetTasks)
				tasks.POST("", taskHandler.CreateTask)
				tasks.GET("/:id", taskHandler.GetTask)
				tasks.PUT("/:id", taskHandler.UpdateTask)
				tasks.PATCH("/:id/status", taskHandler.UpdateTaskStatus)
				tasks.DELETE("/:id", taskHandler.DeleteTask)
			}

			// User routes
			users := authenticated.Group("/users")
			{
				users.GET("", userHandler.GetUsers)
				users.GET("/:id", userHandler.GetUser)
				users.PUT("/:id", userHandler.UpdateUser)
				users.GET("/:id/tasks", userHandler.GetUserTasks)
			}

			// Department routes
			departments := authenticated.Group("/departments")
			{
				departments.GET("", departmentHandler.GetDepartments)
				departments.POST("", middleware.RequireRole("Admin"), departmentHandler.CreateDepartment)
				departments.GET("/:id", departmentHandler.GetDepartment)
				departments.PUT("/:id", middleware.RequireRole("Admin"), departmentHandler.UpdateDepartment)
				departments.DELETE("/:id", middleware.RequireRole("Admin"), departmentHandler.DeleteDepartment)
				departments.GET("/:id/users", departmentHandler.GetDepartmentUsers)
				departments.GET("/:id/tasks", departmentHandler.GetDepartmentTasks)
			}

			// Project routes
			projects := authenticated.Group("/projects")
			{
				projects.GET("", projectHandler.GetProjects)
				projects.POST("", projectHandler.CreateProject)
				projects.GET("/:id", projectHandler.GetProject)
				projects.PUT("/:id", projectHandler.UpdateProject)
				projects.DELETE("/:id", projectHandler.DeleteProject)
				projects.GET("/:id/tasks", projectHandler.GetProjectTasks)
			}
		}
	}
}
