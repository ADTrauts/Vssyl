# Workforce Communications Implementation Gate

**Program:** Business Operations Certification Finalization  
**Module:** Workforce Communications (`workforce_comms`)  
**Date:** 2026-06-14  
**Authority:** [WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md](./WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md), [WORKFORCE_COMMUNICATIONS_ESTABLISHMENT_REQUIREMENTS.md](./WORKFORCE_COMMUNICATIONS_ESTABLISHMENT_REQUIREMENTS.md)

**This gate governs implementation start only. No code in this document.**

---

## 1. Gate question

**Is Business Operations ready to establish Workforce Communications?**

# **Yes — conditional on governance ratification (Path C)**

---

## 2. Gate status

| Prerequisite | Status | Blocks WC? |
|--------------|--------|------------|
| BO Stage 1–2 constitutional alignment | **Complete** | No |
| FALSE POSITIVE governance adopted | **Complete** (Phase 0C) | No |
| WC engineering blueprint (11 docs) | **Complete** | No |
| HR certification ratified | **Pending** | **Yes — governance** |
| Scheduling certification ratified | **Pending** | **Yes — governance** |
| CERTIFICATION_LEDGER updated | **Pending** | **Yes — governance** |
| HR major findings closed | **Open** | **No** (Phase A–F) |
| Scheduling major findings closed | **Open** | **No** (Phase A–F) |
| Identity P1 (G02) stable | **Partial** | **Yes — Phase B+** (audience resolver) |
| WC operation matrix | **Not started** | **No** (Phase G) |

---

## 3. Implementation gate tiers

### Tier 0 — Governance gate (must pass before any WC code)

| # | Requirement | Owner |
|---|-------------|-------|
| G0-1 | Council ratifies HR L3 WITH FINDINGS | Architecture council |
| G0-2 | Council ratifies Scheduling L3 WITH FINDINGS | Architecture council |
| G0-3 | CERTIFICATION_LEDGER rows added | Platform Engineering |
| G0-4 | Findings closure plans accepted (90-day) | BO Program Steward |
| G0-5 | Type `ACT` or formal implementation charter | Product / Engineering lead |

**Gate outcome:** WC Phase A authorized

---

### Tier 1 — Phase A gate (data model)

**Authorized after Tier 0.**

| Requirement | Dependency |
|-------------|------------|
| Prisma `workforce_comms` module | None |
| 8 entities per data model doc | None |
| Migration plan | None |

**Not required:** HR/Scheduling findings closure

---

### Tier 2 — Phase B gate (core services)

| Requirement | Dependency |
|-------------|------------|
| Audience resolver design | Identity architecture (G02) — document known limitations |
| `workforceAudienceService` | `EmployeePosition`, `Department` tables exist |
| No parallel identity writes | Org Chart owns EP |

**HR/Scheduling findings:** Not blocking

---

### Tier 3 — Phase C–F gates (routes, activity, UI)

| Requirement | Copy-from module |
|-------------|------------------|
| Policy Engine actions | Chat, HR PE patterns |
| Activity emitters | HR, Scheduling activity services |
| Notifications `workforce_*` | HR notification metadata |
| Global Trash | HR scoped trash pattern |
| V-Link | HR 4-entity pattern |
| Workspace hub | Scheduling/HR landing pattern |

**HR/Scheduling findings:** Not blocking — certified platform patterns exist in codebase today

---

### Tier 4 — Phase G gate (bridges + matrix)

| Requirement | Dependency |
|-------------|------------|
| `WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md` | WC own deliverable |
| Scheduling publish event hooks | Scheduling domain events (F-SCH-003 **closed**) |
| HR lifecycle hooks | HR activity service |
| Reporting | WC services stable |

**Recommended before Phase G:** Scheduling F-SCH-007 closed (claim-shift events) — low risk if deferred

---

## 4. Path analysis

| Path | Description | Verdict |
|------|-------------|---------|
| **A** | Begin WC now without ratification | **Reject** — ledger gap; weak governance |
| **B** | Close all findings first, then WC | **Reject** — unnecessary delay; findings don't block Phase A |
| **C** | Ratify + WC parallel + findings parallel | **Accept** |

---

## 5. Recommended implementation sequence (Path C)

```
Week 0:  Council ratification + ledger PR + findings tickets
Week 1+: WC Phase A (data model) — parallel with F-HR / F-SCH hygiene
Week 3+: WC Phase B (services) — monitor identity G02 for audience edge cases
Week 5+: WC Phases C–F — copy HR/Scheduling/Chat patterns
Week 12+: WC Phase G — bridges + operation matrix
         HR/Scheduling major findings target closure (90-day)
```

---

## 6. Explicit prohibitions at gate open

| Prohibited | Reason |
|------------|--------|
| Reopen Chat/WC boundary | Constitutional freeze GD-BO-008 |
| Reopen Model C audience | Constitutional freeze |
| Redesign HR or Scheduling | Out of scope |
| WC certification evaluation | After implementation + test evidence |
| Declare WC certified in ledger | Premature |

---

## 7. Gate exit criteria (implementation program authorized)

- [ ] GD-BO-001..007 ratified
- [ ] Ledger rows merged
- [ ] Implementation charter references blueprint + file target matrix
- [ ] Findings tickets F-HR-001..003, F-SCH-004..007 created

**Upon exit:** Engineering may begin WC Phase A per [WORKFORCE_COMMUNICATIONS_EXECUTION_ROADMAP.md](./WORKFORCE_COMMUNICATIONS_EXECUTION_ROADMAP.md)

---

## 8. Risk register

| Risk | Mitigation |
|------|------------|
| WC copies fat AI context pattern | Blueprint mandates service layer from day one |
| Identity G02 corrupts audience | Phase B tests with fixture EP data; document CSV bypass |
| Findings slip past 90 days | Quarterly BO governance review |
| Phase G before Scheduling events stable | F-SCH-003 closed; F-SCH-007 track separately |

---

## Related

- [WORKFORCE_COMMUNICATIONS_EXECUTIVE_SUMMARY.md](./WORKFORCE_COMMUNICATIONS_EXECUTIVE_SUMMARY.md)
- [BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md](./BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md)
