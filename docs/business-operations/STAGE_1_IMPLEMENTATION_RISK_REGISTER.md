# Stage 1 Implementation Risk Register

**Program:** Business Operations Stage 1 Implementation Planning  
**Status:** Pre-execution risk inventory  
**Last updated:** 2026-06-14  
**Sequence:** [STAGE_1_IMPLEMENTATION_SEQUENCE.md](./STAGE_1_IMPLEMENTATION_SEQUENCE.md)  
**Review cadence:** At Track 4 verification; carry-forward to Stage 2

---

## Purpose

Document implementation risks **before** Stage 1 execution begins. Each risk includes mitigation and verification method.

**Minimum coverage:** Identity migration, Scheduling dependencies, notification taxonomy, PE scope creep, bridge ownership, WC boundary regression, activity inconsistency, trash lifecycle mismatch.

---

## Risk summary

| ID | Risk | Impact | Probability | COs |
|----|------|--------|-------------|-----|
| R-01 | Identity migration complexity | High | Medium | CO-05 |
| R-02 | Scheduling hidden dependencies | High | Medium | CO-01, CO-02, CO-04, CO-07 |
| R-03 | Notification taxonomy drift | Medium | Medium | CO-02 |
| R-04 | Policy Engine scope creep | Medium | High | CO-03 |
| R-05 | hrScheduleService ownership ambiguity | High | Medium | CO-07 |
| R-06 | Workforce Communications boundary regression | High | Medium | CO-06 |
| R-07 | Activity event inconsistency | High | Medium | CO-01 |
| R-08 | Global Trash lifecycle mismatch | High | Medium | CO-04 |
| R-09 | Sequence violation (Track 3 before Track 2) | High | Low | All |
| R-10 | Schema migration scope expansion | Medium | Medium | CO-04 |
| R-11 | Seed vs runtime manifest drift | Medium | Medium | CO-02 |
| R-12 | COL-2 attendance stub conflated with bridge | Medium | Low | CO-07 |

---

## Risk register (detailed)

### R-01 — Identity migration complexity

| Field | Detail |
|-------|--------|
| **Risk description** | Remediating HR CSV import bypass and lifecycle asymmetry may affect existing tenant data, duplicate EPs, or break in-flight onboarding |
| **Impact** | High — corrupt workforce identity undermines all BO modules and Stage 3 audience resolver |
| **Probability** | Medium |
| **Affected COs** | CO-05 |
| **Affected domains** | HR (primary), Scheduling, WC (future), Analytics |
| **Mitigation strategy** | WP-05.1 phased import spec; WP-05.2 lifecycle state matrix; WP-05.6 verification scenarios before production rollout; staged tenant migration in implementation program |
| **Verification method** | WP-05.6 scenarios pass; no duplicate EP creation in import test plan; terminate/remove paths produce consistent state |

---

### R-02 — Scheduling hidden dependencies

| Field | Detail |
|-------|--------|
| **Risk description** | Scheduling controllers have ~144 Prisma calls, 501 stubs, and cross-module writes (attendance stubs, calendar sync) — activity/notification/trash emit points may be missed or placed incorrectly |
| **Impact** | High — incomplete constitutional alignment; publish hooks unreliable for Stage 2 and WC |
| **Probability** | Medium |
| **Affected COs** | CO-01, CO-02, CO-04, CO-07 |
| **Affected domains** | Scheduling, HR (attendance stubs), Calendar |
| **Mitigation strategy** | WP-01.2 exhaustive event inventory; WP-02.2 emitter placement map; WP-07.5 caller inventory; Phase 0A stub inventory as checklist |
| **Verification method** | Controller→event mapping review; publish path scenario includes activity + notification + calendar sync |

---

### R-03 — Notification taxonomy drift

| Field | Detail |
|-------|--------|
| **Risk description** | Manifest types, runtime emitters, and frontend grouping map diverge — types emitted but undiscoverable, or manifest entries without emitters |
| **Impact** | Medium — incomplete delivery contract; user-facing notification gaps |
| **Probability** | Medium |
| **Affected COs** | CO-02 |
| **Affected domains** | Scheduling, HR, Platform Notifications |
| **Mitigation strategy** | WP-02.1 master taxonomy; WP-02.7 manifest↔emitter↔grouping verification; manifest-first rule in implementation |
| **Verification method** | WP-02.7 checklist; every emitted type has manifest + grouping map entry |

---

### R-04 — Policy Engine scope creep

| Field | Detail |
|-------|--------|
| **Risk description** | PE registration expands to read paths, analytics, or non-mutation routes — increasing complexity without constitutional benefit |
| **Impact** | Medium — delayed delivery; dual evaluation overhead; authZ confusion |
| **Probability** | High |
| **Affected COs** | CO-03 |
| **Affected domains** | Scheduling, HR |
| **Mitigation strategy** | WP-03.7 migration matrix — P1 write paths only in Stage 1; explicit out-of-scope list for read/analytics |
| **Verification method** | Action inventory review — only mutations registered; no GET routes in PE inventory |

---

### R-05 — hrScheduleService ownership ambiguity

| Field | Detail |
|-------|--------|
| **Risk description** | HR-named package causes Scheduling/Calendar teams to assume HR owns shift sync semantics — integration changes made without contract review |
| **Impact** | High — calendar sync breaks on publish; Stage 2 G09 blocked |
| **Probability** | Medium |
| **Affected COs** | CO-07 |
| **Affected domains** | HR, Scheduling, Calendar |
| **Mitigation strategy** | WP-07.1 neutral contract language; WP-07.2 consumer matrix; WP-07.3 breaking-change policy; BO steward approval for changes |
| **Verification method** | Contract doc review; caller inventory matches known 0A/0B call sites; WP-07.4 sync scenarios defined |

---

### R-06 — Workforce Communications boundary regression

| Field | Detail |
|-------|--------|
| **Risk description** | During CO-02/implementation, scheduling notifications or socket events marketed as "workforce comms"; front-page Phase 1 treated as complete WC |
| **Impact** | High — wrong architecture; Stage 3 CO-11 built on false assumptions |
| **Probability** | Medium |
| **Affected COs** | CO-06 (primary), CO-02 |
| **Affected domains** | WC, Scheduling, Chat, Notifications |
| **Mitigation strategy** | WP-06.1 design review checklist; WP-02.6 per-type FALSE POSITIVE classification; Track 4 audit item 9 |
| **Verification method** | WP-06.3 surrogate audit; no feature labeled full WC without lifecycle; socket events classified as sync |

---

### R-07 — Activity event inconsistency

| Field | Detail |
|-------|--------|
| **Risk description** | Scheduling and HR invent different envelope shapes, event naming, or emit on failure paths — breaking interoperability and analytics foundation |
| **Impact** | High — certification blocked; activity vs analytics conflated |
| **Probability** | Medium |
| **Affected COs** | CO-01 |
| **Affected domains** | Scheduling, HR, WC (future) |
| **Mitigation strategy** | WP-01.1 canonical taxonomy; WP-01.5 emit placement guide; success-only rule in all mutation specs |
| **Verification method** | Taxonomy review; spot-check deny paths — no emit; envelope field consistency across modules |

---

### R-08 — Global Trash lifecycle mismatch

| Field | Detail |
|-------|--------|
| **Risk description** | Scheduling hard delete paths remain alongside trash; HR `deletedAt` coexists with `trashedAt`; handlers registered but not wired — inconsistent user experience |
| **Impact** | High — certification trash must-pass fails; V-Link lifecycle blocked (Stage 2) |
| **Probability** | Medium |
| **Affected COs** | CO-04 |
| **Affected domains** | Scheduling, HR |
| **Mitigation strategy** | WP-04.1 unified contract; WP-04.6 ARCHIVED enum decision; exhaustive entity inventory; WP-04.5 trash activity events |
| **Verification method** | Entity inventory review — no user-facing hard delete in target spec; handler registration complete per entity |

---

### R-09 — Sequence violation (Track 3 before Track 2)

| Field | Detail |
|-------|--------|
| **Risk description** | Implementation team begins notification or trash work before activity taxonomy complete — emitters placed without success-only contract |
| **Impact** | High — constitutional contract violated from inception |
| **Probability** | Low (with gates) |
| **Affected COs** | CO-01, CO-02, CO-04 |
| **Affected domains** | All BO |
| **Mitigation strategy** | [STAGE_1_IMPLEMENTATION_SEQUENCE.md](./STAGE_1_IMPLEMENTATION_SEQUENCE.md) blocking rules; Track 2 exit gate before Track 3 |
| **Verification method** | Track 4 checklist item — CO-01 exit confirmed before CO-02/04 implementation evidence |

---

### R-10 — Schema migration scope expansion

| Field | Detail |
|-------|--------|
| **Risk description** | CO-04 `trashedAt` migration expands to unrelated models or triggers broad data migration beyond Stage 1 scope |
| **Impact** | Medium — delays Stage 1; increases regression surface |
| **Probability** | Medium |
| **Affected COs** | CO-04 |
| **Affected domains** | Scheduling, HR |
| **Mitigation strategy** | WP-04.2/03 entity inventory limits scope; schema migration notes separate from Stage 1 planning; implementation program scopes migration per entity |
| **Verification method** | Migration scope review — only inventoried entities; no Stage 2+ models included |

---

### R-11 — Seed vs runtime manifest drift

| Field | Detail |
|-------|--------|
| **Risk description** | `builtInModuleManifests.ts`, `registerBuiltInModules.ts`, and seed scripts diverge — notifications discovered in one path but not another |
| **Impact** | Medium — Notification Center metadata incomplete |
| **Probability** | Medium |
| **Affected COs** | CO-02 |
| **Affected domains** | Scheduling, HR |
| **Mitigation strategy** | WP-02.2/03 explicit sync requirement across all three artifacts; WP-02.7 verification |
| **Verification method** | Manifest parity check — same types in seed, register, and taxonomy doc |

---

### R-12 — COL-2 attendance stub conflated with bridge

| Field | Detail |
|-------|--------|
| **Risk description** | CO-07 bridge work accidentally includes moving attendance stub creation from scheduling controller — expanding scope |
| **Impact** | Medium — scope creep; delays contract doc |
| **Probability** | Low |
| **Affected COs** | CO-07 |
| **Affected domains** | Scheduling, HR |
| **Mitigation strategy** | WP-07.6 documents COL-2 as Stage 2 item; CO-07 scope excludes attendance stub move |
| **Verification method** | CO-07 deliverable review — no attendance stub implementation in Stage 1 scope |

---

## Risk review schedule

| When | Action |
|------|--------|
| Track 1 start | Review R-01, R-06 |
| Track 2 start | Review R-07 |
| Track 3 start | Review R-02, R-03, R-04, R-05, R-08, R-10, R-11 |
| Track 4 verification | Full register review — open risks carry to Stage 2 or close |
| Track 5 handoff | Carry-forward list attached to Stage 2 readiness package |

---

## Certification statement

**No certification awarded.** Risk register is planning documentation only.
