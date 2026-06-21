# Business Operations Findings Register

**Program:** Business Operations Phase 0B — Domain Reality Assessment  
**Register date:** 2026-06-18  
**Authority:** Consolidates module findings registers; does not supersede module-level IDs  
**Parent:** [BUSINESS_OPERATIONS_REALITY_ASSESSMENT.md](./BUSINESS_OPERATIONS_REALITY_ASSESSMENT.md)

**Source registers:**

- [SCHEDULING_POST_REMEDIATION_FINDINGS.md](./SCHEDULING_POST_REMEDIATION_FINDINGS.md)
- [HR_FINDINGS_REGISTER.md](./HR_FINDINGS_REGISTER.md)
- [WORKFORCE_COMMUNICATIONS_POST_G_FINDINGS_REGISTER.md](./WORKFORCE_COMMUNICATIONS_POST_G_FINDINGS_REGISTER.md)

---

## Summary

| Severity | Scheduling | HR | Workforce Comms | Domain (new) | Total open |
|----------|------------|-----|-----------------|--------------|------------|
| **Blocking** | 0 | 0 | 0 | 0 | **0** |
| **Major** | 0 | 0 | 0 | 0 | **0** |
| **Advisory** | 5 | 6 | 3 | 3 | **17** |
| **Closed (module remediation + BO-1A + BO-1B)** | 7 | 3 | 1 | 4 | **15** |

**Domain certification posture:** **LEVEL 3 CERTIFIED WITH FINDINGS** — executed BO-4 (2026-06-19). G1–G9 24/27 (~89%). 17 advisories on 90-day plan. Program **ARCHIVED**.

---

## Severity definitions

| Severity | Definition |
|----------|------------|
| **Blocking** | Prevents Level 3 — constitutional violation, manifest lie, or production safety P0 |
| **Major** | Gate partial failure on primary surface; tracked on certificate; blocks domain reference |
| **Advisory** | Hygiene, deferred features, or documentation placement — does not block L3 WITH FINDINGS |
| **Domain** | Cross-module integration or governance gap not owned by a single module register |

---

## Domain findings (new — Phase 0B)

| ID | Severity | Finding | Evidence | Gate | Remediation |
|----|----------|---------|----------|------|-------------|
| **BO-F-D01** | Major | **No domain-level operation matrix in `docs/architecture/audits/`** | Published trio + annex (BO-1A) | G7 | **Closed BO-1A** |
| **BO-F-D02** | Major | **HR↔WC broadcast bridge unwired** | `hrWorkforceBridgeIntegrationService` + admin routes | G4, G5 | **Closed BO-1A** |
| **BO-F-D03** | Major | **Scheduling AI write surface truthfulness gap** | 8/8 manifest actions in `ActionExecutor` | G8 | **Closed BO-1A** |
| **BO-F-D04** | Advisory | **`hrScheduleService` ownership ambiguity** — service lives in HR package but serves scheduling+calendar bridge | `hrScheduleService.ts`; boundary doc Shared row | G5 | Document bridge as Shared Platform Integration Service with dual-module consumers |
| **BO-F-D05** | Advisory | **No domain-level UX shell standard** | `BusinessOperationsEmptyState`, ConfirmModal/useConfirm bar, token migration (BO-1B) | G9 | **Closed BO-1B** |
| **BO-F-D06** | Advisory | **Workforce identity scattered across docs** — `WORKFORCE_IDENTITY_ARCHITECTURE.md` + boundary doc + HR org analysis | Multiple ownership docs | G7 | Single domain ownership model doc (this program's ownership model) as executive authority |
| **BO-F-D07** | Advisory | **Analytics domain unowned** — scheduling 501 trio; HR analytics separate; no BO analytics module | `schedulingAdminController` L751–759 | G8 | Stage 4 Analytics gate — explicit OUT OF SCOPE for BO-1A |

---

## Scheduling findings (inherited — open)

| ID | Severity | Finding | Status | Blocks domain ref? |
|----|----------|---------|--------|---------------------|
| F-SCH-004 | Major | AI context controller direct Prisma (16 reads) | **Closed BO-1A** | — |
| F-SCH-005 | Major | Partial PE on auxiliary routes | **Closed BO-1A** | — |
| F-SCH-006 | Major | Operation matrix not in `docs/architecture/audits/` | **Closed BO-1A** | — |
| F-SCH-007 | Major | Open-shift claim missing activity + domain events | **Closed BO-1A** | — |
| F-SCH-008 | Advisory | Dashboard controller 3 Prisma reads | Open | No |
| F-SCH-009 | Advisory | Analytics 501 trio | Open | No |
| F-SCH-010 | Advisory | Search not enabled | Open | No |
| F-SCH-011 | Advisory | No module audit trail | Open | No |
| F-SCH-012 | Advisory | CO-08 doc filename drift | Open | No |

**Closed:** F-SCH-001 (AdminTools extraction), F-SCH-002 (manifest realtime), F-SCH-003 (domain events), F-SCH-004..007 (BO-1A).

---

## HR findings (inherited — open)

| ID | Severity | Finding | Status | Blocks domain ref? |
|----|----------|---------|--------|---------------------|
| F-HR-001 | Major | ~58% HR routes lack `checkHRPolicy` | **Closed BO-1A** (~98%) | — |
| F-HR-002 | Major | Operation matrix not in audits path | **Closed BO-1A** | — |
| F-HR-003 | Major | AI context controller direct Prisma (15 reads) | **Closed BO-1A** | — |
| F-HR-004 | Advisory | No consolidated `web/src/api/hr.ts` | Open | No |
| F-HR-005 | Advisory | Main controller 2,242 LOC | Open | No |
| F-HR-006 | Advisory | `hrControllerUtils` unused | Open | No |
| F-HR-007 | Advisory | No `hr.*` domain event taxonomy | Open | No |
| F-HR-008 | Advisory | Partial audit trail | Open | No |
| F-HR-009 | Advisory | Settings framework stubs | Open | No |

---

## Workforce Communications findings (inherited — open)

| ID | Severity | Finding | Status | Blocks domain ref? |
|----|----------|---------|--------|---------------------|
| F-WC-006 | Advisory | Server `notificationGroupingService` lacks `workforce_*` mapping | Open | No |
| F-WC-007 | Advisory | `workforce_attachment_added` taxonomy not emitted | Open | No |
| F-WC-008 | Advisory | `workforce_ack_reminder` planned but no job | Open | No |
| F-WC-009 | Advisory | Operation matrix path not in audits/ | **Closed BO-1A** | — |

**Closed (Phase G):** F-WC-001..005.

---

## Major findings rollup (domain remediation priority)

| Priority | ID | Module | Theme |
|----------|-----|--------|-------|
| P0 | BO-F-D03 | Domain | AI manifest truthfulness |
| P1 | F-SCH-007 | Scheduling | Claim lifecycle completeness |
| P1 | F-SCH-004 | Scheduling | AI context service extraction |
| P1 | F-HR-003 | HR | AI context service extraction |
| P2 | F-SCH-005 | Scheduling | PE route completion |
| P2 | F-HR-001 | HR | PE read-route coverage |
| P2 | BO-F-D02 | Domain | HR↔WC bridge wiring |
| P3 | BO-F-D01 | Domain | Audit-path documentation |

---

## Finding disposition matrix

| Category | Blocks L3 module cert? | Blocks domain reference? | Required before BO-1A close? |
|----------|------------------------|--------------------------|------------------------------|
| Module blocking | No (all closed) | — | — |
| Module major | No (WITH FINDINGS) | **Yes** | Track in BO-1A |
| Domain major | — | **Yes** | **Yes** |
| Advisory | No | No | Optional hygiene |

---

## Required remediation sequence (planning)

1. **BO-F-D03** — AI manifest / executor alignment (production safety)
2. **F-SCH-007** — Claim path activity + domain events
3. **F-SCH-004 + F-HR-003** — AI context service extraction (parallel)
4. **F-SCH-005 + F-HR-001** — Policy Engine coverage expansion
5. **BO-F-D02** — HR↔WC integration contract execution
6. **BO-F-D01** — Documentation placement to audits path
7. **BO-F-D05** — UX shell alignment (ConfirmModal migration)

**No implementation in Phase 0B.** Sequence informs Package BO-1A charter.

---

## Related documents

- [BUSINESS_OPERATIONS_CERTIFICATION_FRAMEWORK.md](./BUSINESS_OPERATIONS_CERTIFICATION_FRAMEWORK.md)
- [BUSINESS_OPERATIONS_MODERNIZATION_ROADMAP.md](./BUSINESS_OPERATIONS_MODERNIZATION_ROADMAP.md)
