# PK-W3-DE-1 Test Report

**Program:** Platform Kernel Wave 3 — Domain Events Package 1  
**Date:** 2026-06-23  
**Status:** Tests executed

---

## Test suites run

```bash
pnpm exec vitest run \
  src/events/__tests__/domainEventOperationMatrix.test.ts \
  src/events/__tests__/registerDomainEventSubscribers.test.ts \
  src/events/__tests__/domainEventBus.test.ts
```

---

## Results

| Suite | Tests | Status |
|-------|------:|--------|
| `domainEventOperationMatrix.test.ts` | 6 | **Pass** |
| `registerDomainEventSubscribers.test.ts` | 4 | **Pass** |
| `domainEventBus.test.ts` | 4 | **Pass** |
| **Total** | **14** | **14 passed, 0 failed** |

---

## Coverage by area

| Area | Tests |
|------|-------|
| Matrix validation | Default valid; integrity checks |
| Production subscriber count | 7 active by default |
| Stub exclusion | search + workflow stubs not invoked |
| Stub opt-in | search stub invokes when env enabled |
| Registration | Production handlers called; stubs skipped |
| Regression | `emitDomainEvent` bus + activity log subscriber |

---

## TypeScript validation

```bash
pnpm type-check
```

**Result:** **Pass**

---

## Not run (out of scope)

- Full server test suite
- E2E startup integration
- Load tests on subscriber chain

---

**Last updated:** 2026-06-23
