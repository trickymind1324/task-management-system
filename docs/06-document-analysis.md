# FRD-06: Document Analysis

**Feature:** Automatic Task Extraction from Documents

**Version:** 1.0

**Last Updated:** October 6, 2025

**Status:** Draft

**Priority:** P2 (Post-Prototype - AI Feature)

---

## Overview

Automatically analyze uploaded documents (PDF, DOCX, TXT) and extract actionable tasks, deadlines, and assignments using AI-powered document parsing.

## User Stories

- As a project manager, I want to upload meeting notes and auto-create tasks for action items
- As a user, I want to drag-and-drop a PDF contract and extract all deliverables as tasks
- As a team lead, I want to process project proposals and create task lists automatically

## Supported Formats

| Format | Extension | Extraction Method |
|--------|-----------|-------------------|
| PDF | .pdf | pdfcpu (Go) + AI OCR |
| Word | .docx | go-docx + AI parsing |
| Text | .txt, .md | Direct text extraction + AI |
| Excel | .xlsx | Spreadsheet parsing (future) |

## Example Scenarios

### Scenario 1: Meeting Notes

**Document Upload:** `meeting-notes-2025-10-06.pdf`

**Content:**
```
Q4 Planning Meeting - October 6, 2025

Action Items:
- Bharath: Finalize landing page design by Oct 15
- Sunny: Complete API integration by Oct 20
- Raghu: Review security audit by Oct 18
```

**Extracted Tasks:**
```json
[
  {
    "title": "Finalize landing page design",
    "assignees": ["user-001"], // Bharath
    "due_date": "2025-10-15",
    "source": "Document",
    "confidence_score": 0.92
  },
  {
    "title": "Complete API integration",
    "assignees": ["user-002"], // Sunny
    "due_date": "2025-10-20",
    "source": "Document",
    "confidence_score": 0.88
  }
]
```

### Scenario 2: Project Proposal

**Document:** Project proposal with deliverables timeline

**AI Extraction:** Parse document structure, identify deadlines, milestones, and responsible parties

## Technical Architecture

```
Document Upload → File Storage → Parser (PDF/DOCX) → Text Extraction → AI Analysis → Task Extraction → Review UI
```

### Go Libraries

```go
// Document parsing
import (
    "github.com/pdfcpu/pdfcpu"      // PDF parsing
    "github.com/unidoc/unioffice"   // DOCX parsing
)
```

### AI Extraction Prompt

```
Analyze this document and extract all actionable tasks, deadlines, and assignments.

Document title: {filename}
Content:
{extracted_text}

For each task found, extract:
1. Task title/description
2. Assignee (if mentioned)
3. Due date or deadline
4. Priority indicators
5. Context/notes
6. Confidence score

Format: JSON array
```

## UI Flow

1. User uploads document via drag-and-drop or file picker
2. Processing indicator ("Analyzing document...")
3. Show extracted tasks in review panel
4. User can edit, approve, or reject each task
5. Bulk create approved tasks
6. Attach original document to all created tasks

## Prototype Scope

**Exclude from prototype** - Implement in Phase 2.

**Future Enhancement:**
- Support for images with OCR
- Handwriting recognition
- Multi-language support
- Batch document processing

## Related Documents

- [01 - Core Data Models](./01-core-data-models.md)
- [04 - NLP Interface](./04-nlp-interface.md)
- [05 - Email Integration](./05-email-integration.md)
