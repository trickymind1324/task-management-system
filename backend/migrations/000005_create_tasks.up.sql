-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'To Do',
    priority VARCHAR(10) NOT NULL DEFAULT 'Medium',

    -- User relationships
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignees UUID[] DEFAULT '{}',

    -- Organization
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Dates
    due_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,

    -- Source tracking
    source VARCHAR(20) NOT NULL DEFAULT 'GUI',
    source_email_id VARCHAR(255),
    source_document_id VARCHAR(255),

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    confidence_score DECIMAL(3,2),
    metadata JSONB DEFAULT '{}',

    -- Recurring task fields
    is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
    recurrence_pattern JSONB,
    recurrence_parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    next_occurrence TIMESTAMPTZ,
    skip_dates TEXT[] DEFAULT '{}',
    recurrence_end_date TIMESTAMPTZ,
    recurrence_count INTEGER,
    recurrence_generated_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_task_status CHECK (status IN ('To Do', 'In Progress', 'In Review', 'Blocked', 'Done')),
    CONSTRAINT chk_task_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    CONSTRAINT chk_task_source CHECK (source IN ('GUI', 'Email', 'API', 'Document', 'NLP')),
    CONSTRAINT chk_recurring_pattern CHECK (
        (is_recurring = FALSE) OR
        (is_recurring = TRUE AND recurrence_pattern IS NOT NULL)
    )
);

-- Create indexes
CREATE INDEX idx_tasks_task_id ON tasks(task_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_creator_id ON tasks(creator_id);
CREATE INDEX idx_tasks_department_id ON tasks(department_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_source ON tasks(source);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_metadata ON tasks USING GIN(metadata jsonb_path_ops);

-- Recurring tasks index
CREATE INDEX idx_tasks_recurring_due ON tasks(next_occurrence)
    WHERE is_recurring = TRUE AND next_occurrence IS NOT NULL;

-- Full-text search
ALTER TABLE tasks ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english',
            COALESCE(title, '') || ' ' ||
            COALESCE(description, '')
        )
    ) STORED;

CREATE INDEX idx_tasks_search_vector ON tasks USING GIN(search_vector);

-- Create trigger for updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
