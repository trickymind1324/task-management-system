# PostgreSQL Database Architecture Plan
## Project Synapse - Phase 1 Production Database Design

**Author:** PostgreSQL Database Architect
**Date:** October 14, 2025
**Version:** 1.0
**Status:** Architecture Planning

---

## Executive Summary

This document provides a comprehensive PostgreSQL database architecture for Project Synapse, designed to support:

- **100,000+ tasks** with sub-50ms query performance
- **2,000 concurrent users** with optimal connection pooling
- **Email integration** with OAuth token storage
- **Recurring tasks** with efficient cron-based generation
- **RBAC** with role-based data access patterns
- **Self-hosted deployment** with backup and HA strategies

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **PostgreSQL 15+** | Native JSONB, better partitioning, improved query planner |
| **UUID Primary Keys** | Distributed generation, no collisions, security |
| **JSONB for Metadata** | Flexibility for custom fields, efficient indexing with GIN |
| **Array Types for Tags** | Native array support, GIN indexes for fast lookups |
| **Partitioning Strategy** | Time-based partitioning for tasks (future scalability) |
| **Connection Pooling** | PgBouncer with transaction pooling (max 25 connections) |

---

## Table of Contents

1. [Schema Design](#schema-design)
2. [Indexing Strategy](#indexing-strategy)
3. [Query Optimization](#query-optimization)
4. [Connection Pooling](#connection-pooling)
5. [Partitioning Strategy](#partitioning-strategy)
6. [Backup & Recovery](#backup--recovery)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Performance Targets](#performance-targets)

---

## 1. Schema Design

### 1.1 Core Principles

1. **Normalization with Strategic Denormalization**
   - Normalize to 3NF for data integrity
   - Denormalize selectively for read performance (e.g., task assignees stored as JSONB array for quick lookups)

2. **Use Native PostgreSQL Features**
   - JSONB for flexible metadata
   - Arrays for tags and simple lists
   - Full-text search with tsvector
   - Partial indexes for conditional queries
   - GIN indexes for JSON and array searches

3. **Immutable Audit Trail**
   - Use `created_at` (immutable)
   - Use `updated_at` (auto-updated via trigger)
   - Separate audit_logs table for compliance

---

### 1.2 Database Schema

#### Users Table
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    job_title VARCHAR(100),

    -- Authentication
    password_hash VARCHAR(255),  -- bcrypt hash
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    last_login TIMESTAMPTZ,

    -- Authorization
    role VARCHAR(20) NOT NULL DEFAULT 'Member',
    permissions JSONB DEFAULT '[]'::jsonb NOT NULL,

    -- External IDs (for SSO)
    keycloak_id VARCHAR(255) UNIQUE,
    zoho_id VARCHAR(255) UNIQUE,

    -- Organization
    department_id UUID REFERENCES departments(department_id),

    -- Preferences (JSONB for flexibility)
    preferences JSONB DEFAULT '{
        "theme": "auto",
        "language": "en",
        "timezone": "UTC",
        "date_format": "YYYY-MM-DD",
        "default_view": "list"
    }'::jsonb NOT NULL,

    notification_settings JSONB DEFAULT '{
        "email_notifications": true,
        "task_assigned": true,
        "task_due_soon": true,
        "task_completed": true,
        "mentions": true,
        "digest_frequency": "daily"
    }'::jsonb NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT users_role_check CHECK (role IN ('Admin', 'Manager', 'Member', 'Viewer')),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_department ON users(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_keycloak ON users(keycloak_id) WHERE keycloak_id IS NOT NULL;
CREATE INDEX idx_users_zoho ON users(zoho_id) WHERE zoho_id IS NOT NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- Full-text search
CREATE INDEX idx_users_search ON users USING GIN(
    to_tsvector('english', full_name || ' ' || username || ' ' || email)
);
```

**Design Notes:**
- **UUID Primary Keys**: Prevents enumeration attacks, allows distributed generation
- **Partial Indexes**: `WHERE is_active = TRUE` reduces index size by 50%+ for typical datasets
- **JSONB Preferences**: Allows adding new preferences without schema migration
- **Email Validation**: CHECK constraint prevents invalid emails at database level
- **Role Check**: Ensures only valid roles in database

---

#### Departments Table
```sql
CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_department_id UUID REFERENCES departments(department_id),
    department_head_id UUID REFERENCES users(user_id),
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',  -- Hex color for UI
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT departments_no_self_parent CHECK (department_id != parent_department_id),
    CONSTRAINT departments_color_format CHECK (color ~* '^#[0-9A-F]{6}$')
);

CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_parent ON departments(parent_department_id) WHERE parent_department_id IS NOT NULL;
CREATE INDEX idx_departments_head ON departments(department_head_id) WHERE department_head_id IS NOT NULL;
CREATE INDEX idx_departments_active ON departments(is_active) WHERE is_active = TRUE;
```

**Design Notes:**
- **Hierarchical Structure**: `parent_department_id` allows nested departments
- **Prevent Self-Reference**: CHECK constraint prevents circular references
- **Color Validation**: Ensures valid hex colors

---

#### Projects Table
```sql
CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Planning' NOT NULL,
    progress_percentage INTEGER DEFAULT 0 NOT NULL,

    -- Ownership
    owner_id UUID NOT NULL REFERENCES users(user_id),

    -- Temporal
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,

    -- Metadata
    tags TEXT[] DEFAULT '{}'::TEXT[],
    color VARCHAR(7) DEFAULT '#8B5CF6',
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT projects_status_check CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled')),
    CONSTRAINT projects_progress_check CHECK (progress_percentage BETWEEN 0 AND 100),
    CONSTRAINT projects_dates_check CHECK (target_end_date IS NULL OR start_date IS NULL OR target_end_date >= start_date)
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_dates ON projects(start_date, target_end_date);
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);
CREATE INDEX idx_projects_active ON projects(status) WHERE status IN ('Planning', 'Active');
```

**Design Notes:**
- **Progress Tracking**: Calculated from completed tasks, stored for quick dashboard queries
- **Date Validation**: CHECK constraint ensures logical date ordering
- **Array Tags**: Native PostgreSQL array for efficient tag searches
- **Partial Index**: Focus on active projects for faster queries

---

#### Tasks Table (Most Critical)
```sql
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core Fields
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'To Do' NOT NULL,
    priority VARCHAR(10) DEFAULT 'Medium' NOT NULL,

    -- Ownership & Assignment
    creator_id UUID NOT NULL REFERENCES users(user_id),
    assignees UUID[] DEFAULT '{}'::UUID[],  -- Array of user IDs for fast lookup
    department_id UUID REFERENCES departments(department_id),

    -- Relationships
    project_id UUID REFERENCES projects(project_id),
    parent_task_id UUID REFERENCES tasks(task_id),
    dependencies UUID[] DEFAULT '{}'::UUID[],  -- Array of task_ids this task depends on
    blocks UUID[] DEFAULT '{}'::UUID[],        -- Array of task_ids this task blocks

    -- Temporal
    creation_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    due_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    last_modified TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Recurring Task Fields
    is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
    recurrence_pattern JSONB,  -- Stores frequency, interval, daysOfWeek, etc.
    next_occurrence TIMESTAMPTZ,
    skip_dates TEXT[] DEFAULT '{}'::TEXT[],  -- ISO date strings to skip

    -- Source & Confidence
    source VARCHAR(20) DEFAULT 'GUI' NOT NULL,
    confidence_score DECIMAL(3,2),  -- 0.00 to 1.00 for AI-generated tasks

    -- Metadata
    tags TEXT[] DEFAULT '{}'::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT tasks_status_check CHECK (status IN ('To Do', 'In Progress', 'In Review', 'Blocked', 'Done')),
    CONSTRAINT tasks_priority_check CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    CONSTRAINT tasks_source_check CHECK (source IN ('GUI', 'Email', 'API', 'Document', 'NLP')),
    CONSTRAINT tasks_confidence_check CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
    CONSTRAINT tasks_no_self_parent CHECK (task_id != parent_task_id),
    CONSTRAINT tasks_recurring_pattern CHECK (
        (is_recurring = FALSE) OR
        (is_recurring = TRUE AND recurrence_pattern IS NOT NULL)
    )
);

-- Performance Indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_assignees ON tasks USING GIN(assignees);
CREATE INDEX idx_tasks_department ON tasks(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_creation_date ON tasks(creation_date DESC);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_metadata ON tasks USING GIN(metadata jsonb_path_ops);
CREATE INDEX idx_tasks_dependencies ON tasks USING GIN(dependencies);

-- Recurring Tasks Index (Critical for Cron Job Performance)
CREATE INDEX idx_tasks_recurring_next ON tasks(next_occurrence)
    WHERE is_recurring = TRUE AND next_occurrence IS NOT NULL;

-- Full-Text Search Index
CREATE INDEX idx_tasks_search ON tasks USING GIN(
    to_tsvector('english',
        COALESCE(title, '') || ' ' ||
        COALESCE(description, '')
    )
);

-- Composite Index for Common Query Pattern (Status + Due Date)
CREATE INDEX idx_tasks_status_due ON tasks(status, due_date)
    WHERE status IN ('To Do', 'In Progress', 'Blocked');
```

**Design Notes:**
- **UUID Arrays for Relationships**: Faster than join tables for read-heavy workloads
- **GIN Indexes**: Essential for array and JSONB searches
- **Partial Indexes**: Dramatically reduce index size and improve write performance
- **Full-Text Search**: Native PostgreSQL FTS for fast title/description searches
- **Composite Indexes**: Optimized for frontend's common query patterns
- **Recurring Task Optimization**: Dedicated index for cron job queries

**Estimated Performance:**
- Task list query (1000 tasks): **~30ms**
- Filter by status + assignee: **~15ms**
- Full-text search: **~50ms**
- Recurring task lookup (cron): **~5ms**

---

#### Comments Table
```sql
CREATE TABLE comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(user_id),
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,  -- Soft delete

    CONSTRAINT comments_content_length CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 10000)
);

CREATE INDEX idx_comments_task ON comments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);
CREATE INDEX idx_comments_search ON comments USING GIN(to_tsvector('english', content));
```

**Design Notes:**
- **Soft Delete**: `deleted_at` allows recovery, audit trail
- **Cascade Delete**: When task deleted, comments auto-deleted
- **Length Constraint**: Prevents abuse, enforced at DB level

---

#### Attachments Table
```sql
CREATE TABLE attachments (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),  -- MIME type
    file_size BIGINT NOT NULL,  -- Bytes
    storage_path TEXT NOT NULL,  -- S3 key or file path
    uploaded_by UUID NOT NULL REFERENCES users(user_id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT attachments_file_size CHECK (file_size > 0 AND file_size <= 104857600)  -- Max 100MB
);

CREATE INDEX idx_attachments_task ON attachments(task_id);
CREATE INDEX idx_attachments_uploader ON attachments(uploaded_by);
CREATE INDEX idx_attachments_uploaded ON attachments(uploaded_at DESC);
```

**Design Notes:**
- **File Size Limit**: 100MB enforced at database level
- **Storage Path**: Supports local filesystem or S3
- **Cascade Delete**: Attachments deleted with task

---

#### Email Integrations Table
```sql
CREATE TABLE email_integrations (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,  -- 'zoho-mail' or 'outlook'
    email VARCHAR(255) NOT NULL,

    -- OAuth Tokens (Encrypted in Application Layer)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Status
    status VARCHAR(50) DEFAULT 'disconnected' NOT NULL,
    last_sync TIMESTAMPTZ,
    error_message TEXT,

    -- Configuration
    sync_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    folders_to_monitor TEXT[] DEFAULT '{}'::TEXT[],  -- Email folders/labels

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT email_integrations_provider_check CHECK (provider IN ('zoho-mail', 'outlook')),
    CONSTRAINT email_integrations_status_check CHECK (status IN ('connected', 'disconnected', 'syncing', 'error')),
    UNIQUE(user_id, provider)  -- One integration per provider per user
);

CREATE INDEX idx_email_integrations_user ON email_integrations(user_id);
CREATE INDEX idx_email_integrations_provider ON email_integrations(provider);
CREATE INDEX idx_email_integrations_status ON email_integrations(status);
CREATE INDEX idx_email_integrations_sync ON email_integrations(last_sync) WHERE sync_enabled = TRUE;
```

**Design Notes:**
- **Unique Constraint**: Prevents duplicate integrations
- **Partial Index**: Focus on enabled integrations for polling job
- **Token Encryption**: Handled in application layer, not database

---

#### Refresh Tokens Table (JWT)
```sql
CREATE TABLE refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,  -- SHA256 hash
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    revoked BOOLEAN DEFAULT FALSE NOT NULL,

    CONSTRAINT refresh_tokens_expires_future CHECK (expires_at > created_at)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expiry ON refresh_tokens(expires_at) WHERE revoked = FALSE;

-- Auto-delete expired tokens (housekeeping)
CREATE INDEX idx_refresh_tokens_cleanup ON refresh_tokens(expires_at)
    WHERE revoked = FALSE;
```

**Design Notes:**
- **Token Hashing**: Store hash, not raw token
- **Cleanup Index**: Facilitates periodic deletion of expired tokens

---

#### Audit Logs Table (Optional but Recommended)
```sql
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,  -- 'task.create', 'task.update', 'task.delete', etc.
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    changes JSONB,  -- Before/after values
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT audit_logs_action_format CHECK (action ~* '^[a-z_]+\.[a-z_]+$')
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Partition by month for large datasets (future)
-- CREATE TABLE audit_logs_2025_10 PARTITION OF audit_logs
--     FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
```

**Design Notes:**
- **JSONB Changes**: Stores full before/after state for compliance
- **IP Address**: INET type for efficient storage
- **Partitioning Ready**: Easy to partition by month if logs grow large

---

### 1.3 Triggers for Auto-Update

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_integrations_updated_at BEFORE UPDATE ON email_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 2. Indexing Strategy

### 2.1 Index Types Used

| Index Type | Use Case | Example |
|------------|----------|---------|
| **B-Tree (default)** | Equality, range queries | `CREATE INDEX idx_tasks_due_date ON tasks(due_date)` |
| **GIN** | Array, JSONB, full-text search | `CREATE INDEX idx_tasks_assignees ON tasks USING GIN(assignees)` |
| **Partial** | Conditional queries | `CREATE INDEX ... WHERE is_active = TRUE` |
| **Composite** | Multi-column queries | `CREATE INDEX idx_tasks_status_due ON tasks(status, due_date)` |

### 2.2 Index Maintenance

```sql
-- Analyze query patterns
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC;

-- Check index bloat
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Reindex if needed (low priority maintenance window)
REINDEX INDEX CONCURRENTLY idx_tasks_search;
```

---

## 3. Query Optimization

### 3.1 Common Query Patterns

**Task List with Filters (Most Common):**
```sql
EXPLAIN ANALYZE
SELECT
    t.task_id, t.title, t.status, t.priority, t.due_date,
    t.assignees, t.tags, t.is_recurring
FROM tasks t
WHERE
    t.status IN ('To Do', 'In Progress', 'Blocked')
    AND t.department_id = 'dept-001'
    AND t.assignees && ARRAY['user-123']::UUID[]  -- Array overlap
ORDER BY t.due_date ASC NULLS LAST
LIMIT 20 OFFSET 0;
```

**Expected Plan:**
```
Index Scan using idx_tasks_status_due
  Index Cond: status IN ('To Do', 'In Progress', 'Blocked')
  Filter: department_id = 'dept-001' AND assignees && '{user-123}'::UUID[]
Planning Time: 0.5ms
Execution Time: 12ms
```

**Recurring Tasks for Cron Job:**
```sql
SELECT task_id, title, recurrence_pattern, skip_dates
FROM tasks
WHERE is_recurring = TRUE
  AND next_occurrence <= NOW()
  AND next_occurrence IS NOT NULL
ORDER BY next_occurrence ASC
LIMIT 100;
```

**Expected Execution Time:** <5ms (using `idx_tasks_recurring_next`)

### 3.2 Full-Text Search Optimization

```sql
-- Search tasks
SELECT task_id, title, ts_rank(search_vector, query) AS rank
FROM tasks, to_tsquery('english', 'design & mockup') query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

**Performance:** ~50ms for 100K tasks

---

## 4. Connection Pooling

### 4.1 Recommended Setup: PgBouncer

```ini
[databases]
synapse = host=postgres port=5432 dbname=synapse

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 25
```

**Rationale:**
- **Transaction Pooling**: Best balance of performance and compatibility
- **25 Connections**: Matches PostgreSQL `max_connections` setting
- **1000 Clients**: Supports 1000 concurrent API requests

### 4.2 GORM Connection Pool Configuration

```go
sqlDB, _ := db.DB()
sqlDB.SetMaxOpenConns(25)        // Match PgBouncer default_pool_size
sqlDB.SetMaxIdleConns(5)         // Keep 5 idle connections
sqlDB.SetConnMaxLifetime(5 * time.Minute)  // Recycle connections every 5 min
```

---

## 5. Partitioning Strategy

### 5.1 Future: Time-Based Partitioning for Tasks

When tasks exceed 1 million, partition by year:

```sql
CREATE TABLE tasks_2025 PARTITION OF tasks
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE tasks_2026 PARTITION OF tasks
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

**Benefits:**
- Faster queries (smaller partition scans)
- Easier archiving (drop old partitions)
- Better vacuum performance

**When to Implement:** When tasks > 1M or queries > 100ms

---

## 6. Backup & Recovery

### 6.1 Backup Strategy

**Daily Full Backups:**
```bash
pg_dump -U synapse -h localhost -F c synapse > backup_$(date +%Y%m%d).dump
```

**Point-in-Time Recovery (WAL Archiving):**
```
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
```

### 6.2 Retention Policy

- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months

---

## 7. Monitoring & Maintenance

### 7.1 Key Metrics to Monitor

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Slow queries (> 1 second)
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC LIMIT 10;

-- Table bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

### 7.2 Maintenance Tasks

**Weekly:**
- Run `VACUUM ANALYZE` on all tables
- Check for slow queries in `pg_stat_statements`

**Monthly:**
- Review index usage (drop unused indexes)
- Check table bloat
- Update statistics: `ANALYZE;`

---

## 8. Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Task list query (20 items) | <30ms | `EXPLAIN ANALYZE` |
| Full-text search | <50ms | `EXPLAIN ANALYZE` |
| Task creation | <10ms | Application log |
| Recurring task lookup (cron) | <5ms | `EXPLAIN ANALYZE` |
| User authentication | <20ms | Application log |
| Email integration status | <10ms | Application log |

---

## Implementation Checklist

- [ ] Create all tables with constraints
- [ ] Create all indexes
- [ ] Create triggers for `updated_at`
- [ ] Set up connection pooling (PgBouncer)
- [ ] Configure pg_stat_statements extension
- [ ] Set up daily backup script
- [ ] Set up monitoring (Prometheus + pg_exporter)
- [ ] Seed database with test data
- [ ] Run EXPLAIN ANALYZE on common queries
- [ ] Document query patterns for backend team

---

## Conclusion

This PostgreSQL architecture is designed for:
- ✅ **Performance**: Sub-50ms queries for 100K+ tasks
- ✅ **Scalability**: Partitioning-ready for millions of tasks
- ✅ **Flexibility**: JSONB fields for evolving requirements
- ✅ **Reliability**: ACID guarantees, backups, audit trail
- ✅ **Maintainability**: Clear schema, proper indexes, monitoring

**Next Steps:**
1. Review schema with backend team
2. Run migrations in development environment
3. Seed database with realistic test data
4. Benchmark queries with EXPLAIN ANALYZE
5. Iterate on index strategy based on actual query patterns

---

**Document Status:** Ready for Implementation
**Approval Required:** Backend Lead, DevOps Lead
