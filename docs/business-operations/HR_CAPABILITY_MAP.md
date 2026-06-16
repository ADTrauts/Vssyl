# HR Capability Map

**Phase:** Business Operations Phase 0B — Executive synthesis  
**Audience:** Stakeholders (5–10 minute read)  
**Last updated:** 2026-06-14  
**Status:** Discovery synthesis — not certification  
**Drill-down:** Linked audit documents; no conclusions beyond their evidence.

| Document | Answers |
|----------|---------|
| [HR_OPERATION_MATRIX.md](./HR_OPERATION_MATRIX.md) | Per-operation detail |
| [HR_ARCHITECTURE_AUDIT.md](./HR_ARCHITECTURE_AUDIT.md) | Architectural gates |
| [HR_UX_AUDIT.md](./HR_UX_AUDIT.md) | UX categories |
| [HR_STRATEGIC_POSITIONING.md](./HR_STRATEGIC_POSITIONING.md) | Future HR role |
| [HR_ORG_CHART_BOUNDARY_ANALYSIS.md](./HR_ORG_CHART_BOUNDARY_ANALYSIS.md) | HR ↔ Org Chart ownership |
| [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md) | **Who is an employee?** |
| [BUSINESS_OPERATIONS_PHASE_0B_CLOSEOUT.md](./BUSINESS_OPERATIONS_PHASE_0B_CLOSEOUT.md) | Phase closeout |

---

# Executive Summary

## What HR is

A **standalone Business Operations module** for workforce **time-and-people tracking**: employee HR profiles, PTO, attendance, onboarding, and analytics. It **extends** org-chart placement — it does not define org structure or shift planning.

## Maturity snapshot

| Layer | Rating |
|-------|--------|
| **Operational** | MEDIUM — core HR workflows implemented; enterprise areas stubbed |
| **Architectural** | LOW–MEDIUM — monolithic controller; constitutional gaps |
| **UX** | LOW–MEDIUM — functional surfaces; token drift in analytics |
| **Identity clarity** | MEDIUM–HIGH — stack documented; import bypass risk |

## Identity (one sentence)

**Org chart `EmployeePosition` owns workforce identity; `EmployeeHRProfile` extends it.**

Detail: [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md)

---

# Capability Inventory

**Maturity:** HIGH · MEDIUM · LOW · NOT PRESENT · UNKNOWN

| Capability | Current State | Owner | Maturity | Notes |
|------------|---------------|-------|----------|-------|
| **Identity & structure** | | | | |
| Workforce placement | `EmployeePosition` | Org chart | MEDIUM | Identity anchor |
| HR employee profile | `EmployeeHRProfile` | HR | MEDIUM | Optional until created |
| Departments / positions | Org chart CRUD | Org chart | MEDIUM | HR reads only |
| Reporting hierarchy | `reportsToId` | Org chart | MEDIUM | |
| **Employment** | | | | |
| Hire (profile create) | `POST /admin/employees` | HR | MEDIUM | Requires existing EP |
| Bulk import | CSV import | HR | LOW | Bypasses org-chart API |
| Termination | HR terminate endpoint | HR | MEDIUM | Also deactivates EP |
| Onboarding | Journeys + templates | HR | MEDIUM | Feature-gated |
| **Time** | | | | |
| PTO requests/approvals | Implemented | HR | MEDIUM | Calendar sync |
| PTO balances | Endpoint exists | HR | MEDIUM | |
| Attendance punch | Implemented | HR | MEDIUM | Feature-gated |
| Attendance policies | CRUD | HR | MEDIUM | |
| Timecards / overtime / call-offs | — | — | UNKNOWN / NOT PRESENT | |
| **Enterprise** | | | | |
| Payroll | 200 JSON stub | — | NOT PRESENT | |
| Recruitment | 200 JSON stub | — | NOT PRESENT | |
| Performance | 200 JSON stub | — | NOT PRESENT | |
| Benefits | 200 JSON stub | — | NOT PRESENT | |
| **Analytics & AI** | | | | |
| HR analytics (3 domains) | Dashboards + API | HR | MEDIUM | |
| AI context (3 providers) | Implemented | HR | MEDIUM | |
| AI actions (time-off, punch) | `ActionExecutor` | HR | MEDIUM | |
| **Platform** | | | | |
| Notifications | 8 types sent | Platform + HR | LOW | Manifest gap |
| Activity logging | auditLog only | — | NOT PRESENT | |
| Global Trash | `deletedAt` | — | NOT PRESENT | |
| V_Link | — | — | NOT PRESENT | |

---

# Architecture Diagram

```
Platform User
      ↓
Business Member
      ↓
Org Chart ──► Department, Position, EmployeePosition  ← IDENTITY
      ↓
HR Module ──► EmployeeHRProfile, PTO, Attendance, Onboarding
      ↓
Shared ──► hrScheduleService ──► Calendar
      ↑
Scheduling (Phase 0A) ── reads PTO, writes attendance stubs

Workforce Communications → NOT PRESENT (Phase 0C)
```

---

# Ownership Summary

| Owner | Capabilities |
|-------|--------------|
| **Org chart** | Structure, `EmployeePosition`, assign/transfer/remove |
| **HR** | Profile, PTO, attendance, onboarding, HR analytics |
| **Shared** | Calendar bridge (`hrScheduleService`), PTO conflict enforcement (scheduling reads) |
| **Scheduling** | Shift planning (Phase 0A — not re-audited) |
| **NOT PRESENT** | Workforce comms, enterprise HR modules, skills registry |

**Collisions:** CSV import bypass; hire date vs start date; terminate vs org remove; dual shift-template naming (0A).

---

# Relationship to Other Domains

## Org Chart

HR **depends on** org chart. Org chart **does not depend on** HR. See [HR_ORG_CHART_BOUNDARY_ANALYSIS.md](./HR_ORG_CHART_BOUNDARY_ANALYSIS.md).

## Scheduling (Phase 0A baseline)

Scheduling owns planning. HR owns PTO/attendance data. Integration via shared reads/writes and `hrScheduleService`. Scheduling not re-audited in 0B.

## Calendar

Calendar stores events. HR/scheduling trigger sync through `hrScheduleService`.

## Future Workforce Communications (Phase 0C)

Should **consume** `EmployeePosition` + `Department` for audiences — not duplicate identity. Operational messaging layer NOT PRESENT today.

---

# Critical Gaps

| Gap | Confirmed |
|-----|-----------|
| Enterprise HR (payroll, recruitment, performance, benefits) | NOT PRESENT |
| Workforce communications | NOT PRESENT |
| Normalized activity events | NOT PRESENT |
| Policy Engine, V_Link, Global Trash | NOT PRESENT |
| HR CSV import org-chart bypass | Yes — risk |
| Attendance shift template REST APIs | NOT PRESENT |
| Settings / self-profile update stubs | Yes |
| Dedicated HR test suite | NOT PRESENT |
| Certifications / skills registry | UNKNOWN / NOT PRESENT |

---

# Strategic Implications

## Future HR role in Workforce Operations

HR is the **tracking and employment lifecycle** pillar in the hybrid model (Phase 0A **C**): independent modules connected by shared identity (`EmployeePosition`) and integration bridges.

HR should **not** absorb org chart or scheduling. It should **strengthen** profile, PTO, attendance, and onboarding on top of canonical identity.

## Phase 0C preview

Assess workforce broadcasts, emergency alerts, and shift operational messaging as a **new domain** consuming existing identity — cite [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md).

## Strategic Architecture preview

Synthesize 0A + 0B + 0C using:

- [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md) — capability ownership  
- [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md) — identity stack  

---

# Readiness & Next Step

| Item | Status |
|------|--------|
| Phase 0B complete | Yes — 8 documents |
| HR understood | Yes |
| Identity architecture established | Yes |
| Ready for implementation | No |
| Ready for planning | Yes — with documented risks |

**Recommended next step:** **Business Operations Phase 0C — Workforce Communications Reality Assessment**

---

*Synthesized from Phase 0B audit documents only. Updates [BUSINESS_OPERATIONS_CAPABILITY_MAP.md](./BUSINESS_OPERATIONS_CAPABILITY_MAP.md) HR section with evidence-based detail.*
