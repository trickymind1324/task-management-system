# FRD-01: Core Data Models

**Feature:** Core Data Models & Database Schema

**Version:** 1.0

**Last Updated:** October 6, 2025

**Status:** Draft

**Priority:** P0 (Critical for Prototype)

---

## Overview

This document defines the core data models for Project Synapse, including Task, User, Department, Project, and related entities. These models form the foundation of the entire system and must be well-structured for both prototype and production phases.

## User Stories

- **As a developer**, I need clear data schemas so I can build consistent APIs and UI components
- **As a product manager**, I need to understand what data we're tracking for each entity
- **As a user**, I expect my tasks to have all necessary information (title, status, assignees, etc.)

## Core Entities

### 1. Task

The primary entity in the system representing a unit of work.

```typescript
interface Task {
  // Core Identifiers
  task_id: string;                    // UUID v4 - Primary key
  title: string;                      // Required, max 255 chars
  description: string;                // Rich text (Markdown support), max 10,000 chars

  // Status & Priority
  status: TaskStatus;                 // Enum: 'To Do' | 'In Progress' | 'In Review' | 'Blocked' | 'Done'
  priority: TaskPriority;             // Enum: 'Low' | 'Medium' | 'High' | 'Urgent'

  // Assignment & Ownership
  assignees: string[];                // Array of User_IDs (supports multiple assignees)
  creator: string;                    // User_ID, Required, immutable
  department: string;                 // Department_ID, nullable

  // Temporal Data
  creation_date: Date;                // Auto-generated timestamp (ISO 8601)
  due_date: Date | null;              // Optional, user-defined
  completion_date: Date | null;       // Auto-set when status changes to 'Done'
  last_modified: Date;                // Auto-updated on any change

  // Relationships
  project: string | null;             // Project_ID, nullable
  dependencies: string[];             // Array of Task_IDs (tasks that must complete first)
  blocks: string[];                   // Array of Task_IDs (tasks blocked by this task)
  parent_task: string | null;         // For subtasks, references parent Task_ID

  // Metadata
  source: TaskSource;                 // Enum: 'GUI' | 'Email' | 'API' | 'Document' | 'NLP'
  attachments: Attachment[];          // Array of file references
  tags: string[];                     // User or AI-generated keywords
  confidence_score: number | null;    // Float 0.0-1.0, AI confidence (null if manual)
  comments: Comment[];                // Array of comment objects
  metadata: Record<string, any>;      // JSONB flexible storage for custom fields
}

// Supporting Types
type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Blocked' | 'Done';
type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
type TaskSource = 'GUI' | 'Email' | 'API' | 'Document' | 'NLP';

interface Attachment {
  file_id: string;                    // UUID
  filename: string;
  file_type: string;                  // MIME type
  file_size: number;                  // Bytes
  uploaded_at: Date;
  uploaded_by: string;                // User_ID
  url: string;                        // Storage URL or path
}

interface Comment {
  comment_id: string;                 // UUID
  task_id: string;                    // Reference to parent task
  author: string;                     // User_ID
  content: string;                    // Markdown supported
  created_at: Date;
  updated_at: Date | null;
  is_edited: boolean;
}
```

### 2. User

Represents a user in the system.

```typescript
interface User {
  // Core Identifiers
  user_id: string;                    // UUID v4 - Primary key
  email: string;                      // Required, unique, validated
  username: string;                   // Required, unique, 3-30 chars

  // Profile Information
  full_name: string;                  // Required
  avatar_url: string | null;          // Optional profile picture
  job_title: string | null;
  department: string | null;          // Department_ID

  // Authentication
  password_hash: string;              // Hashed (bcrypt/argon2), never exposed in API
  is_active: boolean;                 // Account status
  email_verified: boolean;
  last_login: Date | null;

  // Authorization
  role: UserRole;                     // Enum: 'Admin' | 'Manager' | 'Member' | 'Viewer'
  permissions: string[];              // Array of permission strings

  // Temporal
  created_at: Date;
  updated_at: Date;

  // Preferences
  preferences: UserPreferences;
  notification_settings: NotificationSettings;
}

type UserRole = 'Admin' | 'Manager' | 'Member' | 'Viewer';

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;                   // ISO 639-1 code (e.g., 'en', 'es')
  timezone: string;                   // IANA timezone (e.g., 'America/New_York')
  date_format: string;                // e.g., 'MM/DD/YYYY', 'DD/MM/YYYY'
  default_view: 'list' | 'board' | 'calendar';
}

interface NotificationSettings {
  email_notifications: boolean;
  task_assigned: boolean;
  task_due_soon: boolean;
  task_completed: boolean;
  mentions: boolean;
  digest_frequency: 'none' | 'daily' | 'weekly';
}
```

### 3. Department

Organizational unit for categorizing tasks and users.

```typescript
interface Department {
  // Core Identifiers
  department_id: string;              // UUID v4 - Primary key
  name: string;                       // Required, unique, max 100 chars

  // Hierarchy
  parent_department: string | null;   // Department_ID for nested departments

  // Management
  department_head: string | null;     // User_ID
  members: string[];                  // Array of User_IDs

  // Metadata
  description: string | null;
  color: string;                      // Hex color for UI (e.g., '#FF5733')
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}
```

### 4. Project

Collection of related tasks representing a larger initiative.

```typescript
interface Project {
  // Core Identifiers
  project_id: string;                 // UUID v4 - Primary key
  name: string;                       // Required, max 255 chars
  description: string;                // Rich text (Markdown), max 5,000 chars

  // Status & Progress
  status: ProjectStatus;              // Enum: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled'
  progress_percentage: number;        // 0-100, calculated from tasks

  // Assignment
  owner: string;                      // User_ID, project manager
  team_members: string[];             // Array of User_IDs
  departments: string[];              // Array of Department_IDs

  // Temporal
  start_date: Date | null;
  target_end_date: Date | null;
  actual_end_date: Date | null;
  created_at: Date;
  updated_at: Date;

  // Relationships
  tasks: string[];                    // Array of Task_IDs

  // Metadata
  tags: string[];
  color: string;                      // Hex color for UI
  metadata: Record<string, any>;
}

type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';
```

### 5. Tag

Reusable labels for categorization.

```typescript
interface Tag {
  tag_id: string;                     // UUID v4 - Primary key
  name: string;                       // Required, unique, max 50 chars
  color: string;                      // Hex color
  created_by: string;                 // User_ID
  usage_count: number;                // How many times it's been used
  created_at: Date;
}
```

## Prototype Scope

### For Prototype Phase (Mock Data)

**Include:**
- All Task fields with mock data
- Basic User model (mock authentication)
- Department structure (3-5 sample departments)
- Project model (2-3 sample projects)
- Hardcoded mock data in JSON format or in-memory store

**Exclude:**
- Real authentication/password hashing
- Database migrations
- Complex validation logic
- File upload/attachment storage
- Advanced user permissions

### Mock Data Structure

```typescript
// Example mock data file: mock-data.ts
export const mockUsers: User[] = [
  {
    user_id: 'user-001',
    email: 'Bharath@example.com',
    username: 'Bharath_pm',
    full_name: 'Bharath',
    avatar_url: '/avatars/Bharath.jpg',
    job_title: 'Project Manager',
    department: 'dept-001',
    role: 'Manager',
    is_active: true,
    // ... other fields with sensible defaults
  },
  // ... more users
];

export const mockTasks: Task[] = [
  {
    task_id: 'task-001',
    title: 'Design landing page mockups',
    description: 'Create high-fidelity mockups for the new product landing page',
    status: 'In Progress',
    priority: 'High',
    assignees: ['user-001', 'user-002'],
    creator: 'user-001',
    department: 'dept-001',
    creation_date: new Date('2025-10-01'),
    due_date: new Date('2025-10-15'),
    // ... other fields
  },
  // ... more tasks
];
```

## Validation Rules

### Task Validation

| Field | Rule |
|-------|------|
| title | Required, 1-255 characters, no leading/trailing whitespace |
| description | Optional, max 10,000 characters |
| status | Must be one of defined TaskStatus values |
| priority | Must be one of defined TaskPriority values |
| assignees | Array of valid User_IDs, can be empty |
| creator | Required, must be valid User_ID |
| due_date | Must be present or future date (warning if past) |
| dependencies | Cannot create circular dependencies |

### User Validation

| Field | Rule |
|-------|------|
| email | Required, valid email format, unique |
| username | Required, 3-30 alphanumeric + underscore, unique |
| full_name | Required, 2-100 characters |
| password | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (production only) |

## Database Indexes (Production)

For PostgreSQL implementation (post-prototype):

```sql
-- Tasks Table
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assignees ON tasks USING GIN(assignees);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_department ON tasks(department);
CREATE INDEX idx_tasks_project ON tasks(project);
CREATE INDEX idx_tasks_creator ON tasks(creator);

-- Users Table
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Full-text search
CREATE INDEX idx_tasks_search ON tasks USING GIN(to_tsvector('english', title || ' ' || description));
```

## API Response Format

All API responses should follow this structure:

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    page?: number;
    per_page?: number;
    total?: number;
    timestamp: string;
  };
}
```

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Sunny | Initial draft with all core models |

## Related Documents

- [00 - INDEX](./00-INDEX.md)
- [02 - Task Management UI](./02-task-management-ui.md)
- [09 - API Specification](./09-api-specification.md)
- [10 - Prototype Specifications](./10-prototype-specifications.md)

## Acceptance Criteria

- [ ] All data models defined with TypeScript interfaces
- [ ] Mock data created for prototype (minimum 20 tasks, 5 users, 3 departments, 2 projects)
- [ ] Validation rules documented
- [ ] API response format standardized
- [ ] Frontend can consume and display all data models
- [ ] No breaking changes to data structure during prototype phase
