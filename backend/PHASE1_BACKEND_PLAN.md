# Phase 1 Backend Implementation Plan

**Version:** 2.0
**Date:** October 14, 2025
**Status:** Planning - Updated for Completed Frontend
**Dependencies:** Frontend Phase 1 Complete (70%)

---

## Executive Summary

The frontend is **complete** with all Phase 1 UI features implemented:
- ✅ Email Integration UI (Zoho Mail + Outlook)
- ✅ Recurring Tasks UI (full CRUD with skip dates)
- ✅ RBAC Permissions UI (all role-based UI elements)
- ✅ Settings Page (integrations + profile tabs)
- ✅ Test Suite (45 test cases passing)

This plan provides a **step-by-step roadmap** to build the Go backend that will power these frontend features. The backend must support:

1. **Authentication** - Keycloak (PRIMARY) + Zoho OAuth (SECONDARY)
2. **Email Integration** - Zoho Mail (PRIMARY) + Outlook (SECONDARY) with OAuth 2.0
3. **Recurring Tasks** - Cron-based generation with skip dates support
4. **RBAC** - 4 roles with granular permissions
5. **Self-Hosted Deployment** - Docker Compose with all services

**Estimated Timeline:** 10-12 weeks (2.5-3 months)

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Phase Breakdown](#phase-breakdown)
3. [Detailed Implementation Steps](#detailed-implementation-steps)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Strategy](#deployment-strategy)

---

## Quick Reference

### Technology Stack

| Component | Choice | Version |
|-----------|--------|---------|
| **Language** | Go | 1.21+ |
| **Framework** | Gin | Latest |
| **ORM** | GORM | v2 |
| **Database** | PostgreSQL | 15+ |
| **Cache** | Redis | 7+ |
| **Auth (PRIMARY)** | Keycloak | 23.0 |
| **Cron Jobs** | robfig/cron | v3 |
| **JWT** | golang-jwt/jwt | v5 |
| **OAuth** | golang.org/x/oauth2 | Latest |
| **Container** | Docker + Docker Compose | Latest |

### Frontend Integration Points

The frontend expects these exact API endpoints:

```
BASE_URL: http://localhost:8080/api/v1

Auth:
- POST /auth/login
- POST /auth/refresh
- GET  /auth/me

Tasks:
- GET    /tasks
- POST   /tasks
- GET    /tasks/:id
- PUT    /tasks/:id
- DELETE /tasks/:id

Email Integrations:
- POST /integrations/zoho-mail/auth
- GET  /integrations/zoho-mail/callback
- POST /integrations/zoho-mail/disconnect
- GET  /integrations/zoho-mail/status
- POST /integrations/zoho-mail/sync

(Similar endpoints for /integrations/outlook/*)

Users, Departments, Projects:
- Standard CRUD endpoints
```

---

## Phase Breakdown

### Phase 1: Foundation & Authentication (Weeks 1-3)

**Goal:** Get basic API running with authentication

**Deliverables:**
- ✅ Go project structure
- ✅ PostgreSQL connection
- ✅ Core models (User, Task, Department, Project)
- ✅ Keycloak integration
- ✅ JWT middleware
- ✅ Basic task CRUD

**Success Criteria:**
- Frontend can login via Keycloak
- Frontend can fetch/create tasks
- All auth tests passing

---

### Phase 2: Email Integration (Weeks 4-6)

**Goal:** Implement Zoho Mail and Outlook OAuth + email parsing

**Deliverables:**
- ✅ Zoho Mail OAuth 2.0 flow
- ✅ Zoho Mail API client
- ✅ Email parsing engine
- ✅ Background polling job (every 5 min)
- ✅ Outlook OAuth 2.0 flow
- ✅ Outlook API client
- ✅ Email integration CRUD endpoints

**Success Criteria:**
- Frontend can connect Zoho Mail account
- Frontend can connect Outlook account
- Emails parsed and tasks created automatically
- Manual sync works from frontend

---

### Phase 3: Recurring Tasks (Week 7)

**Goal:** Implement recurring task system with cron generation

**Deliverables:**
- ✅ Recurring task database fields
- ✅ Recurrence pattern calculation
- ✅ Cron job for task generation (hourly)
- ✅ Skip dates support
- ✅ Recurring task management endpoints

**Success Criteria:**
- Frontend can create recurring tasks
- Cron job generates tasks correctly
- Skip dates work correctly
- Frontend can manage recurring patterns

---

### Phase 4: RBAC & Permissions (Week 8)

**Goal:** Implement role-based access control

**Deliverables:**
- ✅ Permission middleware
- ✅ Role-based filtering
- ✅ Department-based access control
- ✅ Admin user management

**Success Criteria:**
- All 4 roles enforced correctly
- Permissions work at API level
- Frontend UI matches backend permissions

---

### Phase 5: Docker & Deployment (Week 9)

**Goal:** Self-hosted production environment

**Deliverables:**
- ✅ Backend Dockerfile
- ✅ Worker Dockerfile
- ✅ docker-compose.yml (all services)
- ✅ Nginx reverse proxy
- ✅ Health checks
- ✅ Backup scripts

**Success Criteria:**
- Full stack runs in Docker
- Keycloak configured and working
- SSL certificates working
- Monitoring stack operational

---

### Phase 6: Testing & QA (Weeks 10-12)

**Goal:** Production readiness

**Deliverables:**
- ✅ Unit tests (80% coverage)
- ✅ Integration tests
- ✅ Load testing
- ✅ Security audit
- ✅ Bug fixes
- ✅ Documentation

**Success Criteria:**
- All tests passing
- Performance targets met
- Zero critical bugs
- Ready for production

---

## Detailed Implementation Steps

### WEEK 1: Project Setup & Core Models

#### Day 1-2: Initialize Project

```bash
# Create project structure
cd /home/sunny/task-management
mkdir -p backend/{cmd/api,cmd/worker,internal/{config,models,handlers,services,repositories,middleware,workers,integrations,database},scripts,docker}

# Initialize Go module
cd backend
go mod init github.com/synapse/backend

# Install core dependencies
go get -u github.com/gin-gonic/gin
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres
go get -u github.com/golang-jwt/jwt/v5
go get -u github.com/sirupsen/logrus
go get -u golang.org/x/crypto/bcrypt
go get -u github.com/go-redis/redis/v9
go get -u github.com/robfig/cron/v3
go get -u golang.org/x/oauth2
go get -u github.com/coreos/go-oidc/v3/oidc
```

#### Day 3: Database Models

Create `internal/models/`:
- `user.go` - User model with Keycloak/Zoho IDs
- `department.go` - Department model
- `project.go` - Project model
- `task.go` - Task model (with recurring fields)
- `comment.go` - Comment model
- `attachment.go` - Attachment model
- `email_integration.go` - Email integration model
- `refresh_token.go` - JWT refresh token model

#### Day 4-5: Database Setup

```sql
-- Create migrations in internal/database/migrations/

-- 001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    job_title VARCHAR(100),
    department_id UUID,
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    role VARCHAR(20) NOT NULL DEFAULT 'Member',
    permissions JSONB DEFAULT '[]'::jsonb,
    keycloak_id VARCHAR(255) UNIQUE,
    zoho_id VARCHAR(255) UNIQUE,
    preferences JSONB DEFAULT '{}'::jsonb,
    notification_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Continue with all tables from ARCHITECTURE.md section 3
```

Create `internal/database/postgres.go`:
```go
package database

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

func NewPostgresDB(dsn string) (*gorm.DB, error) {
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, err
    }

    // Connection pooling
    sqlDB, _ := db.DB()
    sqlDB.SetMaxOpenConns(25)
    sqlDB.SetMaxIdleConns(5)
    sqlDB.SetConnMaxLifetime(5 * time.Minute)

    return db, nil
}
```

---

### WEEK 2: Authentication & Authorization

#### Day 1-2: Keycloak Integration

Create `internal/integrations/keycloak/client.go`:
```go
package keycloak

import (
    "context"
    "github.com/coreos/go-oidc/v3/oidc"
    "golang.org/x/oauth2"
)

type KeycloakClient struct {
    provider *oidc.Provider
    verifier *oidc.IDTokenVerifier
    oauth2Config oauth2.Config
}

func NewKeycloakClient(issuerURL, clientID, clientSecret, redirectURL string) (*KeycloakClient, error) {
    ctx := context.Background()
    provider, err := oidc.NewProvider(ctx, issuerURL)
    if err != nil {
        return nil, err
    }

    return &KeycloakClient{
        provider: provider,
        verifier: provider.Verifier(&oidc.Config{ClientID: clientID}),
        oauth2Config: oauth2.Config{
            ClientID:     clientID,
            ClientSecret: clientSecret,
            RedirectURL:  redirectURL,
            Endpoint:     provider.Endpoint(),
            Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
        },
    }, nil
}

func (k *KeycloakClient) VerifyIDToken(ctx context.Context, rawIDToken string) (*oidc.IDToken, error) {
    return k.verifier.Verify(ctx, rawIDToken)
}
```

#### Day 3: JWT Middleware

Create `internal/middleware/auth.go`:
```go
package middleware

import (
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "net/http"
)

type JWTClaims struct {
    UserID       string   `json:"user_id"`
    Email        string   `json:"email"`
    Role         string   `json:"role"`
    DepartmentID *string  `json:"department_id,omitempty"`
    Permissions  []string `json:"permissions"`
    jwt.RegisteredClaims
}

func RequireAuth(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenString := c.GetHeader("Authorization")
        if tokenString == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
            c.Abort()
            return
        }

        // Remove "Bearer " prefix
        tokenString = strings.TrimPrefix(tokenString, "Bearer ")

        // Parse token
        token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
            return []byte(jwtSecret), nil
        })

        if err != nil || !token.Valid {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }

        claims := token.Claims.(*JWTClaims)
        c.Set("user_id", claims.UserID)
        c.Set("user_email", claims.Email)
        c.Set("user_role", claims.Role)
        c.Set("user_permissions", claims.Permissions)

        c.Next()
    }
}
```

#### Day 4: Permission Middleware

Create `internal/middleware/permission.go`:
```go
package middleware

func RequirePermission(requiredPermission string) gin.HandlerFunc {
    return func(c *gin.Context) {
        permissions, exists := c.Get("user_permissions")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "No permissions found"})
            c.Abort()
            return
        }

        permList := permissions.([]string)
        hasPermission := false
        for _, perm := range permList {
            if perm == requiredPermission {
                hasPermission = true
                break
            }
        }

        if !hasPermission {
            // Check role-based permissions
            role, _ := c.Get("user_role")
            hasPermission = checkRolePermission(role.(string), requiredPermission)
        }

        if !hasPermission {
            c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
            c.Abort()
            return
        }

        c.Next()
    }
}
```

#### Day 5: Auth Handlers

Create `internal/handlers/auth_handler.go`:
```go
package handlers

type AuthHandler struct {
    keycloakClient *keycloak.KeycloakClient
    userService    *services.UserService
    jwtSecret      string
}

func (h *AuthHandler) KeycloakCallback(c *gin.Context) {
    // Handle Keycloak OAuth callback
    // Exchange code for tokens
    // Verify ID token
    // Create or update user in database
    // Issue application JWT
    // Return tokens to frontend
}

func (h *AuthHandler) Login(c *gin.Context) {
    // Traditional email/password login (optional)
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
    // Refresh JWT access token
}

func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
    // Return current authenticated user
}
```

---

### WEEK 3: Task CRUD & Basic Features

#### Day 1-2: Task Repository

Create `internal/repositories/task_repository.go`:
```go
package repositories

type TaskRepository struct {
    db *gorm.DB
}

func (r *TaskRepository) FindWithFilters(ctx context.Context, filters *models.TaskFilters, page, perPage int) ([]*models.Task, int64, error) {
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
    // ... more filters

    // Count total
    query.Count(&total)

    // Paginate
    offset := (page - 1) * perPage
    err := query.Offset(offset).Limit(perPage).Find(&tasks).Error

    return tasks, total, err
}
```

#### Day 3: Task Service

Create `internal/services/task_service.go`:
```go
package services

type TaskService struct {
    taskRepo      *repositories.TaskRepository
    permissionSvc *PermissionService
}

func (s *TaskService) CreateTask(ctx context.Context, dto *models.CreateTaskDTO, user *models.User) (*models.Task, error) {
    // Validate input
    // Check permissions
    // Create task
    // Return result
}

func (s *TaskService) GetTasks(ctx context.Context, filters *models.TaskFilters, user *models.User) ([]*models.Task, int64, error) {
    // Apply permission-based filtering
    // Call repository
    // Return results
}
```

#### Day 4: Task Handlers

Create `internal/handlers/task_handler.go`:
```go
package handlers

type TaskHandler struct {
    taskService *services.TaskService
}

func (h *TaskHandler) GetTasks(c *gin.Context) {
    // Parse filters
    // Get current user
    // Call service
    // Return response
}

func (h *TaskHandler) CreateTask(c *gin.Context) {
    // Parse request body
    // Get current user
    // Call service
    // Return response
}
```

#### Day 5: API Routes

Create `cmd/api/main.go`:
```go
package main

func main() {
    // Load config
    // Connect to database
    // Setup dependencies
    // Initialize handlers
    // Setup routes
    // Start server

    r := gin.Default()

    // Public routes
    r.POST("/api/v1/auth/login", authHandler.Login)
    r.GET("/api/v1/auth/keycloak/callback", authHandler.KeycloakCallback)

    // Protected routes
    api := r.Group("/api/v1")
    api.Use(middleware.RequireAuth(cfg.JWTSecret))
    {
        api.GET("/auth/me", authHandler.GetCurrentUser)

        api.GET("/tasks", taskHandler.GetTasks)
        api.POST("/tasks", middleware.RequirePermission("tasks.create"), taskHandler.CreateTask)
        api.GET("/tasks/:id", taskHandler.GetTask)
        api.PUT("/tasks/:id", taskHandler.UpdateTask)
        api.DELETE("/tasks/:id", taskHandler.DeleteTask)
    }

    r.Run(":8080")
}
```

---

### WEEKS 4-6: Email Integration

#### Email Integration Checklist

**Zoho Mail (PRIMARY):**
- [ ] Register app in Zoho API Console
- [ ] Implement OAuth 2.0 authorization flow
- [ ] Implement token exchange
- [ ] Implement token refresh
- [ ] Create Zoho Mail API client
- [ ] Implement email fetching (unread messages)
- [ ] Implement email parsing
- [ ] Implement task extraction
- [ ] Implement background polling job
- [ ] Create integration endpoints

**Outlook (SECONDARY):**
- [ ] Register app in Azure AD
- [ ] Implement Microsoft Graph OAuth
- [ ] Create Outlook API client
- [ ] Implement similar features as Zoho

#### Implementation

Create `internal/integrations/zoho/mail.go`:
```go
package zoho

type ZohoMailClient struct {
    oauth2Client *http.Client
    accountID    string
}

func (z *ZohoMailClient) FetchUnreadMessages() ([]ZohoMessage, error) {
    // Fetch unread emails from Zoho Mail API
}

func (z *ZohoMailClient) MarkAsRead(messageID string) error {
    // Mark email as read
}
```

Create `internal/services/email_service.go`:
```go
package services

type EmailService struct {
    zohoClient    *zoho.ZohoMailClient
    outlookClient *outlook.OutlookClient
    taskService   *TaskService
    parser        *EmailParser
}

func (s *EmailService) ParseEmail(subject, body string) (*models.ParsedTask, error) {
    // Extract title from subject
    // Extract description from body
    // Detect priority keywords
    // Extract due dates
    // Extract assignees
    // Return parsed task
}

func (s *EmailService) PollAllIntegrations(ctx context.Context) error {
    // Get all active integrations
    // For each integration:
    //   - Fetch new emails
    //   - Parse emails
    //   - Create tasks
    //   - Mark emails as read
}
```

Create `internal/workers/email_poller.go`:
```go
package workers

type EmailPoller struct {
    emailService *services.EmailService
    cron         *cron.Cron
}

func (ep *EmailPoller) Start() error {
    // Run every 5 minutes
    _, err := ep.cron.AddFunc("*/5 * * * *", func() {
        ctx := context.Background()
        if err := ep.emailService.PollAllIntegrations(ctx); err != nil {
            log.Printf("Error polling emails: %v", err)
        }
    })

    if err != nil {
        return err
    }

    ep.cron.Start()
    return nil
}
```

Create `internal/handlers/integration_handler.go`:
```go
package handlers

func (h *IntegrationHandler) InitiateZohoAuth(c *gin.Context) {
    // Generate OAuth URL
    // Redirect user to Zoho
}

func (h *IntegrationHandler) ZohoCallback(c *gin.Context) {
    // Exchange code for tokens
    // Store tokens in database
    // Return success to frontend
}

func (h *IntegrationHandler) GetZohoStatus(c *gin.Context) {
    // Check if user has active Zoho integration
    // Return status and last sync time
}

func (h *IntegrationHandler) SyncZoho(c *gin.Context) {
    // Manually trigger sync
    // Fetch emails and create tasks
    // Return results
}
```

---

### WEEK 7: Recurring Tasks

#### Database Updates

```sql
-- 002_add_recurring_tasks.sql
ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN recurrence_pattern JSONB;
ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN next_occurrence TIMESTAMP;
ALTER TABLE tasks ADD COLUMN skip_dates JSONB DEFAULT '[]'::jsonb;

CREATE INDEX idx_tasks_next_occurrence ON tasks(next_occurrence)
  WHERE is_recurring = TRUE AND next_occurrence IS NOT NULL;
```

#### Recurrence Service

Create `internal/services/recurring_service.go`:
```go
package services

type RecurringTaskService struct {
    taskRepo *repositories.TaskRepository
}

func (r *RecurringTaskService) CalculateNextOccurrence(pattern *models.RecurrencePattern, currentDate time.Time) time.Time {
    switch pattern.Frequency {
    case "daily":
        return currentDate.AddDate(0, 0, pattern.Interval)
    case "weekly":
        next := currentDate.AddDate(0, 0, 7*pattern.Interval)
        if len(pattern.DaysOfWeek) > 0 {
            next = r.findNextDayOfWeek(next, pattern.DaysOfWeek)
        }
        return next
    case "monthly":
        return currentDate.AddDate(0, pattern.Interval, 0)
    case "yearly":
        return currentDate.AddDate(pattern.Interval, 0, 0)
    default:
        return currentDate
    }
}

func (r *RecurringTaskService) GenerateDueTasks(ctx context.Context) error {
    // Find all recurring tasks with next_occurrence <= now
    // For each task:
    //   - Check skip dates
    //   - Generate new task instance
    //   - Update next_occurrence
}
```

#### Cron Worker

Create `internal/workers/recurring_tasks.go`:
```go
package workers

type RecurringTaskWorker struct {
    recurringService *services.RecurringTaskService
    cron             *cron.Cron
}

func (w *RecurringTaskWorker) Start() error {
    // Run every hour
    _, err := w.cron.AddFunc("0 * * * *", func() {
        ctx := context.Background()
        if err := w.recurringService.GenerateDueTasks(ctx); err != nil {
            log.Printf("Error generating recurring tasks: %v", err)
        }
    })

    if err != nil {
        return err
    }

    w.cron.Start()
    return nil
}
```

---

### WEEK 8: RBAC & Permissions

All permission checking code already exists in middleware. Focus on:

1. **Testing all permission scenarios**
2. **Department-based filtering**
3. **Task ownership checks**
4. **Audit logging**

---

### WEEK 9: Docker & Deployment

Create `docker/Dockerfile`:
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

Create `docker/docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: synapse
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U synapse"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: synapse
      KC_DB_PASSWORD: ${DB_PASSWORD}
      KC_HOSTNAME: ${KEYCLOAK_HOSTNAME}
    command: start-dev
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8080:8080"

  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile
    environment:
      DATABASE_URL: postgres://synapse:${DB_PASSWORD}@postgres:5432/synapse?sslmode=disable
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_REALM: synapse
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8081:8080"

  worker:
    build:
      context: .
      dockerfile: docker/Dockerfile.worker
    environment:
      DATABASE_URL: postgres://synapse:${DB_PASSWORD}@postgres:5432/synapse?sslmode=disable
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8080/api/v1
    depends_on:
      - backend
    ports:
      - "3000:3000"

volumes:
  postgres_data:
  redis_data:
```

---

## Database Schema

Complete PostgreSQL schema in `internal/database/migrations/001_initial_schema.sql`:

(See ARCHITECTURE.md section 3 for complete schema)

Key tables:
- `users` - User accounts with Keycloak/Zoho IDs
- `departments` - Organizational units
- `projects` - Project groupings
- `tasks` - Main task table with recurring fields
- `task_assignees` - Many-to-many task assignments
- `comments` - Task comments
- `attachments` - File attachments
- `email_integrations` - Email provider connections
- `refresh_tokens` - JWT refresh tokens
- `audit_logs` - Audit trail (optional)

---

## API Endpoints

### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
GET  /api/v1/auth/keycloak/callback
GET  /api/v1/auth/zoho/callback
```

### Tasks
```
GET    /api/v1/tasks
POST   /api/v1/tasks
GET    /api/v1/tasks/:id
PUT    /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
GET    /api/v1/tasks/:id/comments
POST   /api/v1/tasks/:id/comments
```

### Email Integrations
```
POST /api/v1/integrations/zoho-mail/auth
GET  /api/v1/integrations/zoho-mail/callback
POST /api/v1/integrations/zoho-mail/disconnect
GET  /api/v1/integrations/zoho-mail/status
POST /api/v1/integrations/zoho-mail/sync

POST /api/v1/integrations/outlook/auth
GET  /api/v1/integrations/outlook/callback
POST /api/v1/integrations/outlook/disconnect
GET  /api/v1/integrations/outlook/status
POST /api/v1/integrations/outlook/sync
```

### Users, Departments, Projects
```
GET /api/v1/users
GET /api/v1/users/:id
PUT /api/v1/users/:id

GET /api/v1/departments
GET /api/v1/departments/:id

GET /api/v1/projects
POST /api/v1/projects
GET /api/v1/projects/:id
PUT /api/v1/projects/:id
```

---

## Testing Strategy

### Unit Tests (80% Coverage Target)

```go
// Example: Task service test
func TestTaskService_CreateTask(t *testing.T) {
    tests := []struct {
        name    string
        dto     *models.CreateTaskDTO
        user    *models.User
        wantErr bool
    }{
        {
            name: "valid task",
            dto: &models.CreateTaskDTO{
                Title:    "Test Task",
                Priority: "High",
            },
            user: &models.User{ID: "user-1", Role: "Member"},
            wantErr: false,
        },
        {
            name: "empty title",
            dto: &models.CreateTaskDTO{
                Title:    "",
                Priority: "High",
            },
            user: &models.User{ID: "user-1", Role: "Member"},
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            service := NewTaskService(mockRepo, mockPermSvc)
            _, err := service.CreateTask(context.Background(), tt.dto, tt.user)
            if (err != nil) != tt.wantErr {
                t.Errorf("CreateTask() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Integration Tests

```go
func TestTaskAPI_CreateTask(t *testing.T) {
    // Setup test database
    db := setupTestDB(t)
    defer teardownTestDB(t, db)

    // Setup test server
    router := setupTestRouter(db)

    // Create test request
    body := map[string]interface{}{
        "title":    "Test Task",
        "priority": "High",
    }
    jsonBody, _ := json.Marshal(body)

    req, _ := http.NewRequest("POST", "/api/v1/tasks", bytes.NewBuffer(jsonBody))
    req.Header.Set("Authorization", "Bearer "+validToken)
    req.Header.Set("Content-Type", "application/json")

    // Execute request
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)

    // Assert
    assert.Equal(t, http.StatusCreated, w.Code)
}
```

---

## Deployment Strategy

### Development Environment
```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend ./main migrate up

# Seed database
docker-compose exec backend ./main seed

# View logs
docker-compose logs -f backend
```

### Production Deployment

1. **Set up server** (Ubuntu 22.04+)
2. **Install Docker + Docker Compose**
3. **Clone repository**
4. **Configure environment variables** (`.env` file)
5. **Run `docker-compose up -d`**
6. **Configure Keycloak realm**
7. **Set up SSL certificates** (Let's Encrypt)
8. **Configure Nginx reverse proxy**
9. **Set up monitoring** (Prometheus + Grafana)
10. **Configure backups** (automated PostgreSQL backups)

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| API Response Time (p95) | <200ms | Prometheus metrics |
| Database Query Time (p95) | <50ms | GORM query logging |
| Email Processing | <5min from receipt | Job execution logs |
| Task Generation (recurring) | <1min after hour | Cron job logs |
| Test Coverage | 80%+ | `go test -cover` |
| Uptime | 99.5%+ | Monitoring dashboard |

---

## Next Steps

Sunny, this is a complete implementation plan. Should I:

1. **Initialize the Go project structure** and create the boilerplate?
2. **Start with Phase 1 Week 1** (project setup + core models)?
3. **Set up the Docker development environment** first?

What would you like me to focus on?
