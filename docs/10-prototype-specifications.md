# FRD-10: Prototype Specifications

**Feature:** Clickable Prototype - Scope, Mock Data, and Implementation Guide

**Version:** 1.0

**Last Updated:** October 6, 2025

**Status:** Draft

**Priority:** P0 (Critical - Start Here!)

---

## Overview

This document defines the exact scope, mock data structure, and implementation approach for the **Clickable Prototype** of Project Synapse. The prototype's goal is to validate UI/UX, user flows, and core functionality before building the production backend and AI services.

**Prototype Philosophy:** "Make it look real, make it feel real, but don't build it real (yet)."

## Objectives

### Primary Goals

1. **Validate UX/UI Design** - Test if users can accomplish core tasks intuitively
2. **Demo to Stakeholders** - Show a realistic vision of the final product
3. **Gather User Feedback** - Identify UX issues before production development
4. **Team Alignment** - Ensure frontend/backend teams agree on APIs and data structures

### Non-Goals (Explicitly Out of Scope)

- ❌ Production-ready code
- ❌ Real authentication/security
- ❌ Persistent database
- ❌ AI/ML features
- ❌ Email/document integrations
- ❌ Performance optimization
- ❌ Cross-browser compatibility testing
- ❌ Mobile responsive design (desktop only)

## Prototype Scope

### ✅ What's Included (Must Have)

#### Core Features

| Feature | Implementation | Notes |
|---------|----------------|-------|
| **Login Page** | Mock email-only login | 3-5 predefined users |
| **Dashboard** | Fully functional UI | Real components, mock data |
| **Task List View** | Sortable, filterable | Client-side only |
| **Task Board View** | Drag-and-drop Kanban | Updates mock data in memory |
| **Task Calendar View** | Read-only display | Shows tasks by due date |
| **Task Detail Panel** | Full CRUD operations | Side drawer with all fields |
| **Task Creation** | Modal form | All fields functional |
| **Task Editing** | Inline and panel editing | Optimistic UI updates |
| **Filters** | Status, priority, assignee | Client-side filtering |
| **Search** | Title/description search | Simple string matching |
| **Comments** | Add/view comments | Stored in memory |
| **User Switcher** | Quick switch between users | Developer tool for testing |

#### UI Components

- Header with search, notifications (empty), user menu
- Sidebar navigation
- List/Board/Calendar view toggles
- Priority badges, status badges, avatars
- Date pickers, dropdowns, multi-selects
- Loading states, empty states
- Toast notifications for actions

### ❌ What's Excluded (Won't Have)

| Feature | Reason | Future Phase |
|---------|--------|--------------|
| Real authentication | Not needed for prototype | Phase 1 (Production) |
| Database | Mock data sufficient | Phase 1 |
| Backend API | Frontend-only prototype | Phase 1 |
| File uploads | Complex, not core UX | Phase 2 |
| Email integration | AI feature, not core UX | Phase 2 |
| Document parsing | AI feature | Phase 2 |
| NLP task creation | AI feature | Phase 2 |
| Knowledge graph viz | Advanced feature | Phase 3 |
| Analytics dashboard | Nice-to-have | Phase 4 |
| Notifications system | Not core UX | Phase 4 |
| Mobile responsive | Desktop first | Phase 4 |
| Dark theme | Single theme for prototype | Phase 4 |
| Accessibility (advanced) | Basic only | Phase 5 |
| Performance optimization | Not needed for 50 tasks | Phase 5 |

## Mock Data Structure

### Data Storage

For the prototype, we'll use an **in-memory mock data store** with the following structure:

```typescript
// lib/data/mock-store.ts

import { Task, User, Department, Project, Comment } from '@/types';

class MockDataStore {
  private tasks: Task[] = INITIAL_TASKS;
  private users: User[] = INITIAL_USERS;
  private departments: Department[] = INITIAL_DEPARTMENTS;
  private projects: Project[] = INITIAL_PROJECTS;

  // Simulate async API calls
  private async delay(ms: number = 300) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // Tasks
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    await this.delay();
    let filtered = [...this.tasks];

    if (filters?.status) {
      filtered = filtered.filter(t => filters.status!.includes(t.status));
    }
    if (filters?.priority) {
      filtered = filtered.filter(t => filters.priority!.includes(t.priority));
    }
    if (filters?.assignees) {
      filtered = filtered.filter(t =>
        t.assignees.some(a => filters.assignees!.includes(a))
      );
    }
    // ... more filters

    return filtered;
  }

  async getTaskById(id: string): Promise<Task | null> {
    await this.delay();
    return this.tasks.find(t => t.task_id === id) || null;
  }

  async createTask(task: Omit<Task, 'task_id' | 'creation_date'>): Promise<Task> {
    await this.delay();
    const newTask: Task = {
      ...task,
      task_id: `task-${Date.now()}`,
      creation_date: new Date(),
      last_modified: new Date(),
    };
    this.tasks.push(newTask);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    await this.delay();
    const index = this.tasks.findIndex(t => t.task_id === id);
    if (index === -1) return null;

    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      last_modified: new Date(),
    };
    return this.tasks[index];
  }

  async deleteTask(id: string): Promise<boolean> {
    await this.delay();
    const index = this.tasks.findIndex(t => t.task_id === id);
    if (index === -1) return false;

    this.tasks.splice(index, 1);
    return true;
  }

  // Users
  async getUsers(): Promise<User[]> {
    await this.delay();
    return [...this.users];
  }

  async getUserById(id: string): Promise<User | null> {
    await this.delay();
    return this.users.find(u => u.user_id === id) || null;
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    await this.delay();
    return [...this.departments];
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    await this.delay();
    return [...this.projects];
  }

  // Comments
  async addComment(taskId: string, comment: Omit<Comment, 'comment_id' | 'created_at'>): Promise<Comment> {
    await this.delay();
    const task = await this.getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    const newComment: Comment = {
      ...comment,
      comment_id: `comment-${Date.now()}`,
      created_at: new Date(),
      updated_at: null,
      is_edited: false,
    };

    task.comments.push(newComment);
    return newComment;
  }
}

export const mockDataStore = new MockDataStore();
```

### Sample Mock Data

```typescript
// lib/data/initial-data.ts

export const INITIAL_USERS: User[] = [
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
    email_verified: true,
    last_login: new Date('2025-10-06T09:30:00'),
    // ... other fields
  },
  {
    user_id: 'user-002',
    email: 'Sunny@example.com',
    username: 'Sunny_dev',
    full_name: 'Sunny',
    avatar_url: '/avatars/Sunny.jpg',
    job_title: 'Senior Developer',
    department: 'dept-002',
    role: 'Member',
    is_active: true,
    // ...
  },
  {
    user_id: 'user-003',
    email: 'Raghu@example.com',
    username: 'Raghu_exec',
    full_name: 'Raghu',
    avatar_url: '/avatars/Raghu.jpg',
    job_title: 'VP of Engineering',
    department: null,
    role: 'Admin',
    is_active: true,
    // ...
  },
  // Add 2-3 more users
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    department_id: 'dept-001',
    name: 'Marketing',
    parent_department: null,
    department_head: 'user-001',
    members: ['user-001', 'user-004'],
    description: 'Marketing and brand management',
    color: '#FF6B6B',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    is_active: true,
  },
  {
    department_id: 'dept-002',
    name: 'Engineering',
    parent_department: null,
    department_head: 'user-003',
    members: ['user-002', 'user-003', 'user-005'],
    description: 'Product development and engineering',
    color: '#4ECDC4',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    is_active: true,
  },
  {
    department_id: 'dept-003',
    name: 'Finance',
    parent_department: null,
    department_head: null,
    members: [],
    description: 'Finance and accounting',
    color: '#95E1D3',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    is_active: true,
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    project_id: 'proj-001',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website with modern UI/UX',
    status: 'Active',
    progress_percentage: 45,
    owner: 'user-001',
    team_members: ['user-001', 'user-002', 'user-004'],
    departments: ['dept-001', 'dept-002'],
    start_date: new Date('2025-09-01'),
    target_end_date: new Date('2025-11-30'),
    actual_end_date: null,
    created_at: new Date('2025-08-15'),
    updated_at: new Date('2025-10-05'),
    tasks: ['task-001', 'task-002', 'task-003'],
    tags: ['website', 'redesign', 'high-priority'],
    color: '#FF6B6B',
    metadata: {},
  },
  {
    project_id: 'proj-002',
    name: 'Q4 Budget Planning',
    description: 'Prepare and finalize Q4 budget allocations',
    status: 'Planning',
    progress_percentage: 20,
    owner: 'user-003',
    team_members: ['user-003'],
    departments: ['dept-003'],
    start_date: new Date('2025-10-01'),
    target_end_date: new Date('2025-10-31'),
    actual_end_date: null,
    created_at: new Date('2025-09-20'),
    updated_at: new Date('2025-10-02'),
    tasks: ['task-010'],
    tags: ['finance', 'budget', 'q4'],
    color: '#95E1D3',
    metadata: {},
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    task_id: 'task-001',
    title: 'Design landing page mockups',
    description: '# Landing Page Design\n\nCreate high-fidelity mockups for the new product landing page including:\n- Hero section with CTA\n- Feature highlights (3 columns)\n- Testimonials section\n- Footer with links',
    status: 'In Progress',
    priority: 'High',
    assignees: ['user-001', 'user-004'],
    creator: 'user-001',
    department: 'dept-001',
    creation_date: new Date('2025-10-01'),
    due_date: new Date('2025-10-15'),
    completion_date: null,
    last_modified: new Date('2025-10-05'),
    project: 'proj-001',
    dependencies: [],
    blocks: ['task-002'],
    parent_task: null,
    source: 'GUI',
    attachments: [
      {
        file_id: 'file-001',
        filename: 'wireframes.fig',
        file_type: 'application/figma',
        file_size: 2400000,
        uploaded_at: new Date('2025-10-02'),
        uploaded_by: 'user-001',
        url: '/mock-files/wireframes.fig',
      },
    ],
    tags: ['design', 'landing-page', 'ui', 'mockups'],
    confidence_score: null,
    comments: [
      {
        comment_id: 'comment-001',
        task_id: 'task-001',
        author: 'user-001',
        content: 'First draft is ready for review!',
        created_at: new Date('2025-10-05T14:30:00'),
        updated_at: null,
        is_edited: false,
      },
      {
        comment_id: 'comment-002',
        task_id: 'task-001',
        author: 'user-002',
        content: 'Looks great! Just a few minor suggestions on the color scheme.',
        created_at: new Date('2025-10-05T15:45:00'),
        updated_at: null,
        is_edited: false,
      },
    ],
    metadata: {},
  },
  // ... 25-30 more diverse tasks with different statuses, priorities, assignees, etc.
];
```

### Mock Data Requirements

**Minimum Dataset:**
- **Users:** 5 users (1 Admin, 1 Manager, 3 Members)
- **Departments:** 3-4 departments
- **Projects:** 2-3 projects
- **Tasks:** 25-30 tasks with diverse properties:
  - Statuses: To Do (10), In Progress (8), In Review (4), Blocked (2), Done (6)
  - Priorities: Urgent (2), High (8), Medium (12), Low (8)
  - Due dates: Mix of overdue, today, this week, next week, future
  - Assignees: Mix of single and multiple assignees, some unassigned
  - Projects: Some in projects, some standalone
  - Dependencies: 3-4 tasks with dependencies
  - Comments: 5-10 tasks with comments (1-3 comments each)
  - Attachments: 3-5 tasks with mock attachments

## Technical Implementation

### Technology Stack

```json
{
  "framework": "Next.js 14.2+",
  "language": "TypeScript 5.0+",
  "styling": "Tailwind CSS 3.4+",
  "ui-library": "shadcn/ui",
  "state-management": "Zustand",
  "date-handling": "date-fns",
  "drag-and-drop": "@dnd-kit/core",
  "calendar": "react-big-calendar",
  "rich-text": "Tiptap",
  "icons": "lucide-react"
}
```

### Project Structure

```
prototype/
├── app/
│   ├── layout.tsx                  // Root layout
│   ├── page.tsx                    // Landing/redirect
│   ├── login/
│   │   └── page.tsx                // Mock login
│   └── dashboard/
│       ├── layout.tsx              // Dashboard layout (header + sidebar)
│       ├── page.tsx                // Main dashboard (task views)
│       └── tasks/
│           └── [id]/
│               └── page.tsx        // Task detail page (optional)
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── QuickActions.tsx
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskBoard.tsx
│   │   ├── TaskCalendar.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskRow.tsx
│   │   ├── TaskDetailPanel.tsx
│   │   ├── TaskCreateModal.tsx
│   │   ├── TaskFilters.tsx
│   │   └── CommentThread.tsx
│   ├── common/
│   │   ├── PriorityBadge.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── UserAvatar.tsx
│   │   └── SearchBar.tsx
│   └── ui/                         // shadcn/ui components
├── lib/
│   ├── data/
│   │   ├── mock-store.ts           // Main mock data store
│   │   ├── initial-data.ts         // Seed data
│   │   └── types.ts                // TypeScript types
│   ├── auth/
│   │   └── mock-auth.ts            // Mock authentication
│   ├── hooks/
│   │   ├── useTasks.ts
│   │   ├── useAuth.ts
│   │   └── useFilters.ts
│   └── utils/
│       ├── date-formatters.ts
│       ├── task-helpers.ts
│       └── cn.ts                   // Class name utility
├── types/
│   └── index.ts                    // Shared TypeScript types
├── public/
│   └── avatars/                    // Mock user avatars
└── package.json
```

### State Management with Zustand

```typescript
// lib/store/task-store.ts

import { create } from 'zustand';
import { Task, TaskFilters } from '@/types';
import { mockDataStore } from '@/lib/data/mock-store';

interface TaskStore {
  tasks: Task[];
  filters: TaskFilters;
  selectedTaskId: string | null;
  isLoading: boolean;

  fetchTasks: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setSelectedTask: (id: string | null) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  filters: {},
  selectedTaskId: null,
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    const tasks = await mockDataStore.getTasks(get().filters);
    set({ tasks, isLoading: false });
  },

  createTask: async (taskData) => {
    const newTask = await mockDataStore.createTask(taskData as any);
    set(state => ({ tasks: [...state.tasks, newTask] }));
  },

  updateTask: async (id, updates) => {
    const updated = await mockDataStore.updateTask(id, updates);
    if (updated) {
      set(state => ({
        tasks: state.tasks.map(t => t.task_id === id ? updated : t),
      }));
    }
  },

  deleteTask: async (id) => {
    await mockDataStore.deleteTask(id);
    set(state => ({
      tasks: state.tasks.filter(t => t.task_id !== id),
    }));
  },

  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().fetchTasks();
  },

  setSelectedTask: (id) => {
    set({ selectedTaskId: id });
  },
}));
```

## Development Workflow

### Phase 1: Setup (1-2 days)

1. Initialize Next.js project with TypeScript
2. Install and configure Tailwind CSS + shadcn/ui
3. Set up project structure (folders, files)
4. Create TypeScript types from data models
5. Implement mock data store with initial data

### Phase 2: Authentication & Layout (1 day)

1. Build mock login page
2. Create dashboard layout (header + sidebar)
3. Implement mock auth service
4. Add protected route logic

### Phase 3: Core Task Views (3-4 days)

1. **List View** (1 day)
   - TaskList component
   - TaskRow component
   - Sorting and filtering
2. **Board View** (1.5 days)
   - TaskBoard component
   - TaskCard component
   - Drag-and-drop functionality
3. **Calendar View** (0.5 day)
   - TaskCalendar component (read-only)

### Phase 4: Task Detail & CRUD (2-3 days)

1. Task detail panel (side drawer)
2. Task creation modal
3. Inline editing
4. Comment thread
5. All CRUD operations

### Phase 5: Filters, Search, Polish (1-2 days)

1. Filter panel
2. Global search
3. Toast notifications
4. Loading/empty states
5. Bug fixes and polish

**Total Estimated Time: 8-12 days**

## Testing Strategy

### Manual Testing Checklist

- [ ] All views (List, Board, Calendar) display correctly
- [ ] Task creation works with all fields
- [ ] Task editing updates immediately (optimistic UI)
- [ ] Task deletion with confirmation
- [ ] Drag-and-drop updates status
- [ ] Filters work correctly
- [ ] Search finds tasks by title/description
- [ ] Comments can be added and viewed
- [ ] User switcher changes current user
- [ ] Loading states show during async operations
- [ ] Error states handled gracefully
- [ ] Login/logout flow works

### User Testing Scenarios

1. **Scenario: New User Onboarding**
   - Login as new user
   - Browse existing tasks
   - Create first task
   - Update task status

2. **Scenario: Project Manager Daily Workflow**
   - View all team tasks
   - Filter by department
   - Identify overdue tasks
   - Reassign blocked tasks

3. **Scenario: Individual Contributor Task Management**
   - View "My Tasks"
   - Update task status to "In Progress"
   - Add progress comment
   - Mark task as done

## Deployment

### Prototype Hosting

**Recommended: Vercel** (Free tier)
- Automatic deployments from Git
- Preview URLs for each commit
- Zero configuration
- Fast CDN

**Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**Alternative: Netlify, Railway, or GitHub Pages**

## Success Metrics

### Prototype Acceptance Criteria

- [ ] Clickable prototype deployed and accessible via URL
- [ ] All P0 features functional (list, board, calendar, CRUD)
- [ ] Mock data realistic and diverse (30+ tasks)
- [ ] UI matches design vision (professional, modern)
- [ ] Stakeholder demo completed successfully
- [ ] User feedback collected (5+ users)
- [ ] Technical team alignment on APIs and data models
- [ ] Zero critical bugs in core flows

### Feedback Collection

**Questions to Ask Users:**
1. Is the navigation intuitive?
2. Can you easily find and update your tasks?
3. Are the filters helpful?
4. What's confusing or frustrating?
5. What features are you missing?
6. Would you use this daily?

## Transition to Production

After prototype validation:

1. **Backend Development** (Go + PostgreSQL)
   - RESTful API based on mock store interface
   - Database schema from data models
   - Authentication with JWT

2. **Frontend Integration**
   - Replace mock store with real API calls
   - Add error handling and retry logic
   - Implement proper state management

3. **AI Features** (Phase 2)
   - NLP task creation
   - Email/document parsing
   - Knowledge graph

## Prototyping Issues & Learnings

**Issues discovered during prototype development:**

### Issue #1: Tailwind CSS v4 Compatibility (2025-10-08)

**Problem:** Next.js 15.5.4 ships with Tailwind CSS v4 by default, but shadcn/ui currently expects Tailwind v3.x. This creates compatibility issues during `shadcn init`.

**Workaround:**
- Installed core dependencies manually (`zustand`, `date-fns`, `clsx`, `tailwind-merge`, `lucide-react`, `@dnd-kit/*`)
- Created custom UI components instead of using shadcn CLI
- Alternative: Could downgrade to Tailwind v3 if needed

**Impact:** Low - Can build components manually without shadcn CLI

**Status:** ✅ Resolved - Proceeding with manual component creation

---

### Issue #2: Missing Dashboard Page - 404 After Login (2025-10-08)

**Problem:** After successful login, app redirects to `/dashboard` but the page didn't exist yet, causing 404 error.

**Root Cause:** Development workflow - login page was created before dashboard page.

**Fix:**
- Created `src/app/dashboard/page.tsx` with temporary welcome screen
- Added user info display and logout functionality
- Includes "under construction" notice with upcoming features list

**Impact:** None - Fixed immediately

**Status:** ✅ Resolved

**Learning:** In Next.js App Router, all routes need a `page.tsx` file. Consider creating placeholder pages early to avoid navigation errors during development.

---

### Issue #3: Turbopack Module Resolution - Hot Reload Timing (2025-10-08)

**Problem:** After creating `TaskList.tsx`, Next.js dev server (with Turbopack) threw "Module not found" error despite file existing on disk.

**Error Message:**
```
Module not found: Can't resolve '@/components/tasks/TaskList'
```

**Root Cause:** Turbopack hot reload timing issue - the dev server hadn't picked up the newly created file yet.

**Fix:**
- Killed all running Next.js dev processes
- Restarted dev server with clean compilation
- Module resolved correctly after restart

**Impact:** Low - One-time restart resolved the issue

**Status:** ✅ Resolved

**Learning:** When creating new components, if Turbopack doesn't pick them up via hot reload, restart the dev server rather than debugging import paths. This is a known limitation of file-watching during rapid development.

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Sunny | Initial prototype specifications |
| 1.1 | 2025-10-08 | Sunny | Added prototyping issues section, documented Tailwind v4 issue |
| 1.2 | 2025-10-08 | Sunny | Documented Issues #2 and #3, updated responsive requirement |

## Related Documents

- [00 - INDEX](./00-INDEX.md)
- [01 - Core Data Models](./01-core-data-models.md)
- [02 - Task Management UI](./02-task-management-ui.md)
- [03 - Authentication & Authorization](./03-authentication-authorization.md)
- [09 - API Specification](./09-api-specification.md)
