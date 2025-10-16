# Testing Guide - Project Synapse

Complete guide for testing the frontend-backend integration.

---

## Prerequisites

Before testing, ensure you have:
- Docker and Docker Compose installed
- PostgreSQL 15+ (if testing without Docker)
- Go 1.21+ (if testing without Docker)
- Node.js 20+ and npm

---

## Option 1: Testing with Docker (Recommended)

### Step 1: Start Docker Daemon

Make sure Docker Desktop is running:
```bash
# Check if Docker is running
docker ps

# If not, start Docker Desktop
# (Platform-specific - usually through GUI)
```

### Step 2: Start the Full Stack

```bash
cd /home/sunny/task-management

# Start all services
docker compose up --build

# Or start in background
docker compose up -d --build
```

This will start:
- PostgreSQL on port 5432
- Go Backend on port 8080
- Next.js Frontend on port 3000

### Step 3: Wait for Services to be Ready

```bash
# Check all services are healthy
docker compose ps

# Wait for backend health check
curl http://localhost:8080/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected"
  }
}
```

### Step 4: Verify Database

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U synapse_user -d synapse

# Check tables
\dt

# Check seed data
SELECT email, full_name, role FROM users;

# Exit psql
\q
```

Expected: 5 users (raghu, bharath, sunny, alex, priya)

### Step 5: Test Frontend

Open browser: http://localhost:3000

You should see the Task Management dashboard.

---

## Option 2: Testing with Local PostgreSQL

If Docker isn't available, you can use local PostgreSQL:

### Step 1: Install and Start PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-15

# macOS
brew install postgresql@15

# Start PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql@15  # macOS
```

### Step 2: Create Database and User

```bash
# Access PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE synapse;
CREATE USER synapse_user WITH PASSWORD 'synapse_password';
GRANT ALL PRIVILEGES ON DATABASE synapse TO synapse_user;
\q
```

### Step 3: Run Migrations

```bash
# Run the migration script
psql -U synapse_user -d synapse -f backend/migrations/001_initial_schema.sql
```

### Step 4: Create Backend .env File

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://synapse_user:synapse_password@localhost:5432/synapse?sslmode=disable
JWT_SECRET=development-secret-key-change-in-production
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=168h
PORT=8080
GIN_MODE=debug
CORS_ORIGINS=http://localhost:3000,http://192.168.1.53:3000
```

### Step 5: Start Go Backend

```bash
# Terminal 1: Go Backend
cd backend
go run main.go
```

Expected output:
```
[GIN-debug] Listening and serving HTTP on :8080
```

### Step 6: Configure Frontend for Go Backend

```bash
cd prototype
```

Edit `.env.local`:
```env
NEXT_PUBLIC_USE_GO_BACKEND=true
NEXT_PUBLIC_GO_API_URL=http://localhost:8080/api/v1
```

### Step 7: Start Frontend

```bash
# Terminal 2: Frontend
cd prototype
npm run dev
```

---

## Test Scenarios

### A. Authentication Testing

#### Test 1: Login with Existing User

**Using Browser:**
1. Go to http://localhost:3000/login
2. Enter email: `sunny@example.com`
3. Click login
4. Should redirect to dashboard with authenticated session

**Using curl:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sunny@example.com",
    "password": "password"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-003",
      "email": "sunny@example.com",
      "full_name": "Sunny",
      "role": "Member"
    },
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

#### Test 2: Register New User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "full_name": "New User",
    "role": "Member"
  }'
```

#### Test 3: Get Current User

```bash
# Save token from login response
TOKEN="your_access_token_here"

curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

#### Test 4: Logout

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### B. Task CRUD Operations

#### Test 1: Get All Tasks

```bash
curl http://localhost:8080/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN"
```

#### Test 2: Create Task

```bash
curl -X POST http://localhost:8080/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task from API",
    "description": "Testing task creation",
    "status": "To Do",
    "priority": "High",
    "due_date": "2025-10-20T00:00:00Z"
  }'
```

#### Test 3: Get Task by ID

```bash
# Replace TASK_ID with actual ID from create response
curl http://localhost:8080/api/v1/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Test 4: Update Task

```bash
curl -X PUT http://localhost:8080/api/v1/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress",
    "priority": "Urgent"
  }'
```

#### Test 5: Delete Task

```bash
curl -X DELETE http://localhost:8080/api/v1/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN"
```

### C. User Management

#### Test 1: Get All Users

```bash
curl http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

#### Test 2: Get User by ID

```bash
curl http://localhost:8080/api/v1/users/user-003 \
  -H "Authorization: Bearer $TOKEN"
```

#### Test 3: Update User

```bash
curl -X PUT http://localhost:8080/api/v1/users/user-003 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Sunny Updated"
  }'
```

#### Test 4: Get User Tasks

```bash
curl http://localhost:8080/api/v1/users/user-003/tasks \
  -H "Authorization: Bearer $TOKEN"
```

### D. Department Management

#### Test 1: Get All Departments

```bash
curl http://localhost:8080/api/v1/departments \
  -H "Authorization: Bearer $TOKEN"
```

#### Test 2: Create Department (Admin Only)

```bash
# Login as admin first (raghu@example.com)

curl -X POST http://localhost:8080/api/v1/departments \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HR Department"
  }'
```

#### Test 3: Get Department Users

```bash
curl http://localhost:8080/api/v1/departments/dept-002/users \
  -H "Authorization: Bearer $TOKEN"
```

#### Test 4: Get Department Tasks

```bash
curl http://localhost:8080/api/v1/departments/dept-002/tasks \
  -H "Authorization: Bearer $TOKEN"
```

### E. Project Management

#### Test 1: Get All Projects

```bash
curl http://localhost:8080/api/v1/projects \
  -H "Authorization: Bearer $TOKEN"
```

#### Test 2: Create Project

```bash
curl -X POST http://localhost:8080/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Mobile App",
    "description": "Development of new mobile application",
    "status": "Active",
    "department_id": "dept-002"
  }'
```

#### Test 3: Get Project Tasks

```bash
curl http://localhost:8080/api/v1/projects/proj-001/tasks \
  -H "Authorization: Bearer $TOKEN"
```

### F. RBAC Testing

#### Test 1: Member Cannot Create Department

```bash
# Login as sunny@example.com (Member role)

curl -X POST http://localhost:8080/api/v1/departments \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Department"
  }'
```

Expected: 403 Forbidden

#### Test 2: Admin Can Create Department

```bash
# Login as raghu@example.com (Admin role)

curl -X POST http://localhost:8080/api/v1/departments \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Department"
  }'
```

Expected: 200 OK with department data

#### Test 3: User Can Only See Their Tasks

```bash
# Login as sunny@example.com

curl http://localhost:8080/api/v1/tasks \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

Should only return tasks assigned to Sunny or in Engineering department.

---

## Automated Test Script

Create `test-api.sh`:

```bash
#!/bin/bash

API_BASE="http://localhost:8080/api/v1"

echo "=== Testing Authentication ==="

# Login
echo "1. Login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sunny@example.com", "password": "password"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')

if [ "$TOKEN" == "null" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Login successful"

# Get current user
echo "2. Get current user..."
USER_RESPONSE=$(curl -s $API_BASE/auth/me \
  -H "Authorization: Bearer $TOKEN")

USER_EMAIL=$(echo $USER_RESPONSE | jq -r '.data.email')

if [ "$USER_EMAIL" == "sunny@example.com" ]; then
  echo "✅ Get current user successful"
else
  echo "❌ Get current user failed"
fi

echo ""
echo "=== Testing Tasks ==="

# Get tasks
echo "3. Get all tasks..."
TASKS_RESPONSE=$(curl -s $API_BASE/tasks \
  -H "Authorization: Bearer $TOKEN")

TASK_COUNT=$(echo $TASKS_RESPONSE | jq -r '.data | length')
echo "✅ Retrieved $TASK_COUNT tasks"

# Create task
echo "4. Create task..."
CREATE_RESPONSE=$(curl -s -X POST $API_BASE/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Automated Test Task",
    "description": "Created by test script",
    "status": "To Do",
    "priority": "Medium"
  }')

NEW_TASK_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')

if [ "$NEW_TASK_ID" != "null" ]; then
  echo "✅ Task created: $NEW_TASK_ID"
else
  echo "❌ Task creation failed"
fi

# Update task
echo "5. Update task..."
UPDATE_RESPONSE=$(curl -s -X PUT $API_BASE/tasks/$NEW_TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "In Progress"}')

UPDATED_STATUS=$(echo $UPDATE_RESPONSE | jq -r '.data.status')

if [ "$UPDATED_STATUS" == "In Progress" ]; then
  echo "✅ Task updated"
else
  echo "❌ Task update failed"
fi

# Delete task
echo "6. Delete task..."
DELETE_RESPONSE=$(curl -s -X DELETE $API_BASE/tasks/$NEW_TASK_ID \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Task deleted"

echo ""
echo "=== All tests completed ==="
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Frontend Testing Checklist

### Manual Testing in Browser

1. **Authentication:**
   - [ ] Login with existing user
   - [ ] Logout
   - [ ] Token persists in localStorage
   - [ ] Protected routes redirect to login

2. **Task List:**
   - [ ] View all tasks
   - [ ] Filter tasks (My Tasks, All Tasks, Urgent, In Progress)
   - [ ] Search tasks by title
   - [ ] Sort tasks (by date, priority, status)

3. **Task CRUD:**
   - [ ] Create new task
   - [ ] Update task status
   - [ ] Update task priority
   - [ ] Assign users to task
   - [ ] Delete task
   - [ ] Bulk actions (select multiple, delete)

4. **Task Detail Panel:**
   - [ ] View task details
   - [ ] Add comment
   - [ ] View all comments
   - [ ] Close panel (click outside or X button)

5. **RBAC:**
   - [ ] Members see only their tasks
   - [ ] Managers see department tasks
   - [ ] Admins see all tasks
   - [ ] Department creation restricted to admins

---

## Common Issues and Solutions

### Issue: 401 Unauthorized

**Cause:** Token expired or invalid

**Solution:**
```bash
# Re-login to get new token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sunny@example.com", "password": "password"}'
```

### Issue: CORS Error in Browser

**Cause:** CORS origins not configured correctly

**Solution:** Check `CORS_ORIGINS` in backend `.env` includes frontend URL

### Issue: Database Connection Failed

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
```bash
# Check PostgreSQL status
sudo service postgresql status

# Verify connection
psql -U synapse_user -d synapse -c "SELECT 1;"
```

### Issue: Frontend Shows Mock Data

**Cause:** `NEXT_PUBLIC_USE_GO_BACKEND` not set to true

**Solution:** Update `prototype/.env.local`:
```env
NEXT_PUBLIC_USE_GO_BACKEND=true
```

Then restart Next.js dev server.

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install ab (Apache Bench)
sudo apt-get install apache2-utils

# Test task listing endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/tasks
```

### Expected Performance

- **Task List (GET):** < 50ms (p95)
- **Task Create (POST):** < 100ms (p95)
- **Task Update (PUT):** < 75ms (p95)
- **Login (POST):** < 150ms (p95)

---

## Next Steps After Testing

1. Fix any bugs discovered during testing
2. Add automatic token refresh on 401 errors
3. Improve error messages in frontend
4. Add loading states
5. Implement real-time updates (WebSockets)
6. Add unit and integration tests
7. Set up CI/CD pipeline
8. Deploy to staging environment

---

**Contact:** Sunny
**Last Updated:** October 16, 2025
**Version:** 1.0.0
