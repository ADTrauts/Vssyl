# Business Operations Alignment Priority Matrix

**Program:** Business Operations Constitutional Alignment Program  
**Status:** **Most important alignment deliverable** — ranked constitutional gaps  
**Last updated:** 2026-06-14  
**Master matrix:** [BUSINESS_OPERATIONS_CONSTITUTIONAL_ALIGNMENT.md](./BUSINESS_OPERATIONS_CONSTITUTIONAL_ALIGNMENT.md)  
**Constitution:** [BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md](./BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md)

---

## Purpose

Rank every constitutional gap blocking Scheduling, HR, and Workforce Communications from becoming first-class platform domains. Prioritize shared alignment work that should be completed **once** and consumed by all domains.

**No implementation plans. No modernization waves. No certifications.**

---

## Priority definitions

| Level | Meaning | Modernization planning impact |
|-------|---------|------------------------------|
| **P0** | Blocks planning credibility or causes architectural harm if ignored | Must resolve before any BO modernization planning is credible |
| **P1** | Blocks first-class domain status for any BO module — shared platform contract | Must resolve before domain-specific modernization planning |
| **P2** | Required for Scheduling or HR parity with L3 reference — domain constitutional debt | Resolve during shared P1 program or immediately after |
| **P3** | Required for WC evolution beyond Phase 1 — or certification polish | After P0–P2 gates |

---

## Ranked gap inventory

### P0 — Governance and identity (resolve first)

| ID | Gap | Impact | Dependency | Affected domains | Source |
|----|-----|--------|------------|------------------|--------|
| **G01** | FALSE POSITIVE governance adoption | Wrong domain ownership during modernization — Chat/sockets/notifs absorbed as "full WC" | None | Scheduling, HR, WC, Analytics | 0C boundary analysis; 0D constitution § FALSE POSITIVE GOVERNANCE |
| **G02** | Identity cleanup (CSV bypass, lifecycle asymmetry, legacy member fields) | Corrupts audience resolution, org trust, cross-module lifecycle | None | HR (primary), WC, Scheduling, all integrations | 0B identity architecture; Phase 0B closeout |

---

### P1 — Shared platform constitutional contract

| ID | Gap | Impact | Dependency | Affected domains | Source |
|----|-----|--------|------------|------------------|--------|
| **G03** | Activity standardization (`emitModuleActivityEvent`) | Cannot certify; audit/analytics blocked; activity vs analytics conflated | G02 | Scheduling, HR, WC | 0A/0B architecture audits; platform §19 |
| **G04** | Notification manifest + emitter standardization | Incomplete delivery contract; no `scheduling_*`; HR manifest gap; no `workforce_*` | G03 (emit after authorized success) | Scheduling, HR, WC | 0A/0B/0C; `BUSINESS_OPERATIONS_PLATFORM_SERVICES.md` |
| **G05** | Policy Engine adoption for BO write paths | AuthZ drift vs platform; ad-hoc middleware only | G02 (identity for authZ subjects) | Scheduling, HR, WC | 0A/0B architecture audits |
| **G06** | Global Trash alignment (`trashedAt` + trash controller) | Lifecycle contract fail — hard delete and local `deletedAt` | G03 | Scheduling, HR, WC | 0A/0B architecture audits |
| **G07** | `hrScheduleService` contract formalization | Integration drift between HR, Scheduling, Calendar | G02 | HR, Scheduling | 0A boundary; `HR_SCHEDULING_BOUNDARY_REVIEW.md` |

---

### P2 — Domain constitutional debt (Scheduling + HR parity)

| ID | Gap | Impact | Dependency | Affected domains | Source |
|----|-----|--------|------------|------------------|--------|
| **G08** | Shift-template naming collision (`AttendanceShiftTemplate` vs `ShiftTemplate`) | Cross-module confusion; manager UX ambiguity | — (can parallel P7) | HR, Scheduling | 0A/0B closeouts |
| **G09** | Scheduling manager API completion (501 stubs) | Planning pillar incomplete; publish hooks unreliable | G04, G05, G07, G08 | Scheduling | 0A architecture audit stub inventory |
| **G10** | Scheduling service layer / thin controllers | Drive L4 gap — ~144 Prisma calls in controllers | — | Scheduling | 0A architecture audit |
| **G11** | HR controller decomposition | Drive L4 gap — monolithic `hrController.ts` | — | HR | 0B architecture audit |
| **G12** | HR notification completeness (3 attendance types + manifest) | Manifest/emitter gap despite partial implementation | G04 | HR | 0B architecture audit |
| **G13** | V_Link integration | Platform matrix gap — cross-module entity linking | G06 | Scheduling, HR, WC | Platform doc; 0A/0B audits |

---

### P3 — WC evolution and certification polish

| ID | Gap | Impact | Dependency | Affected domains | Source |
|----|-----|--------|------------|------------------|--------|
| **G14** | Audience resolver implementation | WC Phase 2 gate — no org-chart consumer for broadcast audiences | G02, G04 | WC | 0C audience architecture |
| **G15** | WC module registration + hub | Module NOT PRESENT — cannot be first-class | G02–G06, G14 | WC | 0C architecture audit; constitutional clarification |
| **G16** | Acknowledgement + campaign audit models | Full broadcast lifecycle — compliance and required reading | G14, G15, G03 | WC | 0C architecture audit |
| **G17** | Dedicated BO test suites | Certification readiness — tenant + critical paths | G03+ | Scheduling, HR | 0A/0B architecture audits |
| **G18** | Analytics ownership clarity | Measurement drift — HR dashboards + scheduling UI + 501 server | G03 | Scheduling, HR, Analytics | 0A/0B; modernization P12 |

---

## Priority matrix summary

| Priority | Count | Theme |
|----------|-------|-------|
| **P0** | 2 | Governance + identity trust |
| **P1** | 5 | Shared platform constitutional contract |
| **P2** | 6 | Scheduling/HR domain debt |
| **P3** | 5 | WC establishment + polish |
| **Total** | 18 | — |

### By domain

| Domain | P0 | P1 | P2 | P3 | Total gaps |
|--------|----|----|----|----|------------|
| Scheduling | G01, G02 | G03–G07 | G08–G10, G13 | G17, G18 | 14 |
| HR | G01, G02 | G03–G07 | G08, G11–G13 | G17, G18 | 14 |
| Workforce Communications | G01, G02 | G03–G06 | G13 | G14–G16, G18 | 12 |

*Note: Many gaps are shared — count reflects applicability, not independent work items.*

---

## Dependency graph (simplified)

```
G01 (governance) ──────────────────────────────► G15 (WC module)
G02 (identity) ──► G03 (activity) ──► G04 (notifications) ──► G09 (manager APIs)
                 │                    │
                 │                    └──► G14 (audience) ──► G15 ──► G16
                 ├──► G05 (PE) ─────────────────────────────► G15
                 ├──► G07 (hrSchedule bridge)
                 └──► G08 (shift templates) ──► G09

G03 ──► G06 (trash) ──► G13 (V-Link)
G03 ──► G18 (analytics clarity)
G03+ ──► G17 (tests)
```

---

## Recommended resolution sequence (planning gate — not waves)

| Step | Gaps | Outcome |
|------|------|---------|
| 1 | G01, G02 | Planning credibility; trustworthy identity |
| 2 | G03, G04, G05, G06, G07 | Shared BO platform constitutional alignment |
| 3 | G08, G09, G10, G11, G12, G13 | Scheduling + HR domain parity |
| 4 | G14, G15, G16 | WC Phase 2 establishment |
| 5 | G17, G18 | Certification and measurement polish |

**Modernization planning entry point:** Step 2 (shared platform alignment for HR + Scheduling) after Step 1 gates.

---

# CONVERGENCE OPPORTUNITIES

Initiatives that resolve constitutional gaps across **multiple** Business Operations domains simultaneously. Complete once; consume everywhere.

---

### CO-01 — BO Platform Activity Envelope Program

| Field | Detail |
|-------|--------|
| **Initiative** | Standardize `emitModuleActivityEvent` for all BO write paths — shared event taxonomy, success-only emission, activity vs analytics separation |
| **Domains impacted** | Scheduling, HR, Workforce Communications (future) |
| **Platform services involved** | Activity, Audit (activity-derived) |
| **Dependencies** | G02 (identity stable for actor/subject references) |
| **Expected constitutional benefit** | Single interoperability contract; enables trustworthy audit; unblocks G06, G13, G16, G18; satisfies `moduleSpecs.md` must-pass |

**Resolves gaps:** G03 (primary); enables G16, G18

---

### CO-02 — BO Notification Manifest and Emitter Standardization

| Field | Detail |
|-------|--------|
| **Initiative** | Unified BO notification program: seed manifest `notifications` blocks, `[module]_[event]` naming, emitter placement after authorized success, grouping map completeness |
| **Domains impacted** | Scheduling (`scheduling_*`), HR (complete `hr_*`), Workforce Communications (`workforce_*`) |
| **Platform services involved** | Notifications (C2 Notifier) |
| **Dependencies** | G03 (emit after success); G01 (FALSE POSITIVE — notifs ≠ WC content) |
| **Expected constitutional benefit** | Complete delivery contract for all BO domains; one manifest pattern; Scheduling gains first emitters; HR completes partial work; WC gains fan-out path |

**Resolves gaps:** G04 (primary); G12 (HR subset)

---

### CO-03 — BO Policy Engine Registration Program

| Field | Detail |
|-------|--------|
| **Initiative** | Register Scheduling, HR, and future WC write actions in Policy Engine; migrate from `schedulingPermissions.ts` / `hrPermissions.ts` ad-hoc middleware |
| **Domains impacted** | Scheduling, HR, Workforce Communications |
| **Platform services involved** | Policy Engine |
| **Dependencies** | G02 (identity for authZ subjects) |
| **Expected constitutional benefit** | Cross-module authZ consistency; manager/admin writes auditable through PE; WC author/send gates ready before module exists |

**Resolves gaps:** G05 (primary)

---

### CO-04 — BO Global Trash and Lifecycle Alignment

| Field | Detail |
|-------|--------|
| **Initiative** | Migrate Scheduling and HR delete paths to `trashedAt` + Global Trash API; define WC campaign trash handler when module established |
| **Domains impacted** | Scheduling, HR, Workforce Communications |
| **Platform services involved** | Global Trash, Audit (via activity) |
| **Dependencies** | G03 (activity on trash/restore events) |
| **Expected constitutional benefit** | Unified soft-delete lifecycle; eliminates hard delete and local `deletedAt` drift; certification trash must-pass satisfied |

**Resolves gaps:** G06 (primary); enables G13

---

### CO-05 — Workforce Identity Trust Hardening

| Field | Detail |
|-------|--------|
| **Initiative** | Eliminate CSV import bypass; align terminate/remove lifecycle; deprecate legacy `BusinessMember.department`/`title` for audience purposes |
| **Domains impacted** | HR (primary), Scheduling, Workforce Communications, Analytics |
| **Platform services involved** | Identity stack (`EmployeePosition`, `Department`) — org chart owned, not HR |
| **Dependencies** | None — P0 entry |
| **Expected constitutional benefit** | Trustworthy audience resolution; PE subjects stable; cross-module lifecycle consistent; unblocks audience resolver and WC Phase 2 |

**Resolves gaps:** G02 (primary); unblocks G14, G07

---

### CO-06 — FALSE POSITIVE Governance Adoption

| Field | Detail |
|-------|--------|
| **Initiative** | Adopt `BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md` § FALSE POSITIVE GOVERNANCE in all BO design reviews; maintain three-system model (Chat / WC / Notifications) |
| **Domains impacted** | All BO domains — especially WC, Scheduling (sockets), HR (workflow notifs) |
| **Platform services involved** | Governance (constitutional); Realtime (socket semantics); Notifications (delivery boundary) |
| **Dependencies** | None — P0 entry |
| **Expected constitutional benefit** | Prevents architectural harm during modernization; preserves Chat ≠ WC; sockets remain UI sync; HR notifs remain workflow |

**Resolves gaps:** G01 (primary)

---

### CO-07 — Shared Bridge Contract Formalization (`hrScheduleService`)

| Field | Detail |
|-------|--------|
| **Initiative** | Document neutral contract for `hrScheduleService`: owner, API surface, versioning, breaking-change policy, consumer responsibilities (Scheduling, Calendar) |
| **Domains impacted** | HR, Scheduling, Calendar (adjacent) |
| **Platform services involved** | Integration bridge (not platform service) |
| **Dependencies** | G02 (identity/stack stable) |
| **Expected constitutional benefit** | Eliminates HR-named ambiguity; manager API completion (G09) and calendar sync stable; WC scheduling hooks trustworthy |

**Resolves gaps:** G07 (primary); enables G09

---

### CO-08 — Shift Template Naming and Concept Alignment

| Field | Detail |
|-------|--------|
| **Initiative** | Decision record resolving `AttendanceShiftTemplate` (HR) vs `ShiftTemplate` (Scheduling) — naming, conceptual boundaries, cross-module UX |
| **Domains impacted** | HR, Scheduling |
| **Platform services involved** | None — domain integration |
| **Dependencies** | None (can parallel CO-07) |
| **Expected constitutional benefit** | Removes cross-module confusion before manager tooling and G09 completion |

**Resolves gaps:** G08 (primary); enables G09

---

### CO-09 — BO V-Link Entity Registration

| Field | Detail |
|-------|--------|
| **Initiative** | Register Scheduling and HR entity types in V-Link resolver; define WC campaign entity types when module established |
| **Domains impacted** | Scheduling, HR, Workforce Communications |
| **Platform services involved** | V-Link |
| **Dependencies** | G06 (trash lifecycle aligned with link lifecycle) |
| **Expected constitutional benefit** | Cross-module entity linking per platform §19; Drive/Calendar parity path for BO |

**Resolves gaps:** G13 (primary)

---

### CO-10 — BO Service Layer Extraction (Scheduling + HR)

| Field | Detail |
|-------|--------|
| **Initiative** | Parallel extraction: canonical `schedulingService` (or domain services) from fat controllers; decompose `hrController.ts` into domain services |
| **Domains impacted** | Scheduling, HR |
| **Platform services involved** | None — architectural pattern (Drive L4) |
| **Dependencies** | CO-03 (PE actions map to service boundaries); best after CO-01 (activity emit points in services) |
| **Expected constitutional benefit** | Thin controllers; testable domain logic; certification service-boundary must-pass; independent domains remain independent (Model C) |

**Resolves gaps:** G10, G11 (primary)

---

### CO-11 — Workforce Communications Establishment Package

| Field | Detail |
|-------|--------|
| **Initiative** | Coordinated WC Phase 2 package: audience resolver + module registration + hub + ack/campaign models + front-page evolution — after shared P1 gates |
| **Domains impacted** | Workforce Communications (primary); consumes HR identity, Notifications, Activity, PE |
| **Platform services involved** | Activity, Notifications, Policy Engine, Global Trash, V-Link (optional) |
| **Dependencies** | G01, G02, G03, G04, G05, G06, G14 |
| **Expected constitutional benefit** | Evolves Phase 1 front page to first-class broadcast domain without Chat absorption or greenfield-only assumption |

**Resolves gaps:** G14, G15, G16 (primary)

---

### CO-12 — BO Test and Analytics Foundation

| Field | Detail |
|-------|--------|
| **Initiative** | Shared test patterns for tenant isolation + critical paths; analytics ownership decision record (module vs platform workforce analytics) |
| **Domains impacted** | Scheduling, HR, Analytics |
| **Platform services involved** | Activity (analytics source), Audit |
| **Dependencies** | G03 (activity as measurement foundation) |
| **Expected constitutional benefit** | Certification readiness; eliminates triple analytics overlap; honest labor forecasting posture |

**Resolves gaps:** G17, G18 (primary)

---

## Convergence opportunity priority

| Opportunity | Priority | Domains | Resolves gaps |
|-------------|----------|---------|---------------|
| CO-06 FALSE POSITIVE governance | P0 | All | G01 |
| CO-05 Identity trust hardening | P0 | HR, WC, Scheduling | G02 |
| CO-01 Activity envelope | P1 | Scheduling, HR, WC | G03 |
| CO-02 Notification standardization | P1 | Scheduling, HR, WC | G04, G12 |
| CO-03 Policy Engine registration | P1 | Scheduling, HR, WC | G05 |
| CO-04 Global Trash alignment | P1 | Scheduling, HR, WC | G06 |
| CO-07 Bridge contract | P1 | HR, Scheduling | G07 |
| CO-08 Shift template alignment | P2 | HR, Scheduling | G08 |
| CO-10 Service layer extraction | P2 | Scheduling, HR | G10, G11 |
| CO-09 V-Link registration | P2 | Scheduling, HR, WC | G13 |
| CO-11 WC establishment package | P3 | WC | G14–G16 |
| CO-12 Test + analytics foundation | P3 | Scheduling, HR | G17, G18 |

**Scheduling manager API completion (G09)** is domain-specific but depends on CO-02, CO-03, CO-07, CO-08 — not a convergence initiative itself.

---

## Certification statement

**No certification awarded.** Priority matrix is planning documentation only.

---

## Document authority

Operationalizes [BUSINESS_OPERATIONS_MODERNIZATION_PREREQUISITES.md](./BUSINESS_OPERATIONS_MODERNIZATION_PREREQUISITES.md) P1–P12 as ranked gaps G01–G18. Update via explicit program revision.
