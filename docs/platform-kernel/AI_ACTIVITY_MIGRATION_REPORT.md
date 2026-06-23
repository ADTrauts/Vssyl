# AI Activity Migration Report

**Program:** Platform Kernel Wave 3 — Package 3 (ACT-R1 P1)  
**Date:** 2026-06-23  
**Status:** **Complete**

---

## 1. Scope

Migrate all inventoried AI activity **read** paths from legacy `prisma.activity` to `platformActivityQueryService`.

**Non-goals:** Prompt changes, provider changes, orchestration changes, new AI features.

---

## 2. Consumers migrated

| ID | Consumer | Operation | Before | After |
|----|----------|-----------|--------|-------|
| **C-04** | `CrossModuleContextEngine` | `getActivityContext` | `prisma.activity.findMany` (100 rows) | `getFeedForUser({ userId, limit: 100 })` |
| **C-05** | `DigitalLifeTwinService` | `getRecentActivity` | `prisma.activity.findMany` (50 rows) | `getFeedForUser({ userId, limit: 50 })` |
| **C-08** | `ai-context-debug.ts` | Admin user context slice | `prisma.activity.findMany` (20 rows) | `getFeedForUser({ userId, limit: 20 })` |

---

## 3. Mapping layer

**File:** `server/src/services/platform/platformActivityContextMapper.ts`

| Function | Purpose |
|----------|---------|
| `toAiContextActivityRow` | Maps `PlatformActivityRecord` → `ActivityData` shape for cross-module analysis (`module`, composite `action`/`type`, `timestamp`) |
| `toAiRecentActivityDebugRow` | Maps records → legacy debug select shape (`id`, `type`, `details`, `timestamp`) |

Composite type format: `{moduleId}_{action}` — preserves `analyzeModuleUsage` and `determineFocus` module extraction via `split('_')[0]`.

---

## 4. Behavior preservation

| Area | Notes |
|------|-------|
| Context assembly | No changes to `AIContextAssembler`, providers, or orchestration |
| Activity volume | Same limits (100 / 50 / 20) |
| Module usage analysis | Improved — normalized events carry real `moduleId` |
| Twin `recentActivity` | Still `unknown[]`; now normalized debug rows instead of legacy ORM entities |

---

## 5. Explicitly not migrated (documented)

| Item | Reason |
|------|--------|
| `PredictiveIntelligenceEngine` | Uses `aIConversationHistory` — not platform activity |
| `IntelligentRecommendationsEngine` | Same — misnamed `recentActivity` field |
| Commented `prisma.activity` in `ai.ts` | Already disabled |

---

## 6. Tests

| Suite | Coverage |
|-------|----------|
| `platformActivityContextMapper.test.ts` | Mapper unit tests |
| `CrossModuleContextEngine.activity.test.ts` | `getFeedForUser` delegation via `getUserContext` |
| `DigitalLifeTwinService.activity.test.ts` | Private `getRecentActivity` delegation |

---

**Last updated:** 2026-06-23
