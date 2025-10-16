# Docker Setup Guide - Project Synapse

Complete guide for running the entire Task Management System with Docker.

---

## Quick Start (One Command)

```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** database on port 5432
- **Go Backend** API on port 8080
- **Next.js Frontend** on port 3000

Access the application at: http://localhost:3000

---

## Components

### 1. PostgreSQL Database
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: synapse
- **User**: synapse_user
- **Password**: synapse_password
- **Volume**: postgres_data (persists data)

### 2. Go Backend API
- **Build**: ./backend/Dockerfile
- **Port**: 8080
- **Health Check**: http://localhost:8080/health
- **API Base**: http://localhost:8080/api/v1

### 3. Next.js Frontend
- **Build**: ./prototype/Dockerfile
- **Port**: 3000
- **Mode**: Production build
- **Backend**: Automatically configured to use Go backend

---

## Commands

### Start all services
```bash
docker-compose up
```

### Start in background (detached)
```bash
docker-compose up -d
```

### Rebuild and start
```bash
docker-compose up --build
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ deletes database data)
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart a service
```bash
docker-compose restart backend
```

### Execute commands in running container
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U synapse_user -d synapse

# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh
```

---

## Development Workflow

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/trickymind1324/task-management-system.git
cd task-management-system

# Start services
docker-compose up --build
```

### 2. Database Management

**View tables:**
```bash
docker-compose exec postgres psql -U synapse_user -d synapse -c "\dt"
```

**Run SQL query:**
```bash
docker-compose exec postgres psql -U synapse_user -d synapse -c "SELECT * FROM users;"
```

**Access psql interactive shell:**
```bash
docker-compose exec postgres psql -U synapse_user -d synapse
```

**Backup database:**
```bash
docker-compose exec postgres pg_dump -U synapse_user synapse > backup.sql
```

**Restore database:**
```bash
cat backup.sql | docker-compose exec -T postgres psql -U synapse_user -d synapse
```

### 3. Backend Development

The backend code is **NOT** mounted as a volume (for production-like behavior). To update:

```bash
# Rebuild and restart
docker-compose up --build backend
```

### 4. Frontend Development

Same as backend - rebuild to see changes:

```bash
docker-compose up --build frontend
```

---

## Environment Variables

### Backend (.env)

Create `backend/.env` from `backend/.env.example`:

```env
DATABASE_URL=postgresql://synapse_user:synapse_password@postgres:5432/synapse?sslmode=disable
JWT_SECRET=your-production-secret-here
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=168h
PORT=8080
GIN_MODE=release
CORS_ORIGINS=http://localhost:3000
```

**Note**: Docker Compose will override these with environment variables defined in `docker-compose.yml`.

### Frontend (.env.local)

Create `prototype/.env.local`:

```env
NEXT_PUBLIC_USE_GO_BACKEND=true
NEXT_PUBLIC_GO_API_URL=http://localhost:8080/api/v1
```

---

## Default Users (Seed Data)

The database is pre-populated with test users (password: `password`):

| Email | Role | Department |
|-------|------|------------|
| raghu@example.com | Admin | - |
| bharath@example.com | Manager | Marketing |
| sunny@example.com | Member | Engineering |
| alex@example.com | Member | Marketing |
| priya@example.com | Manager | Finance |

---

## Health Checks

All services have health checks configured:

**PostgreSQL:**
```bash
docker-compose exec postgres pg_isready -U synapse_user -d synapse
```

**Backend:**
```bash
curl http://localhost:8080/health
```

**Check service status:**
```bash
docker-compose ps
```

---

## Troubleshooting

### Port Already in Use

If ports 3000, 5432, or 8080 are already in use:

**Option 1**: Stop conflicting services
```bash
# Stop json-server (if running)
lsof -ti:3001 | xargs kill

# Stop local postgres
sudo service postgresql stop
```

**Option 2**: Change ports in `docker-compose.yml`
```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Use 5433 instead of 5432
```

### Backend Won't Start

**Check logs:**
```bash
docker-compose logs backend
```

**Common issues:**
- Database not ready: Wait for PostgreSQL health check
- Missing environment variables: Check `.env` file
- Port conflict: Change PORT in docker-compose.yml

### Database Connection Failed

**Verify PostgreSQL is running:**
```bash
docker-compose ps postgres
```

**Test connection:**
```bash
docker-compose exec postgres psql -U synapse_user -d synapse -c "SELECT 1;"
```

### Frontend Build Fails

**Check Node.js version:**
```bash
docker-compose exec frontend node --version
```

**View build logs:**
```bash
docker-compose logs frontend
```

### Clear Everything and Start Fresh

```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove images
docker rmi task-management-backend task-management-frontend

# Rebuild from scratch
docker-compose up --build
```

---

## Production Deployment

### Security Checklist

- [ ] Change database password in docker-compose.yml
- [ ] Set strong JWT_SECRET
- [ ] Update CORS_ORIGINS to production domain
- [ ] Enable HTTPS (use reverse proxy like Nginx/Caddy)
- [ ] Remove seed data from migrations
- [ ] Set GIN_MODE=release
- [ ] Use Docker secrets for sensitive data
- [ ] Enable PostgreSQL SSL
- [ ] Set up automated backups
- [ ] Configure log aggregation

### Recommended docker-compose.prod.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: synapse
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal

  backend:
    build: ./backend
    restart: always
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/synapse?sslmode=require
      JWT_SECRET: ${JWT_SECRET}
      GIN_MODE: release
    networks:
      - internal
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.yourdomain.com`)"

  frontend:
    build: ./prototype
    restart: always
    environment:
      NEXT_PUBLIC_USE_GO_BACKEND: "true"
      NEXT_PUBLIC_GO_API_URL: https://api.yourdomain.com/api/v1
    networks:
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`app.yourdomain.com`)"

networks:
  internal:
    driver: bridge
  web:
    external: true

volumes:
  postgres_data:
```

### Using with Traefik (Reverse Proxy)

1. Install Traefik
2. Create external network: `docker network create web`
3. Use production compose file: `docker-compose -f docker-compose.prod.yml up -d`

---

## Performance Tuning

### PostgreSQL

```yaml
postgres:
  environment:
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
    POSTGRES_MAX_CONNECTIONS: 100
```

### Backend

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M
```

---

## Monitoring

### Resource Usage

```bash
docker stats
```

### Container Health

```bash
docker-compose ps
docker inspect synapse-postgres | grep -A 10 Health
```

### Disk Usage

```bash
docker system df
docker volume ls
```

---

## Backup and Restore

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U synapse_user synapse > "backup_${DATE}.sql"
echo "Backup created: backup_${DATE}.sql"
```

### Restore from Backup

```bash
cat backup_20251016_120000.sql | docker-compose exec -T postgres psql -U synapse_user -d synapse
```

---

## Next Steps

1. **Local Testing**: Start with `docker-compose up` and test all features
2. **CI/CD Integration**: Add Docker builds to GitHub Actions
3. **Production Deploy**: Use docker-compose.prod.yml with secrets
4. **Monitoring**: Add Prometheus + Grafana for metrics
5. **Logging**: Configure centralized logging (ELK stack or similar)

---

**Contact**: Sunny
**Last Updated**: October 16, 2025
**Version**: 1.0.0
