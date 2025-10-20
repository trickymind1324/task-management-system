// ABOUTME: Project model for grouping related tasks
// ABOUTME: Includes timeline and status tracking fields

package models

import "time"

type Project struct {
	ID           string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid();column:id" json:"id"`
	ProjectID    string      `gorm:"type:varchar(50);uniqueIndex;column:code" json:"project_id"`
	Name         string      `gorm:"type:varchar(255);not null" json:"name"`
	Description  *string     `gorm:"type:text" json:"description,omitempty"`
	Status       string      `gorm:"type:varchar(20);not null;default:'Active'" json:"status"`
	OwnerID      *string     `gorm:"type:uuid" json:"owner_id,omitempty"`
	Owner        *User       `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	DepartmentID *string     `gorm:"type:uuid" json:"department_id,omitempty"`
	Department   *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	StartDate    *time.Time  `json:"start_date,omitempty"`
	EndDate      *time.Time  `json:"end_date,omitempty"`
	Metadata     string      `gorm:"type:jsonb;default:'{}'" json:"metadata,omitempty"`
	CreatedAt    time.Time   `gorm:"default:now()" json:"created_at"`
	UpdatedAt    time.Time   `gorm:"default:now()" json:"updated_at"`
}

func (Project) TableName() string {
	return "projects"
}
