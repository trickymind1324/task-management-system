# pg_cron Implementation for Recurring Tasks - Project Synapse

**Created:** October 15, 2025
**Version:** 1.0
**Status:** Recommended Architecture Update
**Replaces:** Go-based cron worker approach

---

## Executive Summary

Instead of using a separate Go worker with `robfig/cron` for recurring task generation, we'll use **pg_cron** - a PostgreSQL extension that schedules jobs directly in the database. This is a superior approach because:

✅ **Database-native** - No external process required
✅ **Simpler architecture** - Fewer moving parts, easier to debug
✅ **Better reliability** - PostgreSQL manages job execution
✅ **Transactional** - Job execution is part of database transactions
✅ **Production-proven** - Used by Citus Data and many enterprises
✅ **Lower latency** - Jobs run in-database without network calls

---

## Table of Contents

1. [Installation & Setup](#1-installation--setup)
2. [Database Schema](#2-database-schema)
3. [Stored Procedure for Task Generation](#3-stored-procedure-for-task-generation)
4. [pg_cron Job Configuration](#4-pg_cron-job-configuration)
5. [Monitoring & Logging](#5-monitoring--logging)
6. [Testing Strategy](#6-testing-strategy)
7. [Migration from Go Worker](#7-migration-from-go-worker)
8. [Comparison: pg_cron vs Go Worker](#8-comparison-pg_cron-vs-go-worker)

---

## 1. Installation & Setup

### 1.1 Install pg_cron Extension

**For Ubuntu/Debian:**
```bash
# Install pg_cron package (PostgreSQL 15)
sudo apt-get install postgresql-15-cron

# Or for PostgreSQL 16
sudo apt-get install postgresql-16-cron
```

**For Docker (Recommended for Development):**
```dockerfile
# Use postgres image with pg_cron pre-installed
FROM postgres:15

# Install pg_cron
RUN apt-get update && \
    apt-get install -y postgresql-15-cron && \
    rm -rf /var/lib/apt/lists/*
```

**Or use custom Dockerfile:**
```dockerfile
FROM postgres:15-alpine

RUN apk add --no-cache \
    postgresql-cron-15

# pg_cron requires shared_preload_libraries
COPY postgresql.conf /etc/postgresql/postgresql.conf
```

### 1.2 Configure PostgreSQL

**Edit `postgresql.conf`:**
```conf
# Add pg_cron to shared_preload_libraries
shared_preload_libraries = 'pg_cron'

# Optional: Configure pg_cron database (default is 'postgres')
cron.database_name = 'synapse'

# Optional: Configure timezone
cron.timezone = 'UTC'

# Optional: Use pg_cron in specific database
# cron.use_background_workers = on
```

**Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

### 1.3 Enable Extension in Database

```sql
-- Connect to your database
\c synapse

-- Create pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify installation
SELECT cron.schedule('test-job', '*/5 * * * *', 'SELECT 1');
SELECT * FROM cron.job;

-- Remove test job
SELECT cron.unschedule('test-job');
```

---

## 2. Database Schema

**Schema remains the same** as specified in PostgreSQL Architecture Review Section 4:

```sql
-- Recurring task fields (from migration 000010_add_recurring_tasks.sql)
ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE tasks ADD COLUMN recurrence_pattern JSONB;
ALTER TABLE tasks ADD COLUMN recurrence_parent_id UUID REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN next_occurrence TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN skip_dates TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE tasks ADD COLUMN recurrence_end_date TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN recurrence_count INTEGER;
ALTER TABLE tasks ADD COLUMN recurrence_generated_count INTEGER DEFAULT 0;

-- Performance index
CREATE INDEX idx_tasks_recurring_due ON tasks(next_occurrence)
  WHERE is_recurring = TRUE AND next_occurrence IS NOT NULL;

-- Index for skip dates
CREATE INDEX idx_tasks_skip_dates ON tasks USING GIN(skip_dates)
  WHERE is_recurring = TRUE;
```

---

## 3. Stored Procedure for Task Generation

### 3.1 Main Function: generate_recurring_tasks()

```sql
-- Create function to generate recurring task instances
CREATE OR REPLACE FUNCTION generate_recurring_tasks()
RETURNS TABLE(
    tasks_generated INTEGER,
    tasks_processed INTEGER,
    errors_count INTEGER
) AS $$
DECLARE
    v_tasks_generated INTEGER := 0;
    v_tasks_processed INTEGER := 0;
    v_errors_count INTEGER := 0;
    v_parent_task RECORD;
    v_new_task_id UUID;
    v_next_occurrence TIMESTAMPTZ;
BEGIN
    -- Find all recurring tasks that are due
    FOR v_parent_task IN
        SELECT *
        FROM tasks
        WHERE is_recurring = TRUE
          AND next_occurrence <= NOW()
          AND next_occurrence IS NOT NULL
          AND (recurrence_end_date IS NULL OR recurrence_end_date > NOW())
          AND (recurrence_count IS NULL OR recurrence_generated_count < recurrence_count)
        ORDER BY next_occurrence ASC
        FOR UPDATE SKIP LOCKED  -- Prevent concurrent execution
    LOOP
        BEGIN
            v_tasks_processed := v_tasks_processed + 1;

            -- Generate new task instance
            INSERT INTO tasks (
                task_id,
                title,
                description,
                status,
                priority,
                creator_id,
                department_id,
                project_id,
                due_date,
                source,
                tags,
                recurrence_parent_id,
                is_recurring,
                created_at,
                updated_at
            ) VALUES (
                'task-' || LPAD(CAST(nextval('tasks_sequence') AS TEXT), 6, '0'),
                v_parent_task.title,
                v_parent_task.description,
                'To Do',  -- Always start as To Do
                v_parent_task.priority,
                v_parent_task.creator_id,
                v_parent_task.department_id,
                v_parent_task.project_id,
                v_parent_task.next_occurrence,
                'Recurring',
                v_parent_task.tags,
                v_parent_task.id,
                FALSE,  -- Generated instances are not recurring
                NOW(),
                NOW()
            ) RETURNING id INTO v_new_task_id;

            -- Copy assignees from parent task
            INSERT INTO task_assignees (task_id, user_id, assigned_at)
            SELECT v_new_task_id, user_id, NOW()
            FROM task_assignees
            WHERE task_id = v_parent_task.id;

            -- Calculate next occurrence
            v_next_occurrence := calculate_next_occurrence(
                v_parent_task.recurrence_pattern,
                v_parent_task.next_occurrence,
                v_parent_task.skip_dates
            );

            -- Update parent task
            UPDATE tasks
            SET next_occurrence = v_next_occurrence,
                recurrence_generated_count = recurrence_generated_count + 1,
                updated_at = NOW()
            WHERE id = v_parent_task.id;

            v_tasks_generated := v_tasks_generated + 1;

            -- Log success
            INSERT INTO recurring_task_log (
                parent_task_id,
                generated_task_id,
                scheduled_time,
                generated_at,
                status
            ) VALUES (
                v_parent_task.id,
                v_new_task_id,
                v_parent_task.next_occurrence,
                NOW(),
                'success'
            );

        EXCEPTION WHEN OTHERS THEN
            v_errors_count := v_errors_count + 1;

            -- Log error
            INSERT INTO recurring_task_log (
                parent_task_id,
                scheduled_time,
                generated_at,
                status,
                error_message
            ) VALUES (
                v_parent_task.id,
                v_parent_task.next_occurrence,
                NOW(),
                'error',
                SQLERRM
            );

            -- Continue processing other tasks
            CONTINUE;
        END;
    END LOOP;

    RETURN QUERY SELECT v_tasks_generated, v_tasks_processed, v_errors_count;
END;
$$ LANGUAGE plpgsql;
```

### 3.2 Helper Function: calculate_next_occurrence()

```sql
-- Function to calculate the next occurrence based on recurrence pattern
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
    p_pattern JSONB,
    p_current_occurrence TIMESTAMPTZ,
    p_skip_dates TEXT[]
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_frequency TEXT;
    v_interval INTEGER;
    v_days_of_week INTEGER[];
    v_day_of_month INTEGER;
    v_next_occurrence TIMESTAMPTZ;
    v_next_date TEXT;
BEGIN
    -- Extract pattern values
    v_frequency := p_pattern->>'frequency';
    v_interval := COALESCE((p_pattern->>'interval')::INTEGER, 1);

    -- Calculate next occurrence based on frequency
    CASE v_frequency
        WHEN 'daily' THEN
            v_next_occurrence := p_current_occurrence + (v_interval || ' days')::INTERVAL;

        WHEN 'weekly' THEN
            v_next_occurrence := p_current_occurrence + (v_interval * 7 || ' days')::INTERVAL;

            -- If specific days of week are set, find next matching day
            IF p_pattern ? 'daysOfWeek' THEN
                v_days_of_week := ARRAY(SELECT jsonb_array_elements_text(p_pattern->'daysOfWeek')::INTEGER);

                -- Find next day that matches daysOfWeek
                WHILE NOT (EXTRACT(ISODOW FROM v_next_occurrence)::INTEGER = ANY(v_days_of_week)) LOOP
                    v_next_occurrence := v_next_occurrence + '1 day'::INTERVAL;
                END LOOP;
            END IF;

        WHEN 'monthly' THEN
            v_next_occurrence := p_current_occurrence + (v_interval || ' months')::INTERVAL;

            -- If specific day of month is set
            IF p_pattern ? 'dayOfMonth' THEN
                v_day_of_month := (p_pattern->>'dayOfMonth')::INTEGER;

                IF v_day_of_month = -1 THEN
                    -- Last day of month
                    v_next_occurrence := date_trunc('month', v_next_occurrence) + '1 month'::INTERVAL - '1 day'::INTERVAL;
                ELSE
                    -- Set to specific day of month
                    v_next_occurrence := make_date(
                        EXTRACT(YEAR FROM v_next_occurrence)::INTEGER,
                        EXTRACT(MONTH FROM v_next_occurrence)::INTEGER,
                        v_day_of_month
                    )::TIMESTAMPTZ + (EXTRACT(HOUR FROM v_next_occurrence) || ' hours')::INTERVAL;
                END IF;
            END IF;

        WHEN 'yearly' THEN
            v_next_occurrence := p_current_occurrence + (v_interval || ' years')::INTERVAL;

            -- If specific month is set
            IF p_pattern ? 'monthOfYear' THEN
                v_next_occurrence := make_date(
                    EXTRACT(YEAR FROM v_next_occurrence)::INTEGER,
                    (p_pattern->>'monthOfYear')::INTEGER,
                    EXTRACT(DAY FROM v_next_occurrence)::INTEGER
                )::TIMESTAMPTZ;
            END IF;

        ELSE
            -- Default: daily
            v_next_occurrence := p_current_occurrence + '1 day'::INTERVAL;
    END CASE;

    -- Check if next occurrence is in skip dates
    v_next_date := to_char(v_next_occurrence, 'YYYY-MM-DD');

    IF v_next_date = ANY(p_skip_dates) THEN
        -- Recursively find next occurrence
        RETURN calculate_next_occurrence(p_pattern, v_next_occurrence, p_skip_dates);
    END IF;

    RETURN v_next_occurrence;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 3.3 Logging Table

```sql
-- Create log table for recurring task generation
CREATE TABLE recurring_task_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    generated_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) NOT NULL,  -- 'success', 'error', 'skipped'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying logs
CREATE INDEX idx_recurring_task_log_parent ON recurring_task_log(parent_task_id, generated_at DESC);
CREATE INDEX idx_recurring_task_log_status ON recurring_task_log(status, generated_at DESC);
```

### 3.4 Sequence for task_id Generation

```sql
-- Create sequence for task IDs
CREATE SEQUENCE IF NOT EXISTS tasks_sequence START 1;

-- Example: Generate task-000001, task-000002, etc.
```

---

## 4. pg_cron Job Configuration

### 4.1 Schedule Recurring Task Generation

```sql
-- Schedule job to run every hour at minute 0
SELECT cron.schedule(
    'generate-recurring-tasks',  -- Job name
    '0 * * * *',                 -- Cron schedule (every hour)
    'SELECT generate_recurring_tasks();'  -- SQL command
);

-- Verify job was scheduled
SELECT * FROM cron.job WHERE jobname = 'generate-recurring-tasks';

-- Expected output:
-- jobid | schedule   | command                              | nodename  | nodeport | database | username | active | jobname
-- 1     | 0 * * * *  | SELECT generate_recurring_tasks();   | localhost | 5432     | synapse  | postgres | t      | generate-recurring-tasks
```

### 4.2 Alternative: Run Every 30 Minutes

```sql
-- For more frequent generation (every 30 minutes)
SELECT cron.schedule(
    'generate-recurring-tasks',
    '*/30 * * * *',
    'SELECT generate_recurring_tasks();'
);
```

### 4.3 Alternative: Run Every 15 Minutes

```sql
-- For even more frequent generation
SELECT cron.schedule(
    'generate-recurring-tasks',
    '*/15 * * * *',
    'SELECT generate_recurring_tasks();'
);
```

### 4.4 Management Commands

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-recurring-tasks')
ORDER BY start_time DESC
LIMIT 10;

-- Unschedule job (if needed)
SELECT cron.unschedule('generate-recurring-tasks');

-- Reschedule with different frequency
SELECT cron.unschedule('generate-recurring-tasks');
SELECT cron.schedule('generate-recurring-tasks', '0 * * * *', 'SELECT generate_recurring_tasks();');

-- Disable job temporarily
UPDATE cron.job SET active = FALSE WHERE jobname = 'generate-recurring-tasks';

-- Enable job
UPDATE cron.job SET active = TRUE WHERE jobname = 'generate-recurring-tasks';
```

---

## 5. Monitoring & Logging

### 5.1 Query Job Execution History

```sql
-- Check recent job runs
SELECT
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time,
    end_time - start_time AS duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-recurring-tasks')
ORDER BY start_time DESC
LIMIT 20;

-- Check for failed jobs
SELECT *
FROM cron.job_run_details
WHERE status = 'failed'
  AND jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-recurring-tasks')
ORDER BY start_time DESC;
```

### 5.2 Query Recurring Task Log

```sql
-- View recent task generations
SELECT
    l.id,
    l.parent_task_id,
    pt.title AS parent_task_title,
    l.generated_task_id,
    gt.task_id AS generated_task_external_id,
    l.scheduled_time,
    l.generated_at,
    l.status,
    l.error_message
FROM recurring_task_log l
LEFT JOIN tasks pt ON l.parent_task_id = pt.id
LEFT JOIN tasks gt ON l.generated_task_id = gt.id
ORDER BY l.generated_at DESC
LIMIT 20;

-- Count successful vs failed generations
SELECT
    status,
    COUNT(*) AS count,
    MAX(generated_at) AS last_occurrence
FROM recurring_task_log
WHERE generated_at > NOW() - INTERVAL '7 days'
GROUP BY status;

-- Find recurring tasks that are generating errors
SELECT
    pt.task_id,
    pt.title,
    COUNT(*) AS error_count,
    MAX(l.generated_at) AS last_error,
    MAX(l.error_message) AS last_error_message
FROM recurring_task_log l
JOIN tasks pt ON l.parent_task_id = pt.id
WHERE l.status = 'error'
  AND l.generated_at > NOW() - INTERVAL '7 days'
GROUP BY pt.id, pt.task_id, pt.title
ORDER BY error_count DESC;
```

### 5.3 Monitoring Dashboard Queries

```sql
-- Statistics for last 24 hours
SELECT
    COUNT(*) FILTER (WHERE status = 'success') AS successful_generations,
    COUNT(*) FILTER (WHERE status = 'error') AS failed_generations,
    COUNT(DISTINCT parent_task_id) AS active_recurring_tasks
FROM recurring_task_log
WHERE generated_at > NOW() - INTERVAL '24 hours';

-- Upcoming recurring tasks (next 7 days)
SELECT
    task_id,
    title,
    next_occurrence,
    recurrence_pattern->>'frequency' AS frequency,
    recurrence_generated_count,
    recurrence_count
FROM tasks
WHERE is_recurring = TRUE
  AND next_occurrence BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY next_occurrence ASC;
```

---

## 6. Testing Strategy

### 6.1 Unit Test: calculate_next_occurrence()

```sql
-- Test daily recurrence
SELECT calculate_next_occurrence(
    '{"frequency": "daily", "interval": 1}'::JSONB,
    '2025-10-15 10:00:00'::TIMESTAMPTZ,
    ARRAY[]::TEXT[]
) = '2025-10-16 10:00:00'::TIMESTAMPTZ AS daily_test;

-- Test weekly recurrence (every Monday)
SELECT calculate_next_occurrence(
    '{"frequency": "weekly", "interval": 1, "daysOfWeek": [1]}'::JSONB,
    '2025-10-13 10:00:00'::TIMESTAMPTZ,  -- Monday
    ARRAY[]::TEXT[]
) = '2025-10-20 10:00:00'::TIMESTAMPTZ AS weekly_test;

-- Test monthly recurrence (15th of month)
SELECT calculate_next_occurrence(
    '{"frequency": "monthly", "interval": 1, "dayOfMonth": 15}'::JSONB,
    '2025-10-15 10:00:00'::TIMESTAMPTZ,
    ARRAY[]::TEXT[]
) = '2025-11-15 10:00:00'::TIMESTAMPTZ AS monthly_test;

-- Test skip dates
SELECT calculate_next_occurrence(
    '{"frequency": "daily", "interval": 1}'::JSONB,
    '2025-10-15 10:00:00'::TIMESTAMPTZ,
    ARRAY['2025-10-16', '2025-10-17']
) = '2025-10-18 10:00:00'::TIMESTAMPTZ AS skip_dates_test;
```

### 6.2 Integration Test: generate_recurring_tasks()

```sql
-- Create test recurring task
INSERT INTO tasks (
    task_id,
    title,
    status,
    priority,
    creator_id,
    is_recurring,
    recurrence_pattern,
    next_occurrence
) VALUES (
    'task-test-001',
    'Test Recurring Task',
    'To Do',
    'Medium',
    (SELECT id FROM users LIMIT 1),
    TRUE,
    '{"frequency": "daily", "interval": 1}'::JSONB,
    NOW() - INTERVAL '1 hour'  -- Due 1 hour ago
);

-- Run generation
SELECT * FROM generate_recurring_tasks();

-- Verify new task was created
SELECT * FROM tasks WHERE recurrence_parent_id = (SELECT id FROM tasks WHERE task_id = 'task-test-001');

-- Verify parent task was updated
SELECT next_occurrence, recurrence_generated_count
FROM tasks WHERE task_id = 'task-test-001';

-- Clean up
DELETE FROM tasks WHERE task_id = 'task-test-001' OR recurrence_parent_id = (SELECT id FROM tasks WHERE task_id = 'task-test-001');
```

---

## 7. Migration from Go Worker

### 7.1 Architecture Changes

**BEFORE (Go Worker):**
```
┌──────────────────┐
│   Go Worker      │
│  (Cron Process)  │
│                  │
│  - Runs hourly   │
│  - Queries DB    │
│  - Generates     │
│    tasks         │
└────────┬─────────┘
         │ Network call
         ▼
┌──────────────────┐
│   PostgreSQL     │
│   Database       │
└──────────────────┘
```

**AFTER (pg_cron):**
```
┌──────────────────────────────┐
│      PostgreSQL              │
│                              │
│  ┌────────────────────┐      │
│  │     pg_cron        │      │
│  │  (Built-in cron)   │      │
│  └────────┬───────────┘      │
│           │ Direct function  │
│           │ call (no network)│
│           ▼                  │
│  ┌────────────────────┐      │
│  │ generate_recurring │      │
│  │    _tasks()        │      │
│  └────────────────────┘      │
│                              │
└──────────────────────────────┘
```

### 7.2 Code Removal

**Remove these files from backend:**
- `internal/workers/recurring_task_generator.go` ❌
- `internal/services/recurring_task_service.go` ❌ (logic moved to SQL)
- `cmd/worker/main.go` ❌ (if only used for recurring tasks)

**Update these files:**
- `docker/docker-compose.yml` - Remove worker service
- `docker/Dockerfile.worker` - Delete this file

### 7.3 Migration Script

```sql
-- migration: 000011_add_pg_cron_recurring_tasks.sql

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create sequence for task IDs
CREATE SEQUENCE IF NOT EXISTS tasks_sequence START 1;

-- Create log table
CREATE TABLE IF NOT EXISTS recurring_task_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    generated_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurring_task_log_parent ON recurring_task_log(parent_task_id, generated_at DESC);
CREATE INDEX idx_recurring_task_log_status ON recurring_task_log(status, generated_at DESC);

-- Create helper function
CREATE OR REPLACE FUNCTION calculate_next_occurrence(...) ...
-- (Full function from Section 3.2)

-- Create main function
CREATE OR REPLACE FUNCTION generate_recurring_tasks() ...
-- (Full function from Section 3.1)

-- Schedule cron job
SELECT cron.schedule(
    'generate-recurring-tasks',
    '0 * * * *',
    'SELECT generate_recurring_tasks();'
);
```

---

## 8. Comparison: pg_cron vs Go Worker

| Aspect | pg_cron | Go Worker (robfig/cron) |
|--------|---------|-------------------------|
| **Architecture** | Database-native | External process |
| **Network Calls** | None (in-process) | Required for every task |
| **Latency** | <1ms function call | 5-50ms (network + auth) |
| **Reliability** | PostgreSQL-managed | Requires process monitoring |
| **Failure Recovery** | Automatic (PostgreSQL) | Requires custom retry logic |
| **Transactional** | Yes (ACID guarantees) | No (separate transactions) |
| **Debugging** | SQL logs + pg_cron logs | Application logs + traces |
| **Resource Usage** | Minimal (DB CPU) | Separate container + memory |
| **Deployment** | Part of database | Additional service |
| **Monitoring** | `cron.job_run_details` | Custom metrics |
| **Scalability** | Scales with DB | Needs orchestration |
| **Code Complexity** | SQL functions | Go code + testing |
| **Version Control** | Database migrations | Git + CI/CD |
| **Testing** | SQL unit tests | Go unit + integration tests |

### 8.1 Why pg_cron is Better

**Simplicity:**
- ✅ No separate worker process
- ✅ No process orchestration needed
- ✅ One less container in Docker Compose
- ✅ Fewer deployment steps

**Performance:**
- ✅ Zero network latency (in-process function calls)
- ✅ No JWT token validation overhead
- ✅ Direct database access (no ORM overhead)
- ✅ Batch operations in single transaction

**Reliability:**
- ✅ PostgreSQL handles failures automatically
- ✅ No "worker died" scenarios
- ✅ Automatic retry on crash (PostgreSQL restart)
- ✅ ACID guarantees for task generation

**Operational:**
- ✅ Built-in logging (`cron.job_run_details`)
- ✅ Easy to monitor with SQL queries
- ✅ Easy to disable/enable jobs
- ✅ Easy to change schedule without redeployment

### 8.2 When to Use Go Worker Instead

**Only use Go worker if:**
- ❌ You need to call external APIs during task generation
- ❌ You need complex business logic that's hard to express in SQL
- ❌ You need to distribute work across multiple workers
- ❌ Your database is too busy to run cron jobs

**For Project Synapse:** pg_cron is the **clear winner** because:
1. Task generation is pure database logic
2. No external API calls needed
3. Simple recurrence calculation
4. Low volume (most users have <10 recurring tasks)

---

## 9. Docker Compose Configuration

### 9.1 Updated docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: synapse
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    command:
      - "postgres"
      - "-c"
      - "shared_preload_libraries=pg_cron"
      - "-c"
      - "cron.database_name=synapse"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-pg-cron.sql:/docker-entrypoint-initdb.d/99-pg-cron.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U synapse"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ... other services (no worker needed!)

volumes:
  postgres_data:
```

### 9.2 init-pg-cron.sql

```sql
-- This file runs on database initialization
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions to application user
GRANT USAGE ON SCHEMA cron TO synapse;
```

---

## 10. Production Checklist

- [ ] Install pg_cron extension on PostgreSQL server
- [ ] Add `pg_cron` to `shared_preload_libraries` in postgresql.conf
- [ ] Restart PostgreSQL
- [ ] Run migration to create functions and schedule job
- [ ] Verify job is scheduled: `SELECT * FROM cron.job;`
- [ ] Test function manually: `SELECT generate_recurring_tasks();`
- [ ] Monitor job runs: `SELECT * FROM cron.job_run_details;`
- [ ] Set up alerts for failed job runs
- [ ] Document cron schedule in runbook
- [ ] Remove Go worker from deployment (if it was implemented)

---

## Conclusion

**Recommendation:** Use **pg_cron** for recurring task generation in Project Synapse.

**Benefits:**
- ✅ Simpler architecture
- ✅ Better performance
- ✅ Higher reliability
- ✅ Easier to maintain
- ✅ Lower operational overhead

**Action Items:**
1. Install pg_cron extension
2. Create SQL functions (Section 3)
3. Schedule cron job (Section 4)
4. Remove Go worker code
5. Update deployment scripts

**Next Steps:**
- Implement the SQL functions
- Test with sample recurring tasks
- Monitor job execution
- Document for operations team

---

**Status:** ✅ Ready for Implementation
**Estimated Effort:** 4-6 hours (vs 2-3 days for Go worker)
**Risk Level:** Low (pg_cron is production-proven)
