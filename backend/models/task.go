// ABOUTME: Task model with comprehensive fields for task management
// ABOUTME: Includes recurring task support, dependencies, and AI confidence scoring

package models

import (
	"time"

	"github.com/lib/pq"
)

type Task struct {
	ID                       string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TaskID                   string         `gorm:"-" json:"task_id,omitempty"`
	Title                    string         `gorm:"type:varchar(500);not null" json:"title"`
	Description              *string        `gorm:"type:text" json:"description,omitempty"`
	Status                   string         `gorm:"type:varchar(20);not null;default:'To Do'" json:"status"`
	Priority                 string         `gorm:"type:varchar(10);not null;default:'Medium'" json:"priority"`

	// User relationships
	CreatorID                string         `gorm:"type:uuid;not null" json:"creator_id"`
	Creator                  *User          `gorm:"foreignKey:CreatorID" json:"creator,omitempty"`
	Assignees                pq.StringArray `gorm:"type:uuid[];default:'{}'" json:"assignee_ids"`

	// Organization
	DepartmentID             *string        `gorm:"type:uuid" json:"department_id,omitempty"`
	Department               *Department    `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	ProjectID                *string        `gorm:"type:uuid" json:"project_id,omitempty"`
	Project                  *Project       `gorm:"foreignKey:ProjectID" json:"project,omitempty"`

	// Dates
	DueDate                  *time.Time     `json:"due_date,omitempty"`
	CompletionDate           *time.Time     `json:"completion_date,omitempty"`

	// Source tracking
	Source                   string         `gorm:"type:varchar(20);not null;default:'GUI'" json:"source"`
	SourceEmailID            *string        `gorm:"-" json:"source_email_id,omitempty"`
	SourceDocumentID         *string        `gorm:"-" json:"source_document_id,omitempty"`

	// Metadata
	Tags                     pq.StringArray `gorm:"type:text[];default:'{}'" json:"tags"`
	Attachments              pq.StringArray `gorm:"type:text[];default:'{}'" json:"attachments"`
	ConfidenceScore          *float64       `gorm:"type:decimal(3,2)" json:"confidence_score,omitempty"`
	Metadata                 string         `gorm:"type:jsonb" json:"metadata,omitempty"`

	// Recurring task fields (not yet implemented in database)
	IsRecurring              bool           `gorm:"-" json:"is_recurring,omitempty"`
	RecurrencePattern        *string        `gorm:"-" json:"recurrence_pattern,omitempty"`
	RecurrenceParentID       *string        `gorm:"-" json:"recurrence_parent_id,omitempty"`
	RecurrenceParent         *Task          `gorm:"-" json:"recurrence_parent,omitempty"`
	NextOccurrence           *time.Time     `gorm:"-" json:"next_occurrence,omitempty"`
	SkipDates                pq.StringArray `gorm:"-" json:"skip_dates,omitempty"`
	RecurrenceEndDate        *time.Time     `gorm:"-" json:"recurrence_end_date,omitempty"`
	RecurrenceCount          *int           `gorm:"-" json:"recurrence_count,omitempty"`
	RecurrenceGeneratedCount int            `gorm:"-" json:"recurrence_generated_count,omitempty"`

	// Timestamps
	CreatedAt                time.Time      `gorm:"default:now()" json:"created_at"`
	UpdatedAt                time.Time      `gorm:"default:now()" json:"updated_at"`
}

func (Task) TableName() string {
	return "tasks"
}

// RecurrencePattern represents the structure of recurrence_pattern JSONB field
type RecurrencePattern struct {
	Frequency   string     `json:"frequency"`   // "daily", "weekly", "monthly", "yearly"
	Interval    int        `json:"interval"`    // Every N days/weeks/months/years
	DaysOfWeek  []int      `json:"daysOfWeek"`  // [1,3,5] = Mon, Wed, Fri (ISO weekday)
	DayOfMonth  *int       `json:"dayOfMonth"`  // 15 = 15th of month, -1 = last day
	MonthOfYear *int       `json:"monthOfYear"` // 6 = June
	Count       *int       `json:"count"`       // Generate N occurrences
	Until       *time.Time `json:"until"`       // End date
}
