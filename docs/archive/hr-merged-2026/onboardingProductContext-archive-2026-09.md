> **Historical / non-authoritative.** Archived in Batch 1C-4B-1 (2026-09). Current owners: see the Memory Bank redirect stub at the original path. Do not treat this body as product or architecture law.

# Onboarding Module Product Context

## Summary of Major Changes / Update History
- 2025-11-12: Phase 1–3 delivered (schema, services/routes, frontend surfaces) and migrations applied; module customization UI and HR workspaces now render onboarding data live.
- 2025-11-11: Initial context created – phased implementation plan aligned with Business HR module and module customization settings.

## Cross-References & Modular Context Pattern
- See [hrProductContext.md](./hrProductContext.md) for the broader HR module architecture and tier gating.
- See [moduleSpecs.md](./moduleSpecs.md) and [`components/module-settings/*`](../web/src/components/module-settings) for the module customization framework this module plugs into.
- See [systemPatterns.md](./systemPatterns.md) for business workspace patterns, calendar sync, notifications, and audit logging.
- See [activeContext.md](./activeContext.md) / [progress.md](./progress.md) for current focus once implementation begins.

---

## Overview
The **Employee Onboarding Module** expands the HR platform with structured onboarding journeys, templates, task tracking, and automation. It leverages existing HR infrastructure (profiles, manager hierarchy, calendar sync, notifications, audit logs) and is configured through the new module customization settings inside the Business Admin workspace. The module targets Business Advanced (core onboarding) and Enterprise tiers (advanced automation/analytics).  

> **Implementation Status (Nov 12, 2025)**  
> ● Phase 1 (schema + services) — ✅ Done (`prisma/modules/hr/onboarding.prisma`, `hrOnboardingService`, `hrController`, route wiring, migration applied)  
> ● Phase 2 (module settings integration) — ✅ Done (module customization UI, context updates, admin save/get endpoints)  
> ● Phase 3 (employee/manager experiences) — ✅ Done (workspace pages rendering journeys/tasks, completion handling)  
> ● Phase 4+ (automation/analytics, template seeding, notifications) — 🔄 Planned / upcoming  

## Phased Implementation Plan

### Phase 0 — Blueprint & Alignment
- Reconfirm product requirements: onboarding milestones, document requests, equipment/uniform lists, training tasks, automations, analytics.
- Audit existing tables (`employee_hr_profiles`, `manager_approval_hierarchy`, `hrModuleSettings`) and calendar/notification services we will reuse.
- Decide where onboarding progress surfaces across admin dashboards and employee workspaces.

### Phase 1 — Core Data & API Layer
- **Database (`prisma/modules/hr/onboarding.prisma`)**
  - `OnboardingTemplate`: business-level onboarding recipes (owner, industry/role targeting, automation flags).
  - `OnboardingTaskTemplate`: task definitions with type, instructions, due-date offsets, approver/buddy, required artifacts.
  - `EmployeeOnboardingJourney`: one per employee per business (start date, progress, completion metadata).
  - `EmployeeOnboardingTask`: instantiated tasks (status, completion timestamps, assignees, artifacts, approvals).
  - Optional sub-tables: document request records, equipment assignments, training completions.
- **Services & Routes**
  - `hrOnboardingService.ts`: template CRUD, journey generation, task completion, automation triggers.
  - Extend `server/src/routes/hr.ts` and `hrController.ts` with `/admin/hr/onboarding/*` endpoints (templates, journeys, tasks).
  - Hook into existing hire/rehire flows so journeys auto-start when employees move to active.
  - Reuse `hrScheduleService` for calendar events; emit notifications/audit logs through existing infrastructure.
- **Integration**
  - Use `manager_approval_hierarchy` for approval routing.
  - Ensure journey/task creation respects business/employee scoping and tier gating.

### Phase 2 — Module Customization Settings Integration
- **Placement**: inside the business module customization settings UI (`ModuleSettingsEditor`, `ModuleSettingsPanel`).
- **Configuration UX**
  - Template builder with drag/drop ordering, due offsets, task owners (employee, manager, HR, buddy).
  - Module owner selector (who maintains settings, receives notifications).
  - Automation toggles (auto-start on hire, calendar events, buddy assignment).
  - Time-off policy knobs co-located with other HR settings (accrual defaults, carryover).
  - Validation + last-updated metadata.
- **State & Context**
  - Extend `ModuleSettingsContext` schema and `useModuleSettings` hook to include onboarding configuration payloads.
- **Backend Persistence**
  - Store configuration in `HRModuleSettings` JSON fields; add admin endpoints for get/save operations.

### Phase 3 — Employee & Manager Experience
- **Pages**
  - Employee self-service: `/business/[id]/workspace/hr/me/onboarding/page.tsx`.
  - Manager oversight: `/business/[id]/workspace/hr/team/onboarding/page.tsx`.
  - Update `HRWorkspaceLanding` dashboard widget to show current progress.
- **Components**
  - Timeline view, task cards, detail drawer, approval queue, document upload, buddy prompts.
  - Manager review queue using existing approval patterns.
- **Communication**
  - Notifications via central service (task assignments, reminders).
  - Calendar integration for tasks marked as schedule-worthy.

### Phase 4 — Automation, Analytics & AI
- **Automation Engine**: `hrOnboardingAutomationService` for auto-start journeys, buddy assignment, equipment ticket generation, calendar automation.
- **Analytics Dashboard**: completion rates, time-to-ramp, overdue tasks, export to CSV/PDF, `/admin/hr/onboarding/analytics` endpoints.
- **AI Enhancements**: expose onboarding context to AI assistant (status summaries, risk prediction, recommended actions); generate personalized task suggestions.

### Phase 5 — Advanced Enhancements
- Multi-template support by department/location/role; bulk onboarding for cohorts.
- External integrations (ServiceNow/JIRA for equipment, Slack/Teams notifications).
- Buddy feedback loops, satisfaction surveys, retention tracking.
- Cross-module widgets (dashboard tiles, analytics overlays).

---

## Dependencies & Integration Points
- **Existing Infrastructure Reuse**
  - HR admin/workspace layout, `useHRFeatures` tier gating, manager approval hierarchy, `hrScheduleService`, notifications, audit logs.
- **Module Settings Framework**
  - Configuration lives in the Business Admin “module customization” UI.
  - `ModuleSettingsEditor` persists onboarding settings via HR admin endpoints and `HRModuleSettings`.
- **Navigation**
  - Admin dashboards highlight onboarding setup status; workspace includes onboarding tabs.
- **Tier Strategy**
  - Business Advanced: core templates, journeys, task tracking.
  - Enterprise: advanced automation, analytics, AI-driven recommendations.

---

## Success Metrics
- Onboarding journeys auto-start when HR marks an employee as hired.
- Employees and managers complete tasks through self-service UI with audit trail.
- HR admins configure templates, module owners, and automation via the module settings flow.
- Analytics surfaces time-to-ramp, completion rates, overdue tasks; AI assistant can summarize onboarding state.

The onboarding module context will be updated as implementation proceeds (database schema finalized, routes committed, UI milestones reached). Update this file whenever major work completes or scope changes. 

