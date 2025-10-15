// ABOUTME: Core TypeScript type definitions for Project Synapse
// ABOUTME: Defines interfaces for Task, User, Department, Project and all related entities

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Blocked' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskSource = 'GUI' | 'Email' | 'API' | 'Document' | 'NLP';
export type UserRole = 'Admin' | 'Manager' | 'Member' | 'Viewer';
export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';

// ============================================================================
// ATTACHMENT
// ============================================================================

export interface Attachment {
  file_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: Date;
  uploaded_by: string;
  url: string;
}

// ============================================================================
// COMMENT
// ============================================================================

export interface Comment {
  comment_id: string;
  task_id: string;
  author: string;
  content: string;
  created_at: Date;
  updated_at: Date | null;
  is_edited: boolean;
}

// ============================================================================
// RECURRENCE
// ============================================================================

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: Date;
  occurrences?: number;
}

// ============================================================================
// TASK
// ============================================================================

export interface Task {
  task_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
  creator: string;
  department: string | null;
  creation_date: Date;
  due_date: Date | null;
  completion_date: Date | null;
  last_modified: Date;
  project: string | null;
  dependencies: string[];
  blocks: string[];
  parent_task: string | null;
  source: TaskSource;
  attachments: Attachment[];
  tags: string[];
  confidence_score: number | null;
  comments: Comment[];
  metadata: Record<string, any>;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  next_occurrence?: Date;
  skip_dates?: string[];
}

// ============================================================================
// USER
// ============================================================================

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  date_format: string;
  default_view: 'list' | 'board' | 'calendar';
}

export interface NotificationSettings {
  email_notifications: boolean;
  task_assigned: boolean;
  task_due_soon: boolean;
  task_completed: boolean;
  mentions: boolean;
  digest_frequency: 'none' | 'daily' | 'weekly';
}

export interface User {
  user_id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  job_title: string | null;
  department: string | null;
  is_active: boolean;
  email_verified: boolean;
  last_login: Date | null;
  role: UserRole;
  permissions: string[];
  created_at: Date;
  updated_at: Date;
  preferences: UserPreferences;
  notification_settings: NotificationSettings;
}

// ============================================================================
// DEPARTMENT
// ============================================================================

export interface Department {
  department_id: string;
  name: string;
  parent_department: string | null;
  department_head: string | null;
  members: string[];
  description: string | null;
  color: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// ============================================================================
// PROJECT
// ============================================================================

export interface Project {
  project_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress_percentage: number;
  owner: string;
  team_members: string[];
  departments: string[];
  start_date: Date | null;
  target_end_date: Date | null;
  actual_end_date: Date | null;
  created_at: Date;
  updated_at: Date;
  tasks: string[];
  tags: string[];
  color: string;
  metadata: Record<string, any>;
}

// ============================================================================
// TAG
// ============================================================================

export interface Tag {
  tag_id: string;
  name: string;
  color: string;
  created_by: string;
  usage_count: number;
  created_at: Date;
}

// ============================================================================
// FILTERS & QUERIES
// ============================================================================

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignees?: string[];
  department?: string;
  project?: string;
  due_date_from?: Date;
  due_date_to?: Date;
  search?: string;
  tags?: string[];
  creator?: string;
  source?: TaskSource[];
}

export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface SortParams {
  field: keyof Task;
  direction: 'asc' | 'desc';
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface APIResponse<T> {
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
    total_pages?: number;
    timestamp: string;
  };
}

// ============================================================================
// CREATE/UPDATE DTOs
// ============================================================================

export type CreateTaskDTO = Omit<Task, 'task_id' | 'creation_date' | 'last_modified' | 'comments' | 'completion_date'>;

export type UpdateTaskDTO = Partial<Omit<Task, 'task_id' | 'creation_date' | 'creator'>>;

export type CreateCommentDTO = Omit<Comment, 'comment_id' | 'created_at' | 'updated_at' | 'is_edited'>;

// ============================================================================
// VIEW TYPES
// ============================================================================

export type ViewMode = 'list' | 'board' | 'calendar';

export interface TaskViewSettings {
  mode: ViewMode;
  filters: TaskFilters;
  sort?: SortParams;
  show_completed: boolean;
}
