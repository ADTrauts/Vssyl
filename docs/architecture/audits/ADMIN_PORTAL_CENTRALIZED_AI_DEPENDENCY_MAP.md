# Admin Portal — Centralized AI Dependency Map

**Package:** 0D-B — Legacy AI Retirement Preparation  
**Finding:** AP-F-008 (primary); supports AP-F-029, AP-F-030  
**Date:** 2026-06-17  
**Authoritative planning:** `ADMIN_PORTAL_AI_ADMIN_*` blueprint set (Stage 0D)

---

## 1. Executive summary

| Metric | Value |
|--------|-------|
| `/api/centralized-ai` handlers | **97** (`ai-centralized.ts`, ~3,491 LOC) |
| Active HTTP consumers (pre-0D-B) | **1** — `ai-learning/page.tsx` |
| Active HTTP consumers (post-0D-B) | **0** — page redirected; helpers removed |
| Fence coverage (post-0D-B) | **97/97** routes return 410 via `centralizedAiFence.ts` |
| `adminApiService` centralized helpers | **4 removed** (proven single-consumer) |

**Retirement recommendation:** All centralized-ai routes are **LEGACY** or **UNUSED** from an operator perspective. Handlers remain mounted for migration reference; middleware returns 410 before business logic. Full mount removal deferred to **0D-G**.

---

## 2. Server surface

| Item | Path | Classification | Consumer | Recommendation |
|------|------|----------------|----------|----------------|
| Router mount | `server/src/index.ts` L911 | LEGACY | Admin-only JWT + `requireAdmin` | Retain mount until 0D-G; shrink handler file |
| Router body | `server/src/routes/ai-centralized.ts` | LEGACY | None (all fenced) | Delete in 0D-G after allowlist validation |
| Retirement fence | `server/src/middleware/centralizedAiFence.ts` | ACTIVE | All centralized-ai requests | Expand as needed; canonical pattern for 410 |
| Learning engine import | `CentralizedLearningEngine` in early routes | LEGACY | Was ai-learning only | Fenced; user path is `/api/ai/learning/*` |
| Twin canonical | `server/src/routes/ai.ts` POST `/twin` | ACTIVE | Production AI | **Not** centralized-ai |

---

## 3. Web consumers (HTTP)

### 3.1 Former active consumer — RETIRED in 0D-B

| Consumer | Methods / paths | Classification (pre) | Post-0D-B |
|----------|-----------------|----------------------|-----------|
| `web/src/app/admin-portal/ai-learning/page.tsx` | `GET /health`, `/patterns`, `/insights`, `/privacy/settings`; `POST /patterns/analyze`; `GET /consent/stats`, `/scheduler/*`, `/analytics/*` | ACTIVE (stub UI) | **REDIRECT** → `/admin-portal/ai-pipeline` |

### 3.2 adminApiService helpers — REMOVED

| Method | Path | Classification | Post-0D-B |
|--------|------|----------------|-----------|
| `getCentralizedAIHealth` | `/api/centralized-ai/health` | LEGACY | **REMOVED** — zero refs |
| `getCentralizedAIPatterns` | `/api/centralized-ai/patterns` | LEGACY | **REMOVED** |
| `getCentralizedAIInsights` | `/api/centralized-ai/insights` | LEGACY | **REMOVED** |
| `getCentralizedAIPrivacySettings` | `/api/centralized-ai/privacy/settings` | LEGACY | **REMOVED** |

### 3.3 Related — NOT centralized-ai HTTP consumers

| Item | Path | Classification | Notes |
|------|------|----------------|-------|
| AI System hub | `ai-system/page.tsx` | ACTIVE | BI / business-ai APIs only; `aiLearning` metrics hardcoded; launcher updated to AI Pipeline |
| Business AI enable flag | `adminBusinessAI.ts` `enable/disable-centralized-learning` | ACTIVE | Prisma flag only — not HTTP to centralized-ai |
| AI Pipeline pages | `ai-pipeline/**` | ACTIVE | Canonical control plane — **preserve** |
| Provider governance | `ai-provider-usage.ts`, provider pages | ACTIVE | **Preserve** |
| Layout nav | `layout.tsx` | ACTIVE | Lists `ai-pipeline`; never listed `ai-learning` |

---

## 4. Navigation references

| Reference | Location | Classification | Post-0D-B |
|-----------|----------|----------------|-----------|
| AI Pipeline nav item | `layout.tsx` L120 | ACTIVE | Unchanged |
| AI Learning launcher card | `ai-system/page.tsx` | LEGACY | **Updated** → AI Pipeline path |
| Quick link "Manage AI Learning" | `ai-system/page.tsx` L1246 | LEGACY | **Updated** → AI Pipeline |
| Middleware redirect | `middleware.ts` | ACTIVE | **Added** `/admin-portal/ai-learning` → `ai-pipeline` |
| Source label `ai-learning` in charts | `ai-system/page.tsx` types/badges | ACTIVE | Display taxonomy only — not a route consumer |

---

## 5. Tests

| Test file | Classification | Post-0D-B |
|-----------|----------------|-----------|
| `server/src/routes/__tests__/aiCentralizedAdminFence.test.ts` | ACTIVE | Expanded — 410 samples + 97/97 coverage assertion |
| `web/src/lib/__tests__/adminPortalCentralizedAiRetirement.test.ts` | ACTIVE | **Created** — no client reintroduction |
| `admin-portal-auth-consolidation.test.ts` | ACTIVE | Mount + requireAdmin unchanged |

---

## 6. Route domain classification (97 handlers)

| Domain prefix | Handlers | Pre-0D-B class | Mock/stub | Post-0D-B fence |
|---------------|----------|----------------|-----------|---------------|
| `/learning/event` | 1 | LEGACY | Partial real | 410 (wave-1d) |
| `/patterns`, `/insights`, `/health`, `/privacy` | 6 | LEGACY | Partial real | 410 (0d-b-learning) |
| `/analytics/*` | 18 | LEGACY | Mock | 410 (0d-b-learning) |
| `/audit`, `/consent`, `/scheduler` | 5 | LEGACY | Scaffold | 410 (0d-b-learning) |
| `/performance` | 2 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/security` | 11 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/ab-testing` | 4 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/notifications` | 4 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/sso` | 4 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/models` | 5 | LEGACY | Mock | 410 (wave-1d) |
| `/automl` | 5 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/workflows` | 5 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/decision-support` | 2 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/predictive-maintenance` | 2 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/continuous-learning` | 2 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/predictive` | 12 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/business` | 5 | UNUSED | Mock | 410 (0d-b-scaffold) |
| `/ai-insights` | 6 | UNUSED | Mock | 410 (0d-b-scaffold) |

**UNKNOWN:** None after full-repo grep (2026-06-17).

---

## 7. Import graph (non-HTTP)

| Import | From | To | Classification |
|--------|------|-----|----------------|
| `aiCentralizedRouter` | `index.ts` | `ai-centralized.ts` | LEGACY mount |
| `centralizedAiDeprecatedMiddleware` | `index.ts` | `centralizedAiFence.ts` | ACTIVE |
| `CentralizedLearningEngine` | `ai-centralized.ts` | learning service | LEGACY — unreachable after fence |

---

## 8. Replacement map

| Retired surface | Canonical replacement |
|-----------------|----------------------|
| `/admin-portal/ai-learning` | `/admin-portal/ai-pipeline` |
| User learning ingestion | `POST /api/ai/learning/*` |
| Model catalog | `GET /api/ai/models` |
| Twin inference | `POST /api/ai/twin` |
| Mock analytics dashboards | `/admin-portal/analytics` (0C) |
| Mock business metrics | `/admin-portal/business-ai` |
| Mock security/compliance | `/admin-portal/security`, pipeline compliance |
| A/B scaffold | `/admin-portal/ai-pipeline/test-lab` |

---

## 9. Risk register (dependency-specific)

| Risk | Likelihood | Impact | Mitigation (0D-B) |
|------|------------|--------|-----------------|
| Hidden external caller of centralized-ai | Low | High | Staged 410 with `replacement` + Deprecation header; monitor logs in 0D-C |
| Operator expects ai-learning page | Medium | Low | Redirect + ai-system launcher update |
| Fence pattern gap | Low | Medium | Test asserts 97/97 handler coverage |

---

**Next package:** 0D-C (caller monitoring) / 0D-G (handler deletion + mount removal) per `ADMIN_PORTAL_AI_ADMIN_IMPLEMENTATION_SEQUENCE.md`.
