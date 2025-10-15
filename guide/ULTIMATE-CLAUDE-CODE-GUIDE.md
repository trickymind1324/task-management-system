# The Ultimate Claude Code Guide

**For:** Application Team

**Purpose:** Team workflows and onboarding documentation for using Claude Code

**Read This Before:** Starting any project with Claude Code

**Last Updated:** October 8, 2025

---

## 📚 Table of Contents

### Part I: Getting Started with Claude Code
1. [Installation & Setup](#part-i-getting-started-with-claude-code)
2. [Essential Features](#essential-features)
3. [Smart Prompting Techniques](#smart-prompting-techniques)
4. [Power User Features](#power-user-features)

### Part II: Our Team's Workflow
5. [Team Philosophy](#part-ii-our-teams-workflow)
6. [Project Structure Pattern](#project-structure-pattern)
7. [The CLAUDE.md Strategy](#the-claudemd-strategy)
8. [Documentation-First Approach](#documentation-first-approach)
9. [Phase-by-Phase Development](#phase-by-phase-development)
10. [Best Practices & Common Commands](#best-practices)

### Quick Start
- **New to Claude Code?** Read Part I (sections 1-4)
- **New to our team?** Read Part II (sections 5-10)
- **Both?** Read the entire guide (plan 30-45 minutes)

---

# Part I: Getting Started with Claude Code

## 1. Installation & Setup

### Choose Your Installation Method

You have three main options:

1. **Local Installation** (Recommended for beginners)
   - Download from Anthropic's website
   - Install on your computer
   - Best for: Learning and small projects

2. **Remote Server** (For advanced users)
   - Install on AWS, Digital Ocean, or similar
   - Code from anywhere, even your phone (using Termius)
   - Best for: Working across devices

3. **Inside Other Tools**
   - Use within Cursor, Windsurf, or VS Code
   - Best for: Existing IDE workflows

### Choose Your Subscription Plan

| Plan | Cost | Best For |
|------|------|----------|
| **Pro** | $20/month | Learning, small projects |
| **Max** | $100/month | Serious developers (5x higher limits) |
| **Max 20X** | $200/month | Heavy users coding all day |
| **API** | Variable | Only if company-paid (expensive) |

**Our Recommendation:** Start with Pro, upgrade to Max when you're productive.

### Essential First-Time Setup

Run these commands immediately after installation:

```bash
# 1. Enable multi-line prompts (CRITICAL)
/terminal-setup

# 2. Connect to your IDE
/ide

# 3. Initialize your project
/init
```

**Why this matters:**
- Multi-line prompts let you write complex instructions
- IDE connection gives Claude access to diagnostics
- `/init` auto-generates project documentation

### Master the Three Input Modes

Press `Shift + Tab` to cycle through:

1. **Edit Mode** (Default)
   - Asks permission before making changes
   - Use for: Reviewing changes carefully

2. **Auto-Accept Mode** ⭐ (Recommended)
   - Makes changes without asking
   - Use for: Most work - trust Claude

3. **Plan Mode** ⭐ (Critical for our workflow)
   - Creates plans without writing code
   - Use for: Thinking through problems, documentation

**Pro Tip:** Use Plan Mode for all documentation and architecture work!

## Essential Keyboard Shortcuts

| Shortcut | Action | When to Use |
|----------|--------|-------------|
| `CMD/CTRL + ESC` | Quick open Claude Code | Instant access |
| `CMD/CTRL + L` | Clear screen | Fresh start |
| `ESC + ESC` | Jump to previous prompt | Undo mistakes |
| `ESC` (once) | Interrupt Claude | Stop wrong path |
| `CMD/CTRL + R` | Verbose output | More details |
| `CMD/CTRL + N` | New buffer | Long prompts |
| `Shift + Enter` | New line in prompt | Multi-line input |
| `Ctrl + B` | Run in background | Dev servers, logs |

**Memorize these first three - they'll save you hours!**

## Essential Features

### 1. To-Do Lists for Complex Tasks ⭐

For any project with 3+ steps:

```
"Create a to-do list first for implementing [feature]"
```

**Why:** Prevents loops, keeps you organized, shows progress.

**Our team rule:** ALWAYS use todo lists for documentation and multi-step tasks.

### 2. Bash Mode - Your Terminal in Claude

Claude can run terminal commands directly:

```
"Install the dependencies"
"Run the tests and fix any errors"
"Create a git commit with message 'Add feature X'"
```

**What Claude can do:**
- Read files
- Install packages
- Run git commands
- Execute tests
- Start dev servers

**What NOT to use Bash for:**
- File operations (use Read, Write, Edit tools instead)
- Simple communication (just talk to Claude directly)

### 3. Work with Images

**Three ways to add images:**

1. Drag and drop screenshots
2. Copy-paste from clipboard
3. Reference file path

**Use cases:**
- UI debugging ("Fix this layout issue" + screenshot)
- Design mockups ("Make it look like this")
- Error screenshots ("What's wrong here?")

### 4. Track Your Costs

```bash
# View token usage and costs
npx ccusage

# Real-time monitoring
npx ccusage --live
```

**Budget tip:** Clear context regularly with `/clear` to reduce token usage.

### 5. Resume After Crashes

If Claude crashes or you lose connection:

```
/resume
```

Works even after power outages! Your work is safe.

## Smart Prompting Techniques

### Control Thinking Power

| Keyword | Thinking Level | When to Use |
|---------|----------------|-------------|
| `"think about..."` | Basic, fast | Simple tasks |
| `"think harder about..."` | Deep analysis | Complex problems |
| `"ultrathink about..."` | Maximum power | Critical decisions |

**Example:**
```
"Ultrathink about the best database architecture for this project"
```

### Use Subagents for Large Tasks

For complex work like refactoring:

```
"Use subagents to refactor this codebase"
```

**What happens:**
1. Claude splits the work into chunks
2. Creates parallel agents
3. Coordinates the work
4. Merges results

**When to use:** Large refactors, multi-file changes, parallel work.

### Run Tasks in Loops

For iterative fixes:

```
"Run the build in a loop and fix all errors as they appear"
```

**Perfect for:** Type errors, linting issues, test failures.

### Leverage Planning Mode ⭐

Switch to Plan Mode (`Shift + Tab` twice), then:

```
"Plan the architecture for [feature]"
"Think through how to solve [problem]"
"Debug why [issue] is happening"
```

**Our team uses this for:**
- All FRD creation
- Architecture decisions
- Problem analysis

### Use the Message Queue

You can type new messages while Claude is working:

```
Claude is working on Task 1...
You type: "After that, do Task 2"
You type: "Then deploy to staging"
```

All messages queue and execute in order!

## Power User Features

### The `CLAUDE.md` File ⭐⭐⭐

**Most important file in your project!**

Claude reads this EVERY time it works on your project.

**What to include:**
- Coding standards
- Project architecture
- Git workflow
- Testing requirements
- DO and DON'T rules

**Quick start:**
```
"Analyze my project and create a comprehensive CLAUDE.md file"
```

**Advanced: Nested CLAUDE.md Files**

Create directory-specific rules:

```
project/
├── CLAUDE.md (root - overall project)
├── frontend/CLAUDE.md (frontend-specific)
└── backend/CLAUDE.md (backend-specific)
```

**Auto-add rules:**

Type a rule during conversation:

```
# "Always use async/await instead of .then()"
```

Claude will automatically add it to `CLAUDE.md`!

### Custom Commands

Create shortcuts in `.claude/commands/`:

**Example: `.claude/commands/test.md`**
```markdown
Run all tests and fix any failures
```

**Usage:**
```
/test
```

**Our team uses these for:**
- `/deploy` - Deploy to staging
- `/build-check` - Build and fix errors
- `/docs-update` - Regenerate documentation

### Hooks for Automation

**Auto-commit when done:**

Add to `CLAUDE.md`:
```markdown
When a task is complete, automatically:
1. Run IDE diagnostics
2. Fix all errors
3. Git add all changes
4. Create descriptive commit message
5. Commit (don't push)
```

**Auto-format on save:**

Add hook to `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": {
      "Write": "prettier --write {file_path}",
      "Edit": "prettier --write {file_path}"
    }
  }
}
```

### MCP Extensions

**Essential extensions:**

1. **TaskMaster AI** - Breaks complex work into chunks
2. **Playwright** - Browser testing
3. **Context7** - Updated documentation

**Install:**
```
/mcp install taskmaster
```

### Multiple Models Strategy

| Model | When to Use | Cost |
|-------|-------------|------|
| **Opus** | Complex architecture, critical decisions | High |
| **Sonnet** | Routine coding, implementations | Medium |
| **Combo** | Opus for planning, Sonnet for coding | Efficient |

**Our team default:** Sonnet for most work, Opus for architecture.

### Background Commands

Press `Ctrl + B` to run in background:

```
"Start the dev server" (Ctrl + B)
"Watch the logs" (Ctrl + B)
```

**Stop background tasks:** Press `K`

**Perfect for:** Dev servers, log monitoring, long-running processes.

### Clear Context Strategically

After major tasks:

```
/clear
```

**When to clear:**
- After completing a feature
- Before starting unrelated work
- When context feels "polluted"
- To reduce token costs

**Don't clear:**
- In the middle of related work
- When you need conversation history

---

# Part II: Our Team's Workflow

## Team Philosophy

Our approach to Claude Code is built on three core principles:

### 1. **Plan Before You Build**

> "A prototype built without planning is just expensive exploration."

**What this means:**
- Document requirements BEFORE writing code
- Break down features into FRDs (Feature Requirement Documents)
- Start with clickable prototypes to validate UX
- Never jump straight to production

**Why:**
- Saves time (fixing design is cheaper than fixing code)
- Aligns team on what to build
- Creates reusable documentation
- Reduces miscommunication

### 2. **Context is King**

> "Every directory should explain itself to Claude."

**What this means:**
- Each directory has its own `CLAUDE.md` file
- Root `CLAUDE.md` provides overall vision
- Documentation guides Claude's decisions
- Never assume Claude knows your context

**Why:**
- Claude makes better decisions with context
- New team members understand instantly
- Reduces back-and-forth clarification
- Scales as project grows

### 3. **Iterate in Phases**

> "Prototype → Production → AI Features"

**Our three-phase approach:**

**Phase 1: Clickable Prototype**
- Next.js with mock data
- Validate UX/UI
- Get stakeholder feedback
- No backend, no database

**Phase 2: Production Backend**
- Real database (PostgreSQL)
- Go backend with APIs
- Authentication
- Connect frontend to real backend

**Phase 3: AI Features**
- NLP interfaces
- Email integration
- Knowledge graphs
- Advanced features

**Why this order:**
- Validate UX before committing to architecture
- Cheaper to change prototypes than production code
- Get feedback early
- Reduces wasted effort

## Project Structure Pattern

**Every project follows this structure:**

```
project-name/
├── CLAUDE.md                    # Project vision & tech stack
├── docs/                        # Feature Requirements (FRDs)
│   ├── CLAUDE.md                # How to use docs
│   ├── 00-INDEX.md              # Master navigation
│   ├── 01-core-data-models.md
│   ├── 02-task-management-ui.md
│   ├── ...
│   └── 10-prototype-specifications.md
├── prototype/                   # Phase 1 (mock data)
│   ├── CLAUDE.md
│   ├── app/
│   ├── components/
│   └── lib/
├── backend/                     # Phase 2 (Go + PostgreSQL)
│   ├── CLAUDE.md
│   ├── cmd/
│   ├── internal/
│   └── pkg/
└── frontend/                    # Phase 2 (Next.js + API)
    ├── CLAUDE.md
    └── ...
```

**Why this structure?**
- **Separation of concerns** - Each directory has one job
- **Claude-friendly** - Context files everywhere
- **Scalable** - Easy to add features
- **Team-friendly** - Self-documenting

## The CLAUDE.md Strategy

### Rule: Every Directory Gets a CLAUDE.md

**Purpose:** Tell Claude exactly what to do in each directory.

### Root CLAUDE.md Template

**Must include:**

```markdown
# Project Name - One Line Description

## Project Overview
[What the product does]

## Core Vision
[Why we're building this]

## Key Objectives
- Business Goal: [measurable]
- User Goal: [experience]
- System Goal: [technical]

## Target Users
1. **Persona 1** (Name) - Needs and pain points
2. **Persona 2** (Name) - Needs and pain points

## Technology Stack
### Backend
- Runtime: Go
- Framework: Gin/Fiber
- Database: PostgreSQL

### Frontend
- Framework: Next.js + TypeScript
- Styling: Tailwind CSS
- State: Zustand

## Project Structure
[ASCII tree with annotations]

## Directory Guide
[Explain each major directory]

## Getting Started with Claude Code
### Phase 1: Build Clickable Prototype
[Commands]

### Phase 2: Build Production Backend
[Commands]

## Notes
- Author: [Name]
- Version: [X.Y]
- Date: [Date]
```

### Directory-Specific CLAUDE.md Template

**Must include:**

```markdown
# [Directory Name] Guide

**Purpose:** [One sentence]

## Scope

### Include
- [What to build here]
- [Specific features]

### Exclude
- [What NOT to build]
- [Deferred to other directories]

## Tech Stack
[Specific to this directory]

## Key Commands
[Relevant commands for this directory]

## Related Directories
[Links to related folders]
```

### Real Examples from Our Team

**`prototype/CLAUDE.md`:**
```markdown
# Prototype Directory Guide

**Purpose:** Clickable prototype with mock data for UX validation

## Scope

### Include
- Next.js frontend with mock data
- UI components per docs/02-task-management-ui.md
- In-memory mock store
- Basic interactions

### Exclude
- Real database
- Production backend
- Authentication (use mock)
- AI features

## Tech Stack
- Next.js 14+
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand for state
- Mock data in lib/data/

## Key Commands
- "Build TaskList component per docs/02-task-management-ui.md"
- "Create mock data store with 30 sample tasks"
- "Deploy prototype to Vercel"
```

**`backend/CLAUDE.md`:**
```markdown
# Backend Directory Guide

**Purpose:** Production Go backend with PostgreSQL

## Scope

### Include
- RESTful API per docs/09-api-specification.md
- PostgreSQL database
- JWT authentication
- GORM models

### Exclude
- Frontend code (see /frontend)
- Mock data (that's in /prototype)
- AI features (Phase 3)

## Tech Stack
- Go 1.21+
- Gin framework
- GORM
- PostgreSQL
- JWT for auth

## Key Commands
- "Implement tasks API per docs/09-api-specification.md"
- "Create database schema per docs/01-core-data-models.md"
- "Add JWT middleware"
```

## Documentation-First Approach

### Why We Document First

Before writing ANY code, we create FRDs (Feature Requirement Documents).

**Benefits:**
1. **Team alignment** - Everyone knows what to build
2. **Better AI output** - Claude generates better code
3. **Prevents scope creep** - Clear boundaries
4. **Living documentation** - Evolves with project
5. **Parallel work** - Different people work on different FRDs

### FRD Structure

**Every FRD follows this template:**

```markdown
# FRD-XX: Feature Name

**Feature:** [One-line description]
**Version:** [X.Y]
**Last Updated:** [Date]
**Status:** [Draft/Active/Completed]
**Priority:** [P0/P1/P2]

---

## Overview
[What this feature does and why]

## User Stories
- As a [user type], I want [goal] so that [benefit]

## Functional Requirements
[What it must do]

## Technical Specifications
[How to build it]

## Prototype Scope ⭐

### Include (For Prototype)
[What to implement now]

### Exclude (Post-Prototype)
[What to defer to production]

## API Contracts (if applicable)
[Request/response formats]

## UI/UX Mockups (if applicable)
[Descriptions or ASCII art]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Change Log
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | ... | ... | Initial draft |

## Related Documents
[Links to other FRDs]
```

### FRD Naming Convention

| Range | Priority | Examples |
|-------|----------|----------|
| `00` | Index | 00-INDEX.md |
| `01-09` | P0 (Critical) | Core features for prototype |
| `10-19` | P1 (Important) | Production features |
| `20+` | P2 (Future) | AI/advanced features |

**Standard FRDs:**
- `00-INDEX.md` - Master navigation (ALWAYS FIRST)
- `01-core-data-models.md` - Data schemas
- `02-task-management-ui.md` - UI specifications
- `03-authentication-authorization.md` - Auth
- `09-api-specification.md` - API design
- `10-prototype-specifications.md` - Prototype scope (ALWAYS FRD-10)

### The Master Index (00-INDEX.md)

**Purpose:** Navigation hub for all FRDs

**Must include:**

```markdown
# Project Name - FRD Index

## Purpose
[What this directory contains]

## Development Strategy
### Current Phase: [Prototype/Production/AI]
[What we're building now]

## FRD Navigation

### Core Foundation (P0)
| Document | Feature | Priority | Prototype Status |
|----------|---------|----------|------------------|
| [01](./01-...) | ... | P0 | Required |

## Priority Levels
- P0: Critical - implement now
- P1: Important - mock for prototype
- P2: Future - plan now, build later

## Reading Guide
[Who reads what and when]
```

## Phase-by-Phase Development

### Phase 0: Project Initialization

**When:** Starting a new project

**Steps:**

1. **Create project directory**
   ```bash
   mkdir project-name && cd project-name
   ```

2. **Create root CLAUDE.md**
   - Define vision
   - List target users (with real names: Bharath, Sunny, Raghu)
   - Document tech stack
   - Add structure diagram

3. **Create docs directory**
   ```bash
   mkdir docs
   ```

4. **Use Plan Mode with Claude**
   ```
   [Switch to Plan Mode: Shift + Tab twice]

   "Read CLAUDE.md and create comprehensive FRDs in docs/.
   Break requirements into modular features.
   Create master index at docs/00-INDEX.md.
   Add docs/CLAUDE.md explaining how to use documentation.
   Focus on prototype-first approach with clear prototype scope sections."
   ```

5. **Review the plan**
   - Check FRD structure
   - Verify prototype scope is clear
   - Ensure P0/P1/P2 priorities make sense

6. **Approve and execute**
   ```
   "Approve the plan and proceed"
   ```

7. **Review generated FRDs**
   - Read each document
   - Ask Claude to clarify sections
   - Iterate until perfect

**Deliverables:**
- ✅ Root CLAUDE.md
- ✅ docs/CLAUDE.md
- ✅ docs/00-INDEX.md
- ✅ 10+ FRDs with prototype scope

### Phase 1: Build Clickable Prototype

**When:** After documentation complete

**Goal:** Validate UX before production

**Duration:** 8-12 days

**Steps:**

1. **Start with FRD-10**
   ```
   "Read docs/10-prototype-specifications.md and docs/00-INDEX.md"
   ```

2. **Set up prototype**
   ```
   "Create prototype directory per docs/10-prototype-specifications.md.
   Initialize Next.js with TypeScript.
   Set up Tailwind CSS and shadcn/ui.
   Create prototype/CLAUDE.md explaining prototype scope."
   ```

3. **Create mock data**
   ```
   "Create mock data store per docs/01-core-data-models.md.
   Include 30 sample tasks with diverse properties.
   Add 5 mock users: Bharath (Manager), Sunny (Member), Raghu (Admin), etc.
   Use realistic dates, priorities, and statuses."
   ```

4. **Implement UI (by priority)**
   ```
   Day 1-2:
   "Build TaskList component per docs/02-task-management-ui.md"

   Day 3-4:
   "Build TaskBoard component with drag-and-drop per docs/02-task-management-ui.md"

   Day 5:
   "Create task detail panel per docs/02-task-management-ui.md"

   Day 6:
   "Implement mock authentication per docs/03-authentication-authorization.md"

   Day 7-8:
   "Add filters, search, and polish"
   ```

5. **Test user flows**
   - Create task flow
   - Update task status flow
   - View details flow
   - Filter and search flow

6. **Deploy**
   ```
   "Deploy prototype to Vercel"
   ```

**Deliverables:**
- ✅ Clickable prototype URL
- ✅ All P0 features working
- ✅ 30+ mock tasks
- ✅ Stakeholder demo completed

### Phase 2: Build Production Backend

**When:** After prototype validated

**Goal:** Real database and APIs

**Duration:** 15-20 days

**Steps:**

1. **Set up backend**
   ```
   "Create backend directory structure for Go web service.
   Include cmd/, internal/, pkg/ directories.
   Add backend/CLAUDE.md explaining backend scope.
   Initialize Go modules and install Gin, GORM, PostgreSQL driver."
   ```

2. **Database layer**
   ```
   "Create PostgreSQL schema per docs/01-core-data-models.md"
   "Implement GORM models for Task, User, Department, Project"
   "Add database migrations"
   ```

3. **API layer**
   ```
   "Implement tasks API per docs/09-api-specification.md"
   "Add API middleware for logging, CORS, error handling"
   "Implement JWT authentication per docs/03-authentication-authorization.md"
   ```

4. **Connect frontend**
   ```
   "Create frontend/ directory by copying prototype/"
   "Replace mock store with real API calls"
   "Add error handling and loading states"
   "Update frontend/CLAUDE.md"
   ```

**Deliverables:**
- ✅ Go backend with PostgreSQL
- ✅ RESTful API working
- ✅ JWT authentication
- ✅ Frontend connected to backend

### Phase 3: Add AI Features

**When:** After production backend stable

**Goal:** Intelligent automation

**Duration:** 20-30 days

**Steps:**

1. **NLP task creation**
   ```
   "Build NLP service per docs/04-nlp-interface.md using Claude API"
   ```

2. **Email integration**
   ```
   "Implement Gmail/Outlook integration per docs/05-email-integration.md"
   ```

3. **Knowledge graph**
   ```
   "Set up Neo4j and implement graph schema per docs/07-knowledge-graph.md"
   ```

**Deliverables:**
- ✅ Natural language task creation
- ✅ Email task extraction
- ✅ Dependency visualization

## Best Practices

### 1. Always Use Plan Mode for Documentation ⭐⭐⭐

**When creating FRDs or planning:**

```
[Switch to Plan Mode: Shift + Tab twice]

"Create comprehensive FRDs for [project].
Don't execute - just plan the structure."
```

**After review:**
```
"Approve the plan and proceed"
```

**Why:** Prevents Claude from executing before you review.

### 2. Reference FRDs in Every Request

**Good:**
```
"Build TaskList component per docs/02-task-management-ui.md"
```

**Bad:**
```
"Build a task list component"
```

**Why:** Ensures Claude follows YOUR specifications.

### 3. Use Prototype Scope Sections

**Every FRD must have:**

```markdown
## Prototype Scope

### Include (For Prototype)
- Feature X with mock data
- Feature Y (simplified)

### Exclude (Post-Prototype)
- Real authentication
- Database
- Complex feature Z
```

**Why:** Prevents overbuilding prototypes.

### 4. Version Everything

**Always include:**

```markdown
- Version: 1.5
- Date: October 8, 2025
- Author: Sunny
```

**When updating:**
1. Increment version
2. Update date
3. Add change log entry

**Why:** Track changes, know what's current.

### 5. Use Mock Data with Real Names

**Example:**

```typescript
const MOCK_USERS = [
  {
    user_id: 'user-001',
    email: 'Bharath@example.com',
    full_name: 'Bharath',
    role: 'Manager'
  },
  {
    user_id: 'user-002',
    email: 'Sunny@example.com',
    full_name: 'Sunny',
    role: 'Member'
  },
  {
    user_id: 'user-003',
    email: 'Raghu@example.com',
    full_name: 'Raghu',
    role: 'Admin'
  }
];
```

**Why:** Makes demos relatable, easier to test scenarios.

### 6. Update Documentation as You Build

**When something changes:**

1. Update the relevant FRD
2. Increment version number
3. Add change log entry
4. Tell Claude:
   ```
   "Update docs/02-task-management-ui.md to reflect [change].
   Increment version and add change log entry."
   ```

**Why:** Documentation = reality.

### 7. Use Consistent Command Patterns

**Structure:**
```
"[Action] [Component] per docs/[FRD-XX]-[name].md"
```

**Examples:**
```
"Build authentication per docs/03-authentication-authorization.md"
"Create task board per docs/02-task-management-ui.md"
"Implement API per docs/09-api-specification.md"
```

**Why:** Clarity and consistency.

### 8. Create Todo Lists for Multi-Step Work

**For complex tasks:**

```
"Create a todo list for implementing the prototype.
Break down into individual components."
```

**Claude will:**
1. Create checklist
2. Mark items as in-progress
3. Mark completed
4. Track progress

**Why:** Never miss a step.

### 9. Clear Context After Major Milestones

**After completing a feature:**

```
/clear
```

**When NOT to clear:**
- In middle of related work
- Need conversation history
- Working on connected features

**Why:** Reduce tokens, fresh context.

### 10. Deploy Prototypes Early

**Don't wait for perfection:**

```
"Deploy prototype to Vercel even though [feature X] incomplete"
```

**Why:** Early feedback, real usage data.

## Common Commands

### Documentation Phase

```bash
# Create FRDs
"[Plan Mode] Read CLAUDE.md and create comprehensive FRDs in docs/.
Follow pattern: 00-INDEX, 01-core-data-models, 02-ui, etc.
Prototype-first approach with clear scope sections."

# Add new FRD
"Create docs/11-new-feature.md following standard template"

# Update FRD
"Update docs/02-task-management-ui.md to include [requirement].
Increment version and add change log."

# Create directory guide
"Create [directory]/CLAUDE.md explaining scope and purpose"
```

### Prototype Phase

```bash
# Setup
"Read docs/10-prototype-specifications.md and set up prototype/"

# Mock data
"Create mock data store per docs/01-core-data-models.md with 30 tasks"

# Components
"Build [Component] per docs/[FRD].md"
"Implement [feature] per docs/[FRD].md (prototype version only)"

# Testing
"Add mock data for [scenario] to test [flow]"

# Deploy
"Deploy prototype to Vercel"
```

### Production Phase

```bash
# Backend
"Set up Go backend per docs/09-api-specification.md with Gin"
"Create PostgreSQL schema per docs/01-core-data-models.md"
"Implement tasks API per docs/09-api-specification.md"

# Frontend
"Replace mock store with real API calls to [endpoint]"
"Add error handling for API failures"
```

### AI Features Phase

```bash
# NLP
"Implement NLP service per docs/04-nlp-interface.md using Claude API"

# Email
"Build email extraction per docs/05-email-integration.md"

# Graph
"Set up Neo4j per docs/07-knowledge-graph.md"
```

## Team Onboarding Checklist

### For New Team Members

-  **Read this entire guide** (30-45 minutes)
-  **Install Claude Code**
-  **Run essential setup**
      ```bash
      /terminal-setup
      /ide
      ```
-  **Clone project repository**
-  **Read root `/CLAUDE.md`** - Project vision
-  **Read `docs/CLAUDE.md`** - Documentation structure
-  **Read `docs/00-INDEX.md`** - Navigate FRDs
-  **Read `docs/10-prototype-specifications.md`** - Current phase
-  **Test Claude Code**
      ```
      "Read docs/00-INDEX.md and summarize the project"
      ```
-  **Complete first task**
      ```
      "Read docs/[FRD].md and help me implement [component]"
      ```

### For Team Leads

-  **Ensure all directories have CLAUDE.md**
-  **Review FRDs for completeness**
-  **Verify prototype scope clarity**
-  **Set up team git conventions**
-  **Create project-specific examples**
-  **Schedule documentation reviews** (weekly)
-  **Establish FRD update process**

## Common Mistakes to Avoid

### ❌ Don't Skip Setup

**Always run:**
```bash
/terminal-setup
/ide
/init
```

**Create CLAUDE.md before coding!**

### ❌ Don't Ignore Context Limits

**Do:**
- Use `/clear` regularly
- Break down large tasks
- Switch modes appropriately

**Don't:**
- Let context grow indefinitely
- Try to do everything in one session

### ❌ Don't Forget to Commit

**Claude has no automatic checkpoints!**

**Do:**
- Commit often
- Use auto-commit rules
- Use `/resume` if session lost

**Don't:**
- Work for hours without commits
- Assume changes are saved

### ❌ Don't Review Every Line

**Focus on:**
- Feature-level functionality
- Tests passing
- User experience

**Don't:**
- Micromanage implementation
- Review routine code changes
- Waste time on style (use auto-format)

### ❌ Don't Skip Plan Mode

**Use Plan Mode for:**
- Creating FRDs
- Architecture decisions
- Problem analysis
- Documentation

**Never:**
- Jump straight to coding
- Skip planning phase
- Assume Claude knows your intent

## Troubleshooting

### "Claude isn't following my FRD"

**Solution:**
```
"Build [feature] per docs/[FRD].md. Follow specifications exactly.
Pay special attention to the Prototype Scope section."
```

### "Claude is overbuilding the prototype"

**Solution:**
Check FRD has clear Prototype Scope. If missing:
```
"Update docs/[FRD].md to add Prototype Scope section.
Make clear that [features] are excluded from prototype."
```

### "Documentation is outdated"

**Solution:**
Make updates part of workflow:
```
"Update docs/[FRD].md to reflect [change].
Increment version, add change log entry."
```

### "New member is overwhelmed"

**Solution:**
Start small:
```
"Read docs/02-task-management-ui.md.
Just build the TaskRow component.
Don't worry about other components yet."
```

### "Token usage too high"

**Solution:**
- Use `/clear` after major tasks
- Switch to Sonnet instead of Opus
- Break work into smaller sessions
- Remove verbose output mode

## Essential Rules for Every Project

Add these to your `CLAUDE.md`:

```markdown
## Version Control
- Create feature branches
- Commit frequently with descriptive messages
- Never push to main directly
- Auto-commit when tasks complete

## Code Quality (CRITICAL)
- Always run IDE diagnostics after editing
- Fix all errors before marking task complete
- Use auto-format hooks
- Run tests before committing

## Documentation
- Update README when features change
- Create inline comments for complex logic
- Generate API docs from code
- Keep change logs updated

## Testing
- Write tests for new features
- Run existing tests before committing
- Focus on end-to-end tests
- Use TDD for complex features
```

## Advanced Tips

### Use Parallel Subagents

For complex problems:
```
"Use parallel subagents to explore multiple solutions for [problem]"
```

Gets you several approaches to choose from.

### Create Custom Subagents

```
/agents create ui-designer "Expert in UI/UX, responsive design, accessibility"
/agents create security-reviewer "Security expert, finds vulnerabilities"
```

Then:
```
"Use the ui-designer agent to review this interface"
```

### Reference Files in Rules

In `CLAUDE.md`:
```markdown
## API Standards
See: @docs/api-specification.md

## UI Guidelines
See: @docs/ui-guidelines.md
```

Claude will read these files when needed.

### Monitor Dependencies

In `CLAUDE.md`:
```markdown
## Dependencies
Current versions:
- Next.js: 14.2.3
- React: 18.2.0
- Tailwind: 3.4.1

Never install different versions without updating this list.
```

Prevents version conflicts.

## Workflow Summary

```
1. New Project
   └─> Create root CLAUDE.md
       └─> Create docs/ with FRDs
           └─> Create docs/CLAUDE.md
               └─> Create docs/00-INDEX.md

2. Prototype (Phase 1)
   └─> Read docs/10-prototype-specifications.md
       └─> Create prototype/
           └─> Create prototype/CLAUDE.md
               └─> Build with mock data
                   └─> Deploy and validate

3. Production (Phase 2)
   └─> Create backend/
       └─> Create backend/CLAUDE.md
           └─> Implement per FRDs
               └─> Connect frontend

4. AI Features (Phase 3)
   └─> Implement per FRDs 04-08
       └─> Test and iterate

5. Maintain
   └─> Update FRDs when requirements change
       └─> Keep CLAUDE.md current
           └─> Version everything
```

## Real Example: How John Uses Claude Code

**Session transcript:**

```
John: "go through the files and understand"

Claude: [Explores codebase]

John: "create FRDs in docs/, focus on clickable prototype first.
Every directory needs its own CLAUDE.md explaining scope."

Claude: [Switches to Plan Mode, shows comprehensive plan]

John: [Reviews] "Approve and proceed"

Claude: [Creates 12 FRDs, all CLAUDE.md files]

Result: Complete documentation ready for development!
```

**Key takeaway:** High-level direction → Claude handles details → Always use established patterns.

---

## Quick Reference Card



### Essential Commands
```bash
/terminal-setup    # Enable multi-line (run once)
/ide              # Connect IDE
/init             # Auto-generate docs
/clear            # Clear context
/resume           # Continue after crash
Shift + Tab       # Cycle input modes
ESC               # Interrupt Claude
Ctrl + B          # Run in background
```

### Our Workflow
```
1. Plan Mode → Create FRDs
2. Build prototype (mock data)
3. Deploy and validate
4. Build production backend
5. Connect frontend
6. Add AI features
```

### Every Directory Needs
```
CLAUDE.md with:
- Purpose
- Scope (include/exclude)
- Tech stack
- Key commands
```

### Every FRD Needs
```
- Prototype Scope section
- User stories
- Acceptance criteria
- Change log
```

### Before Starting Work
```
1. Read relevant FRD
2. Check CLAUDE.md
3. Use Plan Mode for complex work
4. Reference FRD in prompts
```

---

## Conclusion

This guide combines:
- **Claude Code fundamentals** (Part I)
- **Our team's proven workflow** (Part II)

**The goal:** Make you 10x more productive while maintaining:
- High code quality
- Excellent documentation
- Team alignment
- Scalable processes

**Remember:**
1. **Plan before you build**
2. **Context is king**
3. **Iterate in phases**



---

**Contributors:**
- Sunny 


**Version:** 1.0

**Last Updated:** October 8, 2025

