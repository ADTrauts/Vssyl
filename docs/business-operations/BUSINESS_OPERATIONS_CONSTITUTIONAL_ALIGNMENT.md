# Business Operations Constitutional Alignment

**Program:** Business Operations Constitutional Alignment Program  
**Status:** Planning documentation — no certification, no implementation  
**Last updated:** 2026-06-14  
**Purpose:** Master constitutional gap assessment for Scheduling, HR, and Workforce Communications against platform standards  
**Priority matrix:** [BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md](./BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md)  
**Constitution:** [BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md](./BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md)

---

## Executive summary

Business Operations discovery (Phases 0A–0D) and constitutional clarification are complete. Scheduling and HR are **operational modules with constitutional debt**. Workforce Communications is **Phase 1 partial** (Business Front Page announcements) with **no dedicated module**.

This document evaluates nine platform services across three target domains and defines what must align before Business Operations modernization **planning** can credibly proceed. It synthesizes existing discovery only — no repository re-audit.

**Primary finding:** All three domains share **P0–P1 platform constitutional gaps** (Activity, Notifications standardization, Policy Engine, Global Trash, identity trust). Domain-specific debt (Scheduling manager stubs, HR controller decomposition, WC audience resolver) follows shared alignment.

---

## First-class domain definition

A Business Operations module is **constitutionally first-class** when it meets the platform module contract minimum:

| Gate | Reference pattern |
|------|-------------------|
| Workspace hub | WS-L1 switch case + landing |
| Tenant scoping | `businessId` / `dashboardId` on all persisted paths |
| `authorize → execute → emit` | Policy/authZ → mutation → activity (success only) |
| Normalized activity | `emitModuleActivityEvent` |
| Notifications | Manifest metadata + `[module]_[event]` emitters |
| Policy Engine | `*PolicyDual` or registered PE actions |
| Global Trash | `trashedAt` + trash controller handler |
| V-Link | Entity types + resolver |
| AI | `ModuleAIContext` + bounded providers |
| Service boundaries | Thin controllers; canonical services |
| Tests | Tenant isolation + critical path coverage |

**Reference modules (comparison only):** Drive (L4), Chat (L3), Calendar (L3). See [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §19.

---

## Reference module baseline (platform services)

| Platform service | Drive (L4) | Chat (L3) | Calendar (L3) |
|------------------|------------|-----------|---------------|
| **Activity** | PASS — normalized envelope | PASS | PASS WITH FINDINGS |
| **Notifications** | PASS — manifest + emitters | PASS | PASS WITH FINDINGS |
| **Policy Engine** | PASS — `drivePolicyDual` | PASS — `chatPolicyDual` | PASS WITH FINDINGS |
| **Realtime** | N/A (file module) | PASS | PARTIAL |
| **V-Link** | PASS — full resolver | PASS WITH FINDINGS | PASS — `calendarVlinkAccessService` |
| **Global Trash** | PASS — `trashedAt` + handler | PASS | PASS — `calendarTrashService` |
| **Audit** | PASS — activity-derived | PASS | PASS WITH FINDINGS |
| **Search** | PASS | PARTIAL | PARTIAL |
| **AI Integration** | PASS | PASS | PASS WITH FINDINGS |

Business Operations modules must converge toward this bar. Scheduling and HR currently fall short on most constitutional services; Workforce Communications has not yet entered the contract.

---

## Master constitutional matrix

### Activity

| Domain | Current state | Required state | Gap |
|--------|---------------|----------------|-----|
| **Scheduling** | NOT PRESENT — no `emitModuleActivityEvent` on shift, publish, swap, or availability actions | Normalized activity on all authorized write paths per `moduleSpecs.md` | **Full gap** — cannot certify; audit/analytics blocked |
| **HR** | NOT PRESENT — `auditLog` for employee CRUD only; not module activity envelope | Same contract — PTO, attendance, onboarding, profile mutations emit after success | **Full gap** — activity vs analytics conflated |
| **Workforce Communications** | NOT PRESENT — no campaign audit trail | Campaign publish, audience resolve, ack events emit via normalized envelope | **Full gap** — Phase 1 front page has no activity |

**Shared dependency:** Activity standardization is prerequisite for trustworthy audit, analytics ownership, and Global Trash alignment (P11).

---

### Notifications

| Domain | Current state | Required state | Gap |
|--------|---------------|----------------|-----|
| **Scheduling** | NOT PRESENT — zero `scheduling_*` types; no `NotificationService.createNotification` | Manifest `notifications` block + emitters for publish, swap, open-shift, assignment events | **Full gap** |
| **HR** | PARTIAL — 8 types emitted; seed manifest lacks `notifications` block; 3 attendance types documented but not sent | Complete manifest + all documented emitters; grouping map aligned | **Manifest and emitter gap** |
| **Workforce Communications** | NOT PRESENT — Phase 1 front page renders only; no fan-out on publish | `workforce_*` (or `comms_*`) emitters after authorized campaign publish | **Full gap** — delivery partner exists; domain does not emit |

**Constitutional rule (unchanged):** Notifications = delivery infrastructure. Domains author and emit; Notifier delivers. See [BUSINESS_OPERATIONS_PLATFORM_SERVICES.md](./BUSINESS_OPERATIONS_PLATFORM_SERVICES.md).

---

### Policy Engine

| Domain | Current state | Required state | Gap |
|--------|---------------|----------------|-----|
| **Scheduling** | NOT PRESENT — `schedulingPermissions.ts` custom middleware only | PE-registered actions for manager/admin writes (publish, swap approve, template CRUD) | **Full gap** |
| **HR** | NOT PRESENT — `hrPermissions.ts` + tier gating only | PE for admin/manager writes (PTO approve, profile changes, attendance admin) | **Full gap** |
| **Workforce Communications** | NOT PRESENT — no module; front page uses business admin context only | PE for author/send by role + audience scope | **Full gap** |

**Shared dependency:** Identity cleanup (P1) stabilizes authZ subjects before PE adoption scales.

---

### Realtime

| Domain | Current state | Required state | Gap |
|--------|---------------|----------------|-----|
| **Scheduling** | PARTIAL — `join_schedule` with membership check; shift CRUD + publish broadcasts via `chatSocketService` | Scoped realtime for UI sync — **not** workforce messaging | **Acceptable for planning module** — FALSE POSITIVE risk if mistaken for comms |
| **HR** | NOT PRESENT — no HR-specific socket layer | Optional — HR workflows may use notifications; realtime not mandatory for L3 parity | **Gap vs optional target** — not blocking first-class if notifications complete |
| **Workforce Communications** | NOT PRESENT — no campaign realtime | Target optional — notification fan-out primary; realtime for live ack dashboards optional | **Not required for Phase 2 gate** — sockets ≠ WC per boundary analysis |

**Constitutional rule:** Realtime transport is platform-owned; domain event semantics are domain-owned. Scheduling sockets are UI sync, not Workforce Communications.

---

### V-Link

| Domain | Current state | Required state | Gap |
|--------|---------------|----------------|-----|
| **Scheduling** | NOT PRESENT — explicit non-integration per platform doc | Entity resolver for shifts, schedules, swap requests linked across modules | **Full gap** |
| **HR** | NOT PRESENT | Entity resolver for profiles, PTO requests, attendance records | **Full gap** |
| **Workforce Communications** | NOT PRESENT | Campaign and announcement entities linkable from HR, Scheduling, Drive | **Full gap** |

**Shared dependency:** Global Trash alignment (P11) often pairs with V-Link lifecycle.

---

### Global Trash

| Domain | Current state | Required state | Gap |
|--------|---------------|----------------|-----|
| **Scheduling** | FAIL — hard delete; `ScheduleStatus.ARCHIVED` only; client-only `scheduleTrashed` event; no `trashedAt` | `trashedAt` soft delete + `trashController` handler + restore/purge | **FAIL** — lifecycle contract violation |
| **HR** | FAIL — `EmployeeHRProfile.deletedAt`; onboarding `archivedAt`; not in Global Trash API | Same Global Trash contract | **FAIL** |
| **Workforce Communications** | NOT PRESENT — Phase 1 has no trash model for announcements | Campaign soft-delete via Global Trash when domain established | **Not yet applicable** — required before Phase 2+ |

---

### Audit

| Domain | Current state | Required state | Gap |
|--------|---------------|----------------|-----|
| **Scheduling** | NOT PRESENT — no compliance trail beyond DB state | Activity-derived audit + optional domain audit views | **Full gap** |
| **HR** | PARTIAL — `prisma.auditLog` for employee CRUD; not normalized module activity | Normalized activity as primary audit source; HR audit log supplementary | **Partial — wrong layer** |
| **Workforce Communications** | NOT PRESENT — no campaign history | Campaign lifecycle audit (author, audience, delivery, ack) | **Full gap** |

**Note:** Audit at platform level is activity-derived. HR's local `auditLog` is supplementary, not a substitute for `emitModuleActivityEvent`.

---

### Search

| Domain | Current state | Required state | Gap |
|--------|---------------|----------------|-----|
| **Scheduling** | NOT EVALUATED in Phase 0A — no scheduling-specific search integration assessed | Module entities discoverable via platform search when indexed | **Unknown posture** — treat as P3 enhancement until evaluated |
| **HR** | NOT EVALUATED in Phase 0B | Same | **Unknown posture** |
| **Workforce Communications** | NOT PRESENT | Campaign and announcement discovery via platform search | **Full gap** — blocked until module exists |

---

### AI Integration

| Domain | Current state | Required state | Gap |
|--------|---------------|----------------|-----|
| **Scheduling** | PARTIAL — 3 context providers + 2 write actions; limited vs manifest | Full `ModuleAIContext` alignment; bounded providers; documented executors | **PASS WITH FINDINGS** — constitutional debt elsewhere dominates |
| **HR** | PARTIAL — 3 providers + 4 actions (time-off, clock in/out) | Same | **PASS WITH FINDINGS** |
| **Workforce Communications** | NOT PRESENT — no comms AI context | `ModuleAIContext` + audience-aware providers when domain established | **Full gap** — not blocking P0–P1 |

---

## Domain first-class readiness summary

| Domain | Module status | Constitutional posture | First-class ready? |
|--------|---------------|------------------------|-------------------|
| **Scheduling** | Registered built-in; WS-L1 hub (`SchedulingLayout`) | Operational; significant debt on Activity, Notifications, PE, Trash, V-Link, service layer | **No** — P0–P2 gaps |
| **HR** | Registered built-in; WS-L1 hub (`HRLayout`) | Operational; debt on Activity, PE, Trash, V-Link; Notifications partial | **No** — P0–P2 gaps |
| **Workforce Communications** | Module NOT PRESENT; domain Phase 1 (front page) | LOW maturity broadcast seed only | **No** — P0–P3 gates before evolution |

---

## Shared platform dependencies

These capabilities must be aligned **once** and consumed by all Business Operations domains. See [BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md](./BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md) § CONVERGENCE OPPORTUNITIES.

| Dependency | Why shared | Domains affected |
|------------|------------|------------------|
| **Identity trust** (`EmployeePosition` single write path) | Audience resolver, PE subjects, cross-module lifecycle | HR, Scheduling, WC, all integrations |
| **FALSE POSITIVE governance** | Prevents Chat/socket/notification absorption during modernization | All |
| **Activity envelope** | Interoperability contract; audit foundation | Scheduling, HR, WC |
| **Notification manifest + emitter pattern** | Delivery contract for all BO events | Scheduling, HR, WC |
| **Policy Engine registration** | Cross-module authZ consistency | Scheduling, HR, WC |
| **Global Trash API** | Unified lifecycle | Scheduling, HR, WC |
| **V-Link infrastructure** | Cross-module entity linking | Scheduling, HR, WC |
| **`hrScheduleService` contract** | Shared bridge — not a platform service but integration prerequisite | HR, Scheduling, Calendar |

**Source:** [BUSINESS_OPERATIONS_PLATFORM_SERVICES.md](./BUSINESS_OPERATIONS_PLATFORM_SERVICES.md), [BUSINESS_OPERATIONS_MODERNIZATION_PREREQUISITES.md](./BUSINESS_OPERATIONS_MODERNIZATION_PREREQUISITES.md)

---

## Domain-specific dependencies

| Domain | Document | Focus |
|--------|----------|-------|
| Scheduling | [SCHEDULING_ALIGNMENT_REQUIREMENTS.md](./SCHEDULING_ALIGNMENT_REQUIREMENTS.md) | Manager 501 APIs, service layer, shift-template collision |
| HR | [HR_ALIGNMENT_REQUIREMENTS.md](./HR_ALIGNMENT_REQUIREMENTS.md) | Controller decomposition, CSV bypass, notification completeness |
| Workforce Communications | [WORKFORCE_COMMUNICATIONS_ESTABLISHMENT_REQUIREMENTS.md](./WORKFORCE_COMMUNICATIONS_ESTABLISHMENT_REQUIREMENTS.md) | Phase 1 → full domain minimum platform |

---

## Constitutional gaps inventory (consolidated)

| ID | Gap | Scheduling | HR | WC | Priority |
|----|-----|------------|-----|-----|----------|
| G01 | FALSE POSITIVE governance adoption | ✓ | ✓ | ✓ | P0 |
| G02 | Identity cleanup (CSV bypass, lifecycle asymmetry) | ✓ | ✓ | ✓ | P0 |
| G03 | Activity standardization | ✓ | ✓ | ✓ | P1 |
| G04 | Notification manifest + emitter standardization | ✓ | ✓ | ✓ | P1 |
| G05 | Policy Engine adoption | ✓ | ✓ | ✓ | P1 |
| G06 | Global Trash alignment | ✓ | ✓ | ✓ | P1 |
| G07 | `hrScheduleService` contract formalization | ✓ | ✓ | — | P1 |
| G08 | Shift-template naming collision | ✓ | ✓ | — | P2 |
| G09 | Scheduling manager API completion (501) | ✓ | — | — | P2 |
| G10 | Scheduling service layer / thin controllers | ✓ | — | — | P2 |
| G11 | HR controller decomposition | — | ✓ | — | P2 |
| G12 | HR notification completeness (3 types) | — | ✓ | — | P2 |
| G13 | V_Link integration | ✓ | ✓ | ✓ | P2 |
| G14 | Audience resolver implementation | — | — | ✓ | P3 |
| G15 | WC module registration + hub | — | — | ✓ | P3 |
| G16 | Acknowledgement + campaign audit models | — | — | ✓ | P3 |
| G17 | Dedicated BO test suites | ✓ | ✓ | — | P3 |
| G18 | Analytics ownership clarity | ✓ | ✓ | ✓ | P3 |

Full ranking: [BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md](./BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md)

---

## Relationship to prior programs

| Program | Relationship |
|---------|--------------|
| Phases 0A–0C Discovery | Evidence source — not amended |
| Phase 0D Strategic Architecture | Constitution — alignment operationalizes prerequisites |
| Constitutional Clarification | WC Phase 1 maturity — informs WC establishment requirements |
| Modernization Prerequisites (P1–P12) | Mapped to priority matrix G01–G18 |
| Future modernization planning | **Gated** on P0–P1 resolution per executive summary |

---

## Certification statement

**No certification awarded.** This document is constitutional alignment planning only. No implementation, schema changes, or modernization waves are defined.

---

## Document authority

Synthesizes Phase 0A–0D and constitutional clarification. Update via explicit Business Operations program revision when implementation evidence changes posture.
