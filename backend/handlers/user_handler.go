// ABOUTME: User management handlers for user CRUD operations
// ABOUTME: Handles user listing, retrieval, and updates with role-based access

package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/synapse/backend/models"
	"github.com/synapse/backend/utils"
	"gorm.io/gorm"
)

type UserHandler struct {
	db *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

// UpdateUserRequest represents the user update request body
type UpdateUserRequest struct {
	FullName     *string `json:"full_name" binding:"omitempty,min=1"`
	AvatarURL    *string `json:"avatar_url"`
	JobTitle     *string `json:"job_title"`
	DepartmentID *string `json:"department_id"`
	Role         *string `json:"role" binding:"omitempty,oneof=Admin Manager Member Viewer"`
	IsActive     *bool   `json:"is_active"`
}

// GetUsers returns a paginated list of users
func (h *UserHandler) GetUsers(c *gin.Context) {
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
	departmentID := c.Query("department_id")
	role := c.Query("role")
	isActive := c.Query("is_active")
	search := c.Query("search")

	// Get user context for access control
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	// Build query
	query := h.db.Model(&models.User{})

	// Apply role-based filtering
	if userRole == "Manager" {
		// Managers can only see users in their department
		query = query.Where("department_id = ?", userDepartmentID)
	}
	// Admins can see all users (no additional filter)

	// Apply filters
	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}
	if role != "" {
		query = query.Where("role = ?", role)
	}
	if isActive != "" {
		if isActive == "true" {
			query = query.Where("is_active = ?", true)
		} else if isActive == "false" {
			query = query.Where("is_active = ?", false)
		}
	}
	if search != "" {
		query = query.Where("full_name ILIKE ? OR email ILIKE ? OR username ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

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
		Preload("Department").
		Order("created_at DESC").
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

// GetUser returns a single user by ID
func (h *UserHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")

	var user models.User
	if err := h.db.
		Preload("Department").
		First(&user, "id = ?", userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "USER_NOT_FOUND", "User not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch user", nil)
		return
	}

	// Check permissions
	requestUserID, _ := c.Get("user_id")
	requestUserRole, _ := c.Get("user_role")
	requestUserDepartmentID, _ := c.Get("user_department_id")

	// Users can view their own profile
	// Admins can view any user
	// Managers can view users in their department
	// Members and Viewers can view users in their department
	if requestUserID.(string) != userID {
		if requestUserRole == "Manager" {
			reqDeptID, _ := requestUserDepartmentID.(*string)
			if reqDeptID == nil || user.DepartmentID == nil ||
				*user.DepartmentID != *reqDeptID {
				utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to view this user", nil)
				return
			}
		} else if requestUserRole != "Admin" {
			// Members and Viewers can only view users in same department
			reqDeptID, _ := requestUserDepartmentID.(*string)
			if reqDeptID == nil || user.DepartmentID == nil ||
				*user.DepartmentID != *reqDeptID {
				utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to view this user", nil)
				return
			}
		}
	}

	// Clear password hash
	user.PasswordHash = nil

	utils.RespondSuccess(c, http.StatusOK, user, "User retrieved successfully")
}

// UpdateUser updates an existing user
func (h *UserHandler) UpdateUser(c *gin.Context) {
	userID := c.Param("id")

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid input data", nil)
		return
	}

	// Get requesting user context
	requestUserID, _ := c.Get("user_id")
	requestUserRole, _ := c.Get("user_role")

	// Fetch existing user
	var user models.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "USER_NOT_FOUND", "User not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch user", nil)
		return
	}

	// Check permissions
	isSelf := requestUserID.(string) == userID
	isAdmin := requestUserRole == "Admin"

	// Users can update their own profile (limited fields)
	// Admins can update any user (all fields)
	if !isSelf && !isAdmin {
		utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to update this user", nil)
		return
	}

	// Update fields based on permissions
	if req.FullName != nil {
		user.FullName = *req.FullName
	}
	if req.AvatarURL != nil {
		user.AvatarURL = req.AvatarURL
	}
	if req.JobTitle != nil {
		user.JobTitle = req.JobTitle
	}

	// Only admins can change role, department, and active status
	if isAdmin {
		if req.Role != nil {
			user.Role = *req.Role
		}
		if req.DepartmentID != nil {
			user.DepartmentID = req.DepartmentID
		}
		if req.IsActive != nil {
			user.IsActive = *req.IsActive
		}
	} else {
		// Non-admins trying to change restricted fields
		if req.Role != nil || req.DepartmentID != nil || req.IsActive != nil {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Only admins can change role, department, or active status", nil)
			return
		}
	}

	// Save user
	if err := h.db.Save(&user).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to update user", nil)
		return
	}

	// Reload user with associations
	h.db.Preload("Department").First(&user, "id = ?", user.ID)

	// Clear password hash
	user.PasswordHash = nil

	utils.RespondSuccess(c, http.StatusOK, user, "User updated successfully")
}

// GetUserTasks returns tasks for a specific user
func (h *UserHandler) GetUserTasks(c *gin.Context) {
	userID := c.Param("id")

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

	// Check if user exists
	var user models.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "USER_NOT_FOUND", "User not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch user", nil)
		return
	}

	// Check permissions
	requestUserID, _ := c.Get("user_id")
	requestUserRole, _ := c.Get("user_role")
	requestUserDepartmentID, _ := c.Get("user_department_id")

	// Users can view their own tasks
	// Admins can view any user's tasks
	// Managers can view tasks of users in their department
	if requestUserID.(string) != userID && requestUserRole != "Admin" {
		if requestUserRole == "Manager" {
			reqDeptID, _ := requestUserDepartmentID.(*string)
			if reqDeptID == nil || user.DepartmentID == nil ||
				*user.DepartmentID != *reqDeptID {
				utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to view this user's tasks", nil)
				return
			}
		} else {
			utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to view this user's tasks", nil)
			return
		}
	}

	// Build query for tasks created by or assigned to the user
	query := h.db.Model(&models.Task{}).Where(
		"creator_id = ? OR id IN (SELECT task_id FROM task_assignees WHERE user_id = ?)",
		userID, userID,
	)

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
		Preload("Department").
		Preload("Project").
		Order("created_at DESC").
		Limit(perPage).
		Offset(offset).
		Find(&tasks).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch tasks", nil)
		return
	}

	// Load assignees for all tasks
	if err := h.loadTaskAssignees(&tasks); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to load task assignees", nil)
		return
	}

	utils.RespondSuccessWithPagination(c, tasks, page, perPage, total)
}

// loadTaskAssignees loads assignee IDs from task_assignees table
func (h *UserHandler) loadTaskAssignees(tasks *[]models.Task) error {
	if len(*tasks) == 0 {
		return nil
	}

	// Collect all task IDs
	taskIDs := make([]string, len(*tasks))
	taskMap := make(map[string]*models.Task)
	for i := range *tasks {
		taskIDs[i] = (*tasks)[i].ID
		taskMap[(*tasks)[i].ID] = &(*tasks)[i]
		// Initialize empty slice to avoid null
		(*tasks)[i].Assignees = []string{}
	}

	// Query assignees for all tasks using IN clause
	var results []struct {
		TaskID string `gorm:"column:task_id"`
		UserID string `gorm:"column:user_id"`
	}
	if err := h.db.Raw("SELECT task_id, user_id FROM task_assignees WHERE task_id IN ?", taskIDs).Scan(&results).Error; err != nil {
		return err
	}

	// Populate assignees
	for _, result := range results {
		if task, ok := taskMap[result.TaskID]; ok {
			task.Assignees = append(task.Assignees, result.UserID)
		}
	}

	return nil
}
