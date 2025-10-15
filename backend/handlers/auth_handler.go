// ABOUTME: Authentication handlers for user registration, login, token refresh
// ABOUTME: Handles JWT token generation and user session management

package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/synapse/backend/config"
	"github.com/synapse/backend/models"
	"github.com/synapse/backend/utils"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

// RegisterRequest represents the registration request body
type RegisterRequest struct {
	Email      string  `json:"email" binding:"required,email"`
	Password   string  `json:"password" binding:"required,min=8,max=72"`
	FullName   string  `json:"full_name" binding:"required"`
	Department *string `json:"department_id,omitempty"`
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RefreshRequest represents the token refresh request body
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	User         *models.User `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int          `json:"expires_in"` // seconds
}

// Register creates a new user account
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid input data", nil)
		return
	}

	// Validate password requirements
	if err := utils.IsValidPassword(req.Password); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := h.db.Where("email = ?", strings.ToLower(req.Email)).First(&existingUser).Error; err == nil {
		utils.RespondError(c, http.StatusConflict, "USER_EXISTS", "User with this email already exists", nil)
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to process password", nil)
		return
	}

	// Create new user
	hashedPasswordPtr := &hashedPassword
	user := models.User{
		Email:        strings.ToLower(req.Email),
		Username:     strings.Split(strings.ToLower(req.Email), "@")[0], // Use email prefix as username
		PasswordHash: hashedPasswordPtr,
		FullName:     req.FullName,
		Role:         "Member", // Default role
		DepartmentID: req.Department,
		IsActive:     true,
	}

	if err := h.db.Create(&user).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to create user", nil)
		return
	}

	// Generate tokens
	cfg := config.GetConfig()
	accessToken, err := utils.GenerateJWT(&user, cfg.JWTSecret, 24) // 24 hours
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to generate access token", nil)
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(&user, cfg.JWTSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to generate refresh token", nil)
		return
	}

	// Clear password hash before returning
	user.PasswordHash = nil

	utils.RespondSuccess(c, http.StatusCreated, AuthResponse{
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    86400, // 24 hours in seconds
	}, "User registered successfully")
}

// Login authenticates a user and returns JWT tokens
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid input data", nil)
		return
	}

	// Find user by email
	var user models.User
	if err := h.db.Where("email = ?", strings.ToLower(req.Email)).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to query user", nil)
		return
	}

	// Check if user is active
	if !user.IsActive {
		utils.RespondError(c, http.StatusForbidden, "ACCOUNT_DISABLED", "Account has been disabled", nil)
		return
	}

	// Verify password
	if user.PasswordHash == nil {
		utils.RespondError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password", nil)
		return
	}
	if err := utils.VerifyPassword(*user.PasswordHash, req.Password); err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password", nil)
		return
	}

	// Generate tokens
	cfg := config.GetConfig()
	accessToken, err := utils.GenerateJWT(&user, cfg.JWTSecret, 24) // 24 hours
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to generate access token", nil)
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(&user, cfg.JWTSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to generate refresh token", nil)
		return
	}

	// Clear password hash before returning
	user.PasswordHash = nil

	utils.RespondSuccess(c, http.StatusOK, AuthResponse{
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    86400, // 24 hours in seconds
	}, "Login successful")
}

// Refresh generates a new access token using a valid refresh token
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid input data", nil)
		return
	}

	// Validate refresh token
	cfg := config.GetConfig()
	claims, err := utils.ValidateJWT(req.RefreshToken, cfg.JWTSecret)
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired refresh token", nil)
		return
	}

	// Get user from database
	var user models.User
	if err := h.db.First(&user, "id = ?", claims.UserID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusUnauthorized, "USER_NOT_FOUND", "User no longer exists", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to query user", nil)
		return
	}

	// Check if user is still active
	if !user.IsActive {
		utils.RespondError(c, http.StatusForbidden, "ACCOUNT_DISABLED", "Account has been disabled", nil)
		return
	}

	// Generate new access token
	accessToken, err := utils.GenerateJWT(&user, cfg.JWTSecret, 24) // 24 hours
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to generate access token", nil)
		return
	}

	// Optionally generate new refresh token (rotate refresh tokens)
	newRefreshToken, err := utils.GenerateRefreshToken(&user, cfg.JWTSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to generate refresh token", nil)
		return
	}

	// Clear password hash before returning
	user.PasswordHash = nil

	utils.RespondSuccess(c, http.StatusOK, AuthResponse{
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    86400, // 24 hours in seconds
	}, "Token refreshed successfully")
}

// Logout invalidates the current user session
func (h *AuthHandler) Logout(c *gin.Context) {
	// For JWT-based auth, logout is typically handled client-side by removing tokens
	// In a more sophisticated setup, you might:
	// - Add token to a blacklist in Redis
	// - Store active sessions in database and remove on logout
	// For now, we'll just return success
	utils.RespondSuccess(c, http.StatusOK, nil, "Logout successful")
}

// Me returns the current authenticated user's information
func (h *AuthHandler) Me(c *gin.Context) {
	// Get user ID from context (set by RequireAuth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		utils.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	// Query user from database with department preloaded
	var user models.User
	if err := h.db.Preload("Department").First(&user, "id = ?", userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "USER_NOT_FOUND", "User not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to query user", nil)
		return
	}

	// Clear password hash before returning
	user.PasswordHash = nil

	utils.RespondSuccess(c, http.StatusOK, user, "User retrieved successfully")
}
