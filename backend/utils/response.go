// ABOUTME: Standard API response structures and helper functions
// ABOUTME: Provides consistent JSON response format across all endpoints

package utils

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   Error  `json:"error"`
}

type Error struct {
	Code    string        `json:"code"`
	Message string        `json:"message"`
	Details []ErrorDetail `json:"details,omitempty"`
}

type ErrorDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type PaginatedResponse struct {
	Success    bool        `json:"success"`
	Data       interface{} `json:"data"`
	Pagination Pagination  `json:"pagination"`
}

type Pagination struct {
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

func RespondSuccess(c *gin.Context, statusCode int, data interface{}, message string) {
	c.JSON(statusCode, SuccessResponse{
		Success: true,
		Data:    data,
		Message: message,
	})
}

func RespondSuccessWithPagination(c *gin.Context, data interface{}, page, perPage int, total int64) {
	totalPages := int((total + int64(perPage) - 1) / int64(perPage))
	c.JSON(http.StatusOK, PaginatedResponse{
		Success: true,
		Data:    data,
		Pagination: Pagination{
			Page:       page,
			PerPage:    perPage,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

func RespondError(c *gin.Context, statusCode int, code string, message string, details []ErrorDetail) {
	c.JSON(statusCode, ErrorResponse{
		Success: false,
		Error: Error{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

func RespondValidationError(c *gin.Context, details []ErrorDetail) {
	RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Validation failed", details)
}

func RespondUnauthorized(c *gin.Context) {
	RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
}

func RespondForbidden(c *gin.Context) {
	RespondError(c, http.StatusForbidden, "FORBIDDEN", "Insufficient permissions", nil)
}

func RespondNotFound(c *gin.Context, resource string) {
	RespondError(c, http.StatusNotFound, "NOT_FOUND", resource+" not found", nil)
}

func RespondInternalError(c *gin.Context, err error) {
	c.Error(err)
	RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "An internal error occurred", nil)
}
