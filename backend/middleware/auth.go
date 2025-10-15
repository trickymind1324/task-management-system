// ABOUTME: Authentication middleware for JWT token validation
// ABOUTME: Protects routes by requiring valid JWT tokens in Authorization header

package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/synapse/backend/utils"
)

// RequireAuth validates JWT token and sets user context
func RequireAuth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing authorization header", nil)
			c.Abort()
			return
		}

		// Check for "Bearer " prefix
		if !strings.HasPrefix(authHeader, "Bearer ") {
			utils.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization format", nil)
			c.Abort()
			return
		}

		// Extract token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == "" {
			utils.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing token", nil)
			c.Abort()
			return
		}

		// Validate token
		claims, err := utils.ValidateJWT(tokenString, jwtSecret)
		if err != nil {
			utils.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired token", nil)
			c.Abort()
			return
		}

		// Set user information in context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_name", claims.FullName)
		c.Set("user_role", claims.Role)
		c.Set("user_department_id", claims.DepartmentID)
		c.Set("user_permissions", claims.Permissions)

		c.Next()
	}
}

// RequirePermission checks if user has a specific permission
func RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get permissions from context (set by RequireAuth middleware)
		permsInterface, exists := c.Get("user_permissions")
		if !exists {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "No permissions found", nil)
			c.Abort()
			return
		}

		permissions, ok := permsInterface.([]string)
		if !ok {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Invalid permissions format", nil)
			c.Abort()
			return
		}

		// Check if user has required permission
		hasPermission := false
		for _, perm := range permissions {
			if perm == permission {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Insufficient permissions", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole checks if user has a specific role
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get role from context
		role, exists := c.Get("user_role")
		if !exists {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "No role found", nil)
			c.Abort()
			return
		}

		userRole, ok := role.(string)
		if !ok {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Invalid role format", nil)
			c.Abort()
			return
		}

		// Check if user role is in allowed roles
		hasRole := false
		for _, allowedRole := range allowedRoles {
			if userRole == allowedRole {
				hasRole = true
				break
			}
		}

		if !hasRole {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Insufficient role", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// OptionalAuth validates JWT if present but doesn't require it
func OptionalAuth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// No token provided, continue without authentication
			c.Next()
			return
		}

		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := utils.ValidateJWT(tokenString, jwtSecret)
			if err == nil {
				// Valid token, set user context
				c.Set("user_id", claims.UserID)
				c.Set("user_email", claims.Email)
				c.Set("user_name", claims.FullName)
				c.Set("user_role", claims.Role)
				c.Set("user_department_id", claims.DepartmentID)
				c.Set("user_permissions", claims.Permissions)
			}
		}

		c.Next()
	}
}
