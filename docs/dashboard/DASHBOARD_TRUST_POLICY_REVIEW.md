# Dashboard Module — Trust Policy Review

**Program:** Dashboard Module Wave 3 — Phase 0B Constitutional Operations Audit  
**Assessment date:** 2026-06-21  
**Status:** Discovery only — violations documented, not remediated

**Authority:** [moduleSpecs.md](../../memory-bank/moduleSpecs.md) lifecycle; [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §2–3

---

## Purpose

Define the constitutional trust model for Dashboard operations: when Policy Engine, activity, domain events, notifications, and realtime are **required**, and map every current violation.

---

## 1. Trust model principles

| Principle | Rule |
|-----------|------|
| **T1** | No persisted mutation without authorization provably equal to or stronger than PE |
| **T2** | No successful mutation without normalized module activity |
| **T3** | No user-visible metric unless sourced from authorized module or platform capability API |
| **T4** | No fallback that fabricates domain or activity data on API failure |
| **T5** | Widget projections must not mutate foreign module SoR except via that module's API |
| **T6** | AI context reads must be bounded, tenant-scoped, and PE-gated — no cross-module god queries in controllers |

---

## 2. Policy Engine requirements

### 2.1 Required (fail-closed)

| Operation class | PE rule |
|-----------------|---------|
| Create dashboard / widget | `dashboard:write` + tenant scope (`dashboardId`, `businessId`, etc.) |
| Update / personalize / configure persisted state | `dashboard:write` on parent dashboard |
| Delete dashboard / widget | `dashboard:write` or stricter delete action |
| Execute (batch layout, template, file migration) | `dashboard:write` |
| Read dashboard by id | `dashboard:read` (**only path implemented today**) |
| List dashboards | `dashboard:read` scoped to actor |
| AI context reads | `dashboard:read` + no foreign resource expansion without module PE |
| Trash restore/purge dashboard tab | `dashboard:write` |

### 2.2 PE violations

| ID | Violation | Severity | Rows |
|----|-----------|----------|------|
| **TP-PE-01** | Widget CRUD has JWT-only ownership check, no `authorize()` | Blocking | W-01–W-03 |
| **TP-PE-02** | Dashboard update/delete JWT-only | Blocking | D-05–D-07 |
| **TP-PE-03** | Sidebar config writes JWT-only | Blocking | S-02–S-04 |
| **TP-PE-04** | List dashboards unscoped PE | Major | D-01 |
| **TP-PE-05** | AI overview/widgets JWT-only | Major | A-01, A-03 |
| **TP-PE-06** | AI quick-stats reads foreign tables without PE | Blocking | A-02 |
| **TP-PE-07** | Trash dashboard_tab paths unverified for PE | Major | D-10–D-12 |
| **TP-PE-08** | File summary read without PE | Major | D-08 |

**Compliance:** **1/24** required PE paths → **DASH-B2**

---

## 3. Activity requirements

### 3.1 Required emissions (module feed)

| Event (proposed taxonomy) | Trigger |
|---------------------------|---------|
| `dashboard.created` | D-03, D-02, D-09 |
| `dashboard.updated` | D-05 (name/layout/prefs) |
| `dashboard.deleted` | D-06, D-07, D-12 |
| `dashboard.trashed` / `dashboard.restored` | D-10, D-11 |
| `widget.added` | W-01, W-05, W-06 |
| `widget.updated` | W-02, W-04, S-05 |
| `widget.removed` | W-03 |
| `sidebar.customized` | S-02, S-03, S-04 |

### 3.2 Activity violations

| ID | Violation | Severity |
|----|-----------|----------|
| **TP-ACT-01** | Zero `emitModuleActivityEvent` for `moduleId: 'dashboard'` | **Blocking** |
| **TP-ACT-02** | Auto-create on GET list silent mutation without activity | Major |
| **TP-ACT-03** | Batch position updates silent | Major |

**Compliance:** **0/16** → **DASH-B1**

---

## 4. Domain event requirements

### 4.1 Recommended (platform fan-out — not substitute for activity)

| Event | When | Subscriber interest |
|-------|------|---------------------|
| `dashboard.created` | New tab / business ensure | Analytics placeholder, AI consumer |
| `dashboard.deleted` | Tab removed | Cleanup jobs |
| `widget.added` / `widget.removed` | Grid changes | Analytics capability (future) |

### 4.2 Violations

| ID | Violation | Severity |
|----|-----------|----------|
| **TP-DE-01** | No domain events from dashboard module paths | Advisory (L2) / Major (L3) |
| **TP-DE-02** | Calendar create side effect emits no dashboard-domain event | Major (coupling) |

**Compliance:** **0/8** recommended emissions

---

## 5. Notification requirements

| Scenario | Required? | Today |
|----------|-----------|-------|
| Dashboard tab shared (future) | Yes | — N/A |
| Dashboard deleted with files migrated | Optional user notice | Toast client-only |
| Widget added/removed | No | — |
| Enterprise alert panels | If real — via NotificationsService | **Mock only** |

### Violations

| ID | Violation | Severity |
|----|-----------|----------|
| **TP-NOT-01** | No manifest notification types for dashboard | Advisory |
| **TP-NOT-02** | Enterprise mock alerts impersonate notification UX | Major |

---

## 6. Realtime requirements

| Scenario | Required? | Today |
|----------|-----------|-------|
| Widget grid multi-device sync | Optional (product) | **No** — refresh on load only |
| Live widget data (chat, notifications) | Module-owned RT | Partial via module widgets |
| Activity feed widget | Platform RT optional | Poll 120s + socket debounce |

### Violations

| ID | Violation | Severity |
|----|-----------|----------|
| **TP-RT-01** | Dashboard module claims no realtime; widgets inherit module RT inconsistently | Advisory |
| **TP-RT-02** | ActivityFeed uses chat socket for refresh — not dashboard-owned | Advisory |

---

## 7. Data trust violations (production safety)

| ID | Violation | Trust rule | Severity |
|----|-----------|------------|----------|
| **TP-TRUST-01** | `ActivityFeedWidget.generatePlaceholderActivities()` on API failure | T4 | **Blocking** |
| **TP-TRUST-02** | `EnhancedDashboardModule` mockQuickMetrics | T3 | **Blocking** |
| **TP-TRUST-03** | `ExecutiveAnalyticsPanel` mock metrics | T3 | **Blocking** |
| **TP-TRUST-04** | `CrossModuleAnalyticsPanel` mock insights | T3 | **Blocking** |
| **TP-TRUST-05** | `DriveWidget` Math.random share simulation | T3 | Major |
| **TP-TRUST-06** | `DriveWidget` hardcoded 10GB storage total | T3 | Major |
| **TP-TRUST-07** | `getDashboardQuickStats` aggregates without validation | T6 | **Blocking** |

---

## 8. Trust policy by operation class

| Class | PE | Activity | Domain event | Notification | Realtime | Data trust |
|-------|-----|----------|--------------|--------------|----------|------------|
| **Create** | Required | Required | Recommended | Optional | — | N/A |
| **Read** | Required if tenant-sensitive | — | — | — | Optional | **Required** — no mock |
| **Update** | Required | Required | Optional | — | — | N/A |
| **Delete** | Required | Required | Recommended | Optional | — | N/A |
| **Execute** | Required | Required | Optional | — | — | No fabricated results |
| **Share** | Required | Required | Recommended | Required | — | N/A |
| **Personalize** | Required | Required | — | — | — | N/A |
| **Configure** | Required if persisted | If persisted | — | — | — | Local-only OK |

---

## 9. Violation summary

| Category | Blocking | Major | Advisory |
|----------|----------|-------|----------|
| Policy Engine | 3 | 5 | 0 |
| Activity | 1 | 2 | 0 |
| Domain events | 0 | 1 | 1 |
| Notifications | 0 | 1 | 1 |
| Realtime | 0 | 0 | 2 |
| Data trust | 4 | 2 | 0 |
| **Total unique** | **8** | **12** | **4** |

*Maps to Phase 0A DASH-B1–B5 plus expanded TP-* register.*

---

## 10. Largest constitutional violation

**TP-TRUST-01 + TP-ACT-01 + TP-PE-01 combined:** The module **mutates state without audit trail** and **displays fabricated data** when reads fail — violates core platform trust ([moduleSpecs.md](../../memory-bank/moduleSpecs.md) lifecycle + Activity vs Analytics separation).

Single largest: **TP-TRUST-01 / DASH-B4** — explicit fake activity feed undermines platform-wide activity honesty claims.

---

**Last updated:** 2026-06-21
