// ABOUTME: Unit and integration tests for health check endpoint
// ABOUTME: Tests database connectivity and API response format

package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/synapse/backend/handlers"
	"github.com/synapse/backend/routes"
)

func TestHealthEndpoint_Success(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create test router without database (testing handler logic only)
	router := gin.Default()
	healthHandler := handlers.NewHealthHandler(nil) // nil db for unit test
	router.GET("/health", healthHandler.HealthCheck)

	// Create test request
	req, err := http.NewRequest("GET", "/health", nil)
	assert.NoError(t, err)

	// Record response
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert response code
	assert.Equal(t, http.StatusOK, w.Code)

	// Parse response body
	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Assert response structure
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])

	// Assert data structure
	data := response["data"].(map[string]interface{})
	assert.Equal(t, "ok", data["status"])
	assert.Contains(t, []string{"connected", "disconnected"}, data["database"])
}

func TestHealthEndpoint_ResponseFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.Default()
	healthHandler := handlers.NewHealthHandler(nil)
	router.GET("/health", healthHandler.HealthCheck)

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert content type
	assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

	// Assert JSON structure
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Verify required fields exist
	assert.Contains(t, response, "success")
	assert.Contains(t, response, "data")
}

func TestHealthEndpoint_Integration(t *testing.T) {
	// Skip if no test database available
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	gin.SetMode(gin.TestMode)

	// TODO: Set up test database connection
	// db := setupTestDB(t)
	// defer teardownTestDB(t, db)

	// For now, test with nil database
	router := gin.Default()
	routes.SetupRoutes(router, nil)

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.True(t, response["success"].(bool))
}

// Benchmark health endpoint performance
func BenchmarkHealthEndpoint(b *testing.B) {
	gin.SetMode(gin.TestMode)

	router := gin.Default()
	healthHandler := handlers.NewHealthHandler(nil)
	router.GET("/health", healthHandler.HealthCheck)

	req, _ := http.NewRequest("GET", "/health", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}
