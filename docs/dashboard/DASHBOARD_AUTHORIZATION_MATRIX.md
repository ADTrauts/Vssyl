# Dashboard Module — Authorization Matrix

**Program:** Dashboard Module Wave 3 — Phase 1 Trust & Authorization Charter  
**Date:** 2026-06-21  
**Status:** Governance charter — authoritative authorization model for 42 operations

**Related:** [DASHBOARD_OPERATION_MATRIX.md](./DASHBOARD_OPERATION_MATRIX.md), [DASHBOARD_TRUST_MODEL.md](./DASHBOARD_TRUST_MODEL.md)

---

## Legend

| Column | Meaning |
|--------|---------|
| **Actor** | Who initiates |
| **Permission** | Manifest / RBAC permission string |
| **Policy action** | `POLICY_ACTIONS.*` for `authorize()` |
| **Domain** | Ownership domain for authorization decision |
| **Risk** | H / M / L — constitutional exposure if missing PE |

---

## A. Dashboard tab lifecycle

| Op ID | Operation | Actor | Permission | Policy action | Domain | Scope keys | Risk |
|-------|-----------|-------|------------|---------------|--------|------------|------|
| D-01 | List dashboards | User | `dashboard:read` | `DASHBOARD_READ` | Dashboard | `userId` | M |
| D-02 | Auto-create default personal | System | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `userId` | H |
| D-03 | Create dashboard tab | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `userId`, context FK | H |
| D-04 | Get dashboard by id | User | `dashboard:read` | `DASHBOARD_READ` | Dashboard | `dashboardId`, tenant | M |
| D-05 | Update dashboard | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `dashboardId` | H |
| D-06 | Delete dashboard tab | User | `dashboard:write` or `dashboard:delete` | `DASHBOARD_DELETE` | Dashboard | `dashboardId` | H |
| D-07 | Delete with file migration | User | `dashboard:delete` + Drive actions | `DASHBOARD_DELETE`, `FILE_*` | Dashboard+Drive | `dashboardId` | H |
| D-08 | File summary read | User | `dashboard:read`, `file:read` | `DASHBOARD_READ` | Drive (scoped) | `dashboardId` | M |
| D-09 | Ensure business dashboard | System/User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `userId`, `businessId` | H |
| D-10 | Soft-trash dashboard tab | User | `dashboard:write` | `DASHBOARD_WRITE` | Platform trash | `dashboardId` | H |
| D-11 | Restore trashed tab | User | `dashboard:write` | `DASHBOARD_WRITE` | Platform trash | `dashboardId` | M |
| D-12 | Permanent purge tab | User | `dashboard:delete` | `DASHBOARD_DELETE` | Platform trash | `dashboardId` | H |

### Membership gates (non-PE — prerequisite before DASHBOARD_WRITE on context create)

| Context | Gate |
|---------|------|
| Business | Active `businessMember` |
| Household | Active `householdMember` |
| Institution | Active `institutionMember` |

---

## B. Widget lifecycle

| Op ID | Operation | Actor | Permission | Policy action | Domain | Scope keys | Risk |
|-------|-----------|-------|------------|---------------|--------|------------|------|
| W-01 | Add widget | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `dashboardId` | H |
| W-02 | Update widget | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `dashboardId`, `widgetId` | H |
| W-03 | Remove widget | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `dashboardId`, `widgetId` | H |
| W-04 | Batch update positions | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `dashboardId` | M |
| W-05 | Apply template | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `dashboardId` | M |
| W-06 | Build-out initial widgets | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `dashboardId` | M |
| W-07 | Picker eligibility | User | — | — | Dashboard (client) | install list | L |

---

## C. Personalization & configuration

| Op ID | Operation | Actor | Permission | Policy action | Domain | Scope keys | Risk |
|-------|-----------|-------|------------|---------------|--------|------------|------|
| S-01 | Get sidebar config | User | `dashboard:read` | `DASHBOARD_READ` | Dashboard | `dashboardId` | M |
| S-02 | Save sidebar config | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `dashboardId` | M |
| S-03 | Update sidebar config | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `dashboardId` | M |
| S-04 | Reset sidebar config | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `dashboardId` | M |
| S-05 | Widget-local config | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | `widgetId` | L |
| S-06 | Edit mode toggle | User | — | — | Client | — | L |

---

## D. AI context providers

| Op ID | Operation | Actor | Permission | Policy action | Domain | Scope keys | Risk |
|-------|-----------|-------|------------|---------------|--------|------------|------|
| A-01 | AI overview | User/AI | `dashboard:read` | `DASHBOARD_READ` | Dashboard | `userId`, optional `dashboardId` | M |
| A-02 | AI quick-stats | User/AI | **Analytics read** (delegated) | **Not Dashboard PE+Prisma** | **Analytics** | `dashboardId`, tenant | **H** |
| A-03 | AI widget summary | User/AI | `dashboard:read` | `DASHBOARD_READ` | Dashboard | `dashboardId` | M |

**A-02 charter rule:** Remove from Dashboard authorization surface; Analytics capability owns aggregate read policy.

---

## E. Client / platform reads

| Op ID | Operation | Actor | Permission | Policy action | Domain | Risk |
|-------|-----------|-------|------------|---------------|--------|------|
| C-01 | Load widget grid | User | via D-04 | via D-04 | Dashboard | L |
| C-02 | Header stats hook | User | Analytics delegated | Analytics | Analytics | H |
| C-03 | Enterprise dashboard | User | `dashboard:read` + feature gate | `DASHBOARD_READ` | Dashboard+Analytics | H |
| C-04 | Enterprise showcase | User | — | — | Marketing | L |
| C-05 | Search index hit | User | search policy | platform | Platform search | L |

---

## F. Share (future)

| Op ID | Operation | Actor | Permission | Policy action | Domain | Risk |
|-------|-----------|-------|------------|---------------|--------|------|
| X-01 | Share dashboard tab | User | `dashboard:write` + share | TBD | Dashboard | H |
| X-02 | Share widget config | User | `dashboard:write` | `DASHBOARD_WRITE` | Dashboard | M |
| X-03 | Drive upload from widget | User | `file:upload` | `FILE_UPLOAD` | Drive | M |

---

## G. Widget projections (host — module enforces)

| Op ID | Widget | Module permission (via API) | Dashboard PE |
|-------|--------|----------------------------|--------------|
| P-01–P-06, P-09–P-11 | Module widgets | Module-specific | Host: `dashboard:read` implicit via tab access |
| P-07 | activityfeed | Activity feed read | `dashboard:read` |
| P-08 | quickstats | **Analytics** | `dashboard:read` + analytics facade |
| P-12 | bookmarks/notes | — | `dashboard:write` on config save |

---

## H. Highest-risk operations (answer Q4)

| Rank | Op ID | Risk | Reason |
|------|-------|------|--------|
| 1 | **A-02** | **H** | Cross-module Prisma without PE — DASH-B3 |
| 2 | **D-07** | **H** | Delete + file migration cross-domain |
| 3 | **D-02** | **H** | Silent mutation on GET list |
| 4 | **W-01–W-03** | **H** | Widget SoR mutations JWT-only |
| 5 | **D-05–D-06** | **H** | Layout/delete JWT-only |
| 6 | **C-03** | **H** | Mock metrics presented as authorized product |
| 7 | **P-07** | **H** | Fabricated activity on failure — DASH-B4 |
| 8 | **D-09** | **H** | Business ensure — cross-module coupling |

---

## I. PE action summary (answer Q1)

| Policy action | Operation count | Status today |
|---------------|----------------:|--------------|
| `DASHBOARD_READ` | 8 | Partial (1 path implemented) |
| `DASHBOARD_WRITE` | 14 | **Not implemented** |
| `DASHBOARD_DELETE` | 3 | **Not implemented** |
| Analytics delegated (not Dashboard PE) | 2 | **Violation** |
| None required | 15 | OK |

**New actions to implement:** `DASHBOARD_WRITE`, `DASHBOARD_DELETE` (+ handlers in `policyEngine.ts`).

---

## J. Dual-enforcement pattern (charter)

```
Request → authenticateJWT → authorize(policyAction, scope) → service.execute → activity → (optional) domain event
```

**Package 1 deliverable (when ACT):** `dashboardPolicyDual.ts` mirroring Calendar/Todo `*PolicyDual.ts` patterns.

---

**Last updated:** 2026-06-21
