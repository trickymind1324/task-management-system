# Project Synapse - Documentation Directory

**Last Updated:** October 13, 2025

---

## About This Directory

The `docs/` folder contains all Feature Requirement Documents (FRDs) for Project Synapse - an intelligent, agentic task management system designed for mid-sized enterprises.

---

## 🎯 Project Overview

### Core Vision
Create a "zero-admin" task management experience where users focus on execution rather than organization, with AI handling the administrative overhead.

### Key Objectives
- **Business Goal**: Increase operational productivity by 20% within the first year
- **User Goal**: Zero-admin task management experience
- **System Goal**: Achieve 90%+ accuracy in automated task creation and categorization

### Target Users
1. **Project Managers** (Bharath) - Holistic project views, dependency tracking, bottleneck identification
2. **Individual Contributors** (Sunny) - Consolidated, prioritized task lists from multiple sources
3. **Department Heads/Executives** (Raghu) - High-level analytics and strategic insights

---

## 📋 Core Features to Implement

### 1. Natural Language Processing Interface
- Conversational task management
- Voice and text command support
- Context-aware task interpretation

### 2. Omni-Channel Task Ingestion
- Email integration (Google Workspace, Microsoft 365)
- Document analysis and task extraction
- API endpoints for third-party integrations
- GUI-based manual task creation

### 3. Intelligent Document Analysis
- PDF, DOCX, and text file parsing
- Automatic task identification from attachments
- Context extraction and metadata generation

### 4. Departmental Categorization
- Auto-categorization based on organizational structure
- Department-based filtering and views
- Cross-departmental collaboration tracking

### 5. Task & User Knowledge Graph
- Relationship modeling between tasks, users, and projects
- Dependency visualization
- Hidden insight discovery through graph analysis

### 6. Reinforcement Learning from User Feedback
- Continuous improvement of task suggestions
- Learning from user corrections and modifications
- Personalized automation patterns

---

## 🗂️ Documentation Structure

```
docs/
├── CLAUDE.md                           # This file - project overview
├── 00-INDEX.md                         # Master index and navigation
├── 01-core-data-models.md              # Database schemas and data structures
├── 02-task-management-ui.md            # UI/UX specifications
├── 03-authentication-authorization.md  # Auth and permissions
├── 04-nlp-interface.md                 # Natural language processing
├── 05-email-integration.md             # Email task extraction
├── 06-document-analysis.md             # Document parsing
├── 07-knowledge-graph.md               # Relationship modeling
├── 08-analytics-dashboard.md           # Business intelligence
├── 09-api-specification.md             # RESTful API design
└── 10-prototype-specifications.md      # Prototype scope and implementation
```

---

## 📊 Data Model: Task Schema

```typescript
interface Task {
  // Core Identifiers
  task_id: string;                    // UUID - Primary key
  title: string;                      // Required, max 255 chars
  description: string;                // Rich text (Markdown)

  // Status & Priority
  status: 'To Do' | 'In Progress' | 'In Review' | 'Blocked' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';

  // Assignment & Ownership
  assignees: string[];                // Array of User_IDs
  creator: string;                    // User_ID, Required
  department: string;                 // Department_ID

  // Temporal Data
  creation_date: Date;                // Auto-generated timestamp
  due_date: Date | null;              // Optional
  completion_date: Date | null;       // Null until status = Done

  // Relationships
  project: string | null;             // Project_ID, nullable
  dependencies: string[];             // Array of Task_IDs (depends_on)

  // Metadata
  source: 'GUI' | 'Email' | 'API' | 'Document' | 'NLP';
  attachments: string[];              // Array of File_IDs
  tags: string[];                     // User or AI-generated keywords
  confidence_score: number | null;    // Float 0.0-1.0, AI confidence
  metadata: Record<string, any>;      // JSONB flexible storage
}
```

---

## 🛠️ Technology Stack

### Backend (Production)
- **Runtime**: Go (Golang)
- **Framework**: Gin or Fiber
- **Database**: PostgreSQL (with JSONB support)
- **Graph Database**: Neo4j (for knowledge graph)
- **Cache**: Redis
- **Message Queue**: RabbitMQ or Apache Kafka
- **ORM**: GORM or sqlc

### AI/ML
- **NLP**: OpenAI GPT API / Anthropic Claude API
- **Document Processing**: Go libraries (pdfcpu, go-docx) + external AI services
- **ML Framework**: TensorFlow / PyTorch (Python microservice for RL)
- **Vector Database**: Pinecone or Weaviate (for semantic search)

### Frontend (Production)
- **Framework**: Next.js with TypeScript
- **State Management**: Zustand or React Context API
- **UI Components**: Tailwind CSS
- **Data Visualization**: D3.js, Recharts
- **Graph Visualization**: react-flow or cytoscape.js

### Prototype
- **Framework**: Next.js 15.5.4 with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Mock API**: json-server (REST API on port 3001)
- **Data**: Mock database (db.json)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Datadog, Sentry
- **Cloud Provider**: AWS / GCP / Azure

---

## 🎯 Development Phases

### Phase 0: Prototype & UX Validation (COMPLETE ✅)
- [x] Set up project structure and dependencies
- [x] Implement core data models (Task, User, Department, Project)
- [x] Create mock database with 30+ sample tasks
- [x] Build mock RESTful API (json-server)
- [x] Implement dashboard UI with List, Board, Calendar views
- [x] Add task CRUD operations (GUI-based)
- [x] Implement mock authentication
- [x] Validate UX with stakeholders

### Phase 1: Production MVP (IN PROGRESS 🚧)
**Core Features:**
- [x] Production frontend foundation (Next.js + TypeScript)
- [ ] Go backend with Gin framework
- [ ] PostgreSQL database with GORM
- [ ] RESTful API endpoints (all CRUD operations)
- [ ] JWT authentication with refresh tokens
- [ ] Task management (all views from prototype)
- [ ] Email integration (Gmail, Outlook)
  - [ ] OAuth 2.0 authentication
  - [ ] Email parsing and task extraction
  - [ ] Attachment handling
- [ ] Scheduled/Recurring tasks
  - [ ] Cron-based scheduling
  - [ ] Task recurrence patterns (daily, weekly, monthly)
  - [ ] Automatic task generation
- [ ] Role-Based Access Control (RBAC)
  - [ ] Zoho authentication integration
  - [ ] Keycloak identity management
  - [ ] Role definitions (Admin, Manager, Member, Viewer)
  - [ ] Permission-based access control

**Infrastructure:**
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging environment deployment
- [ ] Basic monitoring and logging

### Phase 2: AI & Intelligence Layer
- [ ] Natural Language Processing (NLP)
  - [ ] OpenAI/Claude API integration
  - [ ] Task extraction from text
  - [ ] Confidence scoring
- [ ] Document analysis
  - [ ] PDF/DOCX parsing
  - [ ] Automatic task identification
- [ ] Knowledge graph (Neo4j)
  - [ ] Task dependencies
  - [ ] User collaboration patterns
  - [ ] Bottleneck detection
- [ ] Reinforcement learning
  - [ ] User feedback loop
  - [ ] Personalized suggestions

### Phase 3: Advanced Features
- [ ] Analytics dashboard
  - [ ] Task completion trends
  - [ ] Team performance metrics
  - [ ] Department insights
- [ ] Real-time updates (WebSockets)
- [ ] Advanced search and filtering
- [ ] Mobile app (React Native)
- [ ] Third-party integrations (Slack, Teams, Jira)

### Phase 4: Scale & Optimization
- [ ] Performance optimization
- [ ] Horizontal scaling support
- [ ] Advanced caching strategies
- [ ] Load testing and stress testing
- [ ] Security hardening
- [ ] Production deployment and monitoring

---

## 📈 Technical Requirements

### Non-Functional Requirements

**Security:**
- Role-Based Access Control (RBAC)
- Data encryption at rest and in transit
- Secure API authentication (OAuth 2.0)

**Integrations:**
- Google Workspace (Gmail, Calendar)
- Microsoft 365 (Outlook, Teams)
- RESTful API for third-party tools

**Scalability:**
- Support 2,000 active users
- Handle 100,000+ tasks without performance degradation
- Horizontal scaling capability

**Reliability:**
- 99.9% uptime SLA
- Automated backups and disaster recovery
- Error handling and graceful degradation

### Success Metrics
- **Adoption Rate**: % of employees using system weekly
- **Automation Rate**: % of auto-created vs manual tasks
- **Correction Rate**: % of AI tasks modified by users (lower = better)
- **User Satisfaction**: Net Promoter Score (NPS)

---

## ❌ Out of Scope (Version 1.0)

- Time tracking and billing
- Complex Gantt chart visualizations
- Financial budgeting and resource management
- On-premise deployment (cloud-only for V1)

---

## 📖 How to Use These Documents

### For Claude AI

**Starting prototype work:**
1. Read `10-prototype-specifications.md` first (the blueprint)
2. Reference `01-core-data-models.md` for data structures
3. Follow UI specs in `02-task-management-ui.md`
4. Use mock auth from `03-authentication-authorization.md`

**Starting production backend:**
1. Read `09-api-specification.md` for API contracts
2. Implement data models from `01-core-data-models.md`
3. Follow real auth spec from `03-authentication-authorization.md`

**Starting AI features:**
1. Read `04-nlp-interface.md` for NLP requirements
2. Read `05-email-integration.md` for email parsing
3. Read `06-document-analysis.md` for document processing
4. Read `07-knowledge-graph.md` for relationship modeling

### For Developers

**Starting a new feature:**
1. Find the relevant FRD in `00-INDEX.md`
2. Read the FRD completely before coding
3. Check "Prototype Scope" section for what to include/exclude
4. Refer to "Acceptance Criteria" for definition of done

---

## 🎨 FRD Priority Levels

- **P0 (Critical)**: Required for prototype - implement now
- **P1 (Important)**: Implement with mocks for prototype, real for production
- **P2 (Future)**: Plan now, implement after prototype validation

---

## 📝 Document Standards

Each FRD follows this structure:

```markdown
# FRD-XX: Feature Name
- Overview
- User Stories
- Functional Requirements
- Technical Specifications
- Prototype Scope (what's in/out)
- API Contracts (if applicable)
- UI/UX Mockups (if applicable)
- Acceptance Criteria
- Change Log
- Related Documents
```

---

## 🚀 Common Commands for Claude

**Prototype Work:**
- "Read docs/10-prototype-specifications.md and set up the prototype"
- "Create the TaskList component per docs/02-task-management-ui.md"
- "Implement the mock data store with 30 sample tasks per docs/01-core-data-models.md"
- "Build the task board view with drag-and-drop"

**Production Backend:**
- "Set up the Go backend with Gin framework"
- "Create the PostgreSQL schema per docs/01-core-data-models.md"
- "Implement the tasks API per docs/09-api-specification.md"
- "Build JWT authentication per docs/03-authentication-authorization.md"

**AI Features:**
- "Implement NLP task extraction per docs/04-nlp-interface.md"
- "Build email integration per docs/05-email-integration.md"
- "Create the knowledge graph with Neo4j per docs/07-knowledge-graph.md"

---

## 🔄 Updating FRDs

When updating a document:

1. Increment version number in the header
2. Update "Last Updated" date
3. Add entry to "Change Log" section at bottom
4. Update `00-INDEX.md` if adding/removing FRDs
5. Notify team of changes

---

## 🗂️ Related Directories

- **`/` (root)**: Project-wide CLAUDE.md (your personal Claude rules/workflow)
- **`/docs`**: This directory - feature specifications and product info
- **`/prototype`**: Clickable prototype implementation
- **`/backend`**: Go production backend (to be created)
- **`/frontend`**: Next.js production frontend (to be created)
- **`/guide`**: Team workflows and Claude Code onboarding materials

Each directory has its own CLAUDE.md file specific to its scope.

---

## 📍 Quick Reference

**Current Status:**
- ✅ Prototype: Functional with API-based architecture (json-server)
- ⏳ Production Backend: Not started
- ⏳ AI Features: Not started

**Prototype Location:** `/prototype`
**Prototype Status:** Ready for stakeholder demos and user feedback

---

## ℹ️ Getting Help

If a document is unclear or incomplete:
1. Check related documents for more context
2. Refer to `00-INDEX.md` for navigation
3. Ask Claude to explain specific sections
4. Propose updates via the change log

---

## ✅ Next Steps

1. ✅ Read this guide
2. → Read `00-INDEX.md` for navigation
3. → Read `10-prototype-specifications.md` to understand current state
4. → Read specific FRDs as needed for features

---

**Remember:** These documents are living specifications. Update them as the project evolves!

---

**Project Info:**
- **Author**: Sunny
- **Version**: 2.0
- **Date**: October 13, 2025
- **Status**: Active Development (Prototype Complete)
