# Project Synapse - Frontend (Next.js Production App)

**Last Updated:** October 13, 2025

---

## About This Directory

The `frontend/` folder contains the production Next.js frontend for Project Synapse - a modern, responsive web application for intelligent task management.

---

## 🎯 Frontend Overview

### Purpose
Production-grade Next.js application providing:
- Responsive task management UI (List, Board, Calendar views)
- Real-time collaboration features
- AI-powered task creation interface
- Knowledge graph visualizations
- Analytics dashboards
- Mobile-responsive design

### Tech Stack
- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand
- **Data Fetching:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod validation
- **Date Handling:** date-fns
- **Rich Text Editor:** Tiptap
- **Drag-and-Drop:** @dnd-kit/core
- **Graph Visualization:** react-flow
- **Charts:** Recharts
- **Icons:** Lucide React

---

## 📁 Project Structure

```
frontend/
├── CLAUDE.md                       # This file
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── tailwind.config.ts              # Tailwind configuration
├── next.config.js                  # Next.js configuration
├── .env.local                      # Environment variables
├── public/
│   ├── favicon.ico
│   └── assets/
├── src/
│   ├── app/                        # App Router pages
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home/Dashboard page
│   │   ├── tasks/
│   │   │   ├── page.tsx            # Task list page
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Task detail page
│   │   ├── projects/
│   │   │   ├── page.tsx            # Projects page
│   │   │   └── [id]/page.tsx       # Project detail page
│   │   ├── analytics/
│   │   │   └── page.tsx            # Analytics dashboard
│   │   └── login/
│   │       └── page.tsx            # Login page
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx # Main layout wrapper
│   │   │   ├── Header.tsx          # Top header with search
│   │   │   ├── Sidebar.tsx         # Left navigation
│   │   │   └── QuickActions.tsx    # Floating action button
│   │   ├── tasks/
│   │   │   ├── TaskList.tsx        # List view component
│   │   │   ├── TaskBoard.tsx       # Kanban board view
│   │   │   ├── TaskCalendar.tsx    # Calendar view
│   │   │   ├── TaskCard.tsx        # Task card (board)
│   │   │   ├── TaskRow.tsx         # Task row (list)
│   │   │   ├── TaskDetailPanel.tsx # Side drawer
│   │   │   ├── TaskCreateModal.tsx # Create task modal
│   │   │   ├── TaskFilters.tsx     # Filter panel
│   │   │   └── TaskComments.tsx    # Comments section
│   │   ├── ai/
│   │   │   ├── NLPInput.tsx        # Natural language input
│   │   │   ├── TaskSuggestions.tsx # AI suggestions
│   │   │   └── ConfirmationCard.tsx # AI task confirmation
│   │   ├── graph/
│   │   │   ├── DependencyGraph.tsx # Dependency visualization
│   │   │   └── CollaborationGraph.tsx # Team collaboration
│   │   ├── analytics/
│   │   │   ├── TaskMetrics.tsx     # Task statistics
│   │   │   ├── TeamPerformance.tsx # Team charts
│   │   │   └── DepartmentInsights.tsx # Dept analytics
│   │   ├── common/
│   │   │   ├── PriorityBadge.tsx   # Priority indicator
│   │   │   ├── StatusBadge.tsx     # Status badge
│   │   │   ├── UserAvatar.tsx      # User avatar
│   │   │   ├── DatePicker.tsx      # Date selector
│   │   │   ├── SearchBar.tsx       # Global search
│   │   │   └── LoadingSpinner.tsx  # Loading states
│   │   └── ui/                     # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── toast.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts           # API client setup
│   │   │   ├── tasks.ts            # Task API calls
│   │   │   ├── users.ts            # User API calls
│   │   │   ├── auth.ts             # Auth API calls
│   │   │   └── projects.ts         # Project API calls
│   │   ├── hooks/
│   │   │   ├── useTasks.ts         # Task data hooks
│   │   │   ├── useAuth.ts          # Auth hooks
│   │   │   ├── useFilters.ts       # Filter hooks
│   │   │   └── useDebounce.ts      # Utility hooks
│   │   ├── stores/
│   │   │   ├── authStore.ts        # Auth state (Zustand)
│   │   │   ├── taskStore.ts        # Task state
│   │   │   └── filterStore.ts      # Filter state
│   │   ├── utils/
│   │   │   ├── date.ts             # Date formatting
│   │   │   ├── validation.ts       # Zod schemas
│   │   │   ├── formatters.ts       # Data formatters
│   │   │   └── constants.ts        # App constants
│   │   └── types/
│   │       ├── task.ts             # Task types
│   │       ├── user.ts             # User types
│   │       ├── api.ts              # API response types
│   │       └── index.ts            # Exported types
│   └── styles/
│       └── globals.css             # Global styles
└── tests/
    ├── components/
    │   └── TaskList.test.tsx       # Component tests
    └── integration/
        └── task-flow.test.tsx      # Integration tests
```

---

## 🔧 Development Rules

### Code Style
- Use functional components with hooks (no class components)
- Use TypeScript strict mode
- Prefer named exports over default exports
- Use absolute imports with `@/` prefix
- Keep components small and focused (<200 lines)
- Extract reusable logic into custom hooks
- Use kebab-case for file names (except components: PascalCase)

### Component Patterns
```tsx
// Good: Functional component with TypeScript
interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="task-card">
      {/* Component JSX */}
    </div>
  );
}

// Bad: Avoid default exports and any types
export default function TaskCard(props: any) { ... }
```

### State Management
```tsx
// Use Zustand for global state
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    // API call
    const { user, token } = await api.login(email, password);
    set({ user, token });
  },
  logout: () => set({ user: null, token: null }),
}));

// Use React Query for server state
const { data: tasks, isLoading, error } = useQuery({
  queryKey: ['tasks', filters],
  queryFn: () => api.getTasks(filters),
});
```

### API Integration
```tsx
// Use React Query for data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch tasks
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.getTasks(filters),
    staleTime: 30000, // 30 seconds
  });
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: NewTask) => api.createTask(task),
    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

### Form Validation
```tsx
// Use React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  due_date: z.date().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export function TaskForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  const onSubmit = (data: TaskFormData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      {/* Other fields */}
    </form>
  );
}
```

### Styling Guidelines
```tsx
// Use Tailwind classes with cn() utility for conditional styles
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isError && "error-classes"
)} />

// Use CSS variables for theme colors (defined in globals.css)
// Use shadcn/ui components as building blocks
// Follow mobile-first responsive design
```

---

## 🎨 UI/UX Requirements (from FRD-02)

### View Modes
1. **List View**: Table format with sortable columns, filters, bulk actions
2. **Board View**: Kanban board with drag-and-drop status changes
3. **Calendar View**: Monthly calendar showing tasks by due date

### Responsive Breakpoints
- **Desktop**: ≥1024px (full sidebar, multi-column layouts)
- **Tablet**: 768px-1023px (collapsible sidebar, simplified columns)
- **Mobile**: <768px (bottom nav, single column, swipe gestures)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation (Tab, Arrow keys, Enter, Esc)
- Screen reader support (ARIA labels)
- Focus indicators visible
- Color contrast 4.5:1 minimum
- Support for reduced motion

### Performance
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Lighthouse score: >90
- Virtual scrolling for lists >100 items
- Image optimization (Next.js Image component)
- Code splitting per route

---

## 🔐 Authentication Flow

### Login Process
```tsx
// Login page
export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      toast.error('Invalid credentials');
    }
  };

  return <LoginForm onSubmit={onSubmit} />;
}

// Protected route wrapper
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  if (!token) return null;

  return <>{children}</>;
}
```

### JWT Token Management
- Store JWT token in Zustand + localStorage
- Include token in API request headers
- Auto-refresh token before expiry
- Redirect to login on 401 response
- Clear token on logout

---

## 🤖 AI Features Integration (Phase 2)

### Natural Language Task Creation
```tsx
// NLP input component
export function NLPInput() {
  const [input, setInput] = useState('');
  const { mutate: parseText } = useMutation({
    mutationFn: (text: string) => api.parseNaturalLanguage(text),
    onSuccess: (task) => {
      // Show confirmation modal with extracted task
      openTaskConfirmation(task);
    },
  });

  return (
    <div className="nlp-input">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your task in plain English..."
      />
      <button onClick={() => parseText(input)}>
        Create Task
      </button>
    </div>
  );
}

// Task confirmation modal
export function TaskConfirmationModal({ task, confidenceScore }: Props) {
  return (
    <Dialog>
      <div>
        <h3>Review AI-extracted task</h3>
        <p>Confidence: {(confidenceScore * 100).toFixed(0)}%</p>
        {/* Editable task fields */}
        <button onClick={handleApprove}>Create Task</button>
        <button onClick={handleReject}>Cancel</button>
      </div>
    </Dialog>
  );
}
```

### Email Integration UI
- OAuth flow for Gmail/Outlook connection
- Email list view with task extraction
- Preview extracted tasks before creation
- Bulk approve/reject interface

### Document Upload & Analysis
- Drag-and-drop file upload
- Processing progress indicator
- Review extracted tasks interface
- Attach original document to tasks

---

## 📊 Knowledge Graph Visualization (Phase 2)

### Dependency Graph
```tsx
import ReactFlow, { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

export function DependencyGraph({ taskId }: { taskId: string }) {
  const { data: dependencies } = useQuery({
    queryKey: ['dependencies', taskId],
    queryFn: () => api.getDependencies(taskId),
  });

  const nodes: Node[] = dependencies.map(task => ({
    id: task.id,
    data: { label: task.title },
    position: { x: 0, y: 0 }, // Layout algorithm will position
  }));

  const edges: Edge[] = dependencies.flatMap(task =>
    task.depends_on.map(depId => ({
      id: `${task.id}-${depId}`,
      source: task.id,
      target: depId,
    }))
  );

  return (
    <div style={{ height: '600px' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView />
    </div>
  );
}
```

---

## 📈 Analytics Dashboard

### Task Metrics
```tsx
import { BarChart, LineChart, PieChart } from 'recharts';

export function TaskMetrics() {
  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => api.getTaskMetrics(),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Stat cards */}
      <StatCard
        title="Total Tasks"
        value={metrics.total}
        change="+12%"
      />

      {/* Charts */}
      <div className="col-span-2">
        <h3>Tasks by Status</h3>
        <BarChart data={metrics.byStatus} />
      </div>

      <div className="col-span-2">
        <h3>Completion Trend</h3>
        <LineChart data={metrics.completionTrend} />
      </div>
    </div>
  );
}
```

---

## 🧪 Testing

### Component Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/tasks/TaskCard';

describe('TaskCard', () => {
  it('renders task title', () => {
    const task = { id: '1', title: 'Test Task', status: 'To Do' };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('calls onUpdate when status changes', () => {
    const task = { id: '1', title: 'Test Task', status: 'To Do' };
    const onUpdate = jest.fn();
    render(<TaskCard task={task} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('To Do'));
    fireEvent.click(screen.getByText('In Progress'));

    expect(onUpdate).toHaveBeenCalledWith({ ...task, status: 'In Progress' });
  });
});
```

### Integration Tests
- Test complete user flows (create task, update status, add comment)
- Mock API responses with MSW
- Test authentication flows
- Test error handling

### E2E Tests (Optional)
- Use Playwright or Cypress
- Test critical user journeys
- Run before production deployment

---

## 🚀 Development Workflow

### Initial Setup
```bash
# Create Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app

# Install dependencies
cd frontend
npm install zustand @tanstack/react-query react-hook-form zod
npm install @dnd-kit/core date-fns lucide-react
npm install reactflow recharts tiptap

# Add shadcn/ui
npx shadcn-ui@latest init

# Start development server
npm run dev
```

### Development Commands
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run type check
npm run type-check

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI Services (Phase 2)
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# OAuth (Phase 2)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=
```

---

## 🎯 Component Guidelines

### Component Size
- Keep components under 200 lines
- Extract complex logic into hooks
- Split large components into smaller ones
- Use composition over props drilling

### Props Patterns
```tsx
// Good: Explicit props with TypeScript
interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isLoading?: boolean;
}

// Bad: Spreading unknown props
interface TaskListProps {
  [key: string]: any;
}
```

### Hook Guidelines
```tsx
// Custom hooks must start with "use"
// Extract complex logic into custom hooks
// Keep hooks focused on single responsibility

export function useTaskFilters() {
  const [filters, setFilters] = useState<TaskFilters>({});

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters({});

  return { filters, updateFilter, clearFilters };
}
```

---

## 🎨 Design System

### Colors (from Tailwind config)
```ts
// Priority colors
urgent: 'red.500'      // #ef4444
high: 'orange.500'     // #f97316
medium: 'yellow.500'   // #eab308
low: 'green.500'       // #22c55e

// Status colors
todo: 'gray.500'       // #6b7280
inProgress: 'blue.500' // #3b82f6
inReview: 'purple.500' // #a855f7
blocked: 'red.500'     // #ef4444
done: 'green.500'      // #22c55e
```

### Typography
```tsx
// Heading levels
<h1 className="text-3xl font-bold">      // Page title
<h2 className="text-2xl font-semibold">  // Section title
<h3 className="text-xl font-semibold">   // Subsection title
<p className="text-base">                // Body text
<span className="text-sm text-gray-600"> // Secondary text
```

### Spacing
- Use Tailwind spacing scale (4px base unit)
- Consistent padding: `p-4` for cards, `p-6` for modals
- Consistent gaps: `gap-4` for grids, `gap-2` for inline items

---

## 📱 Responsive Design

### Mobile Considerations
- Bottom navigation bar on mobile
- Swipe gestures for actions
- Full-screen modals (not drawers)
- Larger touch targets (min 44x44px)
- Simplified layouts (single column)

### Tablet Considerations
- Collapsible sidebar (hamburger menu)
- Touch-friendly interactions
- Adaptive layouts (2 columns where appropriate)

### Desktop Considerations
- Full sidebar navigation
- Multi-column layouts
- Hover states and tooltips
- Keyboard shortcuts

---

## 🔍 Search & Filters

### Global Search
```tsx
// Debounced search input
export function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: results } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.searchTasks(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  return (
    <div className="search-bar">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tasks..."
      />
      {results && <SearchResults results={results} />}
    </div>
  );
}
```

### Filter Panel
- Multi-select filters (status, priority, department)
- Date range filters
- Tag filters with autocomplete
- Active filter chips with remove button
- Clear all filters button
- URL sync for shareable filtered views

---

## 🔔 Notifications & Toasts

### Toast Notifications
```tsx
import { toast } from '@/components/ui/toast';

// Success
toast.success('Task created successfully');

// Error
toast.error('Failed to update task');

// Info
toast.info('Task assigned to you');

// Loading
const toastId = toast.loading('Creating task...');
// Later
toast.success('Task created', { id: toastId });
```

### Real-time Updates (Phase 2)
- WebSocket connection for live updates
- Optimistic UI updates
- Conflict resolution
- Connection status indicator

---

## 🚦 Loading States

### Skeleton Loaders
```tsx
// Use skeleton components while loading
export function TaskListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-16 w-full" />
      ))}
    </div>
  );
}

// Usage in component
export function TaskList() {
  const { data: tasks, isLoading } = useTasks();

  if (isLoading) return <TaskListSkeleton />;

  return <div>{/* Render tasks */}</div>;
}
```

### Progress Indicators
- Spinner for button actions
- Progress bar for file uploads
- Skeleton screens for page loads
- Loading overlay for full-page operations

---

## ⚠️ Error Handling

### Error Boundaries
```tsx
'use client'; // Required for error boundaries in Next.js App Router

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error caught by boundary:', error);
  }, [error]);

  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### API Error Handling
```tsx
// Handle API errors consistently
const { data, error, isError } = useTasks();

if (isError) {
  if (error.response?.status === 401) {
    // Redirect to login
    router.push('/login');
  } else if (error.response?.status === 403) {
    return <div>Access denied</div>;
  } else {
    toast.error(error.message || 'Something went wrong');
  }
}
```

---

## 📚 Related Documentation

- **[Root CLAUDE.md](../CLAUDE.md)**: Project-wide rules
- **[docs/02-task-management-ui.md](../docs/02-task-management-ui.md)**: UI specifications
- **[docs/09-api-specification.md](../docs/09-api-specification.md)**: API contracts
- **[backend/CLAUDE.md](../backend/CLAUDE.md)**: Backend integration
- **[prototype/](../prototype/)**: Reference implementation

---

## ✅ Definition of Done

Before considering a frontend feature complete:

- [ ] Component follows TypeScript strict mode
- [ ] Responsive on all breakpoints (mobile, tablet, desktop)
- [ ] Accessible (keyboard navigation, ARIA labels)
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Unit tests written and passing
- [ ] Integration with backend API tested
- [ ] No TypeScript errors or warnings
- [ ] Passes ESLint checks
- [ ] Performance tested (Lighthouse score >90)
- [ ] Code reviewed by peer

---

## 🎯 Current Status

**Phase:** Not started (prototype uses different structure in `/prototype`)

**Next Steps:**
1. Initialize Next.js project with TypeScript
2. Set up Tailwind CSS and shadcn/ui
3. Configure Zustand and React Query
4. Implement authentication flow
5. Build task list view with API integration
6. Build board view with drag-and-drop
7. Build task detail panel
8. Add filters and search
9. Implement responsive design

---

**Remember:** This is the user-facing application. Prioritize UX, performance, and accessibility.

