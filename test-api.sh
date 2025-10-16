#!/bin/bash

# API Testing Script for Project Synapse
# Tests authentication, CRUD operations, and RBAC

API_BASE="http://localhost:8080/api/v1"
PASS_COUNT=0
FAIL_COUNT=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASS_COUNT++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAIL_COUNT++))
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_section() {
    echo ""
    echo "========================================"
    echo "$1"
    echo "========================================"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is required but not installed. Installing..."
    sudo apt-get install -y jq
fi

# Test backend health
print_section "Backend Health Check"
HEALTH_RESPONSE=$(curl -s $API_BASE/../health)
if echo "$HEALTH_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
    exit 1
fi

# =============================================================================
# AUTHENTICATION TESTS
# =============================================================================

print_section "Authentication Tests"

# Test 1: Login with valid credentials
print_info "Test 1: Login with valid credentials"
LOGIN_RESPONSE=$(curl -s -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sunny@example.com", "password": "password"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    print_success "Login successful - Token received"
else
    print_error "Login failed - No token received"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 2: Get current user
print_info "Test 2: Get current user"
USER_RESPONSE=$(curl -s $API_BASE/auth/me \
  -H "Authorization: Bearer $TOKEN")

USER_EMAIL=$(echo $USER_RESPONSE | jq -r '.data.email')

if [ "$USER_EMAIL" == "sunny@example.com" ]; then
    print_success "Get current user successful"
else
    print_error "Get current user failed"
fi

# Test 3: Login with invalid credentials
print_info "Test 3: Login with invalid credentials (should fail)"
INVALID_LOGIN=$(curl -s -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sunny@example.com", "password": "wrongpassword"}')

if echo "$INVALID_LOGIN" | jq -e '.success == false' > /dev/null 2>&1; then
    print_success "Invalid login correctly rejected"
else
    print_error "Invalid login should have been rejected"
fi

# Test 4: Access protected route without token
print_info "Test 4: Access protected route without token (should fail)"
NO_AUTH=$(curl -s $API_BASE/tasks)

if echo "$NO_AUTH" | jq -e '.success == false' > /dev/null 2>&1; then
    print_success "Unauthorized access correctly rejected"
else
    print_error "Unauthorized access should have been rejected"
fi

# =============================================================================
# TASK CRUD TESTS
# =============================================================================

print_section "Task CRUD Tests"

# Test 5: Get all tasks
print_info "Test 5: Get all tasks"
TASKS_RESPONSE=$(curl -s $API_BASE/tasks \
  -H "Authorization: Bearer $TOKEN")

TASK_COUNT=$(echo $TASKS_RESPONSE | jq -r '.data | length')

if [ "$TASK_COUNT" -ge 0 ]; then
    print_success "Retrieved tasks (count: $TASK_COUNT)"
else
    print_error "Failed to retrieve tasks"
fi

# Test 6: Create new task
print_info "Test 6: Create new task"
CREATE_RESPONSE=$(curl -s -X POST $API_BASE/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Automated Test Task",
    "description": "Created by automated test script",
    "status": "To Do",
    "priority": "Medium"
  }')

NEW_TASK_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')

if [ "$NEW_TASK_ID" != "null" ] && [ -n "$NEW_TASK_ID" ]; then
    print_success "Task created successfully (ID: $NEW_TASK_ID)"
else
    print_error "Task creation failed"
    echo "Response: $CREATE_RESPONSE"
fi

# Test 7: Get task by ID
print_info "Test 7: Get task by ID"
GET_TASK_RESPONSE=$(curl -s $API_BASE/tasks/$NEW_TASK_ID \
  -H "Authorization: Bearer $TOKEN")

TASK_TITLE=$(echo $GET_TASK_RESPONSE | jq -r '.data.title')

if [ "$TASK_TITLE" == "Automated Test Task" ]; then
    print_success "Retrieved task by ID"
else
    print_error "Failed to retrieve task by ID"
fi

# Test 8: Update task
print_info "Test 8: Update task"
UPDATE_RESPONSE=$(curl -s -X PUT $API_BASE/tasks/$NEW_TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "In Progress", "priority": "High"}')

UPDATED_STATUS=$(echo $UPDATE_RESPONSE | jq -r '.data.status')
UPDATED_PRIORITY=$(echo $UPDATE_RESPONSE | jq -r '.data.priority')

if [ "$UPDATED_STATUS" == "In Progress" ] && [ "$UPDATED_PRIORITY" == "High" ]; then
    print_success "Task updated successfully"
else
    print_error "Task update failed"
fi

# Test 9: Delete task
print_info "Test 9: Delete task"
DELETE_RESPONSE=$(curl -s -X DELETE $API_BASE/tasks/$NEW_TASK_ID \
  -H "Authorization: Bearer $TOKEN")

# Try to get deleted task (should fail)
DELETED_CHECK=$(curl -s $API_BASE/tasks/$NEW_TASK_ID \
  -H "Authorization: Bearer $TOKEN")

if echo "$DELETED_CHECK" | jq -e '.success == false' > /dev/null 2>&1; then
    print_success "Task deleted successfully"
else
    print_error "Task deletion failed"
fi

# =============================================================================
# USER TESTS
# =============================================================================

print_section "User Management Tests"

# Test 10: Get all users
print_info "Test 10: Get all users"
USERS_RESPONSE=$(curl -s $API_BASE/users \
  -H "Authorization: Bearer $TOKEN")

USER_COUNT=$(echo $USERS_RESPONSE | jq -r '.data | length')

if [ "$USER_COUNT" -ge 5 ]; then
    print_success "Retrieved users (count: $USER_COUNT)"
else
    print_error "Failed to retrieve users or incorrect count"
fi

# Test 11: Get user by ID
print_info "Test 11: Get user by ID"
USER_DETAIL=$(curl -s $API_BASE/users/user-003 \
  -H "Authorization: Bearer $TOKEN")

USER_NAME=$(echo $USER_DETAIL | jq -r '.data.full_name')

if [ "$USER_NAME" == "Sunny" ]; then
    print_success "Retrieved user by ID"
else
    print_error "Failed to retrieve user by ID"
fi

# Test 12: Update user (self-service)
print_info "Test 12: Update user profile"
UPDATE_USER=$(curl -s -X PUT $API_BASE/users/user-003 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Sunny Kumar"}')

UPDATED_NAME=$(echo $UPDATE_USER | jq -r '.data.full_name')

if [ "$UPDATED_NAME" == "Sunny Kumar" ]; then
    print_success "User profile updated"

    # Revert back
    curl -s -X PUT $API_BASE/users/user-003 \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"full_name": "Sunny"}' > /dev/null
else
    print_error "User profile update failed"
fi

# =============================================================================
# DEPARTMENT TESTS
# =============================================================================

print_section "Department Management Tests"

# Test 13: Get all departments
print_info "Test 13: Get all departments"
DEPTS_RESPONSE=$(curl -s $API_BASE/departments \
  -H "Authorization: Bearer $TOKEN")

DEPT_COUNT=$(echo $DEPTS_RESPONSE | jq -r '.data | length')

if [ "$DEPT_COUNT" -ge 3 ]; then
    print_success "Retrieved departments (count: $DEPT_COUNT)"
else
    print_error "Failed to retrieve departments"
fi

# Test 14: Get department users
print_info "Test 14: Get department users"
DEPT_USERS=$(curl -s $API_BASE/departments/dept-002/users \
  -H "Authorization: Bearer $TOKEN")

DEPT_USER_COUNT=$(echo $DEPT_USERS | jq -r '.data | length')

if [ "$DEPT_USER_COUNT" -ge 1 ]; then
    print_success "Retrieved department users"
else
    print_error "Failed to retrieve department users"
fi

# =============================================================================
# PROJECT TESTS
# =============================================================================

print_section "Project Management Tests"

# Test 15: Get all projects
print_info "Test 15: Get all projects"
PROJECTS_RESPONSE=$(curl -s $API_BASE/projects \
  -H "Authorization: Bearer $TOKEN")

PROJECT_COUNT=$(echo $PROJECTS_RESPONSE | jq -r '.data | length')

if [ "$PROJECT_COUNT" -ge 2 ]; then
    print_success "Retrieved projects (count: $PROJECT_COUNT)"
else
    print_error "Failed to retrieve projects"
fi

# Test 16: Create project
print_info "Test 16: Create project"
CREATE_PROJECT=$(curl -s -X POST $API_BASE/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Created by test script",
    "status": "Active"
  }')

NEW_PROJECT_ID=$(echo $CREATE_PROJECT | jq -r '.data.id')

if [ "$NEW_PROJECT_ID" != "null" ] && [ -n "$NEW_PROJECT_ID" ]; then
    print_success "Project created (ID: $NEW_PROJECT_ID)"

    # Clean up - delete project
    curl -s -X DELETE $API_BASE/projects/$NEW_PROJECT_ID \
      -H "Authorization: Bearer $TOKEN" > /dev/null
else
    print_error "Project creation failed"
fi

# =============================================================================
# RBAC TESTS
# =============================================================================

print_section "RBAC (Role-Based Access Control) Tests"

# Test 17: Login as admin
print_info "Test 17: Login as admin"
ADMIN_LOGIN=$(curl -s -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "raghu@example.com", "password": "password"}')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.data.access_token')

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    print_success "Admin login successful"
else
    print_error "Admin login failed"
fi

# Test 18: Admin can create department
print_info "Test 18: Admin can create department"
CREATE_DEPT=$(curl -s -X POST $API_BASE/departments \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Department"}')

NEW_DEPT_ID=$(echo $CREATE_DEPT | jq -r '.data.id')

if [ "$NEW_DEPT_ID" != "null" ] && [ -n "$NEW_DEPT_ID" ]; then
    print_success "Admin created department"

    # Clean up
    curl -s -X DELETE $API_BASE/departments/$NEW_DEPT_ID \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
else
    print_error "Admin failed to create department"
fi

# Test 19: Member cannot create department
print_info "Test 19: Member cannot create department (should fail)"
MEMBER_CREATE_DEPT=$(curl -s -X POST $API_BASE/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Unauthorized Department"}')

if echo "$MEMBER_CREATE_DEPT" | jq -e '.success == false' > /dev/null 2>&1; then
    print_success "Member correctly denied department creation"
else
    print_error "Member should not be able to create department"
fi

# =============================================================================
# SUMMARY
# =============================================================================

print_section "Test Summary"

TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT))

echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
