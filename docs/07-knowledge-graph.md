# FRD-07: Knowledge Graph

**Feature:** Task & User Relationship Modeling with Neo4j

**Version:** 1.0

**Last Updated:** October 6, 2025

**Status:** Draft

**Priority:** P2 (Post-Prototype - Advanced Intelligence)

---

## Overview

Build a knowledge graph using Neo4j to model relationships between tasks, users, projects, and departments. Enable advanced queries like dependency chains, bottleneck identification, and hidden insight discovery.

## User Stories

- As a project manager, I want to visualize task dependencies to identify critical path
- As a department head, I want to see collaboration patterns between teams
- As the system, I want to suggest related tasks based on historical patterns

## Graph Schema

### Nodes

```cypher
// Task Node
(:Task {
  task_id: string,
  title: string,
  status: string,
  priority: string,
  created_at: datetime
})

// User Node
(:User {
  user_id: string,
  full_name: string,
  role: string,
  department_id: string
})

// Department Node
(:Department {
  department_id: string,
  name: string
})

// Project Node
(:Project {
  project_id: string,
  name: string,
  status: string
})
```

### Relationships

```cypher
// Task relationships
(task1:Task)-[:DEPENDS_ON]->(task2:Task)
(task1:Task)-[:BLOCKS]->(task2:Task)
(task:Task)-[:PART_OF]->(project:Project)
(task:Task)-[:SUBTASK_OF]->(parent:Task)

// User relationships
(user:User)-[:ASSIGNED_TO]->(task:Task)
(user:User)-[:CREATED]->(task:Task)
(user:User)-[:COMMENTED_ON]->(task:Task)
(user:User)-[:WORKS_IN]->(dept:Department)
(user:User)-[:COLLABORATES_WITH]->(user2:User)

// Project relationships
(project:Project)-[:BELONGS_TO]->(dept:Department)
(user:User)-[:OWNS]->(project:Project)
```

## Advanced Queries

### Find All Blocking Tasks

```cypher
// Tasks that are blocking others but not completed
MATCH (blocker:Task)-[:BLOCKS]->(blocked:Task)
WHERE blocker.status <> 'Done'
RETURN blocker, blocked
ORDER BY blocker.priority DESC
```

### Find Dependency Chain

```cypher
// Complete dependency path for a task
MATCH path = (task:Task {task_id: $taskId})-[:DEPENDS_ON*]->(dependency:Task)
RETURN path
```

### Identify Bottleneck Users

```cypher
// Users with most assigned high-priority incomplete tasks
MATCH (user:User)-[:ASSIGNED_TO]->(task:Task)
WHERE task.status IN ['To Do', 'In Progress', 'Blocked']
  AND task.priority IN ['High', 'Urgent']
RETURN user.full_name, count(task) as task_count
ORDER BY task_count DESC
LIMIT 10
```

### Find Collaboration Patterns

```cypher
// Users who frequently work together
MATCH (u1:User)-[:ASSIGNED_TO]->(task:Task)<-[:ASSIGNED_TO]-(u2:User)
WHERE u1.user_id < u2.user_id
RETURN u1.full_name, u2.full_name, count(task) as collaborations
ORDER BY collaborations DESC
```

### Suggest Related Tasks

```cypher
// Tasks related to current task via users/projects
MATCH (task:Task {task_id: $taskId})
MATCH (task)-[:PART_OF]->(project:Project)<-[:PART_OF]-(related:Task)
WHERE related.task_id <> task.task_id
  AND related.status <> 'Done'
RETURN related
LIMIT 5
```

## Visualization

### Dependency Graph View

```
    Task A (To Do)
        ↓ depends_on
    Task B (In Progress) ← blocks
        ↓                    ↑
    Task C (Blocked)    Task D
        ↓
    Task E (To Do)
```

**UI Component:** Interactive force-directed graph using react-flow or cytoscape.js

### Team Collaboration Network

```
      Raghu
     /  |  \
  Bharath Sunny Alex
     \  |  /
      Emma
```

**UI Component:** Network diagram showing collaboration strength (edge thickness)

## Prototype Scope

**Include (Simplified):**
- Mock graph data in memory
- Basic dependency visualization (react-flow)
- Show dependency list in task details

**Exclude:**
- Real Neo4j database
- Advanced graph queries
- ML-based suggestions
- Real-time graph updates

## Production Implementation (Go + Neo4j)

```go
// Example Neo4j query in Go
import "github.com/neo4j/neo4j-go-driver/v5/neo4j"

func GetDependencyChain(taskID string) ([]Task, error) {
    session := driver.NewSession(neo4j.SessionConfig{})
    defer session.Close()

    result, err := session.Run(
        `MATCH path = (task:Task {task_id: $taskId})-[:DEPENDS_ON*]->(dep:Task)
         RETURN dep`,
        map[string]interface{}{"taskId": taskID},
    )

    // Process results...
}
```

## Future Enhancements

- **ML-Based Insights:** Predict task completion time based on historical patterns
- **Risk Detection:** Identify projects at risk based on dependency chains
- **Resource Optimization:** Suggest task reassignments to balance workload
- **Pattern Mining:** Discover recurring workflows

## Related Documents

- [01 - Core Data Models](./01-core-data-models.md)
- [02 - Task Management UI](./02-task-management-ui.md)
- [08 - Analytics Dashboard](./08-analytics-dashboard.md)
