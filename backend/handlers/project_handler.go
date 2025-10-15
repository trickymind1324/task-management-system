// ABOUTME: Project management handlers for CRUD operations
// ABOUTME: Handles project listing, creation, updates with authorization

package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/synapse/backend/models"
	"github.com/synapse/backend/utils"
	"gorm.io/gorm"
)

type ProjectHandler struct {
	db *gorm.DB
}

func NewProjectHandler(db *gorm.DB) *ProjectHandler {
	return &ProjectHandler{db: db}
}

// CreateProjectRequest represents the project creation request body
type CreateProjectRequest struct {
	Name         string  `json:"name" binding:"required,min=1,max=200"`
	Description  *string `json:"description"`
	Status       string  `json:"status" binding:"omitempty,oneof=Active On Hold Completed Archived"`
	DepartmentID *string `json:"department_id"`
	OwnerID      *string `json:"owner_id"`
	StartDate    *string `json:"start_date"` // ISO 8601 format
	EndDate      *string `json:"end_date"`   // ISO 8601 format
}

// UpdateProjectRequest represents the project update request body
type UpdateProjectRequest struct {
	Name         *string `json:"name" binding:"omitempty,min=1,max=200"`
	Description  *string `json:"description"`
	Status       *string `json:"status" binding:"omitempty,oneof=Active On Hold Completed Archived"`
	DepartmentID *string `json:"department_id"`
	OwnerID      *string `json:"owner_id"`
	StartDate    *string `json:"start_date"`
	EndDate      *string `json:"end_date"`
}

// GetProjects returns a paginated list of projects
func (h *ProjectHandler) GetProjects(c *gin.Context) {
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
	departmentID := c.Query("department_id")
	ownerID := c.Query("owner_id")
	search := c.Query("search")

	// Get user context for access control
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	// Build query
	query := h.db.Model(&models.Project{})

	// Apply role-based filtering
	if userRole == "Manager" {
		// Managers can only see projects in their department
		query = query.Where("department_id = ?", userDepartmentID)
	}
	// Admins can see all projects (no additional filter)

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}
	if ownerID != "" {
		query = query.Where("owner_id = ?", ownerID)
	}
	if search != "" {
		query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to count projects", nil)
		return
	}

	// Apply pagination
	offset := (page - 1) * perPage
	var projects []models.Project
	if err := query.
		Preload("Owner").
		Preload("Department").
		Order("created_at DESC").
		Limit(perPage).
		Offset(offset).
		Find(&projects).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch projects", nil)
		return
	}

	utils.RespondSuccessWithPagination(c, projects, page, perPage, total)
}

// GetProject returns a single project by ID
func (h *ProjectHandler) GetProject(c *gin.Context) {
	projectID := c.Param("id")

	var project models.Project
	if err := h.db.
		Preload("Owner").
		Preload("Department").
		First(&project, "id = ?", projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "PROJECT_NOT_FOUND", "Project not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch project", nil)
		return
	}

	// Check permissions
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	// Managers can only view projects in their department
	if userRole == "Manager" {
		if userDepartmentID == nil || project.DepartmentID == nil ||
			*project.DepartmentID != userDepartmentID.(string) {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to view this project", nil)
			return
		}
	}

	utils.RespondSuccess(c, http.StatusOK, project, "Project retrieved successfully")
}

// CreateProject creates a new project
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid input data", nil)
		return
	}

	// Get user context
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	// Check permissions - only managers and admins can create projects
	if userRole != "Manager" && userRole != "Admin" {
		utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Only managers and admins can create projects", nil)
		return
	}

	// Validate department if provided
	if req.DepartmentID != nil && *req.DepartmentID != "" {
		var dept models.Department
		if err := h.db.First(&dept, "id = ?", *req.DepartmentID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				utils.RespondError(c, http.StatusBadRequest, "INVALID_DEPARTMENT", "Department not found", nil)
				return
			}
			utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to validate department", nil)
			return
		}

		// Managers can only create projects in their department
		if userRole == "Manager" {
			if userDepartmentID == nil || *req.DepartmentID != userDepartmentID.(string) {
				utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Managers can only create projects in their department", nil)
				return
			}
		}
	} else if userRole == "Manager" {
		// If no department specified, use manager's department
		if userDepartmentID != nil {
			depID := userDepartmentID.(string)
			req.DepartmentID = &depID
		}
	}

	// Validate owner if provided
	if req.OwnerID != nil && *req.OwnerID != "" {
		var owner models.User
		if err := h.db.First(&owner, "id = ?", *req.OwnerID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				utils.RespondError(c, http.StatusBadRequest, "INVALID_OWNER", "Owner user not found", nil)
				return
			}
			utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to validate owner", nil)
			return
		}
	} else {
		// Set current user as owner if not specified
		ownerID := userID.(string)
		req.OwnerID = &ownerID
	}

	// Parse dates if provided
	var startDate, endDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.StartDate)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid start_date format, use ISO 8601", nil)
			return
		}
		startDate = &parsed
	}
	if req.EndDate != nil && *req.EndDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.EndDate)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid end_date format, use ISO 8601", nil)
			return
		}
		endDate = &parsed
	}

	// Validate date range
	if startDate != nil && endDate != nil && endDate.Before(*startDate) {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "End date cannot be before start date", nil)
		return
	}

	// Set default status
	status := "Active"
	if req.Status != "" {
		status = req.Status
	}

	// Create project
	project := models.Project{
		Name:         req.Name,
		Description:  req.Description,
		Status:       status,
		DepartmentID: req.DepartmentID,
		OwnerID:      req.OwnerID,
		StartDate:    startDate,
		EndDate:      endDate,
	}

	if err := h.db.Create(&project).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to create project", nil)
		return
	}

	// Reload with associations
	h.db.
		Preload("Owner").
		Preload("Department").
		First(&project, "id = ?", project.ID)

	utils.RespondSuccess(c, http.StatusCreated, project, "Project created successfully")
}

// UpdateProject updates an existing project
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	projectID := c.Param("id")

	var req UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid input data", nil)
		return
	}

	// Get user context
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	// Fetch existing project
	var project models.Project
	if err := h.db.First(&project, "id = ?", projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "PROJECT_NOT_FOUND", "Project not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch project", nil)
		return
	}

	// Check permissions
	if userRole == "Manager" {
		// Managers can only update projects in their department
		if userDepartmentID == nil || project.DepartmentID == nil ||
			*project.DepartmentID != userDepartmentID.(string) {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to update this project", nil)
			return
		}
	} else if userRole != "Admin" {
		utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Only managers and admins can update projects", nil)
		return
	}

	// Update fields
	if req.Name != nil {
		project.Name = *req.Name
	}
	if req.Description != nil {
		project.Description = req.Description
	}
	if req.Status != nil {
		project.Status = *req.Status
	}
	if req.DepartmentID != nil {
		// Validate department
		if *req.DepartmentID == "" {
			project.DepartmentID = nil
		} else {
			var dept models.Department
			if err := h.db.First(&dept, "id = ?", *req.DepartmentID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					utils.RespondError(c, http.StatusBadRequest, "INVALID_DEPARTMENT", "Department not found", nil)
					return
				}
				utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to validate department", nil)
				return
			}
			project.DepartmentID = req.DepartmentID
		}
	}
	if req.OwnerID != nil {
		// Validate owner
		if *req.OwnerID == "" {
			project.OwnerID = nil
		} else {
			var owner models.User
			if err := h.db.First(&owner, "id = ?", *req.OwnerID).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					utils.RespondError(c, http.StatusBadRequest, "INVALID_OWNER", "Owner user not found", nil)
					return
				}
				utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to validate owner", nil)
				return
			}
			project.OwnerID = req.OwnerID
		}
	}
	if req.StartDate != nil {
		if *req.StartDate == "" {
			project.StartDate = nil
		} else {
			parsed, err := time.Parse(time.RFC3339, *req.StartDate)
			if err != nil {
				utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid start_date format", nil)
				return
			}
			project.StartDate = &parsed
		}
	}
	if req.EndDate != nil {
		if *req.EndDate == "" {
			project.EndDate = nil
		} else {
			parsed, err := time.Parse(time.RFC3339, *req.EndDate)
			if err != nil {
				utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid end_date format", nil)
				return
			}
			project.EndDate = &parsed
		}
	}

	// Validate date range
	if project.StartDate != nil && project.EndDate != nil && project.EndDate.Before(*project.StartDate) {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "End date cannot be before start date", nil)
		return
	}

	// Save project
	if err := h.db.Save(&project).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to update project", nil)
		return
	}

	// Reload with associations
	h.db.
		Preload("Owner").
		Preload("Department").
		First(&project, "id = ?", project.ID)

	utils.RespondSuccess(c, http.StatusOK, project, "Project updated successfully")
}

// DeleteProject deletes a project
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	projectID := c.Param("id")

	// Get user context
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	// Fetch existing project
	var project models.Project
	if err := h.db.First(&project, "id = ?", projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "PROJECT_NOT_FOUND", "Project not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch project", nil)
		return
	}

	// Check permissions - only admins can delete projects
	// Managers can only delete projects in their department
	if userRole == "Manager" {
		if userDepartmentID == nil || project.DepartmentID == nil ||
			*project.DepartmentID != userDepartmentID.(string) {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to delete this project", nil)
			return
		}
	} else if userRole != "Admin" {
		utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Only managers and admins can delete projects", nil)
		return
	}

	// Check if project has tasks
	var taskCount int64
	if err := h.db.Model(&models.Task{}).Where("project_id = ?", projectID).Count(&taskCount).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to check project tasks", nil)
		return
	}
	if taskCount > 0 {
		utils.RespondError(c, http.StatusConflict, "PROJECT_HAS_TASKS", "Cannot delete project with existing tasks", nil)
		return
	}

	// Delete project
	if err := h.db.Delete(&project).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to delete project", nil)
		return
	}

	utils.RespondSuccess(c, http.StatusOK, nil, "Project deleted successfully")
}

// GetProjectTasks returns tasks for a specific project
func (h *ProjectHandler) GetProjectTasks(c *gin.Context) {
	projectID := c.Param("id")

	// Check if project exists
	var project models.Project
	if err := h.db.First(&project, "id = ?", projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "PROJECT_NOT_FOUND", "Project not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch project", nil)
		return
	}

	// Check permissions
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	if userRole == "Manager" {
		if userDepartmentID == nil || project.DepartmentID == nil ||
			*project.DepartmentID != userDepartmentID.(string) {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to view this project's tasks", nil)
			return
		}
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
	query := h.db.Model(&models.Task{}).Where("project_id = ?", projectID)

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
		Preload("Department").
		Order("created_at DESC").
		Limit(perPage).
		Offset(offset).
		Find(&tasks).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch tasks", nil)
		return
	}

	utils.RespondSuccessWithPagination(c, tasks, page, perPage, total)
}
