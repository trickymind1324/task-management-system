# FRD-04: NLP Interface

**Feature:** Natural Language Processing for Task Creation

**Version:** 1.0

**Last Updated:** October 6, 2025

**Status:** Draft

**Priority:** P2 (Post-Prototype - AI Feature)

---

## Overview

Enable users to create and manage tasks using natural language commands, both text and voice. This feature uses AI (OpenAI/Claude API) to parse user intent and extract task details.

## User Stories

- As a user, I want to create tasks by typing natural sentences instead of filling forms
- As a user, I want to say "Remind me to review the budget by Friday" and have it create a task
- As a busy executive, I want to dictate multiple tasks while commuting

## Examples

**Input:** "Remind me to review the Q4 budget proposal by next Friday, assign it to Sunny, high priority"

**Extracted Task:**
```json
{
  "title": "Review Q4 budget proposal",
  "due_date": "2025-10-18", // Next Friday
  "assignees": ["user-002"], // Sunny
  "priority": "High",
  "status": "To Do"
}
```

**Input:** "Create a task for the marketing team to design landing page mockups, due in 2 weeks"

**Extracted Task:**
```json
{
  "title": "Design landing page mockups",
  "department": "dept-001", // Marketing
  "due_date": "2025-10-20",
  "status": "To Do"
}
```

## Technical Architecture

```
User Input → NLP Service → AI Model → Task Extractor → Confirmation → Create Task
```

### AI Prompt Template

```
You are a task extraction assistant. Extract structured task data from natural language.

User input: "{user_input}"

Extract the following if present:
- title (required): Main action/task
- description: Additional details
- priority: Low, Medium, High, or Urgent
- due_date: Parse relative dates (tomorrow, next week, etc.)
- assignees: Names or roles
- department: Department name
- tags: Relevant keywords

Return JSON format with confidence score (0.0-1.0).
```

## Prototype Scope

**Exclude from prototype** - Implement in Phase 2 after prototype validation.

## Related Documents

- [01 - Core Data Models](./01-core-data-models.md)
- [02 - Task Management UI](./02-task-management-ui.md)
