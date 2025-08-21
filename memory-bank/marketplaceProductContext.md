<!--
Marketplace Product Context
See README for the modular context pattern.
-->

# Marketplace Product Context

## 1. Header & Purpose

**Purpose:**  
The Marketplace module enables users and developers to discover, submit, review, and manage installable modules and plugins for the Block on Block platform. It is designed to foster extensibility, customization, and a vibrant ecosystem of third-party and proprietary modules. The Marketplace supports secure submission, approval, and monitoring of modules, with a vision for a user-friendly UI for browsing, searching, and managing modules in the future.

**Cross-References:**  
- See also:  
  - [dashboardProductContext.md] (integration of modules as dashboard widgets)
  - [chatProductContext.md], [driveProductContext.md] (modules that can be extended via Marketplace)
  - [systemPatterns.md] (module system architecture, security, and monitoring)
  - [designPatterns.md] (planned UI/UX for Marketplace)
  - [databaseContext.md] (data model and relationships)

## 2. Problem Space

- Users and organizations need a way to extend the platform with new features and integrations.
- Developers require a secure, standardized process for submitting and managing modules/plugins.
- Admins need tools for reviewing, approving, and monitoring third-party code.
- There is currently no UI for browsing or managing modules, limiting discoverability and adoption.

## 3. User Experience Goals

- Simple, secure submission and approval process for modules/plugins.
- Intuitive UI for browsing, searching, and installing modules (planned).
- Clear feedback and status for module submissions and approvals.
- Role-based access for developers, reviewers, and admins.
- Seamless integration of installed modules into the user's dashboard and workflows.
- Monitoring and health status for installed modules.

## 4. Core Features & Requirements

- Module/plugin submission with validation and metadata.
- Admin review, approval, and rejection of modules.
- Developer and reviewer roles for module management.
- Module search, update, and deletion.
- Security policy enforcement and monitoring for installed modules.
- REST API endpoints for all core operations.
- (Planned) UI for browsing, searching, and managing modules.
- Integration with dashboard and other modules.

## 3a. Panel-Based Layout & Navigation

*Planned for UI implementation:*
- **Left Sidebar:** Categories, filters, user modules.
- **Main Panel:** Module/plugin cards, search results, featured items.
- **Side Panels (optional):** Module details, install/configure dialogs.
- **Panel Features:**
  - Responsive, interactive panels/cards.
  - State preserved for user filters/searches.
  - Mobile and desktop support.

## 4a. Feature Checklist (Implementation Status)

> **Note:** All features marked as planned due to full platform rebuild. Status will be updated as features are re-implemented.

| Feature                        | Status      | Notes/Location (if implemented)                |
|-------------------------------|-------------|-----------------------------------------------|
| Data Model & API Foundations   | ✅          | Implemented (Prisma models, controllers)      |
| Module/Plugin Submission       | ✅          | Implemented (`/modules/submit`)               |
| Admin Review/Approval/Reject   | ✅          | Implemented (`/modules/submissions/*`)        |
| Developer/Reviewer Roles       | ✅          | Implemented (via roles/permissions)           |
| Module Search/Discovery        | ✅          | Implemented (`/modules/marketplace`)          |
| Install/Update/Delete          | ✅          | Implemented (`install/uninstall/configure`)   |
| Security Policy & Monitoring   | ❌          | Planned                                       |
| Integrations (Dashboard, Chat, Drive) | ✅   | Partially via Modules page; runtime pending   |
| UI for Browsing/Managing Modules | ✅        | Basic modules page implemented                |
| Notifications                  | ❌          | Planned                                       |
| Analytics & Reporting          | ❌          | Planned                                       |
| Compliance & Audit             | ❌          | Planned                                       |
## 4b. Runtime (MVP) Integration

- Add iframe‑based runtime host and `GET /api/modules/:id/runtime` endpoint.
- Submission supports hosted bundle URL; approval sets `manifest.frontend.entryUrl`.
- Installed modules get “Open” action linking to `/modules/run/:id`.


*Update status as features are rebuilt.*

## 5. Integration & Compatibility

- Modules can extend or integrate with Dashboard, Chat, Drive, and other core modules.
- REST API endpoints allow other modules to query, install, or manage marketplace modules.
- Security and monitoring are enforced for all installed modules.
- Designed for extensibility: new module types and integrations can be added.

## 5a. Data Model Reference

- See [databaseContext.md](./databaseContext.md) and `prisma/schema.prisma` for full details.
- **Key entities for Marketplace:**
  - **Module:** Represents an installable module, with metadata, versioning, and compatibility.
  - **ModuleSettings:** Stores settings/configuration for each module.
  - **ModuleData:** Stores module-specific data.
  - **moduleSubmission:** Tracks submission, approval, and review status.
  - **User:** Can install, review, and manage modules.
- **Important relationships:**
  - Users can develop, review, and install multiple modules.
  - Modules can be updated and versioned.
  - Submissions are linked to developers and reviewers.

## 6. Technical Constraints & Decisions

- Backend implemented with Node.js, Express, and Prisma ORM.
- Security policies enforced for all modules (no direct file system/network/process access by default).
- Module monitoring for health and metrics.
- All API endpoints require authentication; some require admin.
- UI/UX for Marketplace is planned but not yet implemented.

## 7. Success Metrics

- Number of modules submitted, approved, and installed.
- User and developer engagement with the Marketplace.
- Time to review/approve modules.
- Module health and security compliance.
- User satisfaction with module discovery and management (once UI is built).

## 8. Design & UX References

- Planned inspiration: VS Code Extensions Marketplace, Atlassian Marketplace, Google Workspace Marketplace.
- [designPatterns.md] (planned UI/UX patterns for cards, search, install dialogs)
- [systemPatterns.md] (module system architecture, security, and monitoring)

## 8a. Global Components & Integration Points

- **Global Components (planned):**
  - Module cards, install/configure dialogs, search/filter UI.
  - Integration with dashboard widgets and module management panels.
- **Integration Points:**
  - Dashboard: modules as widgets or dashboard extensions.
  - Chat/Drive: modules that extend or integrate with core features.
  - API: endpoints for module management, install, and health monitoring.
- **Persistent/Global UI (planned):**
  - Marketplace navigation and install dialogs accessible from anywhere in the app.

## 9. Testing & Quality

- Unit and integration tests for all backend services and API endpoints.
- (Planned) E2E tests for module submission, approval, and management UI.
- Security and compliance testing for all modules.
- Monitoring and alerting for module health.

## 10. Future Considerations & Ideas

- Full-featured UI for browsing, searching, and managing modules.
- Third-party developer onboarding and documentation.
- AI-driven module recommendations and search.
- Module/plugin analytics and reporting.
- Team/shared module management.
- Custom notification center for module updates.
- Theming and dark mode.
- Business start-up tools (planned)
- Training/operations modules (planned)
- Vendor/service connection integrations (planned)

## 11. Update History & Ownership

- **2024-06:** Major update to reflect current Marketplace backend implementation and planned UI.  
  Owner: [Your Name/Team]
- **2024-06:** Feature checklist reordered and expanded for best-practice rebuild. All features marked as planned. Status will be updated as features are re-implemented.