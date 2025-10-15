# FRD-08: Analytics Dashboard

**Feature:** Executive & Team Analytics with Insights

**Version:** 1.0

**Last Updated:** October 6, 2025

**Status:** Draft

**Priority:** P2 (Post-Prototype - Business Intelligence)

---

## Overview

Provide data-driven insights and visualizations for executives, managers, and team leads to track productivity, identify bottlenecks, and make informed decisions.

## User Stories

- As a department head, I want to see team productivity trends over time
- As an executive, I want to identify which projects are at risk
- As a project manager, I want to see task completion rates by assignee
- As the system, I want to surface hidden insights proactively

## Analytics Views

### 1. Executive Dashboard (Admin/Department Heads)

**Key Metrics:**

| Metric | Visualization | Description |
|--------|---------------|-------------|
| Total Tasks | Big number | All tasks in system |
| Active Tasks | Big number | To Do + In Progress + In Review |
| Completion Rate | Percentage | Done / Total (last 30 days) |
| Overdue Tasks | Big number (red) | Past due date, not done |
| Tasks by Status | Pie chart | Distribution across statuses |
| Tasks by Priority | Bar chart | Count by priority level |
| Tasks by Department | Bar chart | Distribution across departments |
| Trend Over Time | Line chart | Tasks created/completed by week |

**Layout:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Tasks │ Active      │ Completion  │ Overdue     │
│    245      │    128      │    73%      │     12      │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌──────────────────────────────┬──────────────────────────┐
│ Tasks by Status (Pie)        │ Tasks by Priority (Bar)  │
│                              │                          │
│   To Do: 45%                 │  Urgent:  ████  15       │
│   In Progress: 30%           │  High:    ████████  45   │
│   Done: 20%                  │  Medium:  ████████  60   │
│   Blocked: 5%                │  Low:     ████  35       │
└──────────────────────────────┴──────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Task Trend (Line Chart)                                │
│                                                        │
│  150│           ╱╲                                     │
│     │         ╱    ╲        Created                   │
│  100│       ╱        ╲    ╱                          │
│     │     ╱            ╲╱   Completed                │
│   50│   ╱                                             │
│     └─────────────────────────────────────            │
│      Week 1  Week 2  Week 3  Week 4                  │
└────────────────────────────────────────────────────────┘
```

### 2. Team Performance Dashboard (Managers)

**Key Metrics:**

- Tasks per team member
- Average completion time by assignee
- Workload distribution (task count per person)
- Top performers (most tasks completed)
- Collaboration matrix (who works with whom)

**Visualizations:**

- **Workload Bar Chart:** Tasks assigned to each team member
- **Completion Rate by User:** Percentage of tasks completed on time
- **Average Time to Complete:** Days to complete tasks (by assignee)
- **Collaboration Heatmap:** Frequency of co-assigned tasks

### 3. Project Analytics (Project Owners)

**Key Metrics:**

- Project progress (% complete)
- Tasks remaining vs. time left
- Critical path tasks
- Blocked tasks in project
- Estimated completion date (based on velocity)

**Burn Down Chart:**
```
Tasks
Remaining
  20│ ╲
    │   ╲
  15│     ╲ Ideal
    │       ╲
  10│         ╲       Actual
    │           ╲   ╱
   5│             ╲╱
    │               ╲
   0└─────────────────╲──
     Week 1  2  3  4  5
```

### 4. Individual Dashboard (All Users)

**My Stats:**

- Tasks completed this week/month
- Average completion time
- On-time delivery rate
- Current task load
- Upcoming deadlines (next 7 days)

**Gamification Elements (Future):**

- Streak (consecutive days with completed tasks)
- Badges (early bird, overachiever, collaborator)
- Leaderboard (optional, team-based)

## Data Points & Calculations

### Completion Rate

```typescript
const completionRate = (completedTasks / totalTasks) * 100;
```

### Average Completion Time

```typescript
const avgCompletionTime = tasks
  .filter(t => t.completion_date)
  .reduce((sum, t) => {
    const duration = t.completion_date - t.creation_date;
    return sum + duration;
  }, 0) / completedTasks.length;
```

### Workload Score

```typescript
// Weighted by priority
const workloadScore = tasks.reduce((score, t) => {
  const weight = {
    'Urgent': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1
  };
  return score + weight[t.priority];
}, 0);
```

### Project Velocity

```typescript
// Tasks completed per week
const velocity = completedTasksLastWeek / 1; // per week
const estimatedWeeksRemaining = remainingTasks / velocity;
```

## Insights Engine (AI-Powered)

### Automated Insights

**Examples:**

- "⚠️ Engineering department has 15 overdue tasks, highest in the company"
- "✨ Marketing team completed 23% more tasks this week compared to last week"
- "🚨 Project 'Website Redesign' is at risk - 8 blocked tasks"
- "👏 Sunny has completed 12 tasks this week, team record!"
- "📊 Average task completion time increased by 2 days this month"

### Insight Categories

1. **Alerts:** Problems requiring attention (overdue, blocked, at-risk)
2. **Trends:** Performance changes over time
3. **Achievements:** Positive milestones
4. **Recommendations:** Suggested actions

### AI Prompt for Insights

```
Analyze the following task data and generate 3-5 actionable insights:

Data:
- Total tasks: {total}
- Completed: {completed}
- Overdue: {overdue}
- Blocked: {blocked}
- By department: {dept_stats}
- By user: {user_stats}
- Trends: {trend_data}

Generate insights in categories: alerts, trends, achievements, recommendations.
Format: Emoji + concise message (max 100 chars)
```

## Prototype Scope

**Include (Simplified):**
- Executive dashboard with mock data
- Basic charts (bar, pie, line)
- Static insights (hardcoded)
- Desktop view only

**Exclude:**
- Real-time updates
- AI-generated insights
- Advanced filtering
- Export to PDF/Excel
- Custom report builder
- Mobile responsive

## Technology Stack

**Charting Libraries:**
- Recharts (recommended for React/Next.js)
- Chart.js (alternative)
- D3.js (for custom visualizations)

**Example Component:**

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const TaskTrendChart = ({ data }) => {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="week" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="created" stroke="#8884d8" />
      <Line type="monotone" dataKey="completed" stroke="#82ca9d" />
    </LineChart>
  );
};
```

## API Endpoints (Production)

### GET /analytics/overview

Get executive dashboard metrics.

**Response:**
```json
{
  "total_tasks": 245,
  "active_tasks": 128,
  "completion_rate": 73.2,
  "overdue_tasks": 12,
  "by_status": {
    "To Do": 65,
    "In Progress": 48,
    "In Review": 15,
    "Blocked": 8,
    "Done": 109
  },
  "by_priority": {
    "Urgent": 15,
    "High": 45,
    "Medium": 60,
    "Low": 35
  }
}
```

### GET /analytics/team/:department_id

Get team performance metrics.

### GET /analytics/user/:user_id

Get individual user stats.

### GET /analytics/insights

Get AI-generated insights.

**Response:**
```json
{
  "insights": [
    {
      "type": "alert",
      "message": "15 tasks overdue in Engineering department",
      "severity": "high"
    },
    {
      "type": "trend",
      "message": "Marketing team +23% productivity this week",
      "sentiment": "positive"
    }
  ]
}
```

## Success Metrics

- Executive users access analytics at least weekly
- Insights lead to 20% reduction in overdue tasks
- Managers use analytics to rebalance workload
- 80% of insights rated as "useful" by users

## Future Enhancements

- Predictive analytics (ML-based)
- Custom dashboard builder
- Scheduled email reports
- Slack/Teams integration for insights
- Export to BI tools (Tableau, Power BI)
- Mobile app with push notifications

## Related Documents

- [01 - Core Data Models](./01-core-data-models.md)
- [07 - Knowledge Graph](./07-knowledge-graph.md)
- [09 - API Specification](./09-api-specification.md)
