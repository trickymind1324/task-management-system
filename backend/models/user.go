// ABOUTME: User model with GORM tags matching PostgreSQL schema
// ABOUTME: Includes authentication and authorization fields

package models

import (
	"time"

	"github.com/lib/pq"
)

type User struct {
	ID                     string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email                  string         `gorm:"type:varchar(255);not null;uniqueIndex" json:"email"`
	Username               string         `gorm:"type:varchar(50);not null;uniqueIndex" json:"username"`
	FullName               string         `gorm:"type:varchar(255);not null" json:"full_name"`
	AvatarURL              *string        `gorm:"type:text" json:"avatar_url,omitempty"`
	JobTitle               *string        `gorm:"type:varchar(100)" json:"job_title,omitempty"`
	DepartmentID           *string        `gorm:"type:uuid" json:"department_id,omitempty"`
	Department             *Department    `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	PasswordHash           *string        `gorm:"type:varchar(255)" json:"-"`
	IsActive               bool           `gorm:"default:true" json:"is_active"`
	EmailVerified          bool           `gorm:"default:false" json:"email_verified"`
	LastLogin              *time.Time     `json:"last_login,omitempty"`
	Role                   string         `gorm:"type:varchar(20);not null;default:'Member'" json:"role"`
	Permissions            pq.StringArray `gorm:"type:text[];default:'{}'" json:"permissions"`
	KeycloakID             *string        `gorm:"type:varchar(255);uniqueIndex" json:"keycloak_id,omitempty"`
	ZohoID                 *string        `gorm:"type:varchar(255);uniqueIndex" json:"zoho_id,omitempty"`
	Preferences            string         `gorm:"type:jsonb;default:'{}'" json:"preferences,omitempty"`
	NotificationSettings   string         `gorm:"type:jsonb;default:'{}'" json:"notification_settings,omitempty"`
	CreatedAt              time.Time      `gorm:"default:now()" json:"created_at"`
	UpdatedAt              time.Time      `gorm:"default:now()" json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}
