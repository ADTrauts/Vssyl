# Business Operations Findings Review (BO-2)

**Program:** Business Operations BO-2 — Certification Evaluation  
**Date:** 2026-06-19  
**Authority:** [BUSINESS_OPERATIONS_FINDINGS_REGISTER.md](./BUSINESS_OPERATIONS_FINDINGS_REGISTER.md)  
**Constraint:** Evaluation only — no ledger update, no award

---

## Summary classification

| Severity | Open | Closed (program) | Blocks L3 WITH FINDINGS? | Blocks plain L3? |
|----------|------|------------------|---------------------------|------------------|
| **Blocking** | **0** | All pre-closed | No | No |
| **Major** | **0** | **10** (BO-1A) | No | No |
| **Advisory** | **17** | **5** (incl. BO-1B D05, BO-1A WC-009) | No | **Yes** (domain plain L3) |

**Evaluation verdict:** No open finding prevents **LEVEL 3 CERTIFIED WITH FINDINGS**. Open advisories prevent **plain LEVEL 3** at domain scope without a formal waiver and remediation plan.

---

## Closed findings (BO program)

### Domain (4 closed)

| ID | Closed in |
|----|-----------|
| BO-F-D01 | BO-1A — operation matrices in audits path |
| BO-F-D02 | BO-1A — HR↔WC bridge |
| BO-F-D03 | BO-1A — scheduling AI manifest alignment |
| BO-F-D05 | BO-1B — UX shell standard |

### Scheduling (7 closed)

F-SCH-001..003 (prior remediation) · F-SCH-004..007 (BO-1A)

### HR (3 closed)

F-HR-001..003 (BO-1A)

### Workforce Communications (1 closed)

F-WC-009 (BO-1A) · F-WC-001..005 (Phase G)

---

## Open advisory findings (17)

### Domain (3)

| ID | Finding | Certification impact |
|----|---------|---------------------|
| BO-F-D04 | `hrScheduleService` cross-package ownership | Track on certificate; document as shared integration service |
| BO-F-D06 | Workforce identity docs scattered | G7 hygiene; 90-day doc consolidation |
| BO-F-D07 | Analytics domain unowned (501 trio) | G8 hygiene; explicit deferral to Stage 4 |

### Scheduling (5)

| ID | Finding | Certification impact |
|----|---------|---------------------|
| F-SCH-008 | Dashboard controller Prisma (3 reads) | G3 hygiene |
| F-SCH-009 | Analytics 501 stubs | G8 hygiene — not exposed as live product claims |
| F-SCH-010 | Search not enabled | Enhancement |
| F-SCH-011 | No module audit trail | G2 hygiene |
| F-SCH-012 | Doc filename drift | G7 hygiene |

### HR (6)

| ID | Finding | Certification impact |
|----|---------|---------------------|
| F-HR-004 | No consolidated `web/src/api/hr.ts` | Client hygiene |
| F-HR-005 | Main controller 2,242 LOC | Maintainability |
| F-HR-006 | Unused `hrControllerUtils` | Dead code |
| F-HR-007 | No `hr.*` domain event taxonomy | G2 enhancement |
| F-HR-008 | Partial audit trail | G2 hygiene |
| F-HR-009 | Enterprise settings stubs | G8 — stubs labeled; tier-gated |

### Workforce Communications (3)

| ID | Finding | Certification impact |
|----|---------|---------------------|
| F-WC-006 | Server notification grouping for `workforce_*` | Parity hygiene |
| F-WC-007 | Attachment activity taxonomy not emitted | Activity hygiene |
| F-WC-008 | Ack reminder job not implemented | Manifest `planned: true` — acceptable |

---

## Prevent certification?

| Question | Answer |
|----------|--------|
| Any blocking finding prevent L3 WITH FINDINGS? | **No** |
| Any major finding prevent L3 WITH FINDINGS? | **No** |
| Any advisory prevent L3 WITH FINDINGS? | **No** — track on certificate with 90-day plan |
| Any finding prevent plain L3 (domain)? | **Yes** — cumulative advisories + partial G1/G6/G8 |

---

## Recommended certificate finding schedule

Accept all **17 advisories** on domain certificate with grouped remediation themes:

1. **Integration documentation** (BO-F-D04, BO-F-D06) — 90 days  
2. **Analytics deferral register** (BO-F-D07, F-SCH-009) — document only until Stage 4  
3. **HR client + controller hygiene** (F-HR-004..006) — 90 days  
4. **Audit/event parity** (F-SCH-011, F-HR-007, F-HR-008, F-WC-007) — 90 days  
5. **WC notification parity** (F-WC-006, F-WC-008) — 90 days  
6. **Scheduling PE expansion + dashboard** (F-SCH-008, team/employee PE advisory) — 90 days optional
