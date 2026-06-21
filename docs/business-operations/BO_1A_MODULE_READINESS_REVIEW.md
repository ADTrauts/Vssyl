# BO-1A Module Readiness Review

**Program:** Business Operations — Council Checkpoint  
**Date:** 2026-06-19  
**Modules:** Scheduling · HR · Workforce Communications

---

## Summary matrix

| Module | Pre BO-1A posture | Post BO-1A posture | Open majors | Certification posture |
|--------|-------------------|--------------------|-------------|------------------------|
| **Scheduling** | L3 WITH FINDINGS; 4 majors | Majors **closed** | **0** | **L3 WITH FINDINGS candidate** |
| **HR** | L3 WITH FINDINGS; 3 majors | Majors **closed** | **0** | **L3 WITH FINDINGS candidate** (strongest constitutional) |
| **Workforce Communications** | L3 Certified (Phase G); 0 majors | Unchanged + matrix published | **0** | **L3 candidate** (3 advisory) |

---

## Scheduling (`scheduling`)

### Certification readiness: **~75%** — L3 WITH FINDINGS candidate

| Area | Status | Notes |
|------|--------|-------|
| Service architecture | **Strong** | Schedule/shift/manager/publish services; AI context extracted |
| Activity + domain events | **Strong** | Claim lifecycle closed (F-SCH-007) |
| Policy Engine | **Partial** | Finding-scoped routes closed; ~60% overall route PE |
| AI manifest | **Pass** | 8/8 actions (BO-F-D03) |
| Tests | **Partial** | Service tests solid; thin HTTP integration coverage |
| UX | **Fail bar** | 9+ native confirm/prompt — blocks UX-L1 |
| Documentation | **Pass** | Matrix in audits path |

### Major gaps (closed in BO-1A)

- F-SCH-004 AI context ownership ✓
- F-SCH-005 auxiliary PE ✓
- F-SCH-006 matrix publication ✓
- F-SCH-007 claim activity/events ✓

### Remaining gaps (advisory)

| ID | Theme |
|----|-------|
| F-SCH-008 | Dashboard controller Prisma (3 reads) |
| F-SCH-009 | Analytics 501 trio |
| F-SCH-010 | Search not enabled |
| F-SCH-011 | No module audit trail |
| F-SCH-012 | Doc filename drift |
| — | Team/employee route PE expansion (advisory) |
| — | Native dialog UX debt (G9 / BO-1B) |

### Architectural status

**Constitutional backend largely complete** for certification review. **UX shell is the primary remaining module-level blocker** for plain L3 promotion.

---

## HR (`hr`)

### Certification readiness: **~85%** — L3 WITH FINDINGS candidate (approaching plain L3)

| Area | Status | Notes |
|------|--------|-------|
| Service architecture | **Strong** | Main controller Prisma-free; AI context extracted |
| Activity + notifications | **Strong** | 14 activity emitters; 12 notification types |
| Policy Engine | **Strong** | ~98% route coverage (health exempt) |
| V-Link + trash | **Strong** | 4 entities; scoped employee_profile trash |
| Org-chart symmetry | **Strong** | Unique BO differentiator |
| Tests | **Strong** | ~80 cases across 21 files |
| Web API consolidation | **Partial** | F-HR-004 — no `web/src/api/hr.ts` |
| UX | **Partial** | No native dialogs; shell naming drift vs standard |

### Major gaps (closed in BO-1A)

- F-HR-001 PE coverage ✓
- F-HR-002 matrix publication ✓
- F-HR-003 AI context ownership ✓

### Remaining gaps (advisory)

| ID | Theme |
|----|-------|
| F-HR-004 | Consolidated web API client |
| F-HR-005 | Controller size (2,242 LOC) |
| F-HR-006 | Unused utils |
| F-HR-007 | No `hr.*` domain event taxonomy |
| F-HR-008 | Partial audit trail |
| F-HR-009 | Enterprise settings stubs |

### Architectural status

**Ready for module-level certification review** on server-side constitutional evidence. Advisory findings acceptable on **L3 WITH FINDINGS** certificate. Web consolidation (6B) and domain event taxonomy are hygiene, not review blockers.

---

## Workforce Communications (`workforce_comms`)

### Certification readiness: **~90%** — L3 candidate

| Area | Status | Notes |
|------|--------|-------|
| Full broadcast lifecycle | **Strong** | Compose, audience, publish, ack, reporting |
| Policy Engine | **Strong** | 32/32 routes gated |
| Activity + notifications | **Strong** | Phase G closure verified |
| AI | **Read-only OK** | Context providers; no write executor required |
| Tests | **Strong** | 15 service tests; certification closure tests |
| UX | **Medium** | ConfirmModal on key flows; not full EmptyState bar |
| Documentation | **Pass** | Matrix in audits path (F-WC-009 closed) |

### Major gaps

**None.**

### Remaining gaps (advisory)

| ID | Theme |
|----|-------|
| F-WC-006 | Server notification grouping for `workforce_*` |
| F-WC-007 | Attachment activity taxonomy not emitted |
| F-WC-008 | Ack reminder job not implemented (manifest `planned: true`) |

### Architectural status

**Strongest BO module.** Eligible for **L3** or **L3 WITH FINDINGS** review with minimal expected findings. HR bridge now wired (BO-1A) completes deferred integration note from Phase G register.

---

## Cross-module comparison

| Pattern | Best module |
|---------|-------------|
| Employee lifecycle | HR |
| Shift planning + publish | Scheduling |
| Workforce broadcast | Workforce Communications |
| Domain events (planning) | Scheduling |
| PE completeness | Workforce Communications |
| Test depth | HR + WC |
| UX reference bar | WC (partial) >> HR >> Scheduling |
