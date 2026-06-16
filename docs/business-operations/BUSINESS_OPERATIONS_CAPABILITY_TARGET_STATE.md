# Business Operations Capability Target State

**Phase:** Business Operations Phase 0D — Strategic Architecture Program  
**Last updated:** 2026-06-14  
**Amended:** 2026-06-14 — Workforce Broadcasts Partial ([WORKFORCE_COMMUNICATIONS_CONSTITUTIONAL_CLARIFICATION.md](./WORKFORCE_COMMUNICATIONS_CONSTITUTIONAL_CLARIFICATION.md))  
**Constitution:** [BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md](./BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md)  
**Ownership authority:** [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md)  
**Baselines:** [BUSINESS_OPERATIONS_CAPABILITY_MAP.md](./BUSINESS_OPERATIONS_CAPABILITY_MAP.md), [HR_CAPABILITY_MAP.md](./HR_CAPABILITY_MAP.md), [WORKFORCE_COMMUNICATIONS_CAPABILITY_MAP.md](./WORKFORCE_COMMUNICATIONS_CAPABILITY_MAP.md)

---

## Status legend

| Status | Meaning |
|--------|---------|
| **Implemented** | Core path works with acceptable maturity |
| **Partial** | Exists but stubs, surrogates, or constitutional gaps |
| **Missing** | NOT PRESENT or non-functional |
| **Unknown** | Insufficient discovery evidence |

---

## Capability map

| Capability | Current status | Current owner | Target owner | Target state | Dependencies |
|------------|----------------|---------------|--------------|--------------|--------------|
| **Workforce Identity** | Partial | Org chart | Org chart | Single write path; EP anchor consumed by all BO modules; import bypass resolved | Identity cleanup prerequisite |
| **PTO** | Partial | HR | HR | Full request/approve/balance; calendar sync; manifest notifications | Org chart EP; `hrScheduleService`; PE (target) |
| **Attendance** | Partial | HR | HR | Punch, policies, exceptions; all documented notification types emitted | Org chart EP; Scheduling publish stubs (shared) |
| **Scheduling** | Partial | Scheduling | Scheduling | Admin + manager paths complete; constitutional alignment | Org chart EP; HR PTO read |
| **Shift Swaps** | Partial | Scheduling | Scheduling | Employee + manager flows; **admin list stub fixed** | Manager APIs; org hierarchy for scope |
| **Coverage Requests** | Missing | Unknown | Scheduling (+ Comms integration) | Workflow model + optional operational messaging | Scheduling planning; Workforce Comms (target) |
| **Workforce Broadcasts** | Partial (Phase 1) | Business front-page CMS | Workforce Communications | Business-wide announcements via `companyAnnouncements`; evolve to dept/org-chart audience | Audience architecture; module registration; Notifications |
| **Emergency Alerts** | Missing | — | Workforce Communications | Dedicated alert type, ack, audit — not CMS `urgent` | Comms module; Notifications; FALSE POSITIVE governance |
| **Acknowledgements** | Missing | — | Workforce Communications | Required reading / compliance ack campaigns | Comms module; identity resolver |
| **Labor Forecasting** | Missing (stub) | Scheduling (501) | Scheduling and/or Analytics | Server-side analytics or explicit Analytics ownership | Scheduling data; Analytics clarity |
| **Workforce Analytics** | Partial | HR (+ Scheduling UI) | Analytics (clarified) + module dashboards | Unified ownership; activity-derived metrics | Normalized activity; HR + Scheduling data |
| **Workforce AI** | Partial | Per-module AI | AI infra + each BO pillar | PE-gated actions; comms context when module exists | Module AI registration; Policy Engine |

---

## Detailed current → target notes

### Workforce Identity

**Current:** `EmployeePosition` anchor validated (0B). HR CSV import bypasses org-chart API. Legacy member fields coexist.

**Target:** Org chart is sole placement writer. All modules consume EP + Department. Audience resolver for Comms reads same stack.

**Dependencies:** [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md); identity cleanup prerequisite.

---

### PTO

**Current:** Requests, approvals, balances implemented (MEDIUM). Calendar sync via `hrScheduleService`. Scheduling reads for conflict.

**Target:** Constitutional emitters (activity, manifest). PE for approve paths. No ownership change.

**Dependencies:** HR module; shared bridge; Scheduling read contract.

---

### Attendance

**Current:** Punch, policies, exceptions (MEDIUM). 3 attendance notification types documented but not emitted.

**Target:** Complete notification set; activity events; Global Trash alignment.

**Dependencies:** HR; Scheduling publish stub contract unchanged.

---

### Scheduling

**Current:** Core builder, publish, availability, swaps, open-shift claim (MEDIUM). Manager 501 stubs. No `scheduling_*` notifications.

**Target:** Manager APIs complete; notification types; activity; PE; optional Comms event hooks on publish.

**Dependencies:** Org chart; HR PTO; platform services.

---

### Shift Swaps

**Current:** Employee request + manager approve works; admin swap inbox **empty stub**.

**Target:** Full admin visibility; notifications on swap events.

**Dependencies:** Scheduling manager routes; notification standardization.

---

### Coverage Requests

**Current:** AI `coverage_status` context only — no workflow model.

**Target:** Scheduling-owned request workflow; Comms may emit operational messages on gaps.

**Dependencies:** Scheduling feature; Workforce Communications (optional integration).

---

### Workforce Broadcasts

**Current:** **Partial (Phase 1)** — Business Front Page `companyAnnouncements`; business-wide implicit audience; no ack, audit, or notification fan-out.

**Target:** Full Workforce Communications campaigns with EP/Dept resolver; delivery via Notifications.

**Dependencies:** Evolve Phase 1 front page; audience architecture; module registration; FALSE POSITIVE governance.

---

### Emergency Alerts

**Current:** NOT PRESENT. CMS `urgent` priority is false positive.

**Target:** Comms-owned emergency type with ack and audit.

**Dependencies:** Comms module; governance prevents CMS substitute.

---

### Acknowledgements

**Current:** Chat `ReadReceipt` only — message-scoped, not operational.

**Target:** Comms-owned compliance ack with manager reporting.

**Dependencies:** Comms module; distinct from Chat and notification mark-as-read.

---

### Labor Forecasting

**Current:** `getLaborCostAnalytics` and related endpoints return **501**; UI may show client-computed stats.

**Target:** Server analytics implemented or explicitly owned by Analytics pillar with honest UX.

**Dependencies:** Scheduling data model; analytics ownership decision.

---

### Workforce Analytics

**Current:** HR dashboards (MEDIUM); scheduling server 501; overlap risk.

**Target:** Clear module vs platform split; activity-fed aggregates when available.

**Dependencies:** Activity standardization; ownership clarity in Analytics pillar.

---

### Workforce AI

**Current:** Scheduling 3 providers + 2 actions; HR 3 providers + punch/time-off actions.

**Target:** Each BO pillar registers context; PE gates writes; Comms read-only providers when built.

**Dependencies:** AI infrastructure; Policy Engine adoption.

---

## Maturity summary (current)

| Status | Count (of 12 capabilities) |
|--------|---------------------------|
| Implemented | 0 (none fully constitutional) |
| Partial | 8 |
| Missing | 3 |
| Unknown | 1 (coverage — workflow missing) |

---

## Target ownership diagram

```
Org Chart ──────► Workforce Identity
HR ─────────────► PTO, Attendance
Scheduling ─────► Scheduling, Shift Swaps, Coverage Requests, Labor Forecasting (primary)
Workforce Comms ► Broadcasts, Emergency, Acknowledgements
Analytics ──────► Workforce Analytics (derived), Labor Forecasting (optional share)
AI + modules ───► Workforce AI (per-pillar registration)
Platform ───────► Delivery (Notifications), Activity, Realtime transport
```

---

## Document authority

Capability ownership rows remain authoritative in [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md). This map is the **0D unified target-state synthesis** across Phases 0A–0C.
