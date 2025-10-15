# Project Synapse - Backend (Go Production API)

**Last Updated:** October 13, 2025

---

## About This Directory

The `backend/` folder contains the production Go backend for Project Synapse - a high-performance RESTful API and AI service layer for intelligent task management.

---

## 🎯 Backend Overview

### Purpose
Production-grade Go backend providing:
- RESTful API endpoints for task management
- PostgreSQL database integration with GORM
- JWT-based authentication and authorization
- Neo4j knowledge graph integration
- AI/ML service integration (OpenAI, Claude)
- Email and document processing pipelines
- Real-time updates via WebSockets

### Tech Stack
- **Language:** Go 1.21+
- **Framework:** Gin (web framework)
- **Database:** PostgreSQL 15+ with JSONB support
- **Graph DB:** Neo4j for relationship modeling
- **Cache:** Redis for session and query caching
- **ORM:** GORM v2
- **Auth:** JWT (golang-jwt/jwt)
- **API Docs:** Swagger/OpenAPI (swaggo/swag)
- **Testing:** testify, httptest

---

## 📁 Project Structure

```
backend/
├── CLAUDE.md                   # This file
├── go.mod                      # Go module dependencies
├── go.sum                      # Dependency checksums
├── main.go                     # Application entry point
├── config/
│   ├── config.go               # Configuration management
│   ├── database.go             # Database connection setup
│   └── redis.go                # Redis connection setup
├── models/
│   ├── task.go                 # Task model and validation
│   ├── user.go                 # User model
│   ├── department.go           # Department model
│   ├── project.go              # Project model
│   └── common.go               # Common model fields
├── handlers/
│   ├── task_handler.go         # Task CRUD endpoints
│   ├── user_handler.go         # User management endpoints
│   ├── auth_handler.go         # Authentication endpoints
│   ├── project_handler.go      # Project endpoints
│   └── department_handler.go   # Department endpoints
├── services/
│   ├── task_service.go         # Task business logic
│   ├── auth_service.go         # Authentication logic
│   ├── nlp_service.go          # NLP task extraction
│   ├── email_service.go        # Email parsing service
│   ├── document_service.go     # Document analysis service
│   └── graph_service.go        # Neo4j knowledge graph queries
├── middleware/
│   ├── auth.go                 # JWT authentication middleware
│   ├── cors.go                 # CORS configuration
│   ├── logger.go               # Request logging
│   └── rate_limit.go           # Rate limiting
├── routes/
│   └── routes.go               # API route definitions
├── utils/
│   ├── validators.go           # Input validation helpers
│   ├── response.go             # Standard response formats
│   ├── errors.go               # Error handling
│   └── pagination.go           # Pagination helpers
├── ai/
│   ├── nlp.go                  # NLP task extraction logic
│   ├── email_parser.go         # Email parsing with AI
│   └── document_parser.go      # Document analysis with AI
├── graph/
│   ├── neo4j.go                # Neo4j client and queries
│   ├── relationships.go        # Graph relationship modeling
│   └── queries.go              # Cypher query builders
├── migrations/
│   ├── 001_initial_schema.sql  # Initial database schema
│   ├── 002_add_indexes.sql     # Performance indexes
│   └── migrate.go              # Migration runner
├── tests/
│   ├── task_test.go            # Task endpoint tests
│   ├── auth_test.go            # Authentication tests
│   └── integration_test.go     # Integration tests
└── docs/
    └── swagger.yaml             # OpenAPI specification
```

---

## 🔧 Development Rules

### Code Style
- Follow standard Go conventions (`gofmt`, `golint`)
- Use meaningful package names (singular, lowercase)
- Keep functions small and focused (max 50 lines)
- Use table-driven tests
- Error messages should be lowercase without punctuation
- Use constants for magic numbers and strings

### Naming Conventions
```go
// Good examples
type TaskService struct {}
func (s *TaskService) CreateTask(ctx context.Context, task *models.Task) error
var ErrTaskNotFound = errors.New("task not found")
const MaxTaskTitleLength = 255

// Bad examples - avoid these
type TaskServiceNew struct {}      // Don't use "New" in type names
func (s *TaskService) createTask() // Unexported when should be public
var errTaskNotFound                 // Inconsistent error naming
```

### Error Handling
```go
// Always wrap errors with context
if err != nil {
    return fmt.Errorf("failed to create task: %w", err)
}

// Use custom error types for API errors
type APIError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}

// Handle errors at appropriate levels
// - Handlers: Convert to HTTP responses
// - Services: Add business context
// - Repository: Add data context
```

### Database Best Practices
```go
// Use transactions for multi-step operations
tx := db.Begin()
defer func() {
    if r := recover(); r != nil {
        tx.Rollback()
    }
}()

if err := tx.Create(&task).Error; err != nil {
    tx.Rollback()
    return err
}

tx.Commit()

// Use context for cancellation
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

// Use indexes for frequently queried fields
// Use JSONB for flexible metadata storage
// Always paginate list queries
```

### API Design Principles
- Follow REST conventions strictly
- Use proper HTTP status codes
- Version API endpoints (e.g., `/api/v1/tasks`)
- Include pagination metadata in list responses
- Use kebab-case for URL paths
- Use snake_case for JSON keys
- Always validate input with struct tags

### Security Requirements
```go
// JWT token validation
// Always check token expiry
// Validate user permissions before actions
// Sanitize user input to prevent SQL injection (GORM handles this)
// Use bcrypt for password hashing (cost factor: 12)
// Rate limit all public endpoints
// Log security events (failed logins, permission denials)
```

---

## 📊 Data Models

### Core Models (from FRD-01)

```go
// Task model
type Task struct {
    ID              string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
    Title           string         `gorm:"not null;size:255" json:"title" binding:"required,max=255"`
    Description     string         `gorm:"type:text" json:"description"`
    Status          string         `gorm:"not null;default:'To Do'" json:"status" binding:"required,oneof=To Do In Progress In Review Blocked Done"`
    Priority        string         `gorm:"not null;default:'Medium'" json:"priority" binding:"required,oneof=Low Medium High Urgent"`
    CreatorID       string         `gorm:"not null;type:uuid" json:"creator_id"`
    Creator         User           `gorm:"foreignKey:CreatorID" json:"creator,omitempty"`
    Assignees       []User         `gorm:"many2many:task_assignees" json:"assignees,omitempty"`
    DepartmentID    *string        `gorm:"type:uuid" json:"department_id"`
    Department      *Department    `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
    ProjectID       *string        `gorm:"type:uuid" json:"project_id"`
    Project         *Project       `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
    DueDate         *time.Time     `json:"due_date"`
    CompletionDate  *time.Time     `json:"completion_date"`
    Source          string         `gorm:"not null;default:'GUI'" json:"source" binding:"oneof=GUI Email API Document NLP"`
    Tags            []string       `gorm:"type:text[]" json:"tags"`
    Attachments     []string       `gorm:"type:text[]" json:"attachments"`
    ConfidenceScore *float64       `json:"confidence_score"`
    Metadata        JSONB          `gorm:"type:jsonb" json:"metadata"`
    CreatedAt       time.Time      `json:"created_at"`
    UpdatedAt       time.Time      `json:"updated_at"`
}

// User model
type User struct {
    ID           string      `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
    Email        string      `gorm:"uniqueIndex;not null" json:"email" binding:"required,email"`
    PasswordHash string      `gorm:"not null" json:"-"`
    FullName     string      `gorm:"not null" json:"full_name" binding:"required"`
    Role         string      `gorm:"not null;default:'Individual Contributor'" json:"role"`
    DepartmentID *string     `gorm:"type:uuid" json:"department_id"`
    Department   *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
    Active       bool        `gorm:"default:true" json:"active"`
    CreatedAt    time.Time   `json:"created_at"`
    UpdatedAt    time.Time   `json:"updated_at"`
}

// Department model
type Department struct {
    ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
    Name      string    `gorm:"uniqueIndex;not null" json:"name" binding:"required"`
    HeadID    *string   `gorm:"type:uuid" json:"head_id"`
    Head      *User     `gorm:"foreignKey:HeadID" json:"head,omitempty"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

// Project model
type Project struct {
    ID           string      `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
    Name         string      `gorm:"not null" json:"name" binding:"required"`
    Description  string      `gorm:"type:text" json:"description"`
    Status       string      `gorm:"default:'Active'" json:"status" binding:"oneof=Active On Hold Completed Archived"`
    DepartmentID *string     `gorm:"type:uuid" json:"department_id"`
    Department   *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
    OwnerID      *string     `gorm:"type:uuid" json:"owner_id"`
    Owner        *User       `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
    StartDate    *time.Time  `json:"start_date"`
    EndDate      *time.Time  `json:"end_date"`
    CreatedAt    time.Time   `json:"created_at"`
    UpdatedAt    time.Time   `json:"updated_at"`
}
```

---

## 🛣️ API Endpoints (from FRD-09)

### Authentication
```
POST   /api/v1/auth/register          # Register new user
POST   /api/v1/auth/login             # Login and get JWT token
POST   /api/v1/auth/logout            # Logout (invalidate token)
POST   /api/v1/auth/refresh           # Refresh JWT token
GET    /api/v1/auth/me                # Get current user info
```

### Tasks
```
GET    /api/v1/tasks                  # List tasks (with filters)
POST   /api/v1/tasks                  # Create new task
GET    /api/v1/tasks/:id              # Get task by ID
PUT    /api/v1/tasks/:id              # Update task
PATCH  /api/v1/tasks/:id/status       # Update task status only
DELETE /api/v1/tasks/:id              # Delete task
GET    /api/v1/tasks/:id/dependencies # Get task dependencies
POST   /api/v1/tasks/:id/comments     # Add comment to task
```

### Users
```
GET    /api/v1/users                  # List users
GET    /api/v1/users/:id              # Get user by ID
PUT    /api/v1/users/:id              # Update user
GET    /api/v1/users/:id/tasks        # Get tasks assigned to user
```

### Departments
```
GET    /api/v1/departments            # List departments
POST   /api/v1/departments            # Create department (admin only)
GET    /api/v1/departments/:id        # Get department by ID
PUT    /api/v1/departments/:id        # Update department
GET    /api/v1/departments/:id/tasks  # Get department tasks
```

### Projects
```
GET    /api/v1/projects               # List projects
POST   /api/v1/projects               # Create project
GET    /api/v1/projects/:id           # Get project by ID
PUT    /api/v1/projects/:id           # Update project
DELETE /api/v1/projects/:id           # Delete project
GET    /api/v1/projects/:id/tasks     # Get project tasks
```

### AI Features (Phase 2)
```
POST   /api/v1/ai/parse-text          # Parse natural language to task
POST   /api/v1/ai/parse-email         # Extract tasks from email
POST   /api/v1/ai/parse-document      # Extract tasks from document
GET    /api/v1/ai/suggestions         # Get AI task suggestions
```

### Knowledge Graph (Phase 2)
```
GET    /api/v1/graph/dependencies     # Get dependency graph
GET    /api/v1/graph/collaborations   # Get collaboration network
GET    /api/v1/graph/bottlenecks      # Identify bottleneck users
```

---

## 🧪 Testing Requirements

### Unit Tests
```go
// Test naming convention: TestFunctionName_Scenario_ExpectedResult
func TestCreateTask_ValidInput_Success(t *testing.T) {
    // Arrange
    service := NewTaskService(mockDB, mockGraph)
    task := &models.Task{
        Title:    "Test Task",
        Priority: "High",
    }

    // Act
    err := service.CreateTask(context.Background(), task)

    // Assert
    assert.NoError(t, err)
    assert.NotEmpty(t, task.ID)
}

// Use table-driven tests for multiple scenarios
func TestValidateTask(t *testing.T) {
    tests := []struct {
        name    string
        task    *models.Task
        wantErr bool
    }{
        {"valid task", &models.Task{Title: "Valid", Priority: "High"}, false},
        {"empty title", &models.Task{Title: "", Priority: "High"}, true},
        {"invalid priority", &models.Task{Title: "Valid", Priority: "Invalid"}, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateTask(tt.task)
            if (err != nil) != tt.wantErr {
                t.Errorf("ValidateTask() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Integration Tests
- Test complete request/response cycles
- Use test database (separate from dev/prod)
- Clean up test data after each test
- Test authentication and authorization
- Test error scenarios and edge cases

### Test Coverage
- Aim for 80%+ code coverage
- Run tests before committing: `go test ./...`
- Run with coverage: `go test -cover ./...`
- Generate coverage report: `go test -coverprofile=coverage.out ./...`

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```go
type JWTClaims struct {
    UserID       string `json:"user_id"`
    Email        string `json:"email"`
    Role         string `json:"role"`
    DepartmentID string `json:"department_id"`
    jwt.StandardClaims
}

// Token expiry: 24 hours
// Refresh token expiry: 7 days
// Store refresh tokens in Redis with user ID as key
```

### Permission Levels (from FRD-03)
1. **Individual Contributor**: Can manage own tasks, view department tasks
2. **Project Manager**: Can manage project tasks, assign to team members
3. **Department Head**: Can manage all department tasks and users
4. **Admin**: Full system access

### Authorization Middleware
```go
// Require authentication for all routes except /auth/login and /auth/register
// Check permissions based on resource ownership
// Department heads can access all department resources
// Admins can access all resources
```

---

## 🚀 Development Workflow

### Initial Setup
```bash
# Initialize Go module
go mod init github.com/your-org/synapse-backend

# Install dependencies
go get -u github.com/gin-gonic/gin
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres
go get -u github.com/golang-jwt/jwt/v5
go get -u github.com/neo4j/neo4j-go-driver/v5

# Run migrations
go run migrations/migrate.go up

# Start development server
go run main.go
```

### Running the Server
```bash
# Development mode with hot reload (use air)
air

# Production mode
go build -o synapse-api && ./synapse-api

# Run tests
go test ./...

# Run with race detection
go test -race ./...

# Format code
go fmt ./...

# Lint code
golangci-lint run
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/synapse
DATABASE_MAX_CONNECTIONS=25
DATABASE_MAX_IDLE_CONNECTIONS=5

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=168h

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Server
PORT=8080
GIN_MODE=release
CORS_ORIGINS=http://localhost:3000,https://synapse.example.com

# Email (Phase 2)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
```

---

## 🤖 AI Integration (Phase 2)

### NLP Task Extraction
```go
// Use OpenAI or Claude API to parse natural language
func (s *NLPService) ExtractTask(ctx context.Context, input string) (*models.Task, error) {
    prompt := fmt.Sprintf(`Extract task details from: "%s"

    Return JSON with:
    - title (required)
    - description
    - priority (Low/Medium/High/Urgent)
    - due_date (ISO 8601)
    - confidence_score (0.0-1.0)`, input)

    // Call AI API
    // Parse response
    // Validate extracted data
    // Return task with confidence score
}
```

### Email Parsing
```go
// Parse emails and extract actionable tasks
// Use Gmail API or Microsoft Graph API
// Process email body with AI
// Extract due dates, assignees, priority
// Attach original email as context
```

### Document Analysis
```go
// Parse PDF, DOCX files
// Extract text content
// Send to AI for task extraction
// Return list of extracted tasks with confidence scores
```

---

## 📊 Knowledge Graph (Phase 2)

### Neo4j Integration
```go
// Create task relationships
func (s *GraphService) CreateDependency(taskID, dependsOnID string) error {
    session := s.driver.NewSession(neo4j.SessionConfig{})
    defer session.Close()

    _, err := session.Run(
        `MATCH (t1:Task {task_id: $taskID})
         MATCH (t2:Task {task_id: $dependsOnID})
         CREATE (t1)-[:DEPENDS_ON]->(t2)`,
        map[string]interface{}{
            "taskID":      taskID,
            "dependsOnID": dependsOnID,
        },
    )
    return err
}

// Query dependency chains
// Identify bottlenecks
// Find collaboration patterns
// Suggest related tasks
```

---

## 🔍 Logging & Monitoring

### Logging Standards
```go
// Use structured logging (logrus or zap)
import "github.com/sirupsen/logrus"

log.WithFields(logrus.Fields{
    "user_id": userID,
    "task_id": taskID,
    "action":  "create_task",
}).Info("Task created successfully")

// Log levels:
// - ERROR: System errors, failed operations
// - WARN: Unexpected behavior, deprecations
// - INFO: Important events, API calls
// - DEBUG: Detailed debugging information
```

### Metrics to Track
- Request count by endpoint
- Response time percentiles (p50, p95, p99)
- Error rate by endpoint
- Database query performance
- Cache hit/miss rate
- Active WebSocket connections

---

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Task title",
    ...
  },
  "message": "Task created successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

## 🚦 Performance Targets

- API response time: <200ms (p95)
- Database query time: <50ms (p95)
- Task list endpoint: <500ms for 1000 tasks
- Support 2000 concurrent users
- Support 100,000+ tasks without degradation

---

## 🔒 Security Checklist

- [ ] All endpoints use JWT authentication (except login/register)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (GORM parameterized queries)
- [ ] XSS prevention (sanitize user input)
- [ ] CSRF protection (SameSite cookies)
- [ ] Rate limiting on public endpoints
- [ ] HTTPS only in production
- [ ] Secure password hashing (bcrypt cost 12)
- [ ] Environment variables for secrets (never hardcode)
- [ ] CORS properly configured
- [ ] Security headers (Helmet equivalent for Go)

---

## 📚 Related Documentation

- **[Root CLAUDE.md](../CLAUDE.md)**: Project-wide rules and workflow
- **[docs/](../docs/)**: All FRDs and specifications
- **[docs/01-core-data-models.md](../docs/01-core-data-models.md)**: Database schemas
- **[docs/09-api-specification.md](../docs/09-api-specification.md)**: Complete API docs
- **[frontend/CLAUDE.md](../frontend/CLAUDE.md)**: Frontend integration guide

---

## ✅ Definition of Done

Before considering a backend feature complete:

- [ ] Code follows Go conventions and passes `golangci-lint`
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests for all endpoints
- [ ] API endpoints documented in Swagger
- [ ] Error handling implemented
- [ ] Logging added for important operations
- [ ] Input validation implemented
- [ ] Authorization checks in place
- [ ] Database migrations created
- [ ] Tested with frontend integration
- [ ] Performance tested (if critical path)
- [ ] Code reviewed by peer

---

## 🎯 Current Status

**Phase:** Not started (prototype uses json-server mock API)

**Next Steps:**
1. Initialize Go module and project structure
2. Set up PostgreSQL database and migrations
3. Implement core models (Task, User, Department, Project)
4. Build authentication endpoints and middleware
5. Implement task CRUD endpoints
6. Add filtering and search
7. Integrate with frontend

---

**Remember:** This is production code. Prioritize correctness, security, and maintainability over speed.

