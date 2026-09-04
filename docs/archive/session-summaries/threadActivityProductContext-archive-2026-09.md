> **Historical / non-authoritative.** Archived in Batch 1C-4B-1 (2026-09). Current owners: see the Memory Bank redirect stub at the original path. Do not treat this body as product or architecture law.

<!--
Thread Activity Product Context
See README for the modular context pattern.
-->

# Thread Activity Product Context

**Description:**
This file documents the product context for thread activity logging, analytics, and visualization across all modules.

## [2026-04-21] Activity Interoperability Contract

Thread activity is part of the platform-wide interoperability layer, not an isolated feature.

### Canonical flow

For thread-relevant actions:

1. Authorize actor + context
2. Execute domain action
3. Persist normalized activity event
4. Deliver realtime update to authorized consumers
5. Render UI updates in thread/activity surfaces

### Canonical event expectations

Thread activity events must include:

1. Actor identity (`userId`, role when applicable)
2. Action verb (`message`, `edit`, `share`, `react`, `read`, etc.)
3. Target entity (`message`, `thread`, `file`, etc.)
4. Parent scope (`conversation`, `folder`, `project`, etc. when relevant)
5. Tenant context (`dashboardId` and/or `businessId`/`householdId`)
6. Visibility scope (who can see the event)
7. Timestamp + metadata payload

### Activity vs analytics boundary

1. Thread activity stores immutable, event-level records ("what happened").
2. Thread analytics derives aggregates/trends ("how often", "patterns").
3. Analytics must not replace auditable activity records.

## 1. Header & Purpose
- **Purpose:**  
  The Thread Activity module provides event-level logging, audit trails, and real-time engagement features for threads, conversations, and collaborative contexts. It enables users and admins to review what happened in a thread, when, and by whom, supporting compliance, accountability, and workflow analysis. Thread Activity is distinct from Analytics, which focuses on aggregated, cross-thread insights.
- **Cross-References:**  
  - [chatProductContext.md] (thread activity in chat)
  - [analyticsProductContext.md] (aggregated insights)
  - [systemPatterns.md] (event logging, audit trails)
  - [databaseContext.md] (ThreadActivity, ActivityLog models)

## 2. Problem Space
- Previous thread activity code may be AI-generated, incomplete, or not fully functional.
- The purpose and requirements for thread activity need to be clarified and validated.
- Users and admins need accurate, event-level audit trails for compliance, support, and engagement.

## 3. User Experience Goals
- Clear, real-time activity feeds and timelines for threads.
- Accurate, detailed audit trails (who did what, when).
- Non-intrusive, accessible, and performant UI.
- Modular, per-thread activity views (not global dashboards).

## 3a. Panel-Based Layout & Navigation
- **Activity Feed/Timeline:** Shown in thread detail panels, chat, or document collaboration UIs.
- **Panels:** List or timeline of events (messages, edits, shares, reactions, etc.), with timestamps and user info.
- **Integration:** Activity feeds embedded in thread, chat, or document UIs.

## 4. Core Features & Requirements
- Event-level logging for thread actions (messages, edits, shares, reactions, etc.).
- Real-time updates for activity feeds.
- Audit trail storage and retrieval via API.
- Modular, per-thread activity components.
- Strict review and validation of all thread activity features.

## 4a. Feature Checklist (Implementation Status)
| Feature                | Status      | Notes/Location (if implemented)      |
|------------------------|-------------|--------------------------------------|
| Activity Feed/Timeline | ⚠️ Partial | ActivityTimeline.tsx, ActivityHeatmap.tsx (review needed) |
| Event Logging          | ⚠️ Partial | Backend controllers/routes (review needed) |
| Audit Trail Storage    | ⚠️ Partial | API, models (review needed)          |
| Real-Time Updates      | ⚠️ Partial | WebSocket, API (review needed)       |
| Modular Components     | ⚠️ Partial | thread-activity components           |
| Validated Use Cases    | ❌ Planned  | Must be defined and reviewed         |
| Analytics Integration  | ❌ Planned  | For future, if needed                |

## 5. Integration & Compatibility
- Integrated with chat, threads, and collaborative modules.
- API and WebSocket support for real-time updates.
- Designed for extensibility to other modules and analytics.

## 5a. Data Model Reference
- See [databaseContext.md] and `prisma/schema.prisma` for ThreadActivity, ActivityLog models.

## 6. Technical Constraints & Decisions
- All thread activity code must be reviewed and validated before deployment.
- Remove or refactor any legacy/AI-generated thread activity code that is not validated.
- Thread activity must be modular and not introduce instability to the application.
- Use only real, production data sources for event logging.

## 7. Success Metrics
- Accuracy and completeness of activity logs.
- User/admin engagement with activity feeds.
- No negative impact on application stability or performance.
- User/business feedback on audit trail usefulness.

## 8. Design & UX References
- Slack, GitHub, Google Docs (activity feeds, audit trails)
- [designPatterns.md], [systemPatterns.md]

## 8a. Global Components & Integration Points
- ActivityTimeline, ActivityHeatmap, ActivityMetrics, ThreadActivityVisualization, and related modular components.

## 9. Testing & Quality
- Unit/integration tests for activity logging and UI.
- E2E tests for activity feed workflows.
- Data validation and accuracy checks.
- Performance and load testing.

## 10. Future Considerations & Ideas
- Audit and refactor/remove legacy/AI-generated thread activity code.
- Expand thread activity only with validated, user-driven requirements.
- Add analytics integration only after core activity logging is stable and validated.
- Support for export, compliance, and advanced audit features.

## 11. Update History & Ownership
- **2024-06:** Major update to clarify thread activity purpose and distinction from analytics.  
  Owner: [Your Name/Team]