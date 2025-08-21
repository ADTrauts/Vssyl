<!--
Developer Tools Product Context
See README for the modular context pattern.
-->

# Developer Tools Product Context

**Description:**
This file documents the product context for all developer-facing features, including module management, developer dashboards, and "God Mode" tools.

## 1. Header & Purpose
- **Purpose:**  
  The Developer Tools module provides features for developers to manage modules, access developer dashboards, and use advanced ("God Mode") tools for debugging, monitoring, and platform extension.
- **Cross-References:**  
  - [adminProductContext.md] (admin/monitoring overlap)
  - [marketplaceProductContext.md] (module management)
  - [systemPatterns.md] (developer patterns, module system)

## 2. Problem Space
- Developers need tools to manage modules, debug, and monitor system health.
- Lack of centralized developer dashboard limits productivity and oversight.

## 3. User Experience Goals
- Centralized dashboard for module management and developer analytics.
- Access to advanced tools for debugging, monitoring, and testing.
- Secure, developer-only access to sensitive features.

## 3a. Panel-Based Layout & Navigation
- **Left Sidebar:** Navigation between modules, analytics, monitoring, and tools.
- **Main Panel:** Module lists, analytics, logs, and controls.
- **Panel Features:** Filtering, sorting, and action buttons for each tool.

## 4. Core Features & Requirements
- Module management (view, submit, update, delete)
- Developer dashboard (stats, analytics)
- Monitoring (module health, logs, metrics)
- Advanced tools ("God Mode")
- Secure, developer-only access

## 4a. Feature Checklist (Implementation Status)
| Feature                | Status      | Notes/Location (if implemented)      |
|------------------------|-------------|--------------------------------------|
| Module Management      | ✅          | Marketplace backend, APIs            |
| Developer Dashboard    | ✅          | `/developer-portal` + business-scoped route |
| Monitoring             | ⚠️ Partial | Marketplace monitoring, logs         |
| Advanced Tools         | ❌ Planned  |                                      |

## 5. Integration & Compatibility
- Integrates with Marketplace, monitoring, and analytics APIs.

## 5a. Data Model Reference
- Module, ModuleSubmission, Developer, Log (see [databaseContext.md])

## 6. Technical Constraints & Decisions
- Developer-only access enforced at API and UI.
- Uses Node.js, Express, React, REST APIs.

## 7. Success Metrics
- Developer productivity
- Module management efficiency
- System health/uptime

## 8. Design & UX References
- VS Code Extensions, GitHub Actions, Atlassian Developer Console
- [designPatterns.md], [systemPatterns.md]

## 8a. Global Components & Integration Points
- Developer dashboard, module management panels, monitoring widgets.

## 12. Navigation & Business Context (New)
- Business-scoped Developer Portal is accessible via the Work area:
  - Path: `/business/{businessId}/workspace/developer-portal`
  - Also available globally at `/developer-portal` and supports `?businessId={id}`
- Module submission flow now routes users to create or link a business after upload:
  - `BusinessCreationModal` offers "Create New Business" and "Link to Existing Business"
  - On completion, user is redirected to `/business/{id}/workspace`, which includes a Developer Portal quick action

## 13. Current Implementation Notes (New)
- Frontend Developer Portal APIs (`web/src/api/developerPortal.ts`) accept optional `businessId` to scope stats and revenue
- Backend Developer Portal services/controllers accept optional `businessId` to filter modules by business
- Business Workspace shows a Modules widget and a direct "Developer Portal" action
- Developer Portal Modules tab lists modules (when in business scope), supports inline pricing and analytics, and links to Module Details (`/business/{id}/workspace/developer-portal/modules/{moduleId}`)

## 9. Testing & Quality
- Unit/integration tests for developer APIs and UI.
- E2E tests for module management flows.

## 10. Future Considerations & Ideas
- In-app code editor
- Real-time log streaming
- Advanced debugging tools

## 11. Update History & Ownership
- **2024-06:** Initial draft.  
  Owner: [Your Name/Team]