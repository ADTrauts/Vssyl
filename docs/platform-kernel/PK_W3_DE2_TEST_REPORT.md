# PK-W3-DE-2 Test Report

**Program:** Platform Kernel Wave 3 — Domain Events Package 2  
**Date:** 2026-06-23  
**Status:** Tests executed

---

## Test suites run

```bash
pnpm exec vitest run \
  src/events/__tests__/hrDomainEvents.test.ts \
  src/events/__tests__/domainEventOperationMatrix.test.ts \
  src/events/__tests__/registerDomainEventSubscribers.test.ts \
  src/events/__tests__/domainEventRegistry.test.ts \
  src/services/__tests__/hrDomainEventService.test.ts \
  src/services/__tests__/hrActivityService.test.ts \
  src/services/__tests__/businessOperationsActivity.contract.test.ts
```

---

## Results

| Suite | Tests | Status |
|-------|------:|--------|
| `hrDomainEvents.test.ts` | 2 | **Pass** |
| `domainEventOperationMatrix.test.ts` | 7 | **Pass** |
| `registerDomainEventSubscribers.test.ts` | 4 | **Pass** |
| `domainEventRegistry.test.ts` | 6 | **Pass** |
| `hrDomainEventService.test.ts` | 2 | **Pass** |
| `hrActivityService.test.ts` | 7 | **Pass** |
| `businessOperationsActivity.contract.test.ts` | 3 | **Pass** |
| **Total** | **31** | **31 passed, 0 failed** |

---

## Coverage by area

| Area | Tests |
|------|-------|
| HR emitter taxonomy | PII-safe metadata on `hr.employee.created`, `hr.pto.requested` |
| HR facade | Delegation to `domainEventEmitters` |
| HR dual emit | Activity + domain event from `hrActivityService` |
| Module participation | `validateCertifiedModuleParticipation()` including HR |
| Registry | Contract integrity with new HR types |
| Contract wiring | HR services → activity; activity → domain facade |

---

## TypeScript validation

```bash
pnpm type-check
```

**Result:** **Pass**

---

## Not run (out of scope)

- Full server test suite
- E2E HR workflow tests
- Integration tests for subscriber fan-out on HR events

---

**Last updated:** 2026-06-23
