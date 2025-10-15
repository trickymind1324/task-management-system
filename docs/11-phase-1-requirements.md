# FRD-11: Phase 1 Production MVP Requirements

**Version:** 1.2
**Last Updated:** October 13, 2025
**Status:** In Progress

---

## Overview

Phase 1 transforms the validated prototype into a production-ready application with real backend, authentication, email integration, scheduled tasks, and enterprise-grade RBAC.

**Objective:** Deliver a fully functional, production-ready task management system with all features from the prototype plus enterprise requirements.

---

## Phase 0 vs Phase 1

### Phase 0: Prototype (COMPLETE ✅)
- Mock API (json-server)
- Mock authentication (email-only login)
- In-memory data storage
- Basic task CRUD operations
- Dashboard UI (List, Board, Calendar views)
- 30+ sample tasks for demonstration
- UX validation completed

### Phase 1: Production MVP (IN PROGRESS 🚧)
Everything from prototype PLUS:
- **Real Go backend** with PostgreSQL
- **JWT authentication** with refresh tokens
- **Email integration** (Zoho Mail primary, Outlook secondary)
- **Scheduled/recurring tasks** with cron
- **RBAC** with Zoho + Keycloak
- **Production infrastructure** (Docker, CI/CD)
- **Real database** with persistence

---

## Core Requirements

### 1. Go Backend with Real APIs

#### 1.1 Backend Framework
- **Language:** Go 1.21+
- **Framework:** Gin (web framework)
- **ORM:** GORM v2
- **Database:** PostgreSQL 15+

#### 1.2 API Endpoints (Full CRUD)
All endpoints from prototype, now with real implementation:

```
POST   /api/v1/auth/login              # JWT login
POST   /api/v1/auth/refresh            # Token refresh
POST   /api/v1/auth/logout             # Invalidate tokens
GET    /api/v1/auth/me                 # Current user info

GET    /api/v1/tasks                   # List tasks (with filters)
POST   /api/v1/tasks                   # Create task
GET    /api/v1/tasks/:id               # Get task
PUT    /api/v1/tasks/:id               # Update task
DELETE /api/v1/tasks/:id               # Delete task
POST   /api/v1/tasks/:id/comments      # Add comment

GET    /api/v1/users                   # List users
GET    /api/v1/users/:id               # Get user
PUT    /api/v1/users/:id               # Update user

GET    /api/v1/departments             # List departments
GET    /api/v1/departments/:id         # Get department

GET    /api/v1/projects                # List projects
GET    /api/v1/projects/:id            # Get project
```

#### 1.3 Database Schema
PostgreSQL with:
- UUID primary keys
- JSONB for flexible metadata
- Indexes on frequently queried fields
- Foreign key constraints
- Cascading deletes where appropriate

See `docs/01-core-data-models.md` for complete schema.

---

### 2. Email Integration

#### 2.1 Supported Email Providers
**Priority 1:** Zoho Mail (Primary integration)
**Priority 2:** Outlook (Microsoft 365 - Secondary)

#### 2.2 OAuth 2.0 Authentication

**Zoho Mail (PRIMARY):**
```go
// OAuth 2.0 scopes
- ZohoMail.messages.READ
- ZohoMail.accounts.READ
- ZohoMail.folders.READ
```

**API Endpoints:**
```
GET https://mail.zoho.com/api/accounts/{accountId}/messages
GET https://mail.zoho.com/api/accounts/{accountId}/folders
GET https://mail.zoho.com/api/accounts/{accountId}/messages/{messageId}
```

**Outlook (SECONDARY):**
```go
// Microsoft Graph API scopes
- Mail.Read
- Mail.ReadWrite
```

#### 2.3 Email Parsing Features
- **Subject line extraction** → Task title
- **Body text extraction** → Task description
- **Due date detection** (e.g., "by Friday", "deadline: Oct 20")
- **Priority keywords** ("urgent", "high priority")
- **Assignee detection** (@mentions or email addresses)
- **Attachment handling** (save to file storage, link to task)

#### 2.4 Email Monitoring
- **Polling interval:** Every 5 minutes
- **Filters:**
  - Unread emails only
  - Specific labels/folders (e.g., "Tasks", "Action Items")
  - Sender whitelist (optional)
- **Task creation:**
  - Create task automatically or prompt for confirmation
  - Set `source: 'Email'` in task metadata
  - Store original email ID for reference

#### 2.5 User Flow
1. User connects email account via OAuth
2. System polls for new emails matching filters
3. Parse email content using NLP (simple regex for Phase 1)
4. Create task with extracted information
5. Mark email as read (optional)
6. Send notification to user about new task

#### 2.6 API Endpoints
```
# Zoho Mail (PRIMARY)
POST   /api/v1/integrations/zoho-mail/auth           # Start OAuth flow
GET    /api/v1/integrations/zoho-mail/callback       # OAuth callback
POST   /api/v1/integrations/zoho-mail/disconnect     # Remove integration
GET    /api/v1/integrations/zoho-mail/status         # Check connection
POST   /api/v1/integrations/zoho-mail/sync           # Manual sync trigger

# Outlook (SECONDARY)
POST   /api/v1/integrations/outlook/auth             # Start OAuth flow
GET    /api/v1/integrations/outlook/callback         # OAuth callback
POST   /api/v1/integrations/outlook/disconnect       # Remove integration
GET    /api/v1/integrations/outlook/status           # Check connection
```

---

### 3. Scheduled & Recurring Tasks

#### 3.1 Task Recurrence Patterns
Support standard recurrence patterns:

```typescript
interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;           // e.g., every 2 weeks = {frequency: 'weekly', interval: 2}
  daysOfWeek?: number[];      // [0-6] for Sunday-Saturday (weekly only)
  dayOfMonth?: number;        // 1-31 (monthly only)
  monthOfYear?: number;       // 1-12 (yearly only)
  endDate?: Date;             // Optional end date
  occurrences?: number;       // OR maximum number of occurrences
}

interface RecurringTask extends Task {
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern;
  parent_task_id?: string;    // Link to original recurring task
  next_occurrence?: Date;     // When to generate next instance
}
```

#### 3.2 Recurrence Examples
- **Daily standup:** Every weekday at 9 AM
- **Weekly report:** Every Friday
- **Monthly review:** First Monday of each month
- **Quarterly planning:** Every 3 months

#### 3.3 Task Generation
- **Cron job** runs every hour (or as configured)
- Checks for recurring tasks with `next_occurrence` <= now
- Generates new task instance:
  - Copy title, description, assignees, priority
  - Set new `due_date` based on pattern
  - Link to parent with `parent_task_id`
  - Mark `source: 'Recurring'`
- Update parent's `next_occurrence`

#### 3.4 User Interface
**Create Recurring Task:**
- Checkbox: "Make this a recurring task"
- Dropdown: Frequency (Daily/Weekly/Monthly/Yearly)
- Input: Interval (e.g., "Every 2 weeks")
- Days of week selector (for weekly)
- End condition:
  - Never
  - On specific date
  - After N occurrences

**Manage Recurring Tasks:**
- View all instances in task list
- Badge indicator for recurring tasks
- Edit pattern (affects future instances only)
- Stop recurrence
- Skip next occurrence (mark as skipped without deleting)
- Skip exceptions UI (select specific dates to skip)

#### 3.5 Database Schema Addition
```sql
ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN recurrence_pattern JSONB;
ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN next_occurrence TIMESTAMP;
ALTER TABLE tasks ADD COLUMN skip_dates JSONB;  -- Array of dates to skip

CREATE INDEX idx_tasks_next_occurrence ON tasks(next_occurrence)
  WHERE is_recurring = TRUE AND next_occurrence IS NOT NULL;
```

**Skip Dates Format:**
```json
{
  "skip_dates": ["2025-12-25", "2026-01-01", "2026-07-04"]
}
```

---

### 4. Role-Based Access Control (RBAC)

#### 4.1 Authentication Providers
**Primary:** Keycloak (self-hosted identity management)
**Secondary:** Zoho authentication (OAuth integration)

**Implementation Strategy:** Start with Keycloak as the primary authentication system, then add Zoho authentication as an additional OAuth provider option.

#### 4.2 Role Definitions

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Admin** | Full system access, user management, settings | System administrators |
| **Manager** | Manage team tasks, assign tasks, view reports | Project/Department managers |
| **Member** | Create/edit own tasks, view team tasks | Individual contributors |
| **Viewer** | Read-only access to tasks | Stakeholders, clients |

#### 4.3 Permission Matrix

| Action | Admin | Manager | Member | Viewer |
|--------|-------|---------|--------|--------|
| Create tasks | ✅ | ✅ | ✅ | ❌ |
| Edit own tasks | ✅ | ✅ | ✅ | ❌ |
| Edit team tasks | ✅ | ✅ | ❌ | ❌ |
| Edit any task | ✅ | ❌ | ❌ | ❌ |
| Delete own tasks | ✅ | ✅ | ✅ | ❌ |
| Delete team tasks | ✅ | ✅ | ❌ | ❌ |
| Delete any task | ✅ | ❌ | ❌ | ❌ |
| View own tasks | ✅ | ✅ | ✅ | ✅ |
| View team tasks | ✅ | ✅ | ✅ | ✅ |
| View all tasks | ✅ | ❌ | ❌ | ❌ |
| Assign tasks to others | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ❌ | ❌ |
| Export data | ✅ | ✅ | ❌ | ❌ |

#### 4.4 Zoho Integration

**OAuth 2.0 Flow:**
```
1. User clicks "Login with Zoho"
2. Redirect to Zoho OAuth authorization URL
3. User authorizes app
4. Zoho redirects back with auth code
5. Exchange code for access token
6. Fetch user profile from Zoho API
7. Create/update user in local database
8. Issue JWT token for session
```

**Zoho API Endpoints:**
```
GET https://accounts.zoho.com/oauth/v2/auth        # Authorization
POST https://accounts.zoho.com/oauth/v2/token      # Token exchange
GET https://accounts.zoho.com/oauth/user/info      # User profile
```

**User Mapping:**
```go
type ZohoUser struct {
    Email     string `json:"Email"`
    FirstName string `json:"First_Name"`
    LastName  string `json:"Last_Name"`
    ZohoID    string `json:"ZUID"`
}

// Map to local User
func (zu *ZohoUser) ToUser() *User {
    return &User{
        Email:    zu.Email,
        FullName: zu.FirstName + " " + zu.LastName,
        ZohoID:   zu.ZohoID,
        Role:     "Member", // Default role
    }
}
```

#### 4.5 Keycloak Integration

**Setup:**
1. Deploy Keycloak instance (Docker)
2. Create realm: "synapse"
3. Configure client: "synapse-frontend"
4. Define roles: Admin, Manager, Member, Viewer
5. Enable OAuth 2.0 / OpenID Connect

**OIDC Flow:**
```
1. User clicks "Login with Keycloak"
2. Redirect to Keycloak login page
3. User authenticates
4. Keycloak redirects with ID token + access token
5. Verify JWT signature
6. Extract user info and roles from token
7. Create/update user in local database
8. Issue application JWT
```

**Keycloak Configuration:**
```json
{
  "realm": "synapse",
  "auth-server-url": "https://keycloak.example.com/auth",
  "ssl-required": "external",
  "resource": "synapse-frontend",
  "public-client": true,
  "confidential-port": 0
}
```

#### 4.6 JWT Token Structure
```go
type JWTClaims struct {
    UserID       string   `json:"user_id"`
    Email        string   `json:"email"`
    Role         string   `json:"role"`
    DepartmentID string   `json:"department_id,omitempty"`
    Permissions  []string `json:"permissions"`
    jwt.StandardClaims
}
```

#### 4.7 Permission Enforcement
**Backend Middleware:**
```go
// Require authentication
func AuthRequired() gin.HandlerFunc { ... }

// Require specific role
func RoleRequired(roles ...string) gin.HandlerFunc { ... }

// Require specific permission
func PermissionRequired(permissions ...string) gin.HandlerFunc { ... }

// Example usage
router.PUT("/tasks/:id",
    AuthRequired(),
    PermissionRequired("tasks.edit"),
    UpdateTask)
```

**Frontend:**
```tsx
// Hide UI elements based on permissions
{hasPermission('tasks.delete') && (
  <button onClick={deleteTask}>Delete</button>
)}

// Redirect if unauthorized
if (!hasRole('Admin', 'Manager')) {
  router.push('/unauthorized');
}
```

---

### 5. Infrastructure Requirements

#### 5.1 Docker Containerization

**Deployment Strategy:** Self-hosted with Docker (no cloud deployment)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: synapse
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

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
    command: start
    depends_on:
      - postgres
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://synapse:${DB_PASSWORD}@postgres:5432/synapse
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_REALM: synapse
    depends_on:
      - postgres
      - redis
      - keycloak
    restart: unless-stopped

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8080/api/v1
      NEXT_PUBLIC_KEYCLOAK_URL: ${KEYCLOAK_HOSTNAME}
      NEXT_PUBLIC_KEYCLOAK_REALM: synapse
      NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: synapse-frontend
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
      - keycloak
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**Deployment Notes:**
- All services dockerized for self-hosting
- No cloud provider dependencies
- Keycloak included in stack for authentication
- Nginx for reverse proxy and SSL termination
- Persistent volumes for data storage
- Auto-restart policies for reliability

#### 5.2 CI/CD Pipeline
**GitHub Actions:**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - run: cd backend && go test ./...

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci && npm test

  build-and-deploy:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: docker-compose build
      - run: docker-compose push
      - run: ./deploy.sh staging
```

#### 5.3 Monitoring & Logging (Self-Hosted)
- **Application logs:** Structured JSON logs (file-based)
- **Error tracking:** Sentry (self-hosted option) or simple file logging
- **Metrics:** Prometheus + Grafana (dockerized)
- **Uptime monitoring:** Simple health check endpoints
- **Log aggregation:** Loki + Promtail (lightweight alternative to ELK)

**Optional Monitoring Stack:**
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yml:/etc/promtail/config.yml
```

---

## Acceptance Criteria

### Backend
- [ ] All API endpoints functional and tested
- [ ] PostgreSQL database deployed with schema
- [ ] JWT authentication with refresh tokens
- [ ] 80%+ test coverage
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Error handling and logging implemented

### Email Integration
- [ ] Zoho Mail OAuth flow working (PRIMARY)
- [ ] Zoho Mail email parsing extracting tasks correctly
- [ ] Outlook OAuth flow working (SECONDARY)
- [ ] Email parsing working for both providers
- [ ] Attachments saved and linked to tasks
- [ ] Background polling job running (5 min intervals)
- [ ] UI for connecting/disconnecting email accounts
- [ ] Email provider selection in settings

### Recurring Tasks
- [ ] Cron job generating task instances
- [ ] All recurrence patterns supported
- [ ] UI for creating recurring tasks
- [ ] Editing pattern affects future instances only
- [ ] Stopping recurrence works correctly

### RBAC
- [ ] Keycloak authentication integrated (PRIMARY)
- [ ] Zoho authentication integrated (SECONDARY - optional OAuth provider)
- [ ] All 4 roles defined and enforced in Keycloak
- [ ] Permission checks on all endpoints
- [ ] Frontend UI adapts based on user role
- [ ] Admin panel for user management (via Keycloak admin console)

### Infrastructure
- [ ] Docker Compose setup working (all services)
- [ ] Keycloak container running and configured
- [ ] CI/CD pipeline running (GitHub Actions)
- [ ] Self-hosted deployment working
- [ ] Monitoring stack deployed (Prometheus + Grafana)
- [ ] Database backups automated (local backups)
- [ ] SSL certificates configured (Let's Encrypt or self-signed)

### Frontend
- [ ] All prototype features migrated
- [ ] Email connection UI
- [ ] Recurring task creation UI
- [ ] Role-based UI elements
- [ ] Production build optimized

---

## Timeline Estimate

| Component | Estimated Time | Dependencies |
|-----------|----------------|--------------|
| Go Backend Setup | 1 week | None |
| PostgreSQL Schema | 3 days | Backend |
| API Endpoints | 2 weeks | Database |
| JWT Auth | 1 week | Backend |
| Keycloak Setup & Integration | 1 week | Backend |
| Zoho Mail Integration | 2 weeks | Auth |
| Recurring Tasks (with skip dates) | 1.5 weeks | Backend |
| Zoho OAuth (optional) | 3 days | Keycloak |
| Frontend Migration | 2 weeks | API |
| Docker Compose Setup | 1 week | All services |
| Monitoring Stack | 3 days | Docker |
| Testing & QA | 2 weeks | All |

**Total Estimated Time:** 10-12 weeks (2.5-3 months)

---

## Success Metrics

- **Uptime:** 99.5%+ in staging
- **API Response Time:** <200ms p95
- **Email Processing:** <5 min from receipt to task creation
- **User Adoption:** 80%+ of team using email integration
- **Test Coverage:** 80%+ backend, 70%+ frontend
- **Zero Critical Bugs:** In production for 2 weeks

---

## Related Documents

- [FRD-01: Core Data Models](./01-core-data-models.md)
- [FRD-03: Authentication & Authorization](./03-authentication-authorization.md)
- [FRD-05: Email Integration](./05-email-integration.md)
- [FRD-09: API Specification](./09-api-specification.md)
- [Backend Architecture](../backend/ARCHITECTURE.md)
- [Frontend CLAUDE.md](../frontend/CLAUDE.md)

---

## Change Log

**v1.2 - October 13, 2025**
- **Authentication:** Changed to Keycloak PRIMARY, Zoho SECONDARY (answers from Sunny)
- **Email Integration:** Confirmed Zoho Mail as primary (no special parsing requirements)
- **Recurring Tasks:** Added skip dates/exceptions support
- **Infrastructure:** Updated for self-hosted deployment (no cloud provider)
- **Monitoring:** Added self-hosted monitoring stack options
- Updated docker-compose with Keycloak container
- Updated timeline estimates

**v1.1 - October 13, 2025**
- Updated email integration to prioritize Zoho Mail as primary provider
- Updated API endpoints to reflect Zoho Mail integration
- Updated acceptance criteria and dependencies

**v1.0 - October 13, 2025**
- Initial Phase 1 requirements document
- Defined all production MVP features
- Added email integration specifications (Gmail + Outlook)
- Added recurring tasks specifications
- Added RBAC with Zoho and Keycloak
- Added infrastructure requirements

---

**Status:** IN PROGRESS
**Target Completion:** Q1 2026
**Owner:** Sunny + Development Team
