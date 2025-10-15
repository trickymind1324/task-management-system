# Phase 1: Production MVP Roadmap

**Project:** Synapse Task Management System
**Timeline:** Q4 2025 - Q1 2026 (10-12 weeks)
**Status:** IN PROGRESS 🚧

---

## Overview

Phase 1 transforms the validated UX prototype into a production-ready application with enterprise features.

### What Changed: Prototype → Phase 1

| Feature | Prototype (Phase 0) | Phase 1 Production |
|---------|---------------------|-------------------|
| **Backend** | json-server (mock) | Go + PostgreSQL |
| **Authentication** | Email-only (mock) | JWT + OAuth (Zoho/Keycloak) |
| **Data Storage** | In-memory (db.json) | PostgreSQL with persistence |
| **Task Creation** | GUI only | GUI + Email + Recurring |
| **Access Control** | None | Full RBAC (4 roles) |
| **Email Integration** | ❌ Not available | ✅ Zoho Mail + Outlook |
| **Recurring Tasks** | ❌ Not available | ✅ Full recurrence patterns |
| **Deployment** | Local dev only | Docker + CI/CD + Staging |

---

## Phase 1 Features

### 1. ✅ Production Frontend (COMPLETE)
- [x] Next.js 15 with TypeScript
- [x] Zustand state management
- [x] API client with error handling
- [x] Authentication system
- [x] Dashboard layout (Header + Sidebar)
- [x] Login page
- [ ] Complete task management UI
  - [ ] TaskList view
  - [ ] TaskBoard (Kanban)
  - [ ] TaskCalendar
  - [ ] Task detail panel
  - [ ] Create/edit task modal

### 2. Go Backend with Real APIs
- [ ] Gin framework setup
- [ ] PostgreSQL database with GORM
- [ ] RESTful API endpoints
  - [ ] Tasks (CRUD)
  - [ ] Users (CRUD)
  - [ ] Departments (Read)
  - [ ] Projects (CRUD)
  - [ ] Comments (Create, Read)
- [ ] JWT authentication with refresh tokens
- [ ] API documentation (Swagger)
- [ ] Unit tests (80%+ coverage)

### 3. Email Integration
- [ ] **Zoho Mail Integration**
  - [ ] OAuth 2.0 flow
  - [ ] Email polling (every 5 min)
  - [ ] Subject → Task title
  - [ ] Body → Task description
  - [ ] Due date detection
  - [ ] Attachment handling
- [ ] **Outlook Integration**
  - [ ] Microsoft Graph OAuth
  - [ ] Same parsing features as Zoho Mail
- [ ] **UI Components**
  - [ ] Connect email account button
  - [ ] Email account settings
  - [ ] Email-to-task preview/confirmation

### 4. Scheduled & Recurring Tasks
- [ ] **Recurrence Patterns**
  - [ ] Daily (every N days)
  - [ ] Weekly (specific days of week)
  - [ ] Monthly (day of month)
  - [ ] Yearly (specific date)
- [ ] **Task Generation**
  - [ ] Cron job (runs hourly)
  - [ ] Auto-generate next instance
  - [ ] Link to parent task
- [ ] **UI Features**
  - [ ] "Make recurring" checkbox
  - [ ] Frequency selector
  - [ ] End condition (never/date/count)
  - [ ] View all instances
  - [ ] Edit recurrence pattern

### 5. Role-Based Access Control (RBAC)
- [ ] **Roles**
  - [ ] Admin (full access)
  - [ ] Manager (team management)
  - [ ] Member (own tasks + view team)
  - [ ] Viewer (read-only)
- [ ] **Authentication Providers**
  - [ ] Zoho OAuth integration
  - [ ] Keycloak OIDC integration
- [ ] **Permission Enforcement**
  - [ ] Backend middleware
  - [ ] Frontend UI adaptation
  - [ ] API endpoint protection
- [ ] **Admin Panel**
  - [ ] User management
  - [ ] Role assignment
  - [ ] Permission auditing

### 6. Infrastructure
- [ ] **Docker**
  - [ ] docker-compose.yml
  - [ ] Backend Dockerfile
  - [ ] Frontend Dockerfile
  - [ ] PostgreSQL container
  - [ ] Redis container (for sessions)
- [ ] **CI/CD**
  - [ ] GitHub Actions workflow
  - [ ] Automated testing
  - [ ] Build and push images
  - [ ] Deploy to staging
- [ ] **Monitoring**
  - [ ] Application logs (structured JSON)
  - [ ] Error tracking (Sentry)
  - [ ] Uptime monitoring
  - [ ] Basic metrics dashboard

---

## Timeline Breakdown

### Week 1-2: Backend Foundation
- Set up Go project structure
- PostgreSQL schema and migrations
- GORM models and basic CRUD
- JWT authentication

### Week 3-4: API Development
- Complete all API endpoints
- Request validation
- Error handling
- Unit tests
- API documentation

### Week 5-6: Email Integration
- Zoho Mail OAuth flow
- Outlook OAuth flow
- Email parsing logic
- Background polling job
- Attachment storage

### Week 7-8: Recurring Tasks & RBAC
- Recurrence pattern implementation
- Cron job for task generation
- Zoho authentication
- Keycloak setup
- Permission system

### Week 9-10: Frontend Completion
- Task management UI components
- Email integration UI
- Recurring task UI
- Role-based UI elements
- End-to-end testing

### Week 11-12: Infrastructure & Polish
- Docker containerization
- CI/CD pipeline
- Staging deployment
- Monitoring setup
- Bug fixes and optimization

---

## Success Criteria

### Technical
- [ ] All API endpoints tested and documented
- [ ] 80%+ backend test coverage
- [ ] 70%+ frontend test coverage
- [ ] API response time <200ms (p95)
- [ ] Zero critical security vulnerabilities
- [ ] Docker build succeeds
- [ ] CI/CD pipeline green

### Functional
- [ ] All prototype features work in production
- [ ] Email integration creates tasks correctly
- [ ] Recurring tasks generate on schedule
- [ ] All 4 roles have correct permissions
- [ ] OAuth flows work for both providers

### Business
- [ ] 99.5%+ uptime in staging for 2 weeks
- [ ] Zero data loss incidents
- [ ] Email-to-task latency <5 minutes
- [ ] Team can complete all workflows

---

## Dependencies

### External Services
- **PostgreSQL 15+** - Primary database
- **Redis 7** - Session caching
- **Zoho** - OAuth provider (primary)
- **Keycloak** - OAuth provider (self-hosted option)
- **Zoho Mail API** - Email integration
- **Microsoft Graph** - Email integration
- **Sentry** - Error tracking (optional)

### Team Requirements
- **Backend Developer** - Go expertise
- **Frontend Developer** - Next.js/React
- **DevOps** - Docker, CI/CD
- **QA** - Testing and validation

---

## Current Status

### ✅ Completed
- Prototype UX validation
- Production frontend foundation
  - Project setup
  - Authentication system
  - API client
  - Zustand stores
  - Dashboard layout
  - Login page

### 🚧 In Progress
- Frontend task management components

### ⏳ Not Started
- Go backend
- PostgreSQL database
- Email integration
- Recurring tasks
- RBAC implementation
- Infrastructure setup

---

## Next Immediate Steps

1. **Complete frontend task components** (1-2 weeks)
   - TaskList, TaskBoard, TaskCalendar
   - Task detail panel
   - Create/edit task modal

2. **Start Go backend** (Week 3)
   - Initialize project
   - Set up PostgreSQL
   - Create database schema
   - Implement JWT auth

3. **Parallel workstreams** (Week 4+)
   - Team 1: Backend API development
   - Team 2: Email integration
   - Team 3: RBAC setup

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth integration issues | High | Start early, test thoroughly, have backup plan |
| Email parsing complexity | Medium | Use simple regex for Phase 1, AI for Phase 2 |
| Performance with recurring tasks | Medium | Optimize cron job, use indexes, monitor metrics |
| RBAC implementation time | High | Use existing libraries, start with basic roles |
| Team bandwidth | High | Prioritize core features, defer nice-to-haves |

---

## Out of Scope (Phase 2+)

These features are NOT in Phase 1:
- ❌ NLP/AI task extraction
- ❌ Document parsing (PDF, DOCX)
- ❌ Knowledge graph (Neo4j)
- ❌ Analytics dashboard
- ❌ Real-time updates (WebSockets)
- ❌ Mobile app
- ❌ Third-party integrations (Slack, Jira)

---

## Documentation

- [Full Phase 1 Requirements](./docs/11-phase-1-requirements.md)
- [Development Phases](./docs/CLAUDE.md#development-phases)
- [Backend Architecture](./backend/ARCHITECTURE.md)
- [Frontend Migration Guide](./frontend/MIGRATION_GUIDE.md)
- [API Specification](./docs/09-api-specification.md)
- [Email Integration Spec](./docs/05-email-integration.md)

---

**Last Updated:** October 13, 2025
**Owner:** Sunny
**Team:** TBD
**Target Launch:** Q1 2026
