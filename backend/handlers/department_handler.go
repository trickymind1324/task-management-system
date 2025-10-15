// ABOUTME: Department management handlers for CRUD operations
// ABOUTME: Handles department listing, creation, updates with admin controls

package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/synapse/backend/models"
	"github.com/synapse/backend/utils"
	"gorm.io/gorm"
)

type DepartmentHandler struct {
	db *gorm.DB
}

func NewDepartmentHandler(db *gorm.DB) *DepartmentHandler {
	return &DepartmentHandler{db: db}
}

// CreateDepartmentRequest represents the department creation request body
type CreateDepartmentRequest struct {
	Name        string  `json:"name" binding:"required,min=1,max=100"`
	Description *string `json:"description"`
	HeadID      *string `json:"head_id"`
}

// UpdateDepartmentRequest represents the department update request body
type UpdateDepartmentRequest struct {
	Name        *string `json:"name" binding:"omitempty,min=1,max=100"`
	Description *string `json:"description"`
	HeadID      *string `json:"head_id"`
}

// GetDepartments returns a paginated list of departments
func (h *DepartmentHandler) GetDepartments(c *gin.Context) {
	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	// Get filter parameters
	search := c.Query("search")

	// Build query
	query := h.db.Model(&models.Department{})

	// Apply filters
	if search != "" {
		query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to count departments", nil)
		return
	}

	// Apply pagination
	offset := (page - 1) * perPage
	var departments []models.Department
	if err := query.
		Preload("Head").
		Order("name ASC").
		Limit(perPage).
		Offset(offset).
		Find(&departments).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch departments", nil)
		return
	}

	utils.RespondSuccessWithPagination(c, departments, page, perPage, total)
}

// GetDepartment returns a single department by ID
func (h *DepartmentHandler) GetDepartment(c *gin.Context) {
	departmentID := c.Param("id")

	var department models.Department
	if err := h.db.
		Preload("Head").
		First(&department, "id = ?", departmentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "DEPARTMENT_NOT_FOUND", "Department not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch department", nil)
		return
	}

	utils.RespondSuccess(c, http.StatusOK, department, "Department retrieved successfully")
}

// CreateDepartment creates a new department (admin only)
func (h *DepartmentHandler) CreateDepartment(c *gin.Context) {
	var req CreateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid input data", nil)
		return
	}

	// Check if department name already exists
	var existingDept models.Department
	if err := h.db.Where("name = ?", req.Name).First(&existingDept).Error; err == nil {
		utils.RespondError(c, http.StatusConflict, "DEPARTMENT_EXISTS", "Department with this name already exists", nil)
		return
	}

	// Validate head if provided
	if req.HeadID != nil && *req.HeadID != "" {
		var head models.User
		if err := h.db.First(&head, "id = ?", *req.HeadID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				utils.RespondError(c, http.StatusBadRequest, "INVALID_HEAD", "Department head user not found", nil)
				return
			}
			utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to validate department head", nil)
			return
		}
	}

	// Create department
	department := models.Department{
		Name:        req.Name,
		Description: req.Description,
		HeadID:      req.HeadID,
	}

	if err := h.db.Create(&department).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to create department", nil)
		return
	}

	// Reload with associations
	h.db.Preload("Head").First(&department, "id = ?", department.ID)

	utils.RespondSuccess(c, http.StatusCreated, department, "Department created successfully")
}

// UpdateDepartment updates an existing department (admin only)
func (h *DepartmentHandler) UpdateDepartment(c *gin.Context) {
	departmentID := c.Param("id")

	var req UpdateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid input data", nil)
		return
	}

	// Fetch existing department
	var department models.Department
	if err := h.db.First(&department, "id = ?", departmentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "DEPARTMENT_NOT_FOUND", "Department not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch department", nil)
		return
	}

	// Update fields
	if req.Name != nil {
		// Check if new name conflicts with existing department
		var existingDept models.Department
		if err := h.db.Where("name = ? AND id != ?", *req.Name, departmentID).First(&existingDept).Error; err == nil {
			utils.RespondError(c, http.StatusConflict, "DEPARTMENT_EXISTS", "Department with this name already exists", nil)
			return
		}
		department.Name = *req.Name
	}
	if req.Description != nil {
		department.Description = req.Description
	}
	if req.HeadID != nil {
		if *req.HeadID == "" {
			department.HeadID = nil
		} else {
			// Validate head
			var head models.User
			if err := h.db.First(&head, "id = ?", *req.HeadID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					utils.RespondError(c, http.StatusBadRequest, "INVALID_HEAD", "Department head user not found", nil)
					return
				}
				utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to validate department head", nil)
				return
			}
			department.HeadID = req.HeadID
		}
	}

	// Save department
	if err := h.db.Save(&department).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to update department", nil)
		return
	}

	// Reload with associations
	h.db.Preload("Head").First(&department, "id = ?", department.ID)

	utils.RespondSuccess(c, http.StatusOK, department, "Department updated successfully")
}

// DeleteDepartment deletes a department (admin only)
func (h *DepartmentHandler) DeleteDepartment(c *gin.Context) {
	departmentID := c.Param("id")

	// Fetch existing department
	var department models.Department
	if err := h.db.First(&department, "id = ?", departmentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "DEPARTMENT_NOT_FOUND", "Department not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch department", nil)
		return
	}

	// Check if department has users
	var userCount int64
	if err := h.db.Model(&models.User{}).Where("department_id = ?", departmentID).Count(&userCount).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to check department users", nil)
		return
	}
	if userCount > 0 {
		utils.RespondError(c, http.StatusConflict, "DEPARTMENT_HAS_USERS", "Cannot delete department with existing users", nil)
		return
	}

	// Check if department has tasks
	var taskCount int64
	if err := h.db.Model(&models.Task{}).Where("department_id = ?", departmentID).Count(&taskCount).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to check department tasks", nil)
		return
	}
	if taskCount > 0 {
		utils.RespondError(c, http.StatusConflict, "DEPARTMENT_HAS_TASKS", "Cannot delete department with existing tasks", nil)
		return
	}

	// Delete department
	if err := h.db.Delete(&department).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to delete department", nil)
		return
	}

	utils.RespondSuccess(c, http.StatusOK, nil, "Department deleted successfully")
}

// GetDepartmentUsers returns users in a department
func (h *DepartmentHandler) GetDepartmentUsers(c *gin.Context) {
	departmentID := c.Param("id")

	// Check if department exists
	var department models.Department
	if err := h.db.First(&department, "id = ?", departmentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "DEPARTMENT_NOT_FOUND", "Department not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch department", nil)
		return
	}

	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	// Build query
	query := h.db.Model(&models.User{}).Where("department_id = ?", departmentID)

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to count users", nil)
		return
	}

	// Apply pagination
	offset := (page - 1) * perPage
	var users []models.User
	if err := query.
		Order("full_name ASC").
		Limit(perPage).
		Offset(offset).
		Find(&users).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch users", nil)
		return
	}

	// Clear password hashes
	for i := range users {
		users[i].PasswordHash = nil
	}

	utils.RespondSuccessWithPagination(c, users, page, perPage, total)
}

// GetDepartmentTasks returns tasks in a department
func (h *DepartmentHandler) GetDepartmentTasks(c *gin.Context) {
	departmentID := c.Param("id")

	// Check if department exists
	var department models.Department
	if err := h.db.First(&department, "id = ?", departmentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "DEPARTMENT_NOT_FOUND", "Department not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch department", nil)
		return
	}

	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	// Get filter parameters
	status := c.Query("status")
	priority := c.Query("priority")

	// Build query
	query := h.db.Model(&models.Task{}).Where("department_id = ?", departmentID)

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to count tasks", nil)
		return
	}

	// Apply pagination
	offset := (page - 1) * perPage
	var tasks []models.Task
	if err := query.
		Preload("Creator").
		Preload("Assignees").
		Preload("Project").
		Order("created_at DESC").
		Limit(perPage).
		Offset(offset).
		Find(&tasks).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch tasks", nil)
		return
	}

	utils.RespondSuccessWithPagination(c, tasks, page, perPage, total)
}
