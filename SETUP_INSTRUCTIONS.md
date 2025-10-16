# Quick Setup Instructions for Full Stack Testing

Follow these steps to test the complete Go + PostgreSQL + Production Frontend integration.

## Step 1: Start and Configure PostgreSQL

```bash
# Start PostgreSQL service
sudo service postgresql start

# Create database and user as postgres superuser
sudo -u postgres psql << 'EOF'
CREATE DATABASE synapse;
CREATE USER synapse_user WITH PASSWORD 'synapse_password';
GRANT ALL PRIVILEGES ON DATABASE synapse TO synapse_user;
\c synapse
GRANT ALL ON SCHEMA public TO synapse_user;
\q
EOF

# Run database migrations
cd /home/sunny/task-management
PGPASSWORD=synapse_password psql -U synapse_user -d synapse -f backend/migrations/001_initial_schema.sql

# Verify setup
PGPASSWORD=synapse_password psql -U synapse_user -d synapse -c "\dt"
```

Expected output: Should show 8 tables (users, tasks, departments, projects, etc.)

## Step 2: Create Backend .env File

```bash
cd /home/sunny/task-management/backend

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://synapse_user:synapse_password@localhost:5432/synapse?sslmode=disable
JWT_SECRET=development-secret-key-change-in-production
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=168h
PORT=8080
GIN_MODE=debug
CORS_ORIGINS=http://localhost:3000,http://192.168.1.53:3000
EOF
```

## Step 3: Start Go Backend

```bash
cd /home/sunny/task-management/backend
go run main.go
```

Expected output:

```text
[GIN-debug] Listening and serving HTTP on :8080
```

Keep this terminal open. Open a new terminal for the next step.

## Step 4: Start Production Frontend

```bash
cd /home/sunny/task-management/frontend
PORT=3000 HOST=0.0.0.0 npm run dev
```

Expected output:

```text
> next dev --turbopack
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.1.53:3000
```

## Step 5: Test the Application

1. **Open browser**: <http://localhost:3000>

2. **Login with test user**:
   - Email: `sunny@example.com`
   - Password: `password`

3. **Test operations**:
   - View tasks (should see tasks from PostgreSQL)
   - Create a new task
   - Update task status
   - Delete a task
   - Add comments

## Verification Checklist

- [ ] PostgreSQL is running
- [ ] Database `synapse` exists with 8 tables
- [ ] Backend running on port 8080
- [ ] Frontend running on port 3000
- [ ] Can login with test user
- [ ] Can see and interact with tasks
- [ ] Changes persist after page refresh

## Test Users (from seed data)

| Email | Password | Role | Department |
|-------|----------|------|------------|
| raghu@example.com | password | Admin | - |
| bharath@example.com | password | Manager | Marketing |
| sunny@example.com | password | Member | Engineering |
| alex@example.com | password | Member | Marketing |
| priya@example.com | password | Manager | Finance |

## Automated API Testing

Once backend is running, you can run the automated test script:

```bash
cd /home/sunny/task-management
./test-api.sh
```

This will run 19 comprehensive tests covering:

- Authentication
- Task CRUD operations
- User management
- Department management
- Project management
- RBAC enforcement

## Troubleshooting

### PostgreSQL won't start

```bash
# Check PostgreSQL status
sudo service postgresql status

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Backend connection error

```bash
# Test database connection
PGPASSWORD=synapse_password psql -U synapse_user -d synapse -c "SELECT 1;"

# Check if backend can reach database
cd backend
go run main.go
# Look for connection errors in output
```

### Frontend connection issues

```bash
# Verify .env.local setting
cat frontend/.env.local

# Should show: NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Restart frontend after any .env.local changes
```

### Port already in use

```bash
# Kill processes on specific ports
lsof -ti:8080 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

## Quick Reset

If you need to start fresh:

```bash
# Stop all services
lsof -ti:8080 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS synapse;"
sudo -u postgres psql -c "CREATE DATABASE synapse;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE synapse TO synapse_user;"

# Re-run migrations
cd /home/sunny/task-management
PGPASSWORD=synapse_password psql -U synapse_user -d synapse -f backend/migrations/001_initial_schema.sql

# Restart services (Steps 3-4)
```

## Next Steps

After testing locally:

1. Run automated tests: `./test-api.sh`
2. Try Docker setup: `docker compose up --build`
3. Deploy to production environment

---

**Need Help?** Check:

- TESTING_GUIDE.md - Comprehensive testing documentation
- DOCKER_SETUP.md - Docker deployment guide
- INTEGRATION_STATUS.md - Project status overview
