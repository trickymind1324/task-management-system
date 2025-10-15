// ABOUTME: Custom error types and error handling utilities
// ABOUTME: Provides structured error handling throughout the application

package utils

import "errors"

var (
	ErrNotFound          = errors.New("resource not found")
	ErrUnauthorized      = errors.New("unauthorized")
	ErrForbidden         = errors.New("forbidden")
	ErrInvalidInput      = errors.New("invalid input")
	ErrDatabaseError     = errors.New("database error")
	ErrInternalError     = errors.New("internal server error")
)
