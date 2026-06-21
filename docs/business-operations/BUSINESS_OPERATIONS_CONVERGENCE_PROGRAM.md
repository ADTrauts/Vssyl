# Business Operations Convergence Program

**Program:** Business Operations Modernization Planning Program  
**Status:** **ARCHIVED** — certification modernization program closed BO-4 (2026-06-19); retained as convergence planning history  
**Last updated:** 2026-06-19  
**Source:** [BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md](./BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md) § CONVERGENCE OPPORTUNITIES  
**Master plan:** [BUSINESS_OPERATIONS_MODERNIZATION_MASTER_PLAN.md](./BUSINESS_OPERATIONS_MODERNIZATION_MASTER_PLAN.md)  
**Shared alignment:** [SHARED_ALIGNMENT_MODERNIZATION_PLAN.md](./SHARED_ALIGNMENT_MODERNIZATION_PLAN.md)

---

## Purpose

Define twelve **convergence initiatives** (CO-01 through CO-12) that resolve constitutional gaps across multiple Business Operations domains **simultaneously**. Each initiative is a modernization **program** — not an implementation wave.

**Principle:** Complete constitutional alignment work once at the shared layer; Scheduling, HR, and Workforce Communications consume — do not build three independent Activity, Notification, Policy Engine, or Trash patterns.

**No implementation detail. No code. No certifications.**

---

## Program overview

| Group | COs | Stage | Gaps resolved |
|-------|-----|-------|---------------|
| Governance & Identity | CO-06, CO-05 | 1 | G01, G02 |
| Platform Constitutional | CO-01, CO-02, CO-03, CO-04 | 1 | G03, G04, G05, G06 |
| Integration Bridges | CO-07, CO-08 | 1–2 | G07, G08 |
| Domain Architecture | CO-10, CO-09, G09 | 2 | G10, G11, G13, G09 |
| Workforce Communications | CO-11 | 3 | G14, G15, G16 |
| Measurement & Certification | CO-12 | 4–5 | G17, G18 |

---

# Governance & Identity

---

## CO-06 — FALSE POSITIVE Governance Adoption

| Field | Detail |
|-------|--------|
| **Purpose** | Adopt constitutional FALSE POSITIVE governance in all Business Operations design reviews so surrogates are not mistaken for full domain products during modernization |
| **Participating domains** | All BO pillars — especially Workforce Communications, Scheduling (sockets), HR (workflow notifications) |
| **Platform services involved** | Governance (constitutional); Realtime (socket semantics); Notifications (delivery boundary) |
| **Gaps resolved** | **G01** (primary) |
| **Dependencies** | None — P0 entry |
| **Expected outcomes** | Three-system model enforced (Chat / WC / Notifications); design review checklist includes boundary invariants; no feature labeled "full workforce comms" without complete lifecycle |
| **Architectural benefits** | Prevents architectural harm during modernization; preserves Chat ≠ WC; sockets remain UI sync; HR notifs remain workflow; Phase 1 front page correctly classified as broadcast seed |
| **Stage assignment** | **Stage 1** (first entry) |

**Source:** [BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md](./BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md) § FALSE POSITIVE GOVERNANCE; [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md)

**Does not include:** Implementation of WC module; Chat CHANNEL semantics changes; socket transport changes.

---

## CO-05 — Workforce Identity Trust Hardening

| Field | Detail |
|-------|--------|
| **Purpose** | Establish trustworthy workforce identity so all BO modules and future audience resolution consume a single, org-chart-authoritative `EmployeePosition` stack |
| **Participating domains** | HR (primary), Scheduling, Workforce Communications, Analytics |
| **Platform services involved** | Identity stack (`EmployeePosition`, `Department`) — **org chart owned**, not HR |
| **Gaps resolved** | **G02** (primary); unblocks G14, G07 |
| **Dependencies** | None — P0 entry; best after CO-06 governance adoption |
| **Expected outcomes** | CSV import bypass eliminated; terminate/remove lifecycle aligned; legacy `BusinessMember.department`/`title` deprecated for audience purposes; single EP write path |
| **Architectural benefits** | Trustworthy audience resolution; stable PE authZ subjects; cross-module lifecycle consistency; WC Phase 2 unblocked |
| **Stage assignment** | **Stage 1** (P0 entry, parallel with CO-06) |

**Source:** [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md); Phase 0B closeout

**Does not include:** Org chart ownership transfer; HR absorbing identity authority; parallel `WorkforceEmployee` store.

---

# Platform Constitutional

---

## CO-01 — BO Platform Activity Envelope Program

| Field | Detail |
|-------|--------|
| **Purpose** | Standardize `emitModuleActivityEvent` for all Business Operations write paths — shared event taxonomy, success-only emission, activity vs analytics separation |
| **Participating domains** | Scheduling, HR, Workforce Communications (future) |
| **Platform services involved** | Activity, Audit (activity-derived) |
| **Gaps resolved** | **G03** (primary); enables G16, G18 |
| **Dependencies** | G02 / CO-05 (identity stable for actor/subject references) |
| **Expected outcomes** | `authorize → execute → emit` on all key BO mutations; normalized envelope per `moduleSpecs.md`; HR `auditLog` supplementary not substitute |
| **Architectural benefits** | Single interoperability contract; trustworthy audit trail; unblocks Global Trash activity events, WC campaign audit, analytics ownership |
| **Stage assignment** | **Stage 1** |

**Does not include:** Domain-specific analytics dashboards; labor forecasting implementation.

---

## CO-02 — BO Notification Manifest and Emitter Standardization

| Field | Detail |
|-------|--------|
| **Purpose** | Unified BO notification program: seed manifest `notifications` blocks, `[module]_[event]` naming, emitters after authorized success, grouping map completeness |
| **Participating domains** | Scheduling (`scheduling_*`), HR (complete `hr_*`), Workforce Communications (`workforce_*` future) |
| **Platform services involved** | Notifications (C2 Notifier) |
| **Gaps resolved** | **G04** (primary); **G12** (HR subset — manifest pattern) |
| **Dependencies** | G03 / CO-01 (emit after success); G01 / CO-06 (notifs ≠ WC content) |
| **Expected outcomes** | Scheduling gains first `scheduling_*` emitters; HR manifest complete; `workforce_*` emitter pattern defined for WC; Notification Center remains delivery only |
| **Architectural benefits** | Complete delivery contract for all BO domains; one manifest pattern consumed by all modules |
| **Stage assignment** | **Stage 1** |

**Does not include:** Notification Center UX redesign; WC campaign authoring UI.

---

## CO-03 — BO Policy Engine Registration Program

| Field | Detail |
|-------|--------|
| **Purpose** | Register Scheduling, HR, and future WC write actions in Policy Engine; migrate from ad-hoc `schedulingPermissions.ts` / `hrPermissions.ts` middleware |
| **Participating domains** | Scheduling, HR, Workforce Communications |
| **Platform services involved** | Policy Engine |
| **Gaps resolved** | **G05** (primary) |
| **Dependencies** | G02 / CO-05 (identity for authZ subjects) |
| **Expected outcomes** | Manager/admin writes (publish, swap approve, PTO approve, WC author/send) auditable through PE; cross-module authZ consistency |
| **Architectural benefits** | Platform-aligned authorization; WC author/send gates ready before module exists; reduces middleware drift |
| **Stage assignment** | **Stage 1** |

**Does not include:** Custom RBAC replacement for all paths in one step; third-party module PE.

---

## CO-04 — BO Global Trash and Lifecycle Alignment

| Field | Detail |
|-------|--------|
| **Purpose** | Migrate Scheduling and HR delete paths to `trashedAt` + Global Trash API; define WC campaign trash handler when module established |
| **Participating domains** | Scheduling, HR, Workforce Communications |
| **Platform services involved** | Global Trash, Audit (via activity) |
| **Gaps resolved** | **G06** (primary); enables G13 |
| **Dependencies** | G03 / CO-01 (activity on trash/restore events) |
| **Expected outcomes** | Eliminate hard delete (Scheduling) and local `deletedAt` (HR); unified soft-delete lifecycle; trash controller handlers for BO entities |
| **Architectural benefits** | Certification trash must-pass satisfied; V-Link lifecycle alignment; consistent user-facing delete experience |
| **Stage assignment** | **Stage 1** |

**Does not include:** Hard-delete exceptions documentation; purge policy implementation detail.

---

# Integration Bridges

---

## CO-07 — Shared Bridge Contract Formalization (`hrScheduleService`)

| Field | Detail |
|-------|--------|
| **Purpose** | Document neutral contract for `hrScheduleService`: owner, API surface, versioning, breaking-change policy, consumer responsibilities |
| **Participating domains** | HR, Scheduling, Calendar (adjacent) |
| **Platform services involved** | Integration bridge — **not** a platform service |
| **Gaps resolved** | **G07** (primary); enables G09 |
| **Dependencies** | G02 / CO-05 (identity/stack stable) |
| **Expected outcomes** | HR-named ambiguity eliminated; calendar sync contract explicit; consumer responsibilities for Scheduling and Calendar documented |
| **Architectural benefits** | Manager API completion trustworthy; WC scheduling integration hooks reliable; integration drift prevented |
| **Stage assignment** | **Stage 1** |

**Source:** [HR_SCHEDULING_BOUNDARY_REVIEW.md](./HR_SCHEDULING_BOUNDARY_REVIEW.md)

**Does not include:** Moving `hrScheduleService` to different package; calendar recurrence ownership changes.

---

## CO-08 — Shift Template Naming and Concept Alignment

| Field | Detail |
|-------|--------|
| **Purpose** | Decision record resolving `AttendanceShiftTemplate` (HR) vs `ShiftTemplate` (Scheduling) — naming, conceptual boundaries, cross-module UX |
| **Participating domains** | HR, Scheduling |
| **Platform services involved** | None — domain integration |
| **Gaps resolved** | **G08** (primary); enables G09 |
| **Dependencies** | None (can parallel CO-07) |
| **Expected outcomes** | Cross-module naming aligned; conceptual boundaries documented; manager UX ambiguity removed |
| **Architectural benefits** | Manager tooling and G09 completion proceed without cross-module confusion |
| **Stage assignment** | **Stage 2** (entry) |

**Does not include:** Schema merge of template models; unified template store.

---

# Domain Architecture

---

## CO-10 — BO Service Layer Extraction (Scheduling + HR)

| Field | Detail |
|-------|--------|
| **Purpose** | Parallel extraction: canonical scheduling service(s) from fat controllers; decompose `hrController.ts` into domain services |
| **Participating domains** | Scheduling, HR |
| **Platform services involved** | None — architectural pattern (Drive L4 reference) |
| **Gaps resolved** | **G10**, **G11** (primary) |
| **Dependencies** | CO-03 (PE actions map to service boundaries); CO-01 (activity emit points in services) |
| **Expected outcomes** | Thin controllers; testable domain logic; ~144 Scheduling Prisma calls and ~77 HR Prisma calls extracted to services |
| **Architectural benefits** | Drive L4 service-boundary parity path; Model C preserved — domains stay independent; certification service must-pass |
| **Stage assignment** | **Stage 2** |

**Does not include:** Monolithic BO service; shared HR+Scheduling codebase merge.

---

## CO-09 — BO V-Link Entity Registration

| Field | Detail |
|-------|--------|
| **Purpose** | Register Scheduling and HR entity types in V-Link resolver; define WC campaign entity types when module established |
| **Participating domains** | Scheduling, HR, Workforce Communications |
| **Platform services involved** | V-Link |
| **Gaps resolved** | **G13** (primary) |
| **Dependencies** | G06 / CO-04 (trash lifecycle aligned with link lifecycle) |
| **Expected outcomes** | Shifts, schedules, swap requests, HR profiles, PTO, attendance linkable cross-module; WC campaigns linkable when established |
| **Architectural benefits** | Platform §19 vlink parity path for BO; Drive/Calendar linking patterns extended |
| **Stage assignment** | **Stage 2** |

**Does not include:** V-Link UI; link creation UX in every module.

---

## G09 — Scheduling Manager API Completion (domain-specific)

| Field | Detail |
|-------|--------|
| **Purpose** | Complete Scheduling manager and admin stub endpoints (501 → implemented) — planning pillar operational completeness |
| **Participating domains** | Scheduling (primary); WC integration consumer |
| **Platform services involved** | Notifications (emit on publish via CO-02); Policy Engine (via CO-03) |
| **Gaps resolved** | **G09** |
| **Dependencies** | G04, G05, G07, G08 (CO-02, CO-03, CO-07, CO-08) |
| **Expected outcomes** | `publishTeamSchedule`, team availability, open-shift management, assignment, admin swap list functional |
| **Architectural benefits** | Planning workflows complete; reliable publish hooks for WC operational messaging integration |
| **Stage assignment** | **Stage 2** |

**Note:** G09 is domain-specific — not a convergence initiative — but runs in Stage 2 alongside CO-08, CO-09, CO-10.

**Does not include:** Labor analytics (501 trio); socket semantics expansion.

---

# Workforce Communications

---

## CO-11 — Workforce Communications Establishment Package

| Field | Detail |
|-------|--------|
| **Purpose** | Coordinated WC Phase 2+ package: audience resolver + module registration + hub + ack/campaign models + front-page evolution |
| **Participating domains** | Workforce Communications (primary); consumes HR identity, Notifications, Activity, PE |
| **Platform services involved** | Activity, Notifications, Policy Engine, Global Trash, V-Link (optional) |
| **Gaps resolved** | **G14**, **G15**, **G16** (primary) |
| **Dependencies** | G01, G02, G03, G04, G05, G06 (Stages 1 complete); G09 (Scheduling publish reliable) |
| **Expected outcomes** | Phase 1 front page evolves to full broadcast domain; dedicated module with hub and manifest; org-chart audience resolver; ack and campaign audit; `workforce_*` fan-out |
| **Architectural benefits** | First-class WC domain without Chat absorption; evolution not greenfield; three-system model preserved |
| **Stage assignment** | **Stage 3** |

**Source:** [WORKFORCE_COMMUNICATIONS_ESTABLISHMENT_PLAN.md](./WORKFORCE_COMMUNICATIONS_ESTABLISHMENT_PLAN.md)

**Does not include:** Full emergency system as Stage 3 entry requirement; Chat CHANNEL changes; socket-based broadcast.

---

# Measurement & Certification

---

## CO-12 — BO Test and Analytics Foundation

| Field | Detail |
|-------|--------|
| **Purpose** | Shared test patterns for tenant isolation + critical paths; analytics ownership decision record (module vs platform workforce analytics) |
| **Participating domains** | Scheduling, HR, Analytics |
| **Platform services involved** | Activity (analytics source), Audit |
| **Gaps resolved** | **G17** (Stage 5 — tests); **G18** (Stage 4 — analytics) |
| **Dependencies** | G03 / CO-01 (activity as measurement foundation) |
| **Expected outcomes** | Tenant + critical path test strategy for BO modules; analytics ownership decision; activity-derived metrics posture; triple analytics overlap resolved |
| **Architectural benefits** | Certification readiness; honest labor forecasting posture; eliminates HR dashboards + scheduling UI stats + 501 server drift |
| **Stage assignment** | **Stage 4** (G18 analytics) · **Stage 5** (G17 tests) |

**Does not include:** Labor forecasting implementation; certification awards.

---

## Convergence program summary table

| CO | Name | Stage | Priority | Domains | Gaps |
|----|------|-------|----------|---------|------|
| CO-06 | FALSE POSITIVE governance | 1 | P0 | All | G01 |
| CO-05 | Identity trust hardening | 1 | P0 | HR, Scheduling, WC | G02 |
| CO-01 | Activity envelope | 1 | P1 | Scheduling, HR, WC | G03 |
| CO-02 | Notification standardization | 1 | P1 | Scheduling, HR, WC | G04, G12 |
| CO-03 | Policy Engine registration | 1 | P1 | Scheduling, HR, WC | G05 |
| CO-04 | Global Trash alignment | 1 | P1 | Scheduling, HR, WC | G06 |
| CO-07 | hrScheduleService contract | 1 | P1 | HR, Scheduling | G07 |
| CO-08 | Shift template alignment | 2 | P2 | HR, Scheduling | G08 |
| CO-10 | Service layer extraction | 2 | P2 | Scheduling, HR | G10, G11 |
| CO-09 | V-Link registration | 2 | P2 | Scheduling, HR, WC | G13 |
| G09 | Manager API completion | 2 | P2 | Scheduling | G09 |
| CO-11 | WC establishment package | 3 | P3 | WC | G14–G16 |
| CO-12 | Test + analytics foundation | 4–5 | P3 | Scheduling, HR, Analytics | G17, G18 |

---

## Consumption model

```
Stage 1 COs → define shared BO constitutional patterns
                    ↓
Scheduling, HR → inherit Activity, Notifications, PE, Trash patterns
                    ↓
Stage 2 COs → domain architecture on inherited foundation
                    ↓
CO-11 → WC consumes all Stage 1 patterns + Stage 2 Scheduling hooks
                    ↓
CO-12 → measure and certify honestly
```

---

## Certification statement

**No certification awarded.** Convergence program defines modernization **programs** — not implementation waves or certification awards.

---

## Document authority

Expands CO-01–CO-12 from [BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md](./BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md). Update via explicit Business Operations program revision only.
