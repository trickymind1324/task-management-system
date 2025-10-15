# Project Synapse - Backend Architecture Design

**Document Version:** 1.0
**Last Updated:** October 13, 2025
**Status:** Architecture Design - Ready for Implementation

---

## Executive Summary

This document provides a comprehensive backend architecture design for Project Synapse based on the existing Next.js prototype that uses json-server. The design enables seamless migration from the mock API to a production Go backend with minimal frontend changes.

**Key Design Goals:**
- Drop-in replacement for json-server mock API
- Production-ready from day one
- Extensible for Phase 2 AI features
- Database-agnostic frontend (API abstraction)
- Horizontal scalability

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Database Architecture](#2-database-architecture)
3. [API Layer Design](#3-api-layer-design)
4. [Service Layer Architecture](#4-service-layer-architecture)
5. [Project Structure](#5-project-structure)
6. [Data Flow & Patterns](#6-data-flow--patterns)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Migration Strategy](#8-migration-strategy)
9. [Phase 2 Preparation](#9-phase-2-preparation)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Current State Analysis

### 1.1 Prototype Architecture

**Frontend:**
- Next.js 15.5.4 with TypeScript
- Zustand for state management
- Custom API client layer (`src/lib/api/client.ts`)
- Environment-based API URL configuration

**Mock API:**
- json-server on port 3001
- db.json with 30 tasks, 5 users, 3 departments, 2 projects
- RESTful endpoints
- No authentication
- In-memory persistence

**Frontend API Client Pattern:**
```typescript
// All API calls go through this abstraction
const apiClient = new ApiClient();
await apiClient.getTasks(filters);
await apiClient.createTask(taskData);
```

**API Configuration:**
```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 1.2 Key Insights

1. **Frontend is already API-first** - Clean separation, easy to swap backends
2. **No hardcoded URLs** - All requests use environment variable
3. **RESTful patterns** - Matches industry standards
4. **Custom ID fields** - Uses `task_id`, `user_id` instead of generic `id`
5. **Rich data model** - All FRD requirements represented in db.json

### 1.3 Migration Advantages

✅ Frontend requires ZERO code changes (only env variable update)
✅ Prototype data can seed development database
✅ API contract already validated by working prototype
✅ UX proven before backend development starts

---

## 2. Database Architecture

### 2.1 Technology Choice

**PostgreSQL 15+**

**Rationale:**
- JSONB support for flexible metadata
- UUID support for distributed ID generation
- Full-text search capabilities
- Robust ACID guarantees
- Mature Go driver ecosystem (pgx, GORM)
- Easy scaling (read replicas, partitioning)

### 2.2 Schema Design

#### 2.2.1 Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) UNIQUE NOT NULL,  -- External ID (user-001)
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    job_title VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'Member',
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
```

#### 2.2.2 Departments Table

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id VARCHAR(50) UNIQUE NOT NULL,  -- External ID (dept-001)
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    head_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_departments_dept_id ON departments(department_id);
```

#### 2.2.3 Projects Table

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(50) UNIQUE NOT NULL,  -- External ID (proj-001)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    department_id UUID REFERENCES departments(id),
    owner_id UUID REFERENCES users(id),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_project_id ON projects(project_id);
CREATE INDEX idx_projects_department ON projects(department_id);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
```

#### 2.2.4 Tasks Table

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(50) UNIQUE NOT NULL,  -- External ID (task-001)
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'To Do',
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',

    creator_id UUID NOT NULL REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    project_id UUID REFERENCES projects(id),
    parent_task_id UUID REFERENCES tasks(id),  -- For subtasks

    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    source VARCHAR(50) DEFAULT 'GUI',
    confidence_score DECIMAL(3,2),  -- 0.00 to 1.00 for AI confidence

    tags TEXT[],  -- PostgreSQL array
    attachments TEXT[],  -- File URLs/IDs
    metadata JSONB DEFAULT '{}',  -- Flexible storage

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT chk_status CHECK (status IN ('To Do', 'In Progress', 'In Review', 'Blocked', 'Done')),
    CONSTRAINT chk_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    CONSTRAINT chk_source CHECK (source IN ('GUI', 'Email', 'API', 'Document', 'NLP')),
    CONSTRAINT chk_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

-- Performance indexes
CREATE INDEX idx_tasks_task_id ON tasks(task_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_department ON tasks(department_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_creation_date ON tasks(creation_date DESC);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);  -- Array search
CREATE INDEX idx_tasks_metadata ON tasks USING GIN(metadata);  -- JSONB search

-- Full-text search index
CREATE INDEX idx_tasks_search ON tasks USING GIN(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);
```

#### 2.2.5 Task Assignees (Many-to-Many)

```sql
CREATE TABLE task_assignees (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (task_id, user_id)
);

CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
```

#### 2.2.6 Task Dependencies

```sql
CREATE TABLE task_dependencies (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'blocks',  -- 'blocks', 'depends_on'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (task_id, depends_on_task_id),
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

CREATE INDEX idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX idx_task_deps_depends ON task_dependencies(depends_on_task_id);
```

#### 2.2.7 Comments Table

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id VARCHAR(50) UNIQUE NOT NULL,  -- External ID (comment-001)
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE  -- Soft delete
);

CREATE INDEX idx_comments_comment_id ON comments(comment_id);
CREATE INDEX idx_comments_task ON comments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);
```

#### 2.2.8 Sessions Table (JWT Refresh Tokens)

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### 2.3 Database Migration Strategy

**Tool:** golang-migrate or GORM AutoMigrate (start with GORM, switch to migrations later)

**Migration Files:**
```
migrations/
├── 000001_create_users.up.sql
├── 000001_create_users.down.sql
├── 000002_create_departments.up.sql
├── 000002_create_departments.down.sql
├── 000003_create_projects.up.sql
├── 000003_create_projects.down.sql
├── 000004_create_tasks.up.sql
├── 000004_create_tasks.down.sql
├── 000005_create_task_relationships.up.sql
├── 000005_create_task_relationships.down.sql
├── 000006_create_comments.up.sql
├── 000006_create_comments.down.sql
└── 000007_create_sessions.up.sql
```

**Seeding Development Database:**
```bash
# Script to import db.json data into PostgreSQL
go run cmd/seed/main.go --file=../prototype/db.json
```

### 2.4 Database Performance Considerations

**Query Optimization:**
- Composite indexes for common filter combinations
- Partial indexes for active/non-deleted records
- GIN indexes for array and JSONB searches
- EXPLAIN ANALYZE for query tuning

**Connection Pooling:**
```go
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
```

**Read Replicas (Future):**
- Write to primary
- Read from replicas for list/search queries
- Connection string routing

---

## 3. API Layer Design

### 3.1 HTTP Framework

**Choice: Gin**

**Rationale:**
- High performance (httprouter under the hood)
- Excellent middleware ecosystem
- Clean API design
- Good documentation
- Production-proven

**Alternative Considered:** Fiber (even faster, but Express-like API may confuse Go devs)

### 3.2 API Structure

```
/api/v1
├── /auth
│   ├── POST   /register
│   ├── POST   /login
│   ├── POST   /logout
│   ├── POST   /refresh
│   └── GET    /me
├── /tasks
│   ├── GET    /           # List tasks (with filters)
│   ├── POST   /           # Create task
│   ├── GET    /:id        # Get task
│   ├── PUT    /:id        # Update task
│   ├── PATCH  /:id        # Partial update
│   ├── DELETE /:id        # Delete task
│   └── /:id/comments
│       ├── GET    /       # Get comments
│       └── POST   /       # Add comment
├── /users
│   ├── GET    /           # List users
│   ├── GET    /:id        # Get user
│   ├── PUT    /:id        # Update user
│   └── /:id/tasks         # Get user's tasks
├── /departments
│   ├── GET    /           # List departments
│   ├── POST   /           # Create department (admin)
│   ├── GET    /:id        # Get department
│   ├── PUT    /:id        # Update department
│   └── /:id/tasks         # Get department tasks
└── /projects
    ├── GET    /           # List projects
    ├── POST   /           # Create project
    ├── GET    /:id        # Get project
    ├── PUT    /:id        # Update project
    ├── DELETE /:id        # Delete project
    └── /:id/tasks         # Get project tasks
```

### 3.3 Request/Response Format

**Standard Success Response:**
```go
type SuccessResponse struct {
    Success   bool        `json:"success"`
    Data      interface{} `json:"data"`
    Metadata  *Metadata   `json:"metadata,omitempty"`
    Timestamp string      `json:"timestamp"`
}

type Metadata struct {
    Page       int `json:"page,omitempty"`
    PerPage    int `json:"per_page,omitempty"`
    Total      int `json:"total,omitempty"`
    TotalPages int `json:"total_pages,omitempty"`
}
```

**Standard Error Response:**
```go
type ErrorResponse struct {
    Success   bool   `json:"success"`
    Error     Error  `json:"error"`
    Timestamp string `json:"timestamp"`
}

type Error struct {
    Code    string      `json:"code"`
    Message string      `json:"message"`
    Details interface{} `json:"details,omitempty"`
}
```

### 3.4 Handler Pattern

```go
package handlers

type TaskHandler struct {
    taskService *services.TaskService
    logger      *logrus.Logger
}

func NewTaskHandler(taskService *services.TaskService) *TaskHandler {
    return &TaskHandler{
        taskService: taskService,
        logger:      logrus.New(),
    }
}

// GetTasks handles GET /api/v1/tasks
func (h *TaskHandler) GetTasks(c *gin.Context) {
    // 1. Parse query parameters
    filters, err := parseTaskFilters(c)
    if err != nil {
        respondWithError(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
        return
    }

    // 2. Get current user from context (set by auth middleware)
    user := getCurrentUser(c)

    // 3. Call service layer
    tasks, total, err := h.taskService.GetTasks(c.Request.Context(), user, filters)
    if err != nil {
        h.logger.Errorf("Failed to get tasks: %v", err)
        respondWithError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve tasks")
        return
    }

    // 4. Build response
    respondWithSuccess(c, http.StatusOK, tasks, &Metadata{
        Page:       filters.Page,
        PerPage:    filters.PerPage,
        Total:      total,
        TotalPages: (total + filters.PerPage - 1) / filters.PerPage,
    })
}
```

### 3.5 Middleware Stack

```go
// Setup middleware chain
router := gin.New()
router.Use(
    middleware.Recovery(),           // Panic recovery
    middleware.RequestID(),          // Add X-Request-ID
    middleware.Logger(),             // Request logging
    middleware.CORS(),               // CORS headers
    middleware.RateLimit(),          // Rate limiting
)

// Protected routes
api := router.Group("/api/v1")
api.Use(middleware.JWTAuth())       // JWT validation

// Admin-only routes
admin := api.Group("/admin")
admin.Use(middleware.RequireRole("Admin"))
```

---

## 4. Service Layer Architecture

### 4.1 Service Pattern

**Separation of Concerns:**
- **Handlers**: HTTP concerns (parsing, validation, responses)
- **Services**: Business logic, orchestration
- **Repositories**: Data access, queries

### 4.2 Task Service Example

```go
package services

type TaskService struct {
    taskRepo   *repositories.TaskRepository
    userRepo   *repositories.UserRepository
    authz      *AuthorizationService
    db         *gorm.DB
    logger     *logrus.Logger
}

func NewTaskService(
    taskRepo *repositories.TaskRepository,
    userRepo *repositories.UserRepository,
    authz *AuthorizationService,
    db *gorm.DB,
) *TaskService {
    return &TaskService{
        taskRepo:   taskRepo,
        userRepo:   userRepo,
        authz:      authz,
        db:         db,
        logger:     logrus.New(),
    }
}

// GetTasks retrieves tasks based on filters and user permissions
func (s *TaskService) GetTasks(
    ctx context.Context,
    user *models.User,
    filters *TaskFilters,
) ([]*models.Task, int, error) {
    // Apply permission filters
    filters = s.authz.ApplyTaskFilters(user, filters)

    // Get tasks from repository
    tasks, total, err := s.taskRepo.Find(ctx, filters)
    if err != nil {
        return nil, 0, fmt.Errorf("failed to find tasks: %w", err)
    }

    // Eager load relationships if requested
    if filters.IncludeAssignees {
        for _, task := range tasks {
            assignees, _ := s.userRepo.GetTaskAssignees(ctx, task.ID)
            task.Assignees = assignees
        }
    }

    return tasks, total, nil
}

// CreateTask creates a new task with validation
func (s *TaskService) CreateTask(
    ctx context.Context,
    user *models.User,
    dto *CreateTaskDTO,
) (*models.Task, error) {
    // Validate business rules
    if err := s.validateTaskCreation(dto); err != nil {
        return nil, err
    }

    // Check permissions
    if !s.authz.CanCreateTask(user, dto.DepartmentID) {
        return nil, ErrForbidden
    }

    // Start transaction
    tx := s.db.Begin()
    defer func() {
        if r := recover(); r != nil {
            tx.Rollback()
        }
    }()

    // Create task
    task := &models.Task{
        TaskID:       generateTaskID(),
        Title:        dto.Title,
        Description:  dto.Description,
        Status:       dto.Status,
        Priority:     dto.Priority,
        CreatorID:    user.ID,
        DepartmentID: dto.DepartmentID,
        DueDate:      dto.DueDate,
        Source:       "GUI",
    }

    if err := s.taskRepo.CreateWithTx(tx, task); err != nil {
        tx.Rollback()
        return nil, fmt.Errorf("failed to create task: %w", err)
    }

    // Add assignees
    if len(dto.Assignees) > 0 {
        if err := s.taskRepo.AddAssignees(tx, task.ID, dto.Assignees); err != nil {
            tx.Rollback()
            return nil, fmt.Errorf("failed to add assignees: %w", err)
        }
    }

    // Commit transaction
    if err := tx.Commit().Error; err != nil {
        return nil, fmt.Errorf("failed to commit transaction: %w", err)
    }

    // Reload with associations
    return s.taskRepo.GetByID(ctx, task.ID)
}
```

### 4.3 Repository Pattern

```go
package repositories

type TaskRepository struct {
    db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) *TaskRepository {
    return &TaskRepository{db: db}
}

// Find retrieves tasks with filters
func (r *TaskRepository) Find(
    ctx context.Context,
    filters *TaskFilters,
) ([]*models.Task, int, error) {
    var tasks []*models.Task
    var total int64

    query := r.db.WithContext(ctx).Model(&models.Task{})

    // Apply filters
    if len(filters.Status) > 0 {
        query = query.Where("status IN ?", filters.Status)
    }
    if len(filters.Priority) > 0 {
        query = query.Where("priority IN ?", filters.Priority)
    }
    if filters.DepartmentID != nil {
        query = query.Where("department_id = ?", filters.DepartmentID)
    }
    if filters.ProjectID != nil {
        query = query.Where("project_id = ?", filters.ProjectID)
    }
    if filters.Search != "" {
        query = query.Where(
            "to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', ?)",
            filters.Search,
        )
    }

    // Count total
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }

    // Apply pagination
    offset := (filters.Page - 1) * filters.PerPage
    query = query.Offset(offset).Limit(filters.PerPage)

    // Apply sorting
    query = query.Order(filters.SortBy + " " + filters.SortOrder)

    // Execute query
    if err := query.Find(&tasks).Error; err != nil {
        return nil, 0, err
    }

    return tasks, int(total), nil
}
```

---

## 5. Project Structure

```
backend/
├── cmd/
│   ├── api/
│   │   └── main.go                 # API server entrypoint
│   ├── migrate/
│   │   └── main.go                 # Migration runner
│   └── seed/
│       └── main.go                 # Database seeder
├── internal/
│   ├── config/
│   │   ├── config.go               # Configuration struct
│   │   └── database.go             # DB connection setup
│   ├── models/
│   │   ├── task.go                 # Task model
│   │   ├── user.go                 # User model
│   │   ├── department.go           # Department model
│   │   ├── project.go              # Project model
│   │   ├── comment.go              # Comment model
│   │   └── common.go               # Base model, timestamps
│   ├── handlers/
│   │   ├── task_handler.go         # Task HTTP handlers
│   │   ├── user_handler.go         # User handlers
│   │   ├── auth_handler.go         # Auth handlers
│   │   ├── project_handler.go      # Project handlers
│   │   ├── department_handler.go   # Department handlers
│   │   └── helpers.go              # Response helpers
│   ├── services/
│   │   ├── task_service.go         # Task business logic
│   │   ├── user_service.go         # User logic
│   │   ├── auth_service.go         # Authentication
│   │   ├── authz_service.go        # Authorization
│   │   ├── project_service.go      # Project logic
│   │   └── department_service.go   # Department logic
│   ├── repositories/
│   │   ├── task_repository.go      # Task data access
│   │   ├── user_repository.go      # User data access
│   │   ├── project_repository.go   # Project data access
│   │   └── department_repository.go # Department data access
│   ├── middleware/
│   │   ├── auth.go                 # JWT auth middleware
│   │   ├── cors.go                 # CORS middleware
│   │   ├── logger.go               # Logging middleware
│   │   ├── rate_limit.go           # Rate limiting
│   │   └── recovery.go             # Panic recovery
│   ├── routes/
│   │   └── routes.go               # Route registration
│   ├── dto/
│   │   ├── task_dto.go             # Task request/response DTOs
│   │   ├── user_dto.go             # User DTOs
│   │   └── auth_dto.go             # Auth DTOs
│   ├── utils/
│   │   ├── validators.go           # Input validation
│   │   ├── errors.go               # Custom errors
│   │   ├── jwt.go                  # JWT helpers
│   │   └── password.go             # Password hashing
│   └── tests/
│       ├── integration/
│       │   ├── tasks_test.go       # Task API integration tests
│       │   └── auth_test.go        # Auth integration tests
│       └── unit/
│           ├── task_service_test.go # Task service unit tests
│           └── authz_test.go       # Authorization tests
├── pkg/
│   ├── logger/
│   │   └── logger.go               # Structured logging
│   └── response/
│       └── response.go             # Standard response builders
├── migrations/
│   ├── 000001_create_users.up.sql
│   ├── 000001_create_users.down.sql
│   └── ...
├── scripts/
│   ├── seed-dev.sh                 # Seed development DB
│   └── migrate.sh                  # Run migrations
├── deployments/
│   ├── docker/
│   │   ├── Dockerfile              # API server image
│   │   └── docker-compose.yml      # Local dev environment
│   └── kubernetes/
│       └── ...                     # K8s manifests (future)
├── docs/
│   └── swagger.yaml                # OpenAPI specification
├── go.mod
├── go.sum
├── .env.example                    # Environment template
├── CLAUDE.md                       # Backend guidelines
├── ARCHITECTURE.md                 # This document
└── README.md                       # Setup instructions
```

**Key Principles:**
- `cmd/`: Executable entry points
- `internal/`: Private application code (cannot be imported by other projects)
- `pkg/`: Public libraries (can be imported)
- `migrations/`: SQL migration files
- Standard layout following https://github.com/golang-standards/project-layout

---

## 6. Data Flow & Patterns

### 6.1 Request Flow

```
HTTP Request
    ↓
[Middleware Chain]
    ├─ Recovery (panic handling)
    ├─ Request ID
    ├─ Logger (request logging)
    ├─ CORS
    ├─ Rate Limit
    └─ JWT Auth (decode token, attach user to context)
    ↓
[Handler]
    ├─ Parse request (query params, body)
    ├─ Validate input
    └─ Call service
    ↓
[Service]
    ├─ Business logic
    ├─ Authorization checks
    ├─ Orchestrate repositories
    └─ Transaction management
    ↓
[Repository]
    ├─ Build SQL queries
    ├─ Execute database operations
    └─ Return models
    ↓
[Handler]
    ├─ Transform models to DTOs
    ├─ Build response
    └─ Return JSON
    ↓
HTTP Response
```

### 6.2 Dependency Injection Pattern

```go
// main.go
func main() {
    // Load configuration
    cfg := config.Load()

    // Setup database
    db := config.SetupDatabase(cfg)

    // Initialize repositories
    taskRepo := repositories.NewTaskRepository(db)
    userRepo := repositories.NewUserRepository(db)

    // Initialize services
    authService := services.NewAuthService(userRepo, cfg.JWT)
    authzService := services.NewAuthorizationService()
    taskService := services.NewTaskService(taskRepo, userRepo, authzService, db)

    // Initialize handlers
    authHandler := handlers.NewAuthHandler(authService)
    taskHandler := handlers.NewTaskHandler(taskService)

    // Setup router
    router := routes.SetupRouter(authHandler, taskHandler)

    // Start server
    router.Run(":8080")
}
```

### 6.3 Error Handling Strategy

**Error Types:**
```go
var (
    ErrNotFound      = errors.New("resource not found")
    ErrUnauthorized  = errors.New("unauthorized")
    ErrForbidden     = errors.New("forbidden")
    ErrValidation    = errors.New("validation failed")
    ErrConflict      = errors.New("resource conflict")
)
```

**Error Wrapping:**
```go
// Repository layer - add data context
if err := db.First(&task, id).Error; err != nil {
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, fmt.Errorf("%w: task %s", ErrNotFound, id)
    }
    return nil, fmt.Errorf("database error: %w", err)
}

// Service layer - add business context
if task, err := s.taskRepo.GetByID(ctx, id); err != nil {
    return nil, fmt.Errorf("failed to retrieve task: %w", err)
}

// Handler layer - convert to HTTP response
if err != nil {
    if errors.Is(err, ErrNotFound) {
        respondWithError(c, 404, "NOT_FOUND", err.Error())
    } else if errors.Is(err, ErrForbidden) {
        respondWithError(c, 403, "FORBIDDEN", err.Error())
    } else {
        respondWithError(c, 500, "INTERNAL_ERROR", "An error occurred")
    }
}
```

---

## 7. Authentication & Authorization

### 7.1 JWT Authentication Flow

**Login:**
```
1. POST /api/v1/auth/login { email, password }
2. Verify credentials (bcrypt.CompareHashAndPassword)
3. Generate access token (15min expiry)
4. Generate refresh token (7 days expiry)
5. Store refresh token in sessions table
6. Return { access_token, refresh_token, user }
```

**JWT Claims:**
```go
type JWTClaims struct {
    UserID       string `json:"user_id"`
    Email        string `json:"email"`
    Role         string `json:"role"`
    DepartmentID string `json:"department_id"`
    jwt.StandardClaims
}
```

**Token Refresh:**
```
1. POST /api/v1/auth/refresh { refresh_token }
2. Verify refresh token in sessions table
3. Check expiry
4. Generate new access token
5. Update last_used_at in sessions
6. Return { access_token }
```

### 7.2 Authorization Strategy

**Role-Based Access Control (RBAC):**

```go
type Permission struct {
    Role       string
    Resource   string
    Action     string
    Condition  func(*User, interface{}) bool
}

var permissions = []Permission{
    // Members can read all tasks
    {"Member", "task", "read", nil},

    // Members can update their own tasks
    {"Member", "task", "update", func(user *User, resource interface{}) bool {
        task := resource.(*Task)
        return task.CreatorID == user.ID || contains(task.Assignees, user.ID)
    }},

    // Managers can update department tasks
    {"Manager", "task", "update", func(user *User, resource interface{}) bool {
        task := resource.(*Task)
        return task.DepartmentID == user.DepartmentID
    }},

    // Admins can do anything
    {"Admin", "*", "*", nil},
}
```

**Authorization Service:**
```go
func (s *AuthorizationService) CanUpdateTask(user *User, task *Task) bool {
    // Admin can update any task
    if user.Role == "Admin" {
        return true
    }

    // Manager can update department tasks
    if user.Role == "Manager" && task.DepartmentID == user.DepartmentID {
        return true
    }

    // Creator can update own tasks
    if task.CreatorID == user.ID {
        return true
    }

    // Assignees can update assigned tasks
    for _, assignee := range task.Assignees {
        if assignee.ID == user.ID {
            return true
        }
    }

    return false
}
```

---

## 8. Migration Strategy

### 8.1 Phase 1: Parallel Running

**Week 1-2: Setup**
```bash
# Frontend runs on both APIs
NEXT_PUBLIC_API_URL=http://localhost:3001  # json-server
NEXT_PUBLIC_API_URL_PROD=http://localhost:8080  # Go backend

# Toggle in code
const API_URL = process.env.NEXT_PUBLIC_API_URL_PROD || process.env.NEXT_PUBLIC_API_URL;
```

**Tasks:**
1. Initialize Go project structure
2. Setup PostgreSQL database
3. Run migrations
4. Seed database from db.json
5. Implement core endpoints (tasks CRUD)
6. Test with Postman/curl

### 8.2 Phase 2: Feature Parity

**Week 3-4: Implementation**
- Implement all endpoints from FRD-09
- Add authentication (JWT)
- Add authorization checks
- Implement filtering and search
- Add pagination
- Write integration tests

**Validation:**
- All prototype features work with Go backend
- Response format matches json-server
- Performance meets targets (<200ms p95)

### 8.3 Phase 3: Cutover

**Week 5: Production Deployment**
1. Deploy Go backend to staging
2. Update frontend env variable
3. Test all user flows
4. Monitor errors and performance
5. Deploy to production
6. Shut down json-server

**Rollback Plan:**
- Keep json-server running for 1 week
- Frontend can quickly revert env variable
- Database backups before cutover

---

## 9. Phase 2 Preparation (AI Features)

### 9.1 Architecture Extensibility

**NLP Service Integration Points:**
```go
// services/nlp_service.go
type NLPService struct {
    openaiClient *openai.Client
    taskService  *TaskService
}

func (s *NLPService) ParseNaturalLanguage(ctx context.Context, input string) (*TaskSuggestion, error) {
    // Call OpenAI/Claude API
    // Extract task details
    // Return suggestion with confidence score
}
```

**Email Integration:**
```go
// services/email_service.go
type EmailService struct {
    gmailClient  *gmail.Service
    nlpService   *NLPService
    taskService  *TaskService
}

func (s *EmailService) ProcessInbox(ctx context.Context, userID string) error {
    // Fetch emails
    // Parse with AI
    // Create task suggestions
    // Store for user approval
}
```

**Document Analysis:**
```go
// services/document_service.go
type DocumentService struct {
    pdfParser    *pdfcpu.Parser
    aiClient     *openai.Client
    taskService  *TaskService
}

func (s *DocumentService) ExtractTasks(ctx context.Context, file io.Reader) ([]*TaskSuggestion, error) {
    // Extract text from PDF/DOCX
    // Send to AI for analysis
    // Return task suggestions
}
```

### 9.2 Neo4j Integration

**Graph Service:**
```go
// services/graph_service.go
type GraphService struct {
    neo4jDriver neo4j.Driver
}

func (s *GraphService) CreateTaskNode(ctx context.Context, task *Task) error {
    session := s.neo4jDriver.NewSession(neo4j.SessionConfig{})
    defer session.Close()

    _, err := session.WriteTransaction(func(tx neo4j.Transaction) (interface{}, error) {
        return tx.Run(
            `CREATE (t:Task {
                task_id: $task_id,
                title: $title,
                status: $status,
                priority: $priority
            })`,
            map[string]interface{}{
                "task_id":  task.TaskID,
                "title":    task.Title,
                "status":   task.Status,
                "priority": task.Priority,
            },
        )
    })
    return err
}

func (s *GraphService) GetDependencyChain(ctx context.Context, taskID string) ([]*Task, error) {
    // Cypher query to get all dependencies
    // Return task chain
}
```

---

## 10. Implementation Roadmap

### Phase 1: Core API (Weeks 1-4)

**Week 1: Project Setup**
- [ ] Initialize Go module
- [ ] Setup PostgreSQL database
- [ ] Create migration files
- [ ] Implement base models (User, Task, Department, Project)
- [ ] Setup GORM and database connection

**Week 2: Authentication**
- [ ] Implement auth endpoints (login, register, refresh)
- [ ] JWT token generation and validation
- [ ] Auth middleware
- [ ] Password hashing (bcrypt)
- [ ] Session management

**Week 3: Task CRUD**
- [ ] Task handlers (CRUD)
- [ ] Task service (business logic)
- [ ] Task repository (data access)
- [ ] Filtering and search
- [ ] Pagination
- [ ] Comments endpoints

**Week 4: Remaining Resources**
- [ ] User endpoints
- [ ] Department endpoints
- [ ] Project endpoints
- [ ] Authorization middleware
- [ ] Integration tests

### Phase 2: Production Readiness (Weeks 5-6)

**Week 5: Polish & Testing**
- [ ] Error handling refinement
- [ ] Logging and monitoring
- [ ] Performance optimization
- [ ] Load testing
- [ ] Security audit

**Week 6: Deployment**
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Frontend cutover

### Phase 3: AI Features (Weeks 7-12)

**Week 7-8: NLP Integration**
- [ ] OpenAI/Claude API client
- [ ] Natural language task extraction
- [ ] Confidence scoring
- [ ] Task suggestion endpoints

**Week 9-10: Email Integration**
- [ ] Gmail API integration
- [ ] Email parsing service
- [ ] OAuth flow
- [ ] Webhook handling

**Week 11-12: Document Analysis**
- [ ] PDF/DOCX parsing
- [ ] Document upload endpoints
- [ ] AI extraction pipeline
- [ ] Batch processing

### Phase 4: Knowledge Graph (Weeks 13-16)

**Week 13-14: Neo4j Setup**
- [ ] Neo4j database setup
- [ ] Graph schema design
- [ ] Sync tasks to graph
- [ ] Basic dependency queries

**Week 15-16: Advanced Features**
- [ ] Bottleneck detection
- [ ] Collaboration analysis
- [ ] Task suggestions
- [ ] Graph visualization API

---

## Implementation Examples

### Example 1: Complete Task Handler

```go
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "task-management/internal/dto"
    "task-management/internal/services"
    "task-management/internal/middleware"
)

type TaskHandler struct {
    taskService *services.TaskService
}

func NewTaskHandler(taskService *services.TaskService) *TaskHandler {
    return &TaskHandler{taskService: taskService}
}

// GetTasks godoc
// @Summary      List tasks
// @Description  Get tasks with optional filters
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        status      query    []string  false  "Filter by status"
// @Param        priority    query    []string  false  "Filter by priority"
// @Param        department  query    string    false  "Filter by department"
// @Param        search      query    string    false  "Search in title/description"
// @Param        page        query    int       false  "Page number" default(1)
// @Param        per_page    query    int       false  "Items per page" default(20)
// @Success      200  {object}  dto.TaskListResponse
// @Failure      400  {object}  dto.ErrorResponse
// @Failure      401  {object}  dto.ErrorResponse
// @Failure      500  {object}  dto.ErrorResponse
// @Router       /tasks [get]
// @Security     BearerAuth
func (h *TaskHandler) GetTasks(c *gin.Context) {
    // Parse filters
    var filters dto.TaskFilters
    if err := c.ShouldBindQuery(&filters); err != nil {
        dto.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
        return
    }

    // Get current user
    user := middleware.GetCurrentUser(c)

    // Call service
    tasks, total, err := h.taskService.GetTasks(c.Request.Context(), user, &filters)
    if err != nil {
        dto.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve tasks")
        return
    }

    // Respond
    dto.RespondSuccess(c, http.StatusOK, tasks, &dto.Metadata{
        Page:       filters.Page,
        PerPage:    filters.PerPage,
        Total:      total,
        TotalPages: (total + filters.PerPage - 1) / filters.PerPage,
    })
}

// CreateTask godoc
// @Summary      Create task
// @Description  Create a new task
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        task  body      dto.CreateTaskRequest  true  "Task data"
// @Success      201   {object}  dto.TaskResponse
// @Failure      400   {object}  dto.ErrorResponse
// @Failure      401   {object}  dto.ErrorResponse
// @Failure      500   {object}  dto.ErrorResponse
// @Router       /tasks [post]
// @Security     BearerAuth
func (h *TaskHandler) CreateTask(c *gin.Context) {
    var req dto.CreateTaskRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        dto.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
        return
    }

    user := middleware.GetCurrentUser(c)

    task, err := h.taskService.CreateTask(c.Request.Context(), user, &req)
    if err != nil {
        // Handle specific errors
        if errors.Is(err, services.ErrForbidden) {
            dto.RespondError(c, http.StatusForbidden, "FORBIDDEN", "You don't have permission to create tasks in this department")
            return
        }
        dto.RespondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create task")
        return
    }

    dto.RespondSuccess(c, http.StatusCreated, task, nil)
}
```

### Example 2: Configuration Management

```go
package config

import (
    "os"
    "time"
)

type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    JWT      JWTConfig
    Redis    RedisConfig
}

type ServerConfig struct {
    Port         string
    Environment  string
    CORSOrigins  []string
}

type DatabaseConfig struct {
    Host            string
    Port            string
    User            string
    Password        string
    Database        string
    MaxConnections  int
    MaxIdleConns    int
    ConnMaxLifetime time.Duration
}

type JWTConfig struct {
    Secret              string
    AccessTokenExpiry   time.Duration
    RefreshTokenExpiry  time.Duration
}

type RedisConfig struct {
    Host     string
    Port     string
    Password string
    DB       int
}

func Load() *Config {
    return &Config{
        Server: ServerConfig{
            Port:        getEnv("PORT", "8080"),
            Environment: getEnv("ENVIRONMENT", "development"),
            CORSOrigins: getEnvSlice("CORS_ORIGINS", []string{"http://localhost:3000"}),
        },
        Database: DatabaseConfig{
            Host:            getEnv("DB_HOST", "localhost"),
            Port:            getEnv("DB_PORT", "5432"),
            User:            getEnv("DB_USER", "postgres"),
            Password:        getEnv("DB_PASSWORD", ""),
            Database:        getEnv("DB_NAME", "synapse"),
            MaxConnections:  getEnvInt("DB_MAX_CONNECTIONS", 25),
            MaxIdleConns:    getEnvInt("DB_MAX_IDLE_CONNS", 5),
            ConnMaxLifetime: getEnvDuration("DB_CONN_MAX_LIFETIME", 5*time.Minute),
        },
        JWT: JWTConfig{
            Secret:              getEnv("JWT_SECRET", "change-me-in-production"),
            AccessTokenExpiry:   getEnvDuration("JWT_ACCESS_EXPIRY", 15*time.Minute),
            RefreshTokenExpiry:  getEnvDuration("JWT_REFRESH_EXPIRY", 7*24*time.Hour),
        },
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
```

---

## Deployment Architecture

### Development Environment

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   localhost:3000│
└────────┬────────┘
         │
         ↓ HTTP
┌─────────────────┐      ┌──────────────┐
│   Go Backend    │─────→│  PostgreSQL  │
│   localhost:8080│      │  localhost   │
└────────┬────────┘      │  :5432       │
         │               └──────────────┘
         ↓
┌─────────────────┐
│     Redis       │
│   (Sessions)    │
│   localhost:6379│
└─────────────────┘
```

### Production Architecture

```
                    ┌──────────────┐
                    │   Cloudflare │
                    │   (CDN/SSL)  │
                    └───────┬──────┘
                            │
                    ┌───────▼──────┐
                    │  Load Balancer│
                    └───────┬──────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
   │  Next.js    │   │  Next.js    │   │  Next.js    │
   │  Instance 1 │   │  Instance 2 │   │  Instance 3 │
   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │ API Calls
                    ┌───────▼──────┐
                    │  API Gateway │
                    │  (Kong/Nginx)│
                    └───────┬──────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
   │ Go Backend  │   │ Go Backend  │   │ Go Backend  │
   │ Instance 1  │   │ Instance 2  │   │ Instance 3  │
   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
   │ PostgreSQL  │   │    Redis    │   │   Neo4j     │
   │  (Primary)  │   │  (Sessions) │   │   (Graph)   │
   │             │   │             │   │  [Phase 2]  │
   │  ┌────────┐ │   └─────────────┘   └─────────────┘
   │  │Replica │ │
   │  └────────┘ │
   └─────────────┘
```

---

## Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| API Response Time (p95) | <200ms | Indexed queries, connection pooling |
| API Response Time (p99) | <500ms | Query optimization, caching |
| Database Query Time (p95) | <50ms | Proper indexes, query optimization |
| Throughput | 1000 req/sec | Horizontal scaling, load balancing |
| Task List (1000 tasks) | <500ms | Pagination, lazy loading |
| Concurrent Users | 2000+ | Stateless API, Redis sessions |

---

## Security Considerations

### API Security Checklist

- [ ] JWT token validation on all protected endpoints
- [ ] Bcrypt password hashing (cost factor 12)
- [ ] Input validation on all endpoints (struct tags + custom validators)
- [ ] SQL injection prevention (GORM parameterized queries)
- [ ] XSS prevention (sanitize user input, content-type headers)
- [ ] CSRF protection (SameSite cookies, CSRF tokens for state-changing ops)
- [ ] Rate limiting (per-IP, per-user)
- [ ] HTTPS only in production
- [ ] CORS properly configured (whitelist origins)
- [ ] Security headers (Helmet equivalent)
- [ ] Environment variable secrets (never hardcoded)
- [ ] Database connection encryption (SSL mode)
- [ ] Logging of security events (failed logins, permission denials)
- [ ] Regular dependency updates (go mod tidy, dependabot)

---

## Next Steps

### Immediate Actions

1. **Initialize Go Project**
   ```bash
   mkdir backend && cd backend
   go mod init github.com/your-org/synapse-backend
   ```

2. **Setup Development Database**
   ```bash
   docker run -d \
     --name synapse-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=synapse \
     -p 5432:5432 \
     postgres:15
   ```

3. **Install Dependencies**
   ```bash
   go get github.com/gin-gonic/gin
   go get gorm.io/gorm
   go get gorm.io/driver/postgres
   go get github.com/golang-jwt/jwt/v5
   go get github.com/sirupsen/logrus
   go get golang.org/x/crypto/bcrypt
   ```

4. **Create Project Structure**
   ```bash
   mkdir -p cmd/api internal/{config,models,handlers,services,repositories,middleware,routes}
   ```

5. **Start with Authentication**
   - Implement User model
   - Create auth endpoints
   - Test with Postman

### Questions to Resolve

1. **Database Hosting**: AWS RDS, Google Cloud SQL, or self-hosted?
2. **Deployment Platform**: Docker + K8s, AWS ECS, or Google Cloud Run?
3. **Monitoring**: Datadog, New Relic, or self-hosted Prometheus?
4. **Secret Management**: AWS Secrets Manager, HashiCorp Vault, or env files?
5. **CI/CD**: GitHub Actions, GitLab CI, or Jenkins?

---

## Conclusion

This architecture design provides:

✅ **Drop-in Replacement** - Frontend requires only env variable change
✅ **Production-Ready** - Security, performance, scalability considered
✅ **Extensible** - Clear integration points for Phase 2 AI features
✅ **Tested Pattern** - Follows industry best practices
✅ **Clear Roadmap** - Phased implementation with concrete milestones

**The path forward is clear: Build incrementally, test continuously, deploy confidently.**

---

**Document Status:** Ready for review and implementation

**Next Review:** After Phase 1 completion (Week 4)

