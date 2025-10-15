-- Create departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    head_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_head_id ON departments(head_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);

-- Create trigger for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key to users table (department_id)
ALTER TABLE users ADD CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
