// ABOUTME: JWT token generation and validation utilities
// ABOUTME: Implements secure token-based authentication with claims

package utils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/synapse/backend/models"
)

// JWTClaims represents the structure of JWT token claims
type JWTClaims struct {
	UserID       string   `json:"user_id"`
	Email        string   `json:"email"`
	FullName     string   `json:"full_name"`
	Role         string   `json:"role"`
	DepartmentID *string  `json:"department_id,omitempty"`
	Permissions  []string `json:"permissions"`
	jwt.RegisteredClaims
}

// GenerateJWT generates a new JWT token for the given user
func GenerateJWT(user *models.User, secret string, expiryHours int) (string, error) {
	if secret == "" {
		return "", fmt.Errorf("JWT secret not configured")
	}

	// Calculate expiration time
	expiryTime := time.Now().Add(time.Duration(expiryHours) * time.Hour)

	// Create claims
	claims := JWTClaims{
		UserID:       user.ID,
		Email:        user.Email,
		FullName:     user.FullName,
		Role:         user.Role,
		DepartmentID: user.DepartmentID,
		Permissions:  getPermissionsForRole(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiryTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "synapse-api",
			Subject:   user.ID,
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return signedToken, nil
}

// ValidateJWT validates a JWT token and returns the claims
func ValidateJWT(tokenString string, secret string) (*JWTClaims, error) {
	if secret == "" {
		return nil, fmt.Errorf("JWT secret not configured")
	}

	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	// Extract claims
	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

// GenerateRefreshToken generates a long-lived refresh token
func GenerateRefreshToken(user *models.User, secret string) (string, error) {
	// Refresh tokens are valid for 7 days (168 hours)
	return GenerateJWT(user, secret, 168)
}

// getPermissionsForRole returns permissions based on user role
func getPermissionsForRole(role string) []string {
	permissions := map[string][]string{
		"Admin": {
			"tasks.create", "tasks.read", "tasks.update", "tasks.delete",
			"users.create", "users.read", "users.update", "users.delete",
			"projects.create", "projects.read", "projects.update", "projects.delete",
			"departments.create", "departments.read", "departments.update", "departments.delete",
		},
		"Manager": {
			"tasks.create", "tasks.read", "tasks.update", "tasks.delete",
			"users.read",
			"projects.create", "projects.read", "projects.update",
			"departments.read",
		},
		"Member": {
			"tasks.create", "tasks.read", "tasks.update",
			"users.read",
			"projects.read",
			"departments.read",
		},
		"Viewer": {
			"tasks.read",
			"users.read",
			"projects.read",
			"departments.read",
		},
	}

	if perms, ok := permissions[role]; ok {
		return perms
	}

	// Default to viewer permissions
	return permissions["Viewer"]
}
