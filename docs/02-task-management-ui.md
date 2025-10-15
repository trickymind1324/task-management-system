# FRD-02: Task Management UI

**Feature:** Task Management User Interface & Interactions

**Version:** 1.0

**Last Updated:** October 6, 2025

**Status:** Draft

**Priority:** P0 (Critical for Prototype)

---

## Overview

This document defines the user interface components, user flows, and interactions for the core task management functionality in Project Synapse. This is the primary interface where users will create, view, update, and organize their tasks.

## User Stories

### Project Manager (Bharath)

- As a project manager, I want to see all tasks across my team in a single dashboard so I can track progress
- As a project manager, I need to filter tasks by department, status, and assignee so I can identify bottlenecks
- As a project manager, I want to visualize task dependencies so I can understand project risks

### Individual Contributor (Sunny)

- As an individual contributor, I want a clean list of my assigned tasks so I know what to work on
- As an individual contributor, I need to quickly update task status and add comments
- As an individual contributor, I want to see my upcoming deadlines in a calendar view

### Department Head (Raghu)

- As a department head, I want a high-level overview of all departmental tasks
- As a department head, I need to see workload distribution across team members
- As a department head, I want to identify overdue and at-risk tasks

## Core UI Components

### 1. Main Dashboard

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Logo, Search, Notifications, User Menu)            │
├─────────┬───────────────────────────────────────────────────┤
│         │  Task View Tabs: [List] [Board] [Calendar]       │
│         ├───────────────────────────────────────────────────┤
│ Sidebar │                                                   │
│         │                                                   │
│ - Home  │         Main Task Content Area                    │
│ - My    │         (depends on selected view)                │
│   Tasks │                                                   │
│ - Dept  │                                                   │
│ - All   │                                                   │
│ - New + │                                                   │
│         │                                                   │
│ Filters │                                                   │
│ - Status│                                                   │
│ - Prior.│                                                   │
│ - Dept. │                                                   │
│ - Proj. │                                                   │
└─────────┴───────────────────────────────────────────────────┘
```

**Features:**
- Responsive design (desktop, tablet, mobile)
- Persistent sidebar navigation
- Quick action button (floating + button for new task)
- Global search bar
- Notification bell with unread count
- User profile menu

### 2. List View (Default)

**Description:** Table/list format showing tasks with key information

**Columns:**

| Column | Width | Sortable | Filterable |
|--------|-------|----------|------------|
| Checkbox (select) | 40px | No | No |
| Priority (icon) | 60px | Yes | Yes |
| Title | Flex | Yes | Yes |
| Assignee (avatar) | 120px | Yes | Yes |
| Status (badge) | 120px | Yes | Yes |
| Due Date | 100px | Yes | Yes |
| Department | 100px | Yes | Yes |
| Actions (menu) | 60px | No | No |

**Interaction Features:**
- Click row to open task details panel (side drawer)
- Hover row to highlight and show quick actions
- Multi-select checkboxes for bulk operations
- Drag-and-drop to reorder (when no sort applied)
- Inline status update dropdown
- Right-click context menu

**List View Mockup (Text):**

```
┌────────────────────────────────────────────────────────────────┐
│ [+ New Task]          🔍 Search tasks...     [Filter] [Sort]   │
├────────────────────────────────────────────────────────────────┤
│ ☐ 🔴 Design landing page mockups                               │
│     👤 Bharath    [In Progress ▼]  Oct 15  Marketing  •••        │
├────────────────────────────────────────────────────────────────┤
│ ☐ 🟡 Review Q4 budget proposal                                 │
│     👤 Sunny    [To Do ▼]         Oct 20  Finance   •••        │
├────────────────────────────────────────────────────────────────┤
│ ☐ 🟢 Update API documentation                                  │
│     👤 Raghu    [Done ✓]          Oct 10  Engineering •••      │
└────────────────────────────────────────────────────────────────┘
```

### 3. Board View (Kanban)

**Description:** Visual board with columns for each task status

**Columns:**
- To Do
- In Progress
- In Review
- Blocked (collapsible)
- Done (collapsible)

**Features:**
- Drag-and-drop tasks between columns (auto-updates status)
- Card shows: title, assignee avatar, due date, priority icon, tags
- Column headers show task count
- Swim lanes option (group by department/project)
- WIP limits (visual warning when column exceeds limit)

**Board View Mockup (Text):**

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  To Do (5)   │ In Progress  │  In Review   │   Done (12)  │
│              │     (3)      │     (2)      │  [Collapsed] │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │              │
│ │Design LP  │ │ │API Tests │ │ │Security  │ │              │
│ │👤 Bharath   │ │ │👤 Sunny  │ │ │Audit     │ │              │
│ │🔴 Oct 15  │ │ │🟡 Oct 18 │ │ │👤 Raghu  │ │              │
│ └──────────┘ │ └──────────┘ │ │🟢 Oct 22 │ │              │
│              │              │ └──────────┘ │              │
│ ┌──────────┐ │ ┌──────────┐ │              │              │
│ │Budget    │ │ │Dashboard │ │              │              │
│ │Review    │ │ │Update    │ │              │              │
│ │👤 Sunny  │ │ │👤 Bharath  │ │              │              │
│ │🟡 Oct 20 │ │ │🔴 Oct 16 │ │              │              │
│ └──────────┘ │ └──────────┘ │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### 4. Calendar View

**Description:** Monthly calendar showing tasks by due date

**Features:**
- Month/Week/Day view toggles
- Color-coded by priority or department
- Click date to see all tasks due that day
- Drag tasks to reschedule
- Today indicator
- Overdue tasks highlighted in red
- Multiple tasks on same date stacked with "+N more" indicator

**Calendar View Mockup (Text):**

```
┌─────────────────────── October 2025 ───────────────────────┐
│  Sun    Mon    Tue    Wed    Thu    Fri    Sat             │
├─────────────────────────────────────────────────────────────┤
│   1      2      3      4      5      6      7              │
│                                                             │
│   8      9     [10]    11     12     13     14             │
│              • API    • Design  • Budget                    │
│                Docs     LP       +2                         │
│  15     16     17     18     19     20     21              │
│ • Design • Dash • API  • Tests                             │
│   LP      +1     Upd                                        │
└─────────────────────────────────────────────────────────────┘
```

### 5. Task Detail Panel (Side Drawer)

**Description:** Slide-in panel from right side showing full task details

**Sections (top to bottom):**

1. **Header**
   - Close button (×)
   - Task title (editable inline)
   - Priority selector
   - Status dropdown
   - More actions menu (•••)

2. **Metadata Bar**
   - Created by: [User] on [Date]
   - Last updated: [Date]
   - Source: [Icon + label]

3. **Main Content**
   - Description (markdown editor)
   - Assignees (multi-select dropdown with avatars)
   - Due date (date picker)
   - Department (dropdown)
   - Project (dropdown, optional)
   - Tags (multi-select with autocomplete)

4. **Relationships**
   - Dependencies (list with links to tasks)
   - Blocked tasks (list with links)
   - Parent task (if subtask)
   - Subtasks (expandable list)

5. **Attachments**
   - File upload area
   - List of attached files with preview/download

6. **Comments**
   - Comment thread (chronological)
   - Rich text editor for new comment
   - @mention support
   - Reactions (👍 ❤️ 🎉)

7. **Activity Log**
   - Chronological history of changes
   - Who changed what and when

**Task Detail Mockup (Text):**

```
┌───────────────────────────────────────────────────────┐
│ ✕                                    [•••]            │
│ Design landing page mockups                           │
│ 🔴 High    [In Progress ▼]                            │
│                                                        │
│ Created by Bharath on Oct 1, 2025                       │
│ Last updated: 2 hours ago  📧 Email                   │
│────────────────────────────────────────────────────────│
│                                                        │
│ Description                                            │
│ ┌────────────────────────────────────────────────┐   │
│ │ Create high-fidelity mockups for the new       │   │
│ │ product landing page including:                │   │
│ │ - Hero section                                 │   │
│ │ - Feature highlights                           │   │
│ │ - CTA buttons                                  │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Assignees: 👤 Bharath  👤 Sunny  [+ Add]                │
│ Due Date: Oct 15, 2025 📅                              │
│ Department: Marketing ▼                                │
│ Project: Website Redesign ▼                            │
│ Tags: [design] [landing-page] [ui] [+ Add tag]        │
│                                                        │
│ Dependencies                                           │
│ ├─ ✓ Branding guidelines finalized                    │
│ └─ ⏳ User research synthesis (In Progress)           │
│                                                        │
│ Attachments (2)                                        │
│ 📎 wireframes.fig (2.3 MB)                            │
│ 📎 brand-assets.zip (5.1 MB)                          │
│                                                        │
│ Comments (3)                                           │
│ ┌────────────────────────────────────────────────┐   │
│ │ Bharath • 1 hour ago                             │   │
│ │ First draft is ready for review!              │   │
│ │ 👍 2  💬 Reply                                 │   │
│ └────────────────────────────────────────────────┘   │
│ [Write a comment...]                                   │
└───────────────────────────────────────────────────────┘
```

### 6. Task Creation Modal

**Description:** Modal dialog for creating a new task

**Fields:**
- Title (required, autofocus)
- Description (rich text editor)
- Priority (buttons: Low, Medium, High, Urgent)
- Status (dropdown, default: To Do)
- Assignees (multi-select)
- Due date (date picker)
- Department (dropdown)
- Project (dropdown, optional)
- Tags (multi-select with autocomplete)

**Actions:**
- [Cancel] [Save as Draft] [Create Task]
- Keyboard shortcuts: Esc to cancel, Cmd/Ctrl+Enter to create

**Quick Create:** Minimal form with just Title + Assignee + Due Date, other fields optional

### 7. Filters & Search

**Global Search:**
- Search across task titles, descriptions, comments
- Search syntax: `assignee:Bharath status:in-progress priority:high`
- Recent searches saved
- Search suggestions as you type

**Filters Panel (Sidebar):**
- Status (multi-select checkboxes)
- Priority (multi-select checkboxes)
- Department (multi-select)
- Project (multi-select)
- Assignee (multi-select with avatars)
- Due date (ranges: Today, This week, This month, Overdue, Custom)
- Tags (multi-select with autocomplete)
- Created by (multi-select)
- Source (multi-select)

**Active Filters Display:**
- Show chips above task list: `[Status: In Progress ✕] [Priority: High ✕]`
- Clear all filters button

### 8. Bulk Operations

**Available Actions:**
- Update status
- Change priority
- Assign/Reassign
- Add tags
- Move to project
- Change department
- Delete tasks

**UI:**
- Checkbox column in list view
- "Select All" checkbox in header
- Bulk action toolbar appears when tasks selected
- Confirmation dialog for destructive actions

## User Flows

### Flow 1: Create a New Task

1. User clicks "+ New Task" button (header, sidebar, or floating action button)
2. Task creation modal opens
3. User enters title (required) and optionally fills other fields
4. User clicks "Create Task"
5. Task is added to the list/board
6. Success notification appears: "Task created successfully"
7. Modal closes, user sees the new task in the list

**Alternative:** Quick create from list (inline form at top)

### Flow 2: Update Task Status

**From List View:**
1. User clicks status dropdown in the row
2. Dropdown menu appears with status options
3. User selects new status
4. Status updates immediately (no save button)
5. Toast notification: "Status updated to [new status]"

**From Board View:**
1. User drags task card to different column
2. Card moves to new column
3. Backend updates status automatically
4. Visual feedback (card animates into position)

### Flow 3: View Task Details

1. User clicks on task title/row
2. Side drawer slides in from right
3. Full task details load
4. User can edit fields inline
5. Changes auto-save after brief delay (debounced)
6. User closes drawer by clicking X, pressing Esc, or clicking outside

### Flow 4: Filter Tasks

1. User clicks filter dropdown/panel
2. User selects filter criteria (e.g., Status: In Progress)
3. Task list updates to show only matching tasks
4. Filter chip appears above list
5. User can add more filters or remove existing ones
6. URL updates to reflect filters (shareable, bookmarkable)

### Flow 5: Add Comment to Task

1. User opens task detail panel
2. Scrolls to Comments section
3. Clicks in comment text box
4. Types comment (markdown supported)
5. Can @mention other users (autocomplete dropdown)
6. Clicks "Post Comment" or presses Cmd/Ctrl+Enter
7. Comment appears in thread immediately
8. Mentioned users receive notification

## UI Design Principles

### Visual Hierarchy

- **Priority indicators:** Red (Urgent), Orange (High), Yellow (Medium), Green (Low)
- **Status badges:** Color-coded with icons
- **Typography:** Clear heading levels, readable body text (16px minimum)

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support (Tab, Arrow keys, Enter, Esc)
- Screen reader friendly (ARIA labels)
- Focus indicators visible
- Sufficient color contrast (4.5:1 minimum)
- Support for reduced motion preferences

### Responsive Design

**Desktop (>1024px):**
- Full sidebar + main content area
- Multi-column layouts
- Hover states and tooltips

**Tablet (768px - 1024px):**
- Collapsible sidebar (hamburger menu)
- Simplified columns
- Touch-friendly tap targets (min 44x44px)

**Mobile (<768px):**
- Bottom navigation bar
- Single column layouts
- Swipe gestures (e.g., swipe right to complete)
- Full-screen modals instead of drawers

### Performance

- Virtual scrolling for large task lists (>100 items)
- Lazy loading for images and attachments
- Skeleton loaders while fetching data
- Optimistic UI updates (show changes immediately, sync in background)

## Prototype Scope

### For Prototype Phase

**Include:**
- List view (fully functional)
- Board view (fully functional)
- Calendar view (read-only, basic)
- Task detail panel (all sections)
- Task creation modal
- Basic filters (status, priority, assignee)
- Global search (client-side only)
- Mock data (20-30 tasks)
- Desktop layout only
- Light theme only

**Exclude:**
- Mobile responsive views (desktop only for prototype)
- Dark theme
- Advanced search syntax
- Real-time collaboration
- Notifications
- File uploads (show mock attachments only)
- Activity log (show mock data)
- Keyboard shortcuts (except basic Esc, Enter)
- Accessibility features beyond basics
- Performance optimizations (virtual scrolling, etc.)

## Technology Stack (Prototype)

- **Framework:** Next.js 14+ with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand or React Context
- **Date Handling:** date-fns
- **Rich Text Editor:** Tiptap or react-quill
- **Icons:** Lucide React or Heroicons
- **Drag-and-Drop:** @dnd-kit/core
- **Calendar:** react-big-calendar or custom

## Component Structure

```
components/
├── dashboard/
│   ├── DashboardLayout.tsx       // Main layout wrapper
│   ├── Header.tsx                // Top header with search, notifications
│   ├── Sidebar.tsx               // Left navigation sidebar
│   └── QuickActions.tsx          // Floating action button
├── tasks/
│   ├── TaskList.tsx              // List view component
│   ├── TaskBoard.tsx             // Kanban board view
│   ├── TaskCalendar.tsx          // Calendar view
│   ├── TaskCard.tsx              // Single task card (for board)
│   ├── TaskRow.tsx               // Single task row (for list)
│   ├── TaskDetailPanel.tsx       // Side drawer with full details
│   ├── TaskCreateModal.tsx       // Create task modal
│   └── TaskFilters.tsx           // Filter panel
├── common/
│   ├── PriorityBadge.tsx         // Priority indicator
│   ├── StatusBadge.tsx           // Status badge
│   ├── UserAvatar.tsx            // User avatar component
│   ├── DatePicker.tsx            // Date selector
│   └── SearchBar.tsx             // Global search
└── ui/                           // shadcn/ui base components
    ├── button.tsx
    ├── dropdown-menu.tsx
    ├── dialog.tsx
    └── ...
```

## Acceptance Criteria

- [ ] All three view modes (List, Board, Calendar) are functional
- [ ] Users can create, read, update tasks via the UI
- [ ] Task detail panel shows all task information
- [ ] Filters work correctly (status, priority, assignee)
- [ ] Board view supports drag-and-drop status changes
- [ ] Search filters tasks by title and description
- [ ] UI is responsive on desktop (1920x1080, 1366x768)
- [ ] Loading states display correctly
- [ ] Error states are handled gracefully
- [ ] UI matches design mockups (once created)

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Sunny | Initial draft with all UI specifications |

## Related Documents

- [00 - INDEX](./00-INDEX.md)
- [01 - Core Data Models](./01-core-data-models.md)
- [03 - Authentication & Authorization](./03-authentication-authorization.md)
- [10 - Prototype Specifications](./10-prototype-specifications.md)
