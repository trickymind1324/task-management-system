# Project Synapse - Backend

Production Go backend for Project Synapse intelligent task management system.

## Quick Links

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete architecture design (READ THIS FIRST!)
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines and best practices

## Current Status

🚧 **Not started** - Architecture design complete, ready for implementation

The prototype currently uses json-server as a mock API. This backend will replace it.

## Tech Stack

- **Language:** Go 1.21+
- **Framework:** Gin
- **Database:** PostgreSQL 15+
- **ORM:** GORM v2
- **Auth:** JWT (golang-jwt/jwt)
- **Cache:** Redis (sessions)
- **Graph DB:** Neo4j (Phase 2)

## Quick Start (Once Implemented)

```bash
# Setup database
docker run -d --name synapse-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=synapse \
  -p 5432:5432 postgres:15

# Install dependencies
go mod download

# Run migrations
go run cmd/migrate/main.go up

# Seed development data
go run cmd/seed/main.go --file=../prototype/db.json

# Start API server
go run cmd/api/main.go
```

## Architecture Overview

```
Frontend (Next.js) → API (Gin) → Service Layer → Repository → PostgreSQL
                                      ↓
                                  Redis (sessions)
                                      ↓
                                  Neo4j (Phase 2)
```

### Key Design Decisions

1. **Clean Architecture** - Handlers → Services → Repositories
2. **API-First** - Frontend already decoupled via API client
3. **Dual ID Strategy** - UUID (internal) + custom ID (external API)
4. **JWT Authentication** - Stateless with refresh tokens
5. **RBAC Authorization** - Role-based permissions
6. **Phase 2 Ready** - AI service integration points prepared

## Project Structure

```
backend/
├── cmd/
│   ├── api/main.go           # API server
│   ├── migrate/main.go       # Migrations
│   └── seed/main.go          # Database seeder
├── internal/
│   ├── handlers/             # HTTP handlers
│   ├── services/             # Business logic
│   ├── repositories/         # Data access
│   ├── middleware/           # Auth, CORS, logging
│   ├── models/               # Domain models
│   └── dto/                  # Request/response DTOs
├── migrations/               # SQL migrations
├── ARCHITECTURE.md           # Complete design doc
├── CLAUDE.md                 # Dev guidelines
└── README.md                 # This file
```

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
```

### Tasks
```
GET    /api/v1/tasks          # List with filters
POST   /api/v1/tasks          # Create
GET    /api/v1/tasks/:id      # Get by ID
PUT    /api/v1/tasks/:id      # Update
DELETE /api/v1/tasks/:id      # Delete
```

### Users, Departments, Projects
```
GET    /api/v1/users
GET    /api/v1/departments
GET    /api/v1/projects
```

Full API specification: [docs/09-api-specification.md](../docs/09-api-specification.md)

## Migration from Prototype

The frontend is already API-ready. To switch to the Go backend:

1. Build and run Go backend on port 8080
2. Update frontend `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   ```
3. Restart Next.js - **no code changes needed!**

## Database Schema

- **users** - User accounts with bcrypt passwords
- **departments** - Organizational departments
- **projects** - Project groupings
- **tasks** - Main task entities
- **task_assignees** - Many-to-many task assignments
- **task_dependencies** - Task relationships
- **comments** - Task comments
- **sessions** - JWT refresh tokens

Full schema: [ARCHITECTURE.md#database-architecture](./ARCHITECTURE.md#2-database-architecture)

## Implementation Roadmap

### Phase 1: Core API (4 weeks)
- Week 1: Project setup, database, models
- Week 2: Authentication (JWT, sessions)
- Week 3: Task CRUD endpoints
- Week 4: Users, departments, projects

### Phase 2: Production Ready (2 weeks)
- Week 5: Testing, optimization, security
- Week 6: Deployment, frontend cutover

### Phase 3: AI Features (6 weeks)
- Weeks 7-8: NLP task extraction
- Weeks 9-10: Email integration
- Weeks 11-12: Document analysis

### Phase 4: Knowledge Graph (4 weeks)
- Weeks 13-16: Neo4j integration

## Development Workflow

```bash
# Run tests
go test ./...

# Run with hot reload (install air first)
air

# Format code
go fmt ./...

# Lint
golangci-lint run

# Build
go build -o synapse-api cmd/api/main.go
```

## Environment Variables

```env
# Server
PORT=8080
ENVIRONMENT=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=synapse

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGINS=http://localhost:3000
```

## Performance Targets

- API response time (p95): <200ms
- Database query time (p95): <50ms
- Concurrent users: 2000+
- Throughput: 1000 req/sec

## Security Features

- JWT authentication with refresh tokens
- Bcrypt password hashing (cost 12)
- RBAC authorization
- Input validation
- SQL injection prevention (GORM)
- Rate limiting
- CORS configuration
- Security headers
- HTTPS only (production)

## Next Steps

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) completely
2. Initialize Go module and project structure
3. Setup PostgreSQL database
4. Implement authentication first
5. Build task endpoints
6. Test with prototype frontend

## Contributing

See [CLAUDE.md](./CLAUDE.md) for:
- Code style guidelines
- Testing requirements
- Git workflow
- Pull request process

## Related Documentation

- [Root CLAUDE.md](../CLAUDE.md) - Project overview
- [Prototype](../prototype/) - Reference implementation
- [FRD-01](../docs/01-core-data-models.md) - Data models
- [FRD-09](../docs/09-api-specification.md) - API specification

---

**Status:** Architecture design complete, ready to start implementation

**Contact:** Sunny

**Last Updated:** October 13, 2025
