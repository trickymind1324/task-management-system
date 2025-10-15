# FRD-05: Email Integration

**Feature:** Automatic Task Extraction from Emails

**Version:** 1.0

**Last Updated:** October 6, 2025

**Status:** Draft

**Priority:** P2 (Post-Prototype - AI Feature)

---

## Overview

Automatically monitor user inboxes (Gmail, Outlook) and extract actionable tasks from emails using AI. Users can forward emails to create tasks or enable auto-extraction.

## User Stories

- As a user, I want emails with action items to automatically create tasks
- As a project manager, I want to forward client emails to create tasks for my team
- As a user, I want to reply with "@synapse assign to Sunny" to create a task

## Email Sources

1. **Google Workspace (Gmail)**
   - Gmail API integration
   - OAuth 2.0 authentication
   - Real-time push notifications

2. **Microsoft 365 (Outlook)**
   - Microsoft Graph API
   - OAuth 2.0 authentication
   - Webhook subscriptions

## Example Scenarios

### Scenario 1: Action Item in Email

**Email:**
```
From: client@example.com
Subject: Website redesign feedback

Hi Bharath,

Can you please update the landing page mockups based on our
discussion? We need this by October 15th.

Thanks,
Client
```

**Extracted Task:**
```json
{
  "title": "Update landing page mockups based on client feedback",
  "due_date": "2025-10-15",
  "source": "Email",
  "description": "From client@example.com:\n\n[email body]",
  "confidence_score": 0.85
}
```

### Scenario 2: Forward to Create Task

User forwards email to `tasks@synapse.example.com` with custom commands:

```
@assign: Sunny@example.com
@priority: high
@department: marketing

[original email]
```

## Technical Architecture

```
Email Provider → Webhook → Email Parser → AI Extraction → Task Creation → User Confirmation
```

### AI Extraction Prompt

```
Analyze this email and determine if it contains actionable tasks.

Email metadata:
- From: {sender}
- Subject: {subject}
- Date: {date}

Body:
{body}

Extract:
1. Is this an actionable task? (yes/no)
2. Task title
3. Due date (if mentioned)
4. Priority indicators
5. Assignee mentions
6. Confidence score (0.0-1.0)
```

## Prototype Scope

**Exclude from prototype** - Implement in Phase 2.

## Security Considerations

- OAuth scope: Read-only email access
- User consent required
- No email storage beyond extraction
- Encrypted email content in transit
- Option to disable auto-extraction

## Related Documents

- [01 - Core Data Models](./01-core-data-models.md)
- [03 - Authentication & Authorization](./03-authentication-authorization.md)
- [04 - NLP Interface](./04-nlp-interface.md)
