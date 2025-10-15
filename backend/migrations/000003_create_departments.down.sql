-- Rollback departments table
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_department;
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
DROP TABLE IF EXISTS departments;
