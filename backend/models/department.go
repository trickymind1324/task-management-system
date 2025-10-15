// ABOUTME: Department model representing organizational units
// ABOUTME: Supports hierarchical structure with optional head user

package models

import "time"

type Department struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"type:varchar(100);not null;uniqueIndex" json:"name"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	HeadID      *string   `gorm:"type:uuid" json:"head_id,omitempty"`
	Head        *User     `gorm:"foreignKey:HeadID" json:"head,omitempty"`
	ParentID    *string   `gorm:"type:uuid" json:"parent_id,omitempty"`
	Parent      *Department `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:now()" json:"updated_at"`
}

func (Department) TableName() string {
	return "departments"
}
