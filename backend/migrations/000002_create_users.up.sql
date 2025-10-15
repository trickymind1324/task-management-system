-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    job_title VARCHAR(100),
    department_id UUID,
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    role VARCHAR(20) NOT NULL DEFAULT 'Member',
    permissions TEXT[] DEFAULT '{}',
    keycloak_id VARCHAR(255) UNIQUE,
    zoho_id VARCHAR(255) UNIQUE,
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_keycloak_id ON users(keycloak_id) WHERE keycloak_id IS NOT NULL;
CREATE INDEX idx_users_zoho_id ON users(zoho_id) WHERE zoho_id IS NOT NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
