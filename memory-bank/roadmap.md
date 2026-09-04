<!--
Update Rules for roadmap.md
- Only updated for major changes in project direction, phase completion, or new phase planning.
- All changes must be reviewed and approved before updating.
- Should always reflect the current, agreed-upon plan for the project's future.
- Use cross-references to other Memory Bank files to avoid duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents if the file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Block on Block Platform Rebuild Roadmap

<!--
This roadmap outlines the step-by-step phases for a complete rebuild of the platform. Each phase is high-level and cross-references the relevant product context files for detailed requirements, feature checklists, and implementation notes. For granular, up-to-date details, always refer to the product context files in memory-bank/.
-->

## Table of Contents
1. Principles & Constraints
2. Phase Breakdown
   - Phase 0: Foundation (Historical)
   - Phase 1: Core Architecture & Foundations
   - Phase 1b: Foundational Scaffolding (Complete)
   - Phase 2: Core Modules (MVP)
   - Phase 2.5: Global Search & Discovery (Platform-Wide)
   - Phase 3: Integrations & Advanced Features
   - Phase 4: Extensibility & Ecosystem
   - Phase 5: Migration, QA, and Launch
3. Milestones & Review Points
4. How to Use This Roadmap

---

## 1. Principles & Constraints
- **Modularity:** Each module (Chat, Drive, Dashboard, etc.) is independently testable, deployable, and replaceable.
- **Security & Compliance:** Role-based access, permissions, and audit logging are enforced from the start.
- **User Experience:** Persistent navigation, global chat, notifications, and responsive design are core.
- **Extensibility:** Marketplace, third-party modules, and future integrations are supported.
- **Testability:** CI/CD, code quality, and E2E testing are required for every phase.
- **Migration/Phased Rollout:** Support for data migration and incremental rollout if needed.

---

## 2. Phase Breakdown

### Phase 0: Foundation (Historical)
- Pre-build structure and rules established:
  - Monorepo, strict TypeScript, linting, UI library, Prisma, scaffolding, CI/CD, config resolution
- See [progress.md] for full checklist and completion status.

### Phase 1: Core Architecture & Foundations
- Monorepo & Tooling ([techContext.md])
- Design System & Global Layout ([designPatterns.md])
- Authentication & Authorization ([systemPatterns.md], [permissionsModel.md])
- Database Schema & Core Models ([databaseContext.md])
- API & Real-Time Infrastructure ([systemPatterns.md]; historical API notes archived under `docs/archive/session-summaries/apiDocumentation.md`)

### Phase 1b: Foundational Scaffolding (Complete)
- Persistent notification system (DB, API, NotificationList component)
- User roles & permissions (role field, RBAC, admin endpoint)
- User settings (DB, API, useUserSettings hook)
- Platform is now ready for module integration and next phase

### Phase 2: Core Modules (MVP) — Subphases

| Subphase | Module        | Context File                  | Description/Scope                                 |
|----------|---------------|-------------------------------|---------------------------------------------------|
| 2a       | Dashboard     | dashboardProductContext.md     | Persistent navigation, widgets |
| 2b       | Drive         | driveProductContext.md         | File/folder CRUD, sharing, permissions, real-time  |
| 2c       | Chat          | chatProductContext.md          | Real-time messaging, threads, file sharing, presence, global chat pop-up |
| 2d       | Admin         | adminProductContext.md         | User/org management, roles, activity log, monitoring|
| 2e       | Notifications | notificationsProductContext.md | Integration, UI, and advanced features            |
| 2f       | Calendar      | calendarProductContext.md      | Tab-bound calendars (Personal/Business/Household), Day/Week/Month/Year, combined overlays; attendees/RSVP; comments; ICS/export, free-busy |
| 2g       | To-Do   | todoProductContext.md          | AI-powered task management, List/Board views, multi-context support |

- **Current:** Phase 2g (To-Do) **COMPLETE** ✅ — Full implementation with marketplace registration, AI context integration, and multi-view support (List, Board). Calendar view and advanced features planned for Phase 2.

### Phase 2.5: Global Search & Discovery (Platform-Wide)
- **Purpose:** Implement unified search across all modules and content types
- **Scope:** 
  - Global search bar in DashboardLayout
  - Module search provider interface
  - Cross-module search results
  - Search history and suggestions
  - Deep linking to module content
- **Modules:** All installed modules implement search providers
- **Status:** Planned after Drive module completion

### Phase 3: Integrations & Advanced Features
- ✅ **Marketplace:** Module submission, approval, install, and monitoring ([marketplaceProductContext.md]) - COMPLETED
- ✅ **Analytics:** User and thread analytics, dashboards, reporting ([analyticsProductContext.md]) - COMPLETED
- ✅ **Household Management:** Family coordination with role-based access control ([productContext.md]) - COMPLETED
- ✅ **Enhanced Widget System:** Context-aware widgets with household features - COMPLETED
- ✅ **Notifications:** Complete real-time, push, and email notification system - COMPLETED
- ✅ **Compliance:** Audit logging, data retention, legal/privacy features ([compliance.md]) - COMPLETED
- **Presence:** Real-time user status across modules ([presenceProductContext.md]) - IN PROGRESS
- **Testing:** E2E, integration, and unit tests ([testingStrategy.md]; historical notes archived under `docs/archive/session-summaries/testingProductContext.md`) - PENDING

**Note:** Admin system infrastructure (platform-level analytics and administration) is planned for future development after core analytics are stable.

**Current Focus (Phase 3 Completion):**
- **ChatWidget Enhancement:** Add household chat channels and family communication features
- **Educational Module:** Complete educational institution management and student/teacher systems  
- **Business Module:** Enhance work collaboration tools and project management features
- **Widget Expansion:** Build additional widgets for all completed modules

### Phase 4: Extensibility & Ecosystem
- Third-party module support ([marketplaceProductContext.md])
- Advanced admin tools (God Mode, impersonation, org/billing management) ([adminProductContext.md])
- Team/shared dashboards, advanced analytics ([dashboardProductContext.md], [analyticsProductContext.md])
- Mobile/PWA support ([techContext.md], [designPatterns.md])

### Phase 5: Migration, QA, and Launch
- Data migration scripts and validation ([databaseContext.md])
- Full regression and performance testing ([testingStrategy.md]; historical: `docs/archive/session-summaries/testingProductContext.md`)
- Staged rollout, user onboarding, and feedback ([dashboardProductContext.md], [chatProductContext.md])
- Documentation, training, and support resources ([contributorGuide.md], [README.md])

### Phase 6: Vssyl_Place - Social/Connection Web Interface (Future Vision) 🎨
- **Status**: 🎨 **CONCEPTUAL** - Planning and vision phase
- **Purpose**: Redefine how users interact with the internet through a personalized, interconnected "place" or neighborhood
- **Context**: [vssylPlaceProductContext.md](./vssylPlaceProductContext.md)
- **Scope**: 
  - Visual connection mapping (network visualization inspired by Mini Metro/Galaxy)
  - User and business connection system (building on existing `Relationship` and `BusinessFollow` models)
  - Public business profiles and website linking
  - In-place purchasing and transaction system (building on Stripe integration)
  - Meeting place coordination and location marking
  - AI-powered reservation and purchase assistance
  - Work universe integration
- **Integration Points**: 
  - First tab in user header (before personal dashboards)
  - Leverages existing: Business profiles, user connections, payment system, AI system, calendar system
- **Visual Design**: Network visualization with nodes (users, businesses) and edges (connections), interactive manipulation, spatial context
- **Status**: Conceptual planning phase - detailed implementation plan to be developed
- **Note**: This is a major future feature that will require significant design and development work. The conceptual foundation has been documented, and implementation will begin after core platform features are stable.

---

## 3. Milestones & Review Points
- **End of Each Phase:** Internal review, QA, and stakeholder feedback
- **MVP Milestone:** Core modules functional, ready for limited user testing
- **Beta Milestone:** All integrations and advanced features in place, ready for broader testing
- **GA Launch:** Full migration, documentation, and support

---

## 4. How to Use This Roadmap
- **For high-level planning:** Use this roadmap to understand the overall rebuild sequence and major milestones.
- **For detailed requirements and implementation:** Always refer to the cross-referenced product context files in memory-bank/ for up-to-date feature checklists, requirements, and design notes.
- **For engineering tasks:** Break down each phase/module into granular tickets using the feature checklists and requirements in the product context files.
- **For progress tracking:** Update this roadmap only for major phase completions or changes in direction; update product context files for ongoing feature work.

---

_Last updated: 2024-06_ 