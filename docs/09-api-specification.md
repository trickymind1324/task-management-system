# FRD-09: API Specification

**Feature:** RESTful API Endpoints & Contracts

**Version:** 1.0

**Last Updated:** October 6, 2025

**Status:** Draft

**Priority:** P1 (Production Phase)

---

## Overview

This document defines the RESTful API specification for Project Synapse. While the prototype uses a mock data store, this specification will guide the Go backend implementation in the production phase.

**Base URL (Production):** `https://api.synapse.example.com/v1`

**Base URL (Prototype):** Mock store mimics these endpoints

## API Design Principles

1. **RESTful** - Resource-based URLs, HTTP verbs for operations
2. **Consistent** - Standardized response format across all endpoints
3. **Versioned** - `/v1` in URL for future compatibility
4. **Paginated** - List endpoints support pagination
5. **Filterable** - Query parameters for filtering and sorting
6. **Secure** - JWT Bearer token authentication
7. **Documented** - OpenAPI/Swagger specification

## Response Format

### Success Response

```typescript
interface APIResponse<T> {
  success: true;
  data: T;
  metadata?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
  timestamp: string;              // ISO 8601
}
```

### Error Response

```typescript
interface APIErrorResponse {
  success: false;
  error: {
    code: string;                 // Machine-readable error code
    message: string;              // Human-readable error message
    details?: any;                // Additional context
  };
  timestamp: string;
}
```

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Task title is required",
    "details": {
      "field": "title",
      "rule": "required"
    }
  },
  "timestamp": "2025-10-06T10:30:00Z"
}
```

## Authentication

All endpoints (except `/auth/*`) require Bearer token authentication:

```
Authorization: Bearer <JWT_TOKEN>
```

## Tasks API

### GET /tasks

Get list of tasks with optional filters.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| status | string[] | Filter by status | `?status=To Do,In Progress` |
| priority | string[] | Filter by priority | `?priority=High,Urgent` |
| assignee | string[] | Filter by assignee ID | `?assignee=user-001` |
| department | string | Filter by department | `?department=dept-001` |
| project | string | Filter by project | `?project=proj-001` |
| due_date_from | date | Due date range start | `?due_date_from=2025-10-01` |
| due_date_to | date | Due date range end | `?due_date_to=2025-10-31` |
| search | string | Search in title/description | `?search=landing page` |
| sort | string | Sort field | `?sort=-due_date` (- for desc) |
| page | number | Page number | `?page=1` |
| per_page | number | Items per page (max 100) | `?per_page=20` |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "task_id": "task-001",
      "title": "Design landing page mockups",
      "status": "In Progress",
      "priority": "High",
      ...
    }
  ],
  "metadata": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  },
  "timestamp": "2025-10-06T10:30:00Z"
}
```

### GET /tasks/:id

Get single task by ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "task_id": "task-001",
    "title": "Design landing page mockups",
    "description": "...",
    "status": "In Progress",
    ...
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task with ID 'task-001' not found"
  }
}
```

### POST /tasks

Create a new task.

**Request Body:**
```json
{
  "title": "New task title",
  "description": "Task description in markdown",
  "priority": "High",
  "status": "To Do",
  "assignees": ["user-001", "user-002"],
  "due_date": "2025-10-20T00:00:00Z",
  "department": "dept-001",
  "project": "proj-001",
  "tags": ["design", "ui"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "task_id": "task-045",
    "title": "New task title",
    "creation_date": "2025-10-06T10:30:00Z",
    ...
  }
}
```

### PUT /tasks/:id

Update existing task (full update).

**Request Body:** Same as POST (all fields)

**Response (200 OK):** Updated task object

### PATCH /tasks/:id

Partial update of task.

**Request Body:**
```json
{
  "status": "Done",
  "completion_date": "2025-10-06T10:30:00Z"
}
```

**Response (200 OK):** Updated task object

### DELETE /tasks/:id

Delete a task.

**Response (204 No Content):** Empty body

## Users API

### GET /users

Get all users (admin only) or team users (managers).

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "user-001",
      "email": "Bharath@example.com",
      "full_name": "Bharath",
      "role": "Manager",
      "department": "dept-001",
      ...
    }
  ]
}
```

### GET /users/:id

Get user by ID.

### GET /users/me

Get current authenticated user.

## Departments API

### GET /departments

Get all departments.

### GET /departments/:id

Get department by ID.

### GET /departments/:id/tasks

Get all tasks in a department.

## Projects API

### GET /projects

Get all projects.

### GET /projects/:id

Get project by ID.

### GET /projects/:id/tasks

Get all tasks in a project.

### POST /projects

Create new project.

### PATCH /projects/:id

Update project.

## Comments API

### GET /tasks/:task_id/comments

Get comments for a task.

### POST /tasks/:task_id/comments

Add comment to task.

**Request:**
```json
{
  "content": "Great work on this!"
}
```

### PATCH /comments/:id

Edit comment.

### DELETE /comments/:id

Delete comment.

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email exists) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## Prototype Implementation

For the prototype, create a file that mimics these endpoints:

```typescript
// lib/api/mock-api.ts

export const mockAPI = {
  tasks: {
    getAll: async (filters?: TaskFilters) => {
      return mockDataStore.getTasks(filters);
    },
    getById: async (id: string) => {
      return mockDataStore.getTaskById(id);
    },
    create: async (data: CreateTaskDTO) => {
      return mockDataStore.createTask(data);
    },
    update: async (id: string, data: Partial<Task>) => {
      return mockDataStore.updateTask(id, data);
    },
    delete: async (id: string) => {
      return mockDataStore.deleteTask(id);
    },
  },
  // ... other resources
};
```

## Production Go Implementation

```go
// Example Go handler structure
package handlers

func (h *TaskHandler) GetTasks(c *gin.Context) {
    // Parse query params
    filters := parseTaskFilters(c)

    // Get tasks from service
    tasks, total, err := h.taskService.GetTasks(filters)
    if err != nil {
        c.JSON(500, ErrorResponse{
            Success: false,
            Error: Error{
                Code: "INTERNAL_ERROR",
                Message: err.Error(),
            },
        })
        return
    }

    // Return success response
    c.JSON(200, SuccessResponse{
        Success: true,
        Data: tasks,
        Metadata: Metadata{
            Page: filters.Page,
            PerPage: filters.PerPage,
            Total: total,
            TotalPages: (total + filters.PerPage - 1) / filters.PerPage,
        },
    })
}
```

## Acceptance Criteria

- [ ] All endpoints documented with request/response examples
- [ ] Error codes and HTTP status codes defined
- [ ] Prototype mock API matches specification
- [ ] Production Go API implements specification
- [ ] OpenAPI/Swagger spec generated (production)
- [ ] API testing suite covers all endpoints

## Related Documents

- [01 - Core Data Models](./01-core-data-models.md)
- [03 - Authentication & Authorization](./03-authentication-authorization.md)
- [10 - Prototype Specifications](./10-prototype-specifications.md)
