// ABOUTME: Health check handler for service monitoring
// ABOUTME: Returns server status and database connectivity information

package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/synapse/backend/utils"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db *gorm.DB
}

func NewHealthHandler(db *gorm.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) HealthCheck(c *gin.Context) {
	// Check database connection
	sqlDB, err := h.db.DB()
	if err != nil {
		utils.RespondError(c, http.StatusServiceUnavailable, "UNHEALTHY", "Database connection failed", nil)
		return
	}

	if err := sqlDB.Ping(); err != nil {
		utils.RespondError(c, http.StatusServiceUnavailable, "UNHEALTHY", "Database ping failed", nil)
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"status":   "ok",
		"database": "connected",
	}, "")
}
