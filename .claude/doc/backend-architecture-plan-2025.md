# Go Backend Architecture Plan - Project Synapse
## Comprehensive Implementation Strategy Based on Current Frontend

**Created:** October 15, 2025
**Version:** 1.0
**Status:** Implementation-Ready
**Based on:** Frontend Phase 1 (70% Complete) + PostgreSQL Architecture Review 2.0

---

## Executive Summary

This document provides a complete Go backend architecture plan for Project Synapse, designed to support the **currently implemented frontend** at `/home/sunny/task-management/frontend`. The backend must integrate seamlessly with:

### ✅ What the Frontend Has (Already Implemented)
1. **Task Management UI** - List, Board, Calendar views with full CRUD
2. **Email Integration UI** - Zoho Mail + Outlook OAuth flows
3. **Recurring Tasks UI** - Full recurring task management with skip dates
4. **RBAC UI** - Role-based UI elements (Admin, Manager, Member, Viewer)
5. **Settings Page** - User profile + integrations management
6. **Test Suite** - 45 passing test cases

### 🎯 What the Backend Must Provide
1. **RESTful API** - All endpoints the frontend expects
2. **Authentication** - Keycloak (PRIMARY) + Zoho OAuth (SECONDARY)
3. **Email Integration** - OAuth 2.0 for Zoho Mail + Outlook with background polling
4. **Recurring Tasks** - Cron-based task generation engine
5. **RBAC** - 4 roles with granular permissions enforcement
6. **PostgreSQL Integration** - Schema from PostgreSQL Architecture Review 2.0

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Service Layer Design](#3-service-layer-design)
4. [API Endpoint Specifications](#4-api-endpoint-specifications)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Email Integration Architecture](#6-email-integration-architecture)
7. [Recurring Tasks Engine](#7-recurring-tasks-engine)
8. [Database Integration](#8-database-integration)
9. [Error Handling & Logging](#9-error-handling--logging)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Open Questions](#13-open-questions)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
│                     Port 3000 (Development)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/HTTPS
                             │ (REST API calls)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX Reverse Proxy                        │
│              (SSL Termination, Load Balancing)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GO BACKEND (Gin Framework)                 │
│                       Port 8080 (API Server)                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐       │
│  │   Handlers   │  │  Middleware  │  │   Services     │       │
│  │  (HTTP API)  │──│  (Auth/RBAC) │──│ (Business Logic)│      │
│  └──────────────┘  └──────────────┘  └────────────────┘       │
│                                              │                   │
│  ┌──────────────────────────────────────────┼─────────────┐    │
│  │             Repositories (Data Access Layer)            │    │
│  └─────────────────────────────────┬───────────────────────┘    │
└────────────────────────────────────┼────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────┐
         │                           │                       │
         ▼                           ▼                       ▼
┌────────────────┐      ┌──────────────────────┐   ┌────────────────┐
│   PostgreSQL   │      │       Redis          │   │   Keycloak     │
│   (Database)   │      │  (Cache/Sessions)    │   │  (Auth Server) │
│   Port 5432    │      │     Port 6379        │   │   Port 8081    │
└────────────────┘      └──────────────────────┘   └────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│   PostgreSQL (with pg_cron)                                      │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  pg_cron Extension                                       │  │
│   │  - Recurring Task Generation (Every hour)                │  │
│   │    Runs: generate_recurring_tasks() SQL function         │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    BACKGROUND WORKER (Separate Process)          │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │  Email Poller    │  (Only worker needed - recurring tasks   │
│  │ (Every 5 min)    │   handled by pg_cron in database)        │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Gin | Fast, lightweight, excellent middleware support |
| **ORM** | GORM v2 | Mature, good PostgreSQL support, familiar to Go devs |
| **Auth** | Keycloak (PRIMARY) + JWT | Enterprise-grade, supports multiple providers |
| **Cache** | Redis | Fast, supports sessions, rate limiting, pub/sub |
| **Recurring Tasks** | pg_cron (PostgreSQL extension) | Database-native, zero network latency |
| **Background Jobs** | robfig/cron (email polling only) | Simple, reliable, minimal external dependencies |
| **API Design** | RESTful with versioning | Frontend expects REST, easy to version |
| **Database** | PostgreSQL 15+ | Already architected, JSONB support, proven scale |
| **Deployment** | Docker + Docker Compose | Easy self-hosting, reproducible environments |

### 1.3 Design Principles

1. **Separation of Concerns** - Clear boundaries between layers (handlers → services → repositories)
2. **Dependency Injection** - Testable, maintainable, flexible
3. **Single Responsibility** - Each component has one job
4. **DRY (Don't Repeat Yourself)** - Shared utilities, middleware, validation
5. **Security First** - RBAC at middleware level, input validation, SQL injection prevention
6. **Fail Fast** - Validate early, return errors immediately
7. **Observability** - Structured logging, metrics, health checks

---

## 2. Technology Stack

### 2.1 Core Dependencies

```go
// go.mod
module github.com/synapse/backend

go 1.21

require (
    // Web framework
    github.com/gin-gonic/gin v1.9.1

    // Database
    gorm.io/gorm v1.25.5
    gorm.io/driver/postgres v1.5.4

    // Authentication
    github.com/golang-jwt/jwt/v5 v5.2.0
    github.com/coreos/go-oidc/v3 v3.7.0
    golang.org/x/oauth2 v0.15.0

    // Cache
    github.com/go-redis/redis/v9 v9.3.0

    // Background jobs (email polling only)
    github.com/robfig/cron/v3 v3.0.1

    // Validation
    github.com/go-playground/validator/v10 v10.16.0

    // Logging
    github.com/sirupsen/logrus v1.9.3

    // Configuration
    github.com/spf13/viper v1.18.0

    // Email clients
    github.com/zoho/zohomail-go-sdk v1.0.0  // (hypothetical)
    github.com/microsoft/microsoft-graph-go v0.33.0

    // Utilities
    github.com/google/uuid v1.5.0
    golang.org/x/crypto v0.17.0

    // Testing
    github.com/stretchr/testify v1.8.4
    github.com/DATA-DOG/go-sqlmock v1.5.0

    // Migrations
    github.com/golang-migrate/migrate/v4 v4.16.2
)
```

### 2.2 Optional Dependencies (Phase 2)

```go
// AI/ML Integration
github.com/sashabaranov/go-openai v1.17.9  // OpenAI API
github.com/anthropics/anthropic-sdk-go v0.1.0  // Claude API

// Graph Database
github.com/neo4j/neo4j-go-driver/v5 v5.14.0

// WebSockets (Real-time updates)
github.com/gorilla/websocket v1.5.1

// Monitoring
github.com/prometheus/client_golang v1.17.0
```

---

## 3. Service Layer Design

### 3.1 Directory Structure

```
backend/
├── cmd/
│   ├── api/
│   │   └── main.go                      # API server entry point
│   └── worker/
│       └── main.go                      # Background worker entry point
├── internal/
│   ├── config/
│   │   ├── config.go                    # Configuration loader (Viper)
│   │   └── env.go                       # Environment variables
│   ├── models/
│   │   ├── task.go                      # Task model + GORM tags
│   │   ├── user.go                      # User model
│   │   ├── department.go                # Department model
│   │   ├── project.go                   # Project model
│   │   ├── email_integration.go         # Email integration model
│   │   ├── recurring_pattern.go         # Recurring task pattern
│   │   ├── refresh_token.go             # JWT refresh token
│   │   └── common.go                    # Common model fields (timestamps, etc.)
│   ├── handlers/
│   │   ├── task_handler.go              # Task CRUD endpoints
│   │   ├── user_handler.go              # User endpoints
│   │   ├── auth_handler.go              # Authentication endpoints
│   │   ├── project_handler.go           # Project endpoints
│   │   ├── department_handler.go        # Department endpoints
│   │   ├── email_integration_handler.go # Email integration endpoints
│   │   ├── recurring_task_handler.go    # Recurring task management
│   │   └── health_handler.go            # Health check endpoints
│   ├── services/
│   │   ├── task_service.go              # Task business logic
│   │   ├── user_service.go              # User management
│   │   ├── auth_service.go              # Authentication logic
│   │   ├── project_service.go           # Project logic
│   │   ├── department_service.go        # Department logic
│   │   ├── email_service.go             # Email parsing + task extraction
│   │   └── permission_service.go        # RBAC permission checks
│   ├── repositories/
│   │   ├── task_repository.go           # Task data access
│   │   ├── user_repository.go           # User data access
│   │   ├── project_repository.go        # Project data access
│   │   ├── department_repository.go     # Department data access
│   │   └── email_integration_repository.go
│   ├── middleware/
│   │   ├── auth.go                      # JWT authentication
│   │   ├── rbac.go                      # Role-based access control
│   │   ├── cors.go                      # CORS configuration
│   │   ├── logger.go                    # Request logging
│   │   ├── rate_limit.go                # Rate limiting
│   │   ├── error_handler.go             # Global error handler
│   │   └── request_id.go                # Request ID tracking
│   ├── integrations/
│   │   ├── keycloak/
│   │   │   ├── client.go                # Keycloak OIDC client
│   │   │   └── validator.go             # Token validation
│   │   ├── zoho/
│   │   │   ├── oauth.go                 # Zoho OAuth flow
│   │   │   ├── mail_client.go           # Zoho Mail API client
│   │   │   └── parser.go                # Email parsing
│   │   └── outlook/
│   │       ├── oauth.go                 # Microsoft Graph OAuth
│   │       ├── mail_client.go           # Outlook Mail API client
│   │       └── parser.go                # Email parsing
│   ├── workers/
│   │   ├── email_poller.go              # Email polling cron job
│   │   └── scheduler.go                 # Cron scheduler setup
│   ├── database/
│   │   ├── postgres.go                  # PostgreSQL connection
│   │   ├── redis.go                     # Redis connection
│   │   └── migrations/                  # Database migrations
│   │       ├── 000001_initial_schema.sql
│   │       ├── 000002_add_recurring_tasks.sql
│   │       ├── 000003_add_pg_cron_functions.sql
│   │       └── ...
│   ├── utils/
│   │   ├── validator.go                 # Input validation helpers
│   │   ├── response.go                  # Standard API responses
│   │   ├── errors.go                    # Custom error types
│   │   ├── pagination.go                # Pagination helpers
│   │   ├── jwt.go                       # JWT utilities
│   │   └── crypto.go                    # Encryption utilities
│   └── routes/
│       └── routes.go                    # Route definitions
├── tests/
│   ├── unit/
│   │   ├── task_service_test.go
│   │   ├── auth_service_test.go
│   │   └── ...
│   ├── integration/
│   │   ├── task_api_test.go
│   │   ├── auth_flow_test.go
│   │   └── ...
│   └── e2e/
│       └── full_flow_test.go
├── scripts/
│   ├── seed.go                          # Database seeding
│   └── migrate.sh                       # Migration helper
├── docker/
│   ├── Dockerfile                       # API server Dockerfile
│   ├── Dockerfile.worker                # Worker Dockerfile
│   └── docker-compose.yml               # Full stack compose
├── .env.example                         # Example environment variables
├── go.mod
├── go.sum
├── Makefile                             # Build automation
└── README.md
```

### 3.2 Layer Responsibilities

**Handlers (HTTP Layer)**
- Parse HTTP requests
- Validate request structure
- Call service layer
- Format HTTP responses
- Handle HTTP-specific errors (400, 401, 403, 404, 500)

**Services (Business Logic)**
- Implement business rules
- Orchestrate multiple repositories
- Call external services (Keycloak, email providers)
- Transform data between models and DTOs
- Enforce business-level permissions

**Repositories (Data Access)**
- CRUD operations on database
- Build complex queries
- Handle database transactions
- No business logic (pure data access)

**Middleware**
- Authentication verification
- Authorization (RBAC) checks
- Request logging
- Rate limiting
- CORS handling

---

## 4. API Endpoint Specifications

### 4.1 Frontend Expected Endpoints

Based on analysis of the frontend code, these are the **exact endpoints** the frontend expects:

#### Authentication
```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
POST   /api/v1/auth/logout
GET    /api/v1/auth/keycloak/authorize
GET    /api/v1/auth/keycloak/callback
```

#### Tasks
```
GET    /api/v1/tasks                     # List tasks with filters
POST   /api/v1/tasks                     # Create task
GET    /api/v1/tasks/:id                 # Get task by ID
PUT    /api/v1/tasks/:id                 # Update task
DELETE /api/v1/tasks/:id                 # Delete task
GET    /api/v1/tasks/:id/comments        # Get task comments
POST   /api/v1/tasks/:id/comments        # Add comment
```

#### Email Integrations (Zoho Mail)
```
POST   /api/v1/integrations/zoho-mail/auth         # Initiate OAuth
GET    /api/v1/integrations/zoho-mail/callback     # OAuth callback
POST   /api/v1/integrations/zoho-mail/disconnect   # Disconnect integration
GET    /api/v1/integrations/zoho-mail/status       # Get integration status
POST   /api/v1/integrations/zoho-mail/sync         # Manual sync
```

#### Email Integrations (Outlook)
```
POST   /api/v1/integrations/outlook/auth
GET    /api/v1/integrations/outlook/callback
POST   /api/v1/integrations/outlook/disconnect
GET    /api/v1/integrations/outlook/status
POST   /api/v1/integrations/outlook/sync
```

#### Users
```
GET    /api/v1/users                     # List users (filtered by department)
GET    /api/v1/users/:id                 # Get user profile
PUT    /api/v1/users/:id                 # Update user (admin or self)
```

#### Departments
```
GET    /api/v1/departments               # List all departments
GET    /api/v1/departments/:id           # Get department details
```

#### Projects
```
GET    /api/v1/projects                  # List projects
POST   /api/v1/projects                  # Create project (Manager+)
GET    /api/v1/projects/:id              # Get project
PUT    /api/v1/projects/:id              # Update project
DELETE /api/v1/projects/:id              # Delete project (Admin only)
```

#### Settings
```
GET    /api/v1/settings/profile          # Get user profile
PUT    /api/v1/settings/profile          # Update profile
GET    /api/v1/settings/integrations     # List user integrations
```

### 4.2 Detailed API Contracts

#### Example: GET /api/v1/tasks

**Request:**
```http
GET /api/v1/tasks?status=To Do,In Progress&priority=High&page=1&per_page=20&sort_by=due_date&sort_order=asc
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
```typescript
{
  status?: string[]          // Filter by status
  priority?: string[]        // Filter by priority
  assignee_id?: string       // Filter by assignee
  department_id?: string     // Filter by department
  project_id?: string        // Filter by project
  is_recurring?: boolean     // Filter recurring tasks
  due_date_from?: string     // ISO 8601 date
  due_date_to?: string       // ISO 8601 date
  search?: string            // Full-text search
  page?: number              // Page number (default: 1)
  per_page?: number          // Items per page (default: 20, max: 100)
  sort_by?: string           // Sort field (default: created_at)
  sort_order?: 'asc'|'desc'  // Sort direction (default: desc)
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "task_id": "task-001",
      "title": "Implement user authentication",
      "description": "...",
      "status": "In Progress",
      "priority": "High",
      "creator": {
        "id": "uuid",
        "full_name": "Sunny Kumar",
        "email": "sunny@example.com"
      },
      "assignees": [
        {
          "id": "uuid",
          "full_name": "John Doe",
          "email": "john@example.com"
        }
      ],
      "department": {
        "id": "uuid",
        "name": "Engineering"
      },
      "project": {
        "id": "uuid",
        "name": "Project Synapse"
      },
      "due_date": "2025-10-20T17:00:00Z",
      "completion_date": null,
      "source": "GUI",
      "tags": ["backend", "auth"],
      "attachments": [],
      "is_recurring": false,
      "confidence_score": null,
      "created_at": "2025-10-15T10:00:00Z",
      "updated_at": "2025-10-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

#### Example: POST /api/v1/tasks

**Request:**
```http
POST /api/v1/tasks
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "title": "Design API schema",
  "description": "Create OpenAPI specification for all endpoints",
  "status": "To Do",
  "priority": "High",
  "assignee_ids": ["user-uuid-1", "user-uuid-2"],
  "department_id": "dept-uuid",
  "project_id": "project-uuid",
  "due_date": "2025-10-25T17:00:00Z",
  "tags": ["api", "documentation"],
  "is_recurring": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "generated-uuid",
    "task_id": "task-152",
    "title": "Design API schema",
    "status": "To Do",
    "priority": "High",
    "creator": {
      "id": "current-user-uuid",
      "full_name": "Sunny Kumar"
    },
    "assignees": [...],
    "created_at": "2025-10-15T15:00:00Z",
    "updated_at": "2025-10-15T15:00:00Z"
  },
  "message": "Task created successfully"
}
```

#### Example: POST /api/v1/integrations/zoho-mail/auth

**Request:**
```http
POST /api/v1/integrations/zoho-mail/auth
Authorization: Bearer {jwt_token}
Content-Type: application/json

{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://accounts.zoho.com/oauth/v2/auth?client_id=...&redirect_uri=...&scope=...&state=..."
  },
  "message": "Redirect user to authorization URL"
}
```

#### Example: GET /api/v1/integrations/zoho-mail/callback

**Request:**
```http
GET /api/v1/integrations/zoho-mail/callback?code=auth_code&state=random_state
```

**Response:**
```json
{
  "success": true,
  "data": {
    "integration_id": "uuid",
    "provider": "zoho-mail",
    "email": "user@example.com",
    "status": "connected",
    "last_sync": null,
    "sync_enabled": true
  },
  "message": "Zoho Mail integration connected successfully"
}
```

### 4.3 Error Response Format

All errors follow this standard format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "priority",
        "message": "Invalid priority value"
      }
    ]
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Input validation failed (400)
- `UNAUTHORIZED` - Missing or invalid authentication (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource conflict (e.g., duplicate email) (409)
- `INTERNAL_ERROR` - Server error (500)

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

**PRIMARY: Keycloak OIDC**

```
┌─────────┐                                           ┌───────────┐
│Frontend │                                           │ Keycloak  │
└────┬────┘                                           └─────┬─────┘
     │                                                      │
     │ 1. User clicks "Login with Keycloak"                │
     ├──────────────────────────────────────────────────►  │
     │                                                      │
     │ 2. Redirect to Keycloak login page                  │
     │  ◄──────────────────────────────────────────────────┤
     │                                                      │
     │ 3. User enters credentials                          │
     ├──────────────────────────────────────────────────►  │
     │                                                      │
     │ 4. Keycloak authenticates & redirects to callback   │
     │    with authorization code                          │
     │  ◄──────────────────────────────────────────────────┤
     │                                                      │
     ▼                                                      │
┌─────────────┐                                            │
│   Backend   │                                            │
│  /callback  │                                            │
└──────┬──────┘                                            │
       │ 5. Exchange code for tokens (ID token + access)   │
       ├───────────────────────────────────────────────►   │
       │                                                    │
       │ 6. Return tokens                                  │
       │  ◄─────────────────────────────────────────────── │
       │                                                    │
       │ 7. Verify ID token signature                      │
       │ 8. Extract user info (sub, email, name)           │
       │ 9. Create/update user in database                 │
       │ 10. Generate application JWT token                │
       │                                                    │
       │ 11. Return JWT to frontend                        │
       ├───────────────────────────────►                   │
       │                                                    │
┌──────▼──────┐                                            │
│  Frontend   │                                            │
│ Stores JWT  │                                            │
└─────────────┘                                            │
```

**Implementation:**

```go
// internal/integrations/keycloak/client.go
package keycloak

import (
    "context"
    "github.com/coreos/go-oidc/v3/oidc"
    "golang.org/x/oauth2"
)

type KeycloakClient struct {
    provider     *oidc.Provider
    verifier     *oidc.IDTokenVerifier
    oauth2Config oauth2.Config
}

func NewKeycloakClient(issuerURL, clientID, clientSecret, redirectURL string) (*KeycloakClient, error) {
    ctx := context.Background()
    provider, err := oidc.NewProvider(ctx, issuerURL)
    if err != nil {
        return nil, err
    }

    verifier := provider.Verifier(&oidc.Config{ClientID: clientID})

    oauth2Config := oauth2.Config{
        ClientID:     clientID,
        ClientSecret: clientSecret,
        RedirectURL:  redirectURL,
        Endpoint:     provider.Endpoint(),
        Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
    }

    return &KeycloakClient{
        provider:     provider,
        verifier:     verifier,
        oauth2Config: oauth2Config,
    }, nil
}

func (k *KeycloakClient) GetAuthorizationURL(state string) string {
    return k.oauth2Config.AuthCodeURL(state)
}

func (k *KeycloakClient) ExchangeCode(ctx context.Context, code string) (*oauth2.Token, error) {
    return k.oauth2Config.Exchange(ctx, code)
}

func (k *KeycloakClient) VerifyIDToken(ctx context.Context, rawIDToken string) (*oidc.IDToken, error) {
    return k.verifier.Verify(ctx, rawIDToken)
}
```

```go
// internal/handlers/auth_handler.go
package handlers

func (h *AuthHandler) KeycloakCallback(c *gin.Context) {
    ctx := c.Request.Context()

    // 1. Validate state parameter
    state := c.Query("state")
    if !h.validateState(state) {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state"})
        return
    }

    // 2. Exchange authorization code for tokens
    code := c.Query("code")
    oauth2Token, err := h.keycloakClient.ExchangeCode(ctx, code)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to exchange code"})
        return
    }

    // 3. Extract and verify ID token
    rawIDToken, ok := oauth2Token.Extra("id_token").(string)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "No ID token"})
        return
    }

    idToken, err := h.keycloakClient.VerifyIDToken(ctx, rawIDToken)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid ID token"})
        return
    }

    // 4. Extract user info from ID token claims
    var claims struct {
        Email string `json:"email"`
        Name  string `json:"name"`
        Sub   string `json:"sub"`  // Keycloak user ID
    }
    if err := idToken.Claims(&claims); err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to parse claims"})
        return
    }

    // 5. Create or update user in database
    user, err := h.userService.FindOrCreateFromKeycloak(ctx, claims.Sub, claims.Email, claims.Name)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
        return
    }

    // 6. Generate application JWT token
    token, err := h.authService.GenerateJWT(user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
        return
    }

    // 7. Generate refresh token
    refreshToken, err := h.authService.GenerateRefreshToken(user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
        return
    }

    // 8. Return tokens to frontend
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data": gin.H{
            "token":         token,
            "refresh_token": refreshToken,
            "user":          user,
        },
    })
}
```

### 5.2 JWT Token Structure

```go
// internal/utils/jwt.go
package utils

type JWTClaims struct {
    UserID       string   `json:"user_id"`
    Email        string   `json:"email"`
    FullName     string   `json:"full_name"`
    Role         string   `json:"role"`
    DepartmentID *string  `json:"department_id,omitempty"`
    Permissions  []string `json:"permissions"`
    jwt.RegisteredClaims
}

func GenerateJWT(user *models.User, secret string) (string, error) {
    claims := JWTClaims{
        UserID:       user.ID,
        Email:        user.Email,
        FullName:     user.FullName,
        Role:         user.Role,
        DepartmentID: user.DepartmentID,
        Permissions:  user.Permissions,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "synapse-api",
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}
```

### 5.3 RBAC Middleware

```go
// internal/middleware/rbac.go
package middleware

type Role string

const (
    RoleAdmin   Role = "Admin"
    RoleManager Role = "Manager"
    RoleMember  Role = "Member"
    RoleViewer  Role = "Viewer"
)

type Permission string

const (
    // Task permissions
    PermTaskCreate Permission = "tasks.create"
    PermTaskRead   Permission = "tasks.read"
    PermTaskUpdate Permission = "tasks.update"
    PermTaskDelete Permission = "tasks.delete"

    // User permissions
    PermUserCreate Permission = "users.create"
    PermUserRead   Permission = "users.read"
    PermUserUpdate Permission = "users.update"
    PermUserDelete Permission = "users.delete"

    // Project permissions
    PermProjectCreate Permission = "projects.create"
    PermProjectRead   Permission = "projects.read"
    PermProjectUpdate Permission = "projects.update"
    PermProjectDelete Permission = "projects.delete"
)

var rolePermissions = map[Role][]Permission{
    RoleAdmin: {
        PermTaskCreate, PermTaskRead, PermTaskUpdate, PermTaskDelete,
        PermUserCreate, PermUserRead, PermUserUpdate, PermUserDelete,
        PermProjectCreate, PermProjectRead, PermProjectUpdate, PermProjectDelete,
    },
    RoleManager: {
        PermTaskCreate, PermTaskRead, PermTaskUpdate, PermTaskDelete,
        PermUserRead,
        PermProjectCreate, PermProjectRead, PermProjectUpdate,
    },
    RoleMember: {
        PermTaskCreate, PermTaskRead, PermTaskUpdate,
        PermUserRead,
        PermProjectRead,
    },
    RoleViewer: {
        PermTaskRead,
        PermUserRead,
        PermProjectRead,
    },
}

func RequirePermission(perm Permission) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get user from context (set by auth middleware)
        userRole, exists := c.Get("user_role")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
            c.Abort()
            return
        }

        role := Role(userRole.(string))
        permissions := rolePermissions[role]

        // Check if user has required permission
        hasPermission := false
        for _, p := range permissions {
            if p == perm {
                hasPermission = true
                break
            }
        }

        if !hasPermission {
            c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
            c.Abort()
            return
        }

        c.Next()
    }
}

// Resource ownership checks
func RequireTaskOwnership() gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetString("user_id")
        userRole := c.GetString("user_role")
        taskID := c.Param("id")

        // Admins and Managers can access all tasks
        if userRole == string(RoleAdmin) || userRole == string(RoleManager) {
            c.Next()
            return
        }

        // Check if user is creator or assignee
        // (This requires a database query, so inject repository)
        // For now, simplified version
        c.Next()
    }
}
```

### 5.4 Auth Middleware

```go
// internal/middleware/auth.go
package middleware

func RequireAuth(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Extract token from header
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "success": false,
                "error": gin.H{
                    "code":    "UNAUTHORIZED",
                    "message": "Missing authorization header",
                },
            })
            c.Abort()
            return
        }

        // 2. Remove "Bearer " prefix
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")

        // 3. Parse and validate token
        token, err := jwt.ParseWithClaims(tokenString, &utils.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
            // Verify signing method
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
            }
            return []byte(jwtSecret), nil
        })

        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{
                "success": false,
                "error": gin.H{
                    "code":    "UNAUTHORIZED",
                    "message": "Invalid token",
                },
            })
            c.Abort()
            return
        }

        // 4. Extract claims
        claims, ok := token.Claims.(*utils.JWTClaims)
        if !ok || !token.Valid {
            c.JSON(http.StatusUnauthorized, gin.H{
                "success": false,
                "error": gin.H{
                    "code":    "UNAUTHORIZED",
                    "message": "Invalid token claims",
                },
            })
            c.Abort()
            return
        }

        // 5. Set user info in context
        c.Set("user_id", claims.UserID)
        c.Set("user_email", claims.Email)
        c.Set("user_role", claims.Role)
        c.Set("user_department_id", claims.DepartmentID)
        c.Set("user_permissions", claims.Permissions)

        c.Next()
    }
}
```

---

## 6. Email Integration Architecture

### 6.1 OAuth 2.0 Flow

**Zoho Mail OAuth:**

```go
// internal/integrations/zoho/oauth.go
package zoho

import (
    "golang.org/x/oauth2"
)

var ZohoOAuthConfig = oauth2.Config{
    ClientID:     os.Getenv("ZOHO_CLIENT_ID"),
    ClientSecret: os.Getenv("ZOHO_CLIENT_SECRET"),
    RedirectURL:  os.Getenv("ZOHO_REDIRECT_URL"),
    Scopes: []string{
        "ZohoMail.messages.READ",
        "ZohoMail.folders.READ",
    },
    Endpoint: oauth2.Endpoint{
        AuthURL:  "https://accounts.zoho.com/oauth/v2/auth",
        TokenURL: "https://accounts.zoho.com/oauth/v2/token",
    },
}

func GetAuthorizationURL(state string) string {
    return ZohoOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func ExchangeCode(ctx context.Context, code string) (*oauth2.Token, error) {
    return ZohoOAuthConfig.Exchange(ctx, code)
}

func RefreshToken(ctx context.Context, refreshToken string) (*oauth2.Token, error) {
    token := &oauth2.Token{RefreshToken: refreshToken}
    return ZohoOAuthConfig.TokenSource(ctx, token).Token()
}
```

### 6.2 Email Polling Architecture

```go
// internal/workers/email_poller.go
package workers

type EmailPoller struct {
    emailService *services.EmailService
    cron         *cron.Cron
    logger       *logrus.Logger
}

func NewEmailPoller(emailService *services.EmailService, logger *logrus.Logger) *EmailPoller {
    return &EmailPoller{
        emailService: emailService,
        cron:         cron.New(),
        logger:       logger,
    }
}

func (ep *EmailPoller) Start() error {
    // Run every 5 minutes
    _, err := ep.cron.AddFunc("*/5 * * * *", func() {
        ep.logger.Info("Starting email polling job")

        ctx := context.Background()
        if err := ep.emailService.PollAllIntegrations(ctx); err != nil {
            ep.logger.WithError(err).Error("Email polling failed")
        } else {
            ep.logger.Info("Email polling completed successfully")
        }
    })

    if err != nil {
        return fmt.Errorf("failed to schedule email polling: %w", err)
    }

    ep.cron.Start()
    ep.logger.Info("Email poller started (runs every 5 minutes)")
    return nil
}

func (ep *EmailPoller) Stop() {
    ep.cron.Stop()
    ep.logger.Info("Email poller stopped")
}
```

### 6.3 Email Parsing Service

```go
// internal/services/email_service.go
package services

type EmailService struct {
    zohoClient      *zoho.MailClient
    outlookClient   *outlook.MailClient
    taskService     *TaskService
    integrationRepo *repositories.EmailIntegrationRepository
    logger          *logrus.Logger
}

func (s *EmailService) PollAllIntegrations(ctx context.Context) error {
    // 1. Get all active integrations
    integrations, err := s.integrationRepo.FindActive(ctx)
    if err != nil {
        return fmt.Errorf("failed to fetch integrations: %w", err)
    }

    s.logger.Infof("Found %d active integrations", len(integrations))

    // 2. Poll each integration
    for _, integration := range integrations {
        if err := s.pollIntegration(ctx, integration); err != nil {
            s.logger.WithError(err).WithField("integration_id", integration.ID).Error("Failed to poll integration")
            // Update integration error status
            integration.Status = "error"
            integration.ErrorMessage = err.Error()
            integration.ErrorCount++
            s.integrationRepo.Update(ctx, integration)
        } else {
            // Clear error status
            integration.Status = "connected"
            integration.ErrorMessage = ""
            integration.ErrorCount = 0
            integration.LastSync = time.Now()
            s.integrationRepo.Update(ctx, integration)
        }
    }

    return nil
}

func (s *EmailService) pollIntegration(ctx context.Context, integration *models.EmailIntegration) error {
    var messages []EmailMessage
    var err error

    switch integration.Provider {
    case "zoho-mail":
        messages, err = s.pollZohoMail(ctx, integration)
    case "outlook":
        messages, err = s.pollOutlook(ctx, integration)
    default:
        return fmt.Errorf("unknown provider: %s", integration.Provider)
    }

    if err != nil {
        return err
    }

    s.logger.Infof("Fetched %d new messages from %s", len(messages), integration.Provider)

    // 3. Parse each message and create tasks
    for _, msg := range messages {
        if err := s.parseAndCreateTask(ctx, integration, msg); err != nil {
            s.logger.WithError(err).WithField("message_id", msg.ID).Error("Failed to parse message")
        }
    }

    return nil
}

func (s *EmailService) parseAndCreateTask(ctx context.Context, integration *models.EmailIntegration, msg EmailMessage) error {
    // 1. Parse email to extract task details
    parsedTask := s.parseEmailToTask(msg)

    // 2. Check confidence score threshold
    if parsedTask.ConfidenceScore < integration.MinConfidenceScore {
        s.logger.Infof("Skipping task creation due to low confidence: %.2f < %.2f",
            parsedTask.ConfidenceScore, integration.MinConfidenceScore)
        return nil
    }

    // 3. Create task
    task := &models.Task{
        Title:           parsedTask.Title,
        Description:     parsedTask.Description,
        Priority:        integration.DefaultPriority,
        Status:          integration.DefaultStatus,
        Source:          "Email",
        ConfidenceScore: &parsedTask.ConfidenceScore,
        CreatorID:       integration.UserID,
        Metadata: map[string]interface{}{
            "email_id":      msg.ID,
            "email_from":    msg.From,
            "email_subject": msg.Subject,
            "email_date":    msg.Date,
        },
    }

    if parsedTask.DueDate != nil {
        task.DueDate = parsedTask.DueDate
    }

    _, err := s.taskService.CreateTask(ctx, task)
    if err != nil {
        return fmt.Errorf("failed to create task: %w", err)
    }

    s.logger.Infof("Created task from email: %s", task.Title)
    return nil
}

func (s *EmailService) parseEmailToTask(msg EmailMessage) *ParsedTask {
    // Simple rule-based parsing (Phase 1)
    // Phase 2 will use AI/NLP

    parsed := &ParsedTask{
        Title:           msg.Subject,
        Description:     msg.Body,
        ConfidenceScore: 0.8,
    }

    // Extract priority from subject keywords
    subjectLower := strings.ToLower(msg.Subject)
    if strings.Contains(subjectLower, "urgent") || strings.Contains(subjectLower, "asap") {
        parsed.Priority = "Urgent"
        parsed.ConfidenceScore = 0.9
    } else if strings.Contains(subjectLower, "important") {
        parsed.Priority = "High"
    }

    // Extract due date from body (simple regex)
    // TODO: Implement proper date extraction

    return parsed
}
```

### 6.4 Token Encryption

```go
// internal/utils/crypto.go
package utils

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "io"
)

func EncryptToken(plaintext, key string) (string, error) {
    keyBytes := []byte(key)
    plaintextBytes := []byte(plaintext)

    block, err := aes.NewCipher(keyBytes)
    if err != nil {
        return "", err
    }

    ciphertext := make([]byte, aes.BlockSize+len(plaintextBytes))
    iv := ciphertext[:aes.BlockSize]

    if _, err := io.ReadFull(rand.Reader, iv); err != nil {
        return "", err
    }

    stream := cipher.NewCFBEncrypter(block, iv)
    stream.XORKeyStream(ciphertext[aes.BlockSize:], plaintextBytes)

    return base64.URLEncoding.EncodeToString(ciphertext), nil
}

func DecryptToken(ciphertext, key string) (string, error) {
    keyBytes := []byte(key)
    ciphertextBytes, err := base64.URLEncoding.DecodeString(ciphertext)
    if err != nil {
        return "", err
    }

    block, err := aes.NewCipher(keyBytes)
    if err != nil {
        return "", err
    }

    if len(ciphertextBytes) < aes.BlockSize {
        return "", fmt.Errorf("ciphertext too short")
    }

    iv := ciphertextBytes[:aes.BlockSize]
    ciphertextBytes = ciphertextBytes[aes.BlockSize:]

    stream := cipher.NewCFBDecrypter(block, iv)
    stream.XORKeyStream(ciphertextBytes, ciphertextBytes)

    return string(ciphertextBytes), nil
}
```

---

## 7. Recurring Tasks Engine (pg_cron)

**Architecture Decision:** Use **pg_cron** PostgreSQL extension instead of Go worker for recurring task generation.

**Why pg_cron?**
- ✅ Database-native (no external process)
- ✅ Zero network latency (in-process function calls)
- ✅ Simpler architecture (one less container)
- ✅ Better reliability (PostgreSQL-managed)
- ✅ Transactional guarantees (ACID)

**Complete implementation details:** See `/home/sunny/task-management/.claude/doc/pg_cron-recurring-tasks-implementation.md`

### 7.1 Database Schema Addition

```sql
-- From PostgreSQL Architecture Review Section 4
ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE tasks ADD COLUMN recurrence_pattern JSONB;
ALTER TABLE tasks ADD COLUMN recurrence_parent_id UUID REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN next_occurrence TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN skip_dates TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE tasks ADD COLUMN recurrence_end_date TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN recurrence_count INTEGER;
ALTER TABLE tasks ADD COLUMN recurrence_generated_count INTEGER DEFAULT 0;

CREATE INDEX idx_tasks_recurring_due ON tasks(next_occurrence)
  WHERE is_recurring = TRUE AND next_occurrence IS NOT NULL;

-- Create log table for recurring task generation
CREATE TABLE recurring_task_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    generated_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurring_task_log_parent ON recurring_task_log(parent_task_id, generated_at DESC);
CREATE INDEX idx_recurring_task_log_status ON recurring_task_log(status, generated_at DESC);
```

### 7.2 pg_cron Setup

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to calculate next occurrence
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
    p_pattern JSONB,
    p_current_occurrence TIMESTAMPTZ,
    p_skip_dates TEXT[]
)
RETURNS TIMESTAMPTZ AS $$
-- See pg_cron-recurring-tasks-implementation.md Section 3.2 for full implementation
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to generate recurring tasks
CREATE OR REPLACE FUNCTION generate_recurring_tasks()
RETURNS TABLE(
    tasks_generated INTEGER,
    tasks_processed INTEGER,
    errors_count INTEGER
) AS $$
-- See pg_cron-recurring-tasks-implementation.md Section 3.1 for full implementation
$$ LANGUAGE plpgsql;

-- Schedule cron job to run every hour
SELECT cron.schedule(
    'generate-recurring-tasks',
    '0 * * * *',
    'SELECT generate_recurring_tasks();'
);
```

### 7.3 Go Model (Frontend Integration Only)

**Note:** Recurrence calculation logic is in PostgreSQL, not Go.

```go
// internal/models/recurring_pattern.go
package models

type RecurrencePattern struct {
    Frequency   string     `json:"frequency"`   // "daily", "weekly", "monthly", "yearly"
    Interval    int        `json:"interval"`    // Every N days/weeks/months/years
    DaysOfWeek  []int      `json:"daysOfWeek"`  // [1,3,5] = Mon, Wed, Fri (ISO weekday)
    DayOfMonth  *int       `json:"dayOfMonth"`  // 15 = 15th of month, -1 = last day
    MonthOfYear *int       `json:"monthOfYear"` // 6 = June
    Count       *int       `json:"count"`       // Generate N occurrences
    Until       *time.Time `json:"until"`       // End date
}

// Task model addition
type Task struct {
    // ... existing fields

    IsRecurring              bool               `gorm:"default:false" json:"is_recurring"`
    RecurrencePattern        *RecurrencePattern `gorm:"type:jsonb" json:"recurrence_pattern,omitempty"`
    RecurrenceParentID       *string            `gorm:"type:uuid" json:"recurrence_parent_id,omitempty"`
    RecurrenceParent         *Task              `gorm:"foreignKey:RecurrenceParentID" json:"recurrence_parent,omitempty"`
    NextOccurrence           *time.Time         `json:"next_occurrence,omitempty"`
    SkipDates                []string           `gorm:"type:text[]" json:"skip_dates,omitempty"`
    RecurrenceEndDate        *time.Time         `json:"recurrence_end_date,omitempty"`
    RecurrenceCount          *int               `json:"recurrence_count,omitempty"`
    RecurrenceGeneratedCount int                `gorm:"default:0" json:"recurrence_generated_count"`
}
```

### 7.4 Monitoring pg_cron Jobs

**Go endpoint for monitoring:**

```go
// internal/handlers/recurring_task_handler.go
package handlers

func (h *RecurringTaskHandler) GetJobStatus(c *gin.Context) {
    // Query cron.job_run_details for recent runs
    var result struct {
        LastRun         time.Time
        Status          string
        TasksGenerated  int
        TasksProcessed  int
        ErrorsCount     int
    }

    // Query: SELECT * FROM cron.job_run_details WHERE jobname = 'generate-recurring-tasks' ORDER BY start_time DESC LIMIT 1;
    // Parse return_message to extract stats

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    result,
    })
}

func (h *RecurringTaskHandler) GetGenerationLog(c *gin.Context) {
    // Query recurring_task_log table for recent generations
    // Return paginated list of generated tasks

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    logs,
    })
}
```

---

## 8. Database Integration

### 8.1 GORM Connection Setup

```go
// internal/database/postgres.go
package database

import (
    "fmt"
    "time"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

type Config struct {
    Host     string
    Port     int
    User     string
    Password string
    Database string
    SSLMode  string
}

func NewPostgresDB(cfg *Config) (*gorm.DB, error) {
    dsn := fmt.Sprintf(
        "host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
        cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Database, cfg.SSLMode,
    )

    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
        NowFunc: func() time.Time {
            return time.Now().UTC()
        },
    })

    if err != nil {
        return nil, fmt.Errorf("failed to connect to database: %w", err)
    }

    // Connection pooling settings (from PostgreSQL Architecture Review Section 7.2)
    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }

    sqlDB.SetMaxOpenConns(25)                      // Match PgBouncer pool size
    sqlDB.SetMaxIdleConns(5)                       // Match PgBouncer min_pool_size
    sqlDB.SetConnMaxLifetime(1 * time.Hour)        // Match PgBouncer server_lifetime
    sqlDB.SetConnMaxIdleTime(10 * time.Minute)

    return db, nil
}
```

### 8.2 Repository Pattern

```go
// internal/repositories/task_repository.go
package repositories

type TaskRepository struct {
    db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) *TaskRepository {
    return &TaskRepository{db: db}
}

func (r *TaskRepository) Create(ctx context.Context, task *models.Task) error {
    return r.db.WithContext(ctx).Create(task).Error
}

func (r *TaskRepository) FindByID(ctx context.Context, id string) (*models.Task, error) {
    var task models.Task
    err := r.db.WithContext(ctx).
        Preload("Creator").
        Preload("Assignees").
        Preload("Department").
        Preload("Project").
        First(&task, "id = ?", id).Error

    if err != nil {
        return nil, err
    }
    return &task, nil
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

    if filters.AssigneeID != "" {
        query = query.Joins("JOIN task_assignees ON tasks.id = task_assignees.task_id").
            Where("task_assignees.user_id = ?", filters.AssigneeID)
    }

    if filters.DepartmentID != "" {
        query = query.Where("department_id = ?", filters.DepartmentID)
    }

    if filters.ProjectID != "" {
        query = query.Where("project_id = ?", filters.ProjectID)
    }

    if filters.IsRecurring != nil {
        query = query.Where("is_recurring = ?", *filters.IsRecurring)
    }

    if filters.DueDateFrom != nil {
        query = query.Where("due_date >= ?", *filters.DueDateFrom)
    }

    if filters.DueDateTo != nil {
        query = query.Where("due_date <= ?", *filters.DueDateTo)
    }

    if filters.Search != "" {
        // Use generated tsvector column (from PostgreSQL Architecture Review Section 3.3)
        query = query.Where("search_vector @@ plainto_tsquery('english', ?)", filters.Search)
    }

    // Count total
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }

    // Sort
    sortBy := filters.SortBy
    if sortBy == "" {
        sortBy = "created_at"
    }
    sortOrder := filters.SortOrder
    if sortOrder == "" {
        sortOrder = "desc"
    }
    query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

    // Paginate
    offset := (page - 1) * perPage
    err := query.
        Preload("Creator").
        Preload("Assignees").
        Preload("Department").
        Preload("Project").
        Offset(offset).
        Limit(perPage).
        Find(&tasks).Error

    return tasks, total, err
}

func (r *TaskRepository) Update(ctx context.Context, task *models.Task) error {
    return r.db.WithContext(ctx).Save(task).Error
}

func (r *TaskRepository) Delete(ctx context.Context, id string) error {
    return r.db.WithContext(ctx).Delete(&models.Task{}, "id = ?", id).Error
}

func (r *TaskRepository) FindDueRecurringTasks(ctx context.Context) ([]*models.Task, error) {
    var tasks []*models.Task
    err := r.db.WithContext(ctx).
        Where("is_recurring = ? AND next_occurrence <= ? AND next_occurrence IS NOT NULL", true, time.Now()).
        Where("(recurrence_end_date IS NULL OR recurrence_end_date > ?)", time.Now()).
        Where("(recurrence_count IS NULL OR recurrence_generated_count < recurrence_count)").
        Find(&tasks).Error

    return tasks, err
}
```

---

## 9. Error Handling & Logging

### 9.1 Standard Error Response

```go
// internal/utils/response.go
package utils

type ErrorResponse struct {
    Success bool  `json:"success"`
    Error   Error `json:"error"`
}

type Error struct {
    Code    string        `json:"code"`
    Message string        `json:"message"`
    Details []ErrorDetail `json:"details,omitempty"`
}

type ErrorDetail struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

func RespondWithError(c *gin.Context, statusCode int, code string, message string, details []ErrorDetail) {
    c.JSON(statusCode, ErrorResponse{
        Success: false,
        Error: Error{
            Code:    code,
            Message: message,
            Details: details,
        },
    })
}

func RespondWithValidationError(c *gin.Context, errors []ErrorDetail) {
    RespondWithError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Validation failed", errors)
}

func RespondWithUnauthorized(c *gin.Context) {
    RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
}

func RespondWithForbidden(c *gin.Context) {
    RespondWithError(c, http.StatusForbidden, "FORBIDDEN", "Insufficient permissions", nil)
}

func RespondWithNotFound(c *gin.Context, resource string) {
    RespondWithError(c, http.StatusNotFound, "NOT_FOUND", fmt.Sprintf("%s not found", resource), nil)
}

func RespondWithInternalError(c *gin.Context, err error) {
    // Log the error internally
    c.Error(err)

    // Return generic message to client
    RespondWithError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "An internal error occurred", nil)
}
```

### 9.2 Structured Logging

```go
// internal/middleware/logger.go
package middleware

func RequestLogger(logger *logrus.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        method := c.Request.Method

        // Request ID (from request_id middleware)
        requestID := c.GetString("request_id")

        c.Next()

        latency := time.Since(start)
        statusCode := c.Writer.Status()

        logger.WithFields(logrus.Fields{
            "request_id": requestID,
            "method":     method,
            "path":       path,
            "status":     statusCode,
            "latency_ms": latency.Milliseconds(),
            "user_id":    c.GetString("user_id"),
        }).Info("Request processed")
    }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```go
// tests/unit/task_service_test.go
package tests

func TestTaskService_CreateTask(t *testing.T) {
    // Setup mock repository
    mockRepo := new(MockTaskRepository)
    mockPermSvc := new(MockPermissionService)

    service := services.NewTaskService(mockRepo, mockPermSvc)

    tests := []struct {
        name        string
        task        *models.Task
        user        *models.User
        mockSetup   func()
        wantErr     bool
        expectedErr string
    }{
        {
            name: "valid task",
            task: &models.Task{
                Title:    "Test Task",
                Priority: "High",
                Status:   "To Do",
            },
            user: &models.User{
                ID:   "user-1",
                Role: "Member",
            },
            mockSetup: func() {
                mockPermSvc.On("CanCreateTask", mock.Anything, mock.Anything).Return(true, nil)
                mockRepo.On("Create", mock.Anything, mock.Anything).Return(nil)
            },
            wantErr: false,
        },
        {
            name: "empty title",
            task: &models.Task{
                Title:    "",
                Priority: "High",
            },
            user: &models.User{
                ID:   "user-1",
                Role: "Member",
            },
            mockSetup: func() {},
            wantErr:   true,
            expectedErr: "title is required",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            tt.mockSetup()

            err := service.CreateTask(context.Background(), tt.task, tt.user)

            if tt.wantErr {
                assert.Error(t, err)
                if tt.expectedErr != "" {
                    assert.Contains(t, err.Error(), tt.expectedErr)
                }
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

### 10.2 Integration Tests

```go
// tests/integration/task_api_test.go
package integration

func TestTaskAPI_CreateTask(t *testing.T) {
    // Setup test database
    db := setupTestDB(t)
    defer teardownTestDB(t, db)

    // Seed test data
    user := seedUser(t, db)
    token := generateTestJWT(t, user)

    // Setup test router
    router := setupTestRouter(db)

    // Test request
    body := map[string]interface{}{
        "title":    "Test Task",
        "priority": "High",
        "status":   "To Do",
    }
    jsonBody, _ := json.Marshal(body)

    req, _ := http.NewRequest("POST", "/api/v1/tasks", bytes.NewBuffer(jsonBody))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")

    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusCreated, w.Code)

    var response map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &response)

    assert.True(t, response["success"].(bool))
    assert.NotNil(t, response["data"])
}
```

---

## 11. Deployment Architecture

### 11.1 Docker Compose

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    command:
      - "postgres"
      - "-c"
      - "shared_preload_libraries=pg_cron"
      - "-c"
      - "cron.database_name=synapse"
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
      - "8081:8080"

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
      KEYCLOAK_CLIENT_ID: ${KEYCLOAK_CLIENT_ID}
      KEYCLOAK_CLIENT_SECRET: ${KEYCLOAK_CLIENT_SECRET}
      ZOHO_CLIENT_ID: ${ZOHO_CLIENT_ID}
      ZOHO_CLIENT_SECRET: ${ZOHO_CLIENT_SECRET}
      OUTLOOK_CLIENT_ID: ${OUTLOOK_CLIENT_ID}
      OUTLOOK_CLIENT_SECRET: ${OUTLOOK_CLIENT_SECRET}
      EMAIL_TOKEN_ENCRYPTION_KEY: ${EMAIL_TOKEN_ENCRYPTION_KEY}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8080:8080"

  worker:
    build:
      context: .
      dockerfile: docker/Dockerfile.worker
    environment:
      DATABASE_URL: postgres://synapse:${DB_PASSWORD}@postgres:5432/synapse?sslmode=disable
      REDIS_URL: redis://redis:6379
      EMAIL_TOKEN_ENCRYPTION_KEY: ${EMAIL_TOKEN_ENCRYPTION_KEY}
    depends_on:
      postgres:
        condition: service_healthy

# NOTE: No separate worker needed for recurring tasks - handled by pg_cron in PostgreSQL

volumes:
  postgres_data:
  redis_data:
```

---

## 12. Implementation Roadmap

### Week 1: Project Setup & Core Models
- Initialize Go project structure
- Set up PostgreSQL database
- Create database migrations (from PostgreSQL Architecture Review)
- Implement core GORM models (Task, User, Department, Project)
- Set up configuration management (Viper)
- Set up logging (logrus)

### Week 2: Authentication
- Implement Keycloak client integration
- Build JWT generation and validation
- Create auth middleware
- Implement auth endpoints (login, callback, refresh)
- Write auth tests

### Week 3: Task CRUD
- Implement task repository
- Build task service with business logic
- Create task handlers
- Add RBAC middleware to task endpoints
- Write task CRUD tests

### Week 4-6: Email Integration
- Implement Zoho Mail OAuth flow
- Build Zoho Mail API client
- Implement Outlook OAuth flow
- Build Outlook API client
- Create email parsing service
- Build email poller worker
- Add email integration endpoints
- Write email integration tests

### Week 7: Recurring Tasks (pg_cron)
- Install pg_cron extension on PostgreSQL
- Add recurring task database fields (migration)
- Create `calculate_next_occurrence()` SQL function
- Create `generate_recurring_tasks()` SQL function
- Create `recurring_task_log` table
- Schedule pg_cron job (every hour)
- Add recurring task management API endpoints
- Write recurring task SQL tests
- Test pg_cron job execution

### Week 8: RBAC & Testing
- Finalize all RBAC permissions
- Write comprehensive unit tests
- Write integration tests
- Fix bugs from testing

### Week 9: Docker & Deployment
- Create Dockerfiles
- Set up docker-compose
- Configure Keycloak realm
- Test full stack deployment
- Write deployment documentation

---

## 13. Open Questions

**Sunny, I need your input on these decisions:**

1. **PostgreSQL Hosting:**
   - Self-hosted (Docker) for development/staging?
   - Cloud provider (AWS RDS, GCP Cloud SQL) for production?

2. **Keycloak Configuration:**
   - Should I create a default Keycloak realm configuration script?
   - What roles/groups should be pre-configured in Keycloak?

3. **Email Integration Priority:**
   - Should I implement Zoho Mail first, then Outlook? Or both in parallel?

4. **Recurring Tasks (pg_cron):**
   - Should the pg_cron job run hourly (current plan) or more frequently (e.g., every 15 minutes)?
   - Should we notify users when recurring tasks are generated?
   - Should we create a UI to monitor pg_cron job status?

5. **Error Monitoring:**
   - Do you want Sentry integration for production error tracking?

6. **API Rate Limiting:**
   - What rate limits should be set for public endpoints?
   - Should authenticated users have higher limits?

---

## Conclusion

This backend architecture is designed to:

✅ **Support the current frontend** - All expected endpoints are specified
✅ **Follow PostgreSQL best practices** - Based on Architecture Review 2.0
✅ **Scale efficiently** - Connection pooling, caching, background workers
✅ **Maintain security** - RBAC, token encryption, input validation
✅ **Enable testing** - Clean architecture with dependency injection
✅ **Deploy easily** - Docker Compose for self-hosting

**Next Step:** Get Sunny's approval and start Week 1 implementation.

---

**Document Status:** ✅ Ready for Review
**Created:** October 15, 2025
**Next Review:** After Sunny's approval
