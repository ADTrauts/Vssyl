# Business Operations Domain — Operation Matrix Annex (BO-1A)

**Published:** 2026-06-19 (BO-1A)  
**Domain:** Platform Domain — Business Operations  
**Modules:** Scheduling · HR · Workforce Communications  
**Authority:** Domain integration contract publication per BO-F-D01 / F-HR-002 / F-SCH-006

---

## Module matrices (authoritative audit copies)

| Module | Audit path | Canonical working copy |
|--------|------------|------------------------|
| Scheduling | [SCHEDULING_OPERATION_MATRIX.md](./SCHEDULING_OPERATION_MATRIX.md) | [docs/business-operations/SCHEDULING_OPERATION_MATRIX.md](../../business-operations/SCHEDULING_OPERATION_MATRIX.md) |
| HR | [HR_OPERATION_MATRIX.md](./HR_OPERATION_MATRIX.md) | [docs/business-operations/HR_OPERATION_MATRIX.md](../../business-operations/HR_OPERATION_MATRIX.md) |
| Workforce Communications | [WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](./WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md) | [docs/business-operations/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](../../business-operations/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md) |

---

## Cross-module integration operations (BO-1A)

| Operation | Source | Target | Contract | Activity | Domain event | PE |
|-----------|--------|--------|----------|----------|--------------|-----|
| HR policy → WC broadcast | HR admin API | WC draft | `hrWorkforceBridgeIntegrationService` | HR settings activity (existing) | `workforce:bridge.policy_requested` (via bridge) | `hr:settings.write` |
| HR announcement → WC broadcast | HR admin API | WC draft | `hrWorkforceBridgeIntegrationService` | — | `workforce:bridge.announcement_requested` (via bridge) | `hr:settings.write` |
| HR onboarding → WC | HR onboarding service | WC (existing) | `workforceBridgeService.onHrOnboardingBroadcastRequested` | onboarding activity | bridge event | onboarding manage |
| Open shift claim | Scheduling employee API | Scheduling assignment | `schedulingShiftService.claimOpenShiftForEmployee` | `scheduling_open_shift_claimed` | `scheduling:shift.claim` | `scheduling:shift.claim` |

---

## Publication disposition

- **BO-F-D01:** Closed — trio published to `docs/architecture/audits/`
- **F-HR-002:** Closed — HR matrix in audits path
- **F-SCH-006 (matrix path):** Closed — scheduling matrix in audits path
- **F-WC-009:** Closed — WC matrix in audits path
