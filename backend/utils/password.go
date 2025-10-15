// ABOUTME: Password hashing and validation using bcrypt
// ABOUTME: Provides secure password storage with configurable cost factor

package utils

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

const (
	// DefaultCost is the default bcrypt cost factor (12 provides good security/performance balance)
	DefaultCost = 12
)

// HashPassword generates a bcrypt hash from a plain text password
func HashPassword(password string) (string, error) {
	if len(password) == 0 {
		return "", fmt.Errorf("password cannot be empty")
	}

	// Generate hash with default cost
	hash, err := bcrypt.GenerateFromPassword([]byte(password), DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hash), nil
}

// VerifyPassword compares a plain text password with a bcrypt hash
func VerifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// IsValidPassword checks if a password meets minimum requirements
func IsValidPassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	if len(password) > 72 {
		// bcrypt has a maximum password length of 72 bytes
		return fmt.Errorf("password must be less than 72 characters")
	}

	// Add more validation rules as needed
	// - At least one uppercase letter
	// - At least one lowercase letter
	// - At least one number
	// - At least one special character

	return nil
}
