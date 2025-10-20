// ABOUTME: Task CRUD handlers for task management endpoints
// ABOUTME: Handles task creation, retrieval, updates, deletion with filtering

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

type TaskHandler struct {
	db *gorm.DB
}

func NewTaskHandler(db *gorm.DB) *TaskHandler {
	return &TaskHandler{db: db}
}

// CreateTaskRequest represents the task creation request body
type CreateTaskRequest struct {
	Title       string    `json:"title" binding:"required,max=255"`
	Description *string   `json:"description"`
	Status      string    `json:"status"`
	Priority    string    `json:"priority"`
	AssigneeIDs []string  `json:"assignee_ids"`
	DepartmentID *string  `json:"department_id"`
	ProjectID   *string   `json:"project_id"`
	DueDate     *string   `json:"due_date"` // ISO 8601 format
	Tags        []string  `json:"tags"`
	Source      string    `json:"source"`
}

// UpdateTaskRequest represents the task update request body
type UpdateTaskRequest struct {
	Title       *string   `json:"title" binding:"omitempty,max=255"`
	Description *string   `json:"description"`
	Status      *string   `json:"status"`
	Priority    *string   `json:"priority"`
	AssigneeIDs []string  `json:"assignee_ids"`
	DepartmentID *string  `json:"department_id"`
	ProjectID   *string   `json:"project_id"`
	DueDate     *string   `json:"due_date"`
	Tags        []string  `json:"tags"`
}

// Valid values for validation
var (
	validStatuses  = map[string]bool{"To Do": true, "In Progress": true, "In Review": true, "Blocked": true, "Done": true}
	validPriorities = map[string]bool{"Low": true, "Medium": true, "High": true, "Urgent": true}
	validSources   = map[string]bool{"GUI": true, "Email": true, "API": true, "Document": true, "NLP": true}
)

// GetTasks returns a paginated list of tasks with filters
func (h *TaskHandler) GetTasks(c *gin.Context) {
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
	assigneeID := c.Query("assignee_id")
	departmentID := c.Query("department_id")
	projectID := c.Query("project_id")
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	// Get user context
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	// Build query
	query := h.db.Model(&models.Task{})

	// Apply role-based filtering
	if userRole == "Member" || userRole == "Viewer" {
		// Members and Viewers can only see tasks in their department or assigned to them
		query = query.Where("creator_id = ? OR department_id = ? OR id IN (SELECT task_id FROM task_assignees WHERE user_id = ?)",
			userID, userDepartmentID, userID)
	} else if userRole == "Manager" {
		// Managers can see all tasks in their department
		query = query.Where("department_id = ?", userDepartmentID)
	}
	// Admins can see all tasks (no additional filter)

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}
	if assigneeID != "" {
		query = query.Where("id IN (SELECT task_id FROM task_assignees WHERE user_id = ?)", assigneeID)
	}
	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}
	if projectID != "" {
		query = query.Where("project_id = ?", projectID)
	}
	if search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to count tasks", nil)
		return
	}

	// Apply sorting
	validSortFields := map[string]bool{
		"created_at": true,
		"updated_at": true,
		"due_date":   true,
		"priority":   true,
		"status":     true,
		"title":      true,
	}
	if !validSortFields[sortBy] {
		sortBy = "created_at"
	}
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}

	// Apply pagination and sorting
	offset := (page - 1) * perPage
	var tasks []models.Task
	if err := query.
		Preload("Creator").
		Preload("Department").
		Preload("Project").
		Order(sortBy + " " + sortOrder).
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

// GetTask returns a single task by ID
func (h *TaskHandler) GetTask(c *gin.Context) {
	taskID := c.Param("id")

	var task models.Task
	if err := h.db.
		Preload("Creator").
		Preload("Department").
		Preload("Project").
		First(&task, "id = ?", taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "TASK_NOT_FOUND", "Task not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch task", nil)
		return
	}

	// Check permissions
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	if !canAccessTask(task, userID.(string), userRole.(string), userDepartmentID) {
		utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to view this task", nil)
		return
	}

	// Load assignees for this task
	tasks := []models.Task{task}
	if err := h.loadTaskAssignees(&tasks); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to load task assignees", nil)
		return
	}
	task = tasks[0]

	utils.RespondSuccess(c, http.StatusOK, task, "Task retrieved successfully")
}

// CreateTask creates a new task
func (h *TaskHandler) CreateTask(c *gin.Context) {
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid input data", nil)
		return
	}

	// Get user context
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	// Check permissions
	if userRole == "Viewer" {
		utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Viewers cannot create tasks", nil)
		return
	}

	// Validate and set defaults
	status := "To Do"
	if req.Status != "" {
		if !validStatuses[req.Status] {
			utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid status value", nil)
			return
		}
		status = req.Status
	}

	priority := "Medium"
	if req.Priority != "" {
		if !validPriorities[req.Priority] {
			utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid priority value", nil)
			return
		}
		priority = req.Priority
	}

	source := "GUI"
	if req.Source != "" {
		if !validSources[req.Source] {
			utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid source value", nil)
			return
		}
		source = req.Source
	}

	// Parse due date if provided
	var dueDate *time.Time
	if req.DueDate != nil && *req.DueDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid due_date format, use ISO 8601", nil)
			return
		}
		dueDate = &parsed
	}

	// Create task
	task := models.Task{
		Title:       req.Title,
		Description: req.Description,
		Status:      status,
		Priority:    priority,
		CreatorID:   userID.(string),
		DepartmentID: req.DepartmentID,
		ProjectID:   req.ProjectID,
		DueDate:     dueDate,
		Source:      source,
		Tags:        req.Tags,
	}

	// If no department specified, use user's department
	if task.DepartmentID == nil && userDepartmentID != nil {
		// userDepartmentID is *string from JWT claims
		deptIDPtr, ok := userDepartmentID.(*string)
		if ok && deptIDPtr != nil {
			task.DepartmentID = deptIDPtr
		}
	}

	// Start transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create task
	if err := tx.Create(&task).Error; err != nil {
		tx.Rollback()
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to create task", nil)
		return
	}

	// Assign users if provided
	if len(req.AssigneeIDs) > 0 {
		// Validate all assignees exist
		for _, assigneeID := range req.AssigneeIDs {
			var user models.User
			if err := tx.First(&user, "id = ?", assigneeID).Error; err != nil {
				tx.Rollback()
				utils.RespondError(c, http.StatusBadRequest, "INVALID_ASSIGNEE", "Assignee not found: "+assigneeID, nil)
				return
			}
		}

		// Manually insert into task_assignees table
		for _, assigneeID := range req.AssigneeIDs {
			if err := tx.Exec("INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)", task.ID, assigneeID).Error; err != nil {
				tx.Rollback()
				utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to assign users", nil)
				return
			}
		}
	}

	tx.Commit()

	// Reload task with associations
	h.db.
		Preload("Creator").
		Preload("Department").
		Preload("Project").
		First(&task, "id = ?", task.ID)

	// Load assignees
	tasks := []models.Task{task}
	if err := h.loadTaskAssignees(&tasks); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to load task assignees", nil)
		return
	}
	task = tasks[0]

	utils.RespondSuccess(c, http.StatusCreated, task, "Task created successfully")
}

// UpdateTask updates an existing task
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	taskID := c.Param("id")

	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid input data", nil)
		return
	}

	// Get user context
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	// Fetch existing task
	var task models.Task
	if err := h.db.First(&task, "id = ?", taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "TASK_NOT_FOUND", "Task not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch task", nil)
		return
	}

	// Check permissions
	if !canModifyTask(task, userID.(string), userRole.(string), userDepartmentID) {
		utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to update this task", nil)
		return
	}

	// Update fields
	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = req.Description
	}
	if req.Status != nil {
		if !validStatuses[*req.Status] {
			utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid status value", nil)
			return
		}
		task.Status = *req.Status
		// Set completion date if status is Done
		if *req.Status == "Done" && task.CompletionDate == nil {
			now := time.Now()
			task.CompletionDate = &now
		}
	}
	if req.Priority != nil {
		if !validPriorities[*req.Priority] {
			utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid priority value", nil)
			return
		}
		task.Priority = *req.Priority
	}
	if req.DepartmentID != nil {
		task.DepartmentID = req.DepartmentID
	}
	if req.ProjectID != nil {
		task.ProjectID = req.ProjectID
	}
	if req.DueDate != nil {
		if *req.DueDate == "" {
			task.DueDate = nil
		} else {
			parsed, err := time.Parse(time.RFC3339, *req.DueDate)
			if err != nil {
				utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid due_date format", nil)
				return
			}
			task.DueDate = &parsed
		}
	}
	if req.Tags != nil {
		task.Tags = req.Tags
	}

	// Start transaction
	tx := h.db.Begin()

	// Update task
	if err := tx.Save(&task).Error; err != nil {
		tx.Rollback()
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to update task", nil)
		return
	}

	// Update assignees if provided
	if req.AssigneeIDs != nil {
		// Clear existing assignees from task_assignees table
		if err := tx.Exec("DELETE FROM task_assignees WHERE task_id = ?", task.ID).Error; err != nil {
			tx.Rollback()
			utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to update assignees", nil)
			return
		}

		// Add new assignees
		if len(req.AssigneeIDs) > 0 {
			// Validate all assignees exist
			for _, assigneeID := range req.AssigneeIDs {
				var user models.User
				if err := tx.First(&user, "id = ?", assigneeID).Error; err != nil {
					tx.Rollback()
					utils.RespondError(c, http.StatusBadRequest, "INVALID_ASSIGNEE", "Assignee not found: "+assigneeID, nil)
					return
				}
			}

			// Manually insert into task_assignees table
			for _, assigneeID := range req.AssigneeIDs {
				if err := tx.Exec("INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)", task.ID, assigneeID).Error; err != nil {
					tx.Rollback()
					utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to assign users", nil)
					return
				}
			}
		}
	}

	tx.Commit()

	// Reload task with associations
	h.db.
		Preload("Creator").
		Preload("Department").
		Preload("Project").
		First(&task, "id = ?", task.ID)

	// Load assignees
	tasks := []models.Task{task}
	if err := h.loadTaskAssignees(&tasks); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to load task assignees", nil)
		return
	}
	task = tasks[0]

	utils.RespondSuccess(c, http.StatusOK, task, "Task updated successfully")
}

// DeleteTask deletes a task
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	taskID := c.Param("id")

	// Get user context
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Fetch existing task
	var task models.Task
	if err := h.db.First(&task, "id = ?", taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "TASK_NOT_FOUND", "Task not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch task", nil)
		return
	}

	// Check permissions - only admins and task creators can delete
	if userRole != "Admin" && task.CreatorID != userID.(string) {
		utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "Only admins and task creators can delete tasks", nil)
		return
	}

	// Delete task
	if err := h.db.Delete(&task).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to delete task", nil)
		return
	}

	utils.RespondSuccess(c, http.StatusOK, nil, "Task deleted successfully")
}

// UpdateTaskStatus updates only the status of a task
func (h *TaskHandler) UpdateTaskStatus(c *gin.Context) {
	taskID := c.Param("id")

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid status", nil)
		return
	}

	// Validate status
	if !validStatuses[req.Status] {
		utils.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid status value", nil)
		return
	}

	// Get user context
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	userDepartmentID, _ := c.Get("user_department_id")

	// Fetch existing task
	var task models.Task
	if err := h.db.First(&task, "id = ?", taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondError(c, http.StatusNotFound, "TASK_NOT_FOUND", "Task not found", nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to fetch task", nil)
		return
	}

	// Check permissions
	if !canModifyTask(task, userID.(string), userRole.(string), userDepartmentID) {
		utils.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to update this task", nil)
		return
	}

	// Update status
	task.Status = req.Status
	if req.Status == "Done" && task.CompletionDate == nil {
		now := time.Now()
		task.CompletionDate = &now
	}

	if err := h.db.Save(&task).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to update task status", nil)
		return
	}

	// Reload task with associations
	h.db.
		Preload("Creator").
		Preload("Department").
		Preload("Project").
		First(&task, "id = ?", task.ID)

	// Load assignees
	tasks := []models.Task{task}
	if err := h.loadTaskAssignees(&tasks); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "SERVER_ERROR", "Failed to load task assignees", nil)
		return
	}
	task = tasks[0]

	utils.RespondSuccess(c, http.StatusOK, task, "Task status updated successfully")
}

// Helper functions

// loadTaskAssignees loads assignee IDs from task_assignees table
func (h *TaskHandler) loadTaskAssignees(tasks *[]models.Task) error {
	if len(*tasks) == 0 {
		return nil
	}

	// Collect all task IDs
	taskIDs := make([]string, len(*tasks))
	taskMap := make(map[string]*models.Task)
	for i := range *tasks {
		taskIDs[i] = (*tasks)[i].ID
		taskMap[(*tasks)[i].ID] = &(*tasks)[i]
	}

	// Query assignees for all tasks
	rows, err := h.db.Raw("SELECT task_id, user_id FROM task_assignees WHERE task_id = ANY(?)", taskIDs).Rows()
	if err != nil {
		return err
	}
	defer rows.Close()

	// Populate assignees
	for rows.Next() {
		var taskID, userID string
		if err := rows.Scan(&taskID, &userID); err != nil {
			return err
		}
		if task, ok := taskMap[taskID]; ok {
			task.Assignees = append(task.Assignees, userID)
		}
	}

	return rows.Err()
}

func canAccessTask(task models.Task, userID, userRole string, userDepartmentID interface{}) bool {
	// Admins can access all tasks
	if userRole == "Admin" {
		return true
	}

	// Managers can access tasks in their department
	if userRole == "Manager" {
		deptIDPtr, ok := userDepartmentID.(*string)
		if ok && deptIDPtr != nil && task.DepartmentID != nil {
			return *task.DepartmentID == *deptIDPtr
		}
	}

	// Members and Viewers can access tasks they created or are assigned to or in their department
	if task.CreatorID == userID {
		return true
	}
	deptIDPtr, ok := userDepartmentID.(*string)
	if ok && deptIDPtr != nil && task.DepartmentID != nil && *task.DepartmentID == *deptIDPtr {
		return true
	}

	// TODO: Check if user is assigned to the task (requires loading assignees)
	return false
}

func canModifyTask(task models.Task, userID, userRole string, userDepartmentID interface{}) bool {
	// Viewers cannot modify tasks
	if userRole == "Viewer" {
		return false
	}

	// Admins can modify all tasks
	if userRole == "Admin" {
		return true
	}

	// Managers can modify tasks in their department
	if userRole == "Manager" {
		deptIDPtr, ok := userDepartmentID.(*string)
		if ok && deptIDPtr != nil && task.DepartmentID != nil {
			return *task.DepartmentID == *deptIDPtr
		}
	}

	// Members can modify tasks they created or are assigned to
	if userRole == "Member" {
		if task.CreatorID == userID {
			return true
		}
		// TODO: Check if user is assigned to the task
	}

	return false
}
