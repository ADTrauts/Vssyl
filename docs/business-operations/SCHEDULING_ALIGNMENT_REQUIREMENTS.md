# Scheduling Alignment Requirements

**Program:** Business Operations Constitutional Alignment Program  
**Source:** Phase 0A discovery only — no repository re-audit  
**Last updated:** 2026-06-14  
**Evidence:** [SCHEDULING_ARCHITECTURE_AUDIT.md](./SCHEDULING_ARCHITECTURE_AUDIT.md), [SCHEDULING_OPERATION_MATRIX.md](./SCHEDULING_OPERATION_MATRIX.md), [BUSINESS_OPERATIONS_PHASE_0A_CLOSEOUT.md](./BUSINESS_OPERATIONS_PHASE_0A_CLOSEOUT.md)  
**Master matrix:** [BUSINESS_OPERATIONS_CONSTITUTIONAL_ALIGNMENT.md](./BUSINESS_OPERATIONS_CONSTITUTIONAL_ALIGNMENT.md)  
**Ownership authority:** [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md)

---

## Purpose

Identify platform gaps, architectural debt, and constitutional requirements for Scheduling to become a **first-class platform domain**. Synthesizes Phase 0A findings only.

**Current posture:** Substantial operational module with **significant constitutional debt** relative to Drive (L4), Chat (L3), and Calendar (L3) reference patterns.

---

## Constitutional requirements

Scheduling must meet the platform module contract before first-class status and certification pursuit:

| Requirement | Platform standard reference | Scheduling current | Required |
|-------------|----------------------------|-------------------|----------|
| Tenant scoping | `api-and-auth.mdc`, `moduleSpecs.md` | PASS WITH FINDINGS — `businessId` on queries; 1 integration test | Maintain; expand test coverage |
| `authorize → execute → emit` | `module-interoperability.mdc` | FAIL — no activity emit | AuthZ → mutation → `emitModuleActivityEvent` on success only |
| Normalized activity | Platform standards §19 `globalActivity` | NOT PRESENT | All key writes: shift CRUD, publish, swap, availability, open-shift |
| Notifications | Manifest + `[scheduling]_[event]` | NOT PRESENT | `scheduling_*` types for publish, swap, assignment, open-shift |
| Policy Engine | `policy-engine.mdc` | NOT PRESENT | Replace or complement `schedulingPermissions.ts` with PE actions |
| Global Trash | `trashedAt` + trash controller | FAIL — hard delete; ARCHIVED enum | Soft delete + Global Trash handler |
| V-Link | `V_LINK.md` | NOT PRESENT | Shift, schedule, swap entities resolvable cross-module |
| Realtime | Scoped broadcasts with membership | PASS WITH FINDINGS — `join_schedule` proven | Maintain; do not expand into comms semantics |
| AI context | `module-development.mdc` | PASS WITH FINDINGS — 3 providers, 2 actions | Maintain alignment with manifest |
| Workspace hub | WS-L1 switch | PASS — `SchedulingLayout` | Rename to `SchedulingWorkspaceLanding` optional (naming convention) |
| Service boundaries | Thin controllers | FAIL — ~144 Prisma calls in controllers | Canonical `schedulingService` (or domain services) |
| Tests | Tenant + critical paths | FAIL — 1 integration test only | Swap, publish, availability, tenant isolation |

---

## Platform gaps

Per [SCHEDULING_ARCHITECTURE_AUDIT.md](./SCHEDULING_ARCHITECTURE_AUDIT.md) platform capability matrix:

| Platform service | Status | Gap detail |
|------------------|--------|------------|
| **Activity** | NOT PRESENT | No `emitModuleActivityEvent`; activity vs analytics not separated |
| **Notifications** | NOT PRESENT | Zero `scheduling_*` emitters; seed manifest lacks `notifications` block |
| **Policy Engine** | NOT PRESENT | Custom `schedulingPermissions.ts` only; no scheduling in `policyEngine.ts` |
| **Realtime** | PASS WITH FINDINGS | `chatSocketService` schedule rooms — UI sync only; not comms |
| **V-Link** | NOT PRESENT | Explicitly not integrated per platform doc |
| **Global Trash** | FAIL | Hard delete; `ScheduleStatus.ARCHIVED`; client-only `scheduleTrashed` event |
| **Audit** | NOT PRESENT | No compliance trail beyond DB mutations |
| **Search** | NOT EVALUATED | No Phase 0A assessment — defer to P3 |
| **AI Integration** | PASS WITH FINDINGS | Registered; limited write surface vs manifest |

### Module interoperability checklist (scheduling)

| Item | Status |
|------|--------|
| Permission blocks in manifest | PASS WITH FINDINGS |
| Tenant scoping | PASS WITH FINDINGS |
| Activity events on key actions | **FAIL** |
| Realtime scope / membership | PASS WITH FINDINGS |
| Notification metadata | **FAIL** |
| AI context providers | PASS |
| Activity vs analytics separation | **FAIL** |

---

## Architectural debt

Non-platform debt that blocks first-class parity with L3/L4 references:

### Controller and service layer

| Issue | Evidence | Constitutional impact |
|-------|----------|----------------------|
| Fat controllers | ~144 direct `prisma.` calls across 6 controllers | Violates Drive L4 thin-controller pattern |
| No canonical scheduling service | Only AI, philosophy, recommendation services | No trash/notification/activity/visibility services |
| Mixed real + stub handlers | Same route file contains 501 and implemented paths | Planning pillar incomplete |

### Manager and admin API stubs

| Handler | HTTP | Impact |
|---------|------|--------|
| `publishTeamSchedule` | 501 | Manager cannot publish |
| `getOpenShiftsForTeam` | 501 | Manager open-shift management blocked |
| `assignEmployeeToShift` | 501 | Manager assignment blocked |
| `getTeamAvailability` | 501 | Manager availability view blocked |
| Shift template CRUD | 501 / empty list | Template reuse broken |
| `getAllShiftSwapRequests` | Empty stub | Admin swap inbox broken |
| `updateEmployeeAvailabilityAdmin` | 501 | Admin availability edit blocked |
| Analytics trio | 501, not routed | Server analytics absent |

**Constitutional impact:** Manager publish path is prerequisite for reliable operational messaging hooks (Scheduling → Notifications → future WC integration points). Blocks P2 completion before WC Phase 2 planning.

### Registration and manifest drift

| Issue | Evidence |
|-------|----------|
| Seed manifest partial vs `registerBuiltInModules` | `seedSchedulingModule.ts` vs built-in registration |
| Duplicate registration risk | `scripts/ensure-builtin-modules.ts` |
| Missing `notifications` in seed manifest | Phase 0A architecture audit |

### Hub naming

| Issue | Status |
|-------|--------|
| `SchedulingLayout` vs `SchedulingWorkspaceLanding` | Functional hub exists; naming convention drift per `module-development.mdc` |

### Analytics

| Issue | Evidence |
|-------|----------|
| `getLaborCostAnalytics`, `getCoverageAnalytics`, `getComplianceReports` | 501; not routed — `schedulingAdminController.ts` |

**Related gap G18:** Analytics ownership clarity (HR dashboards + scheduling UI stats + 501 server APIs).

---

## Shared integration debt (Scheduling + HR)

Per Phase 0A closeout and boundary analysis:

| Issue | Owner | Alignment requirement |
|-------|-------|---------------------|
| `hrScheduleService` ownership ambiguity | Shared bridge (HR-named, Scheduling + Calendar consumers) | Formalize contract — G07 (P1) |
| `AttendanceShiftTemplate` vs `ShiftTemplate` | HR + Scheduling | **Resolved (CO-08 Tier A)** — [SHIFT_TEMPLATE_DOMAIN_DECISION.md](./SHIFT_TEMPLATE_DOMAIN_DECISION.md) |
| PTO on assign | HR owns data; Scheduling enforces | Documented integration — not re-litigated |
| Attendance stubs on publish | HR owns records; Scheduling creates stubs | Documented integration — not re-litigated |
| Shift communications | Socket broadcasts only | FALSE POSITIVE — not WC; do not expand sockets into comms |

---

## Constitutional requirements mapped to platform standards

| Scheduling requirement | Standard | Gap ID |
|------------------------|----------|--------|
| Emit activity on publish, swap, shift CRUD | `module-interoperability.mdc`, `moduleSpecs.md` | G03 |
| `scheduling_*` notification types + manifest | `module-development.mdc`, `NOTIFICATION_METADATA_GUIDE.md` | G04 |
| PE for manager/admin writes | `policy-engine.mdc`, `POLICY_ENGINE.md` | G05 |
| `trashedAt` + Global Trash handler | `module-development.mdc`, platform §19 trash | G06 |
| V-Link for shifts/schedules | `V_LINK.md`, platform §19 vlink | G13 |
| Thin controllers / scheduling service | Drive L4 pattern, platform standards | G10 |
| Complete manager routes (501 → implemented) | Operational completeness — planning pillar | G09 |
| FALSE POSITIVE: sockets ≠ WC | `CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md` | G01 |
| Identity consumption (not ownership) | `WORKFORCE_IDENTITY_ARCHITECTURE.md` | G02 |
| `hrScheduleService` contract | `HR_SCHEDULING_BOUNDARY_REVIEW.md` | G07 |

---

## What Scheduling alignment does not require (Phase 0A scope)

| Item | Rationale |
|------|-----------|
| Workforce Communications module | WC is separate domain — Scheduling emits events; WC authors broadcasts |
| Chat CHANNEL semantics | Chat boundary unchanged |
| Realtime expansion beyond UI sync | Current socket pattern acceptable for planning |
| Full labor analytics before constitutional alignment | Analytics clarity is P3 (G18) |
| Certification award | Alignment program does not certify |

---

## Readiness assessment

| Question | Verdict |
|----------|---------|
| Scheduling reality understood? | **Yes** — Phase 0A complete |
| Platform gaps documented? | **Yes** — this document |
| Ready for first-class domain status? | **No** — P0–P2 gaps |
| Ready for shared platform alignment program? | **Yes** — after P0 gates |
| Ready for modernization implementation? | **No** — alignment planning only |

---

## Dependencies on shared platform work

Scheduling alignment **must not** be implemented in isolation for constitutional services. Consume shared initiatives:

1. **G01** FALSE POSITIVE governance — before any "shift comms" labeling
2. **G02** Identity cleanup — before audience-aware features
3. **G03–G06** Activity, Notifications, PE, Global Trash — shared BO platform alignment
4. **G07** `hrScheduleService` contract — before manager API completion depends on calendar sync stability
5. **G08** Shift-template collision — **resolved (CO-08 Tier A)** — enables G09 manager UX

See [BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md](./BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md) § CONVERGENCE OPPORTUNITIES.

---

## Certification statement

**No certification awarded.** Phase 0A evidence only. No implementation plan defined.
