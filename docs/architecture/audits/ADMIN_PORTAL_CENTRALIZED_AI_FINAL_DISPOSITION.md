# Admin Portal — Centralized AI Final Disposition

**Package:** 0D-G — AI Administration Readiness Review & Legacy Retirement Closure  
**Finding:** AP-F-008  
**Date:** 2026-06-17  
**Mount:** `/api/centralized-ai` (retired)

---

## Executive summary

Centralized AI retirement is **complete for Stage 0D**. The legacy **97-handler** router file is **deleted**. The mount remains as an **admin-gated 410 stub** so bookmarks and stale integrations receive explicit retirement responses instead of 404s.

**Verdict:** Safe to remove handler body — **done**. Mount retained as compatibility stub — **intentional**.

---

## Consumer review (2026-06-17)

| Consumer class | Count | Status |
|----------------|-------|--------|
| Admin portal pages fetching `/api/centralized-ai` | **0** | ai-learning redirected (0D-B) |
| `adminApiService` centralized helpers | **0** | Removed (0D-B) |
| Server production callers (non-test) | **0** | Repo grep — mount + fence only |
| Stale documentation references | Several | Advisory — not runtime blockers |

**No active consumers remain.**

---

## Handler reachability

| Phase | State |
|-------|-------|
| 0D-B | 97/97 routes returned 410 via `centralizedAiDeprecatedMiddleware` before router |
| **0D-G** | Router deleted; middleware **always** returns 410 (catch-all for unknown paths) |

**Handlers still reachable with live business logic:** **0**

---

## Mount disposition

| Artifact | 0D-G action | Rationale |
|----------|-------------|-----------|
| `server/src/routes/ai-centralized.ts` (3,491 LOC) | **DELETED** | All routes fenced; zero consumers |
| `centralizedAiDeprecatedMiddleware` | **RETAINED** | Per-route successor hints + catch-all 410 |
| `/api/centralized-ai` mount in `index.ts` | **RETAINED (stub)** | Compatibility 410 for admin JWT callers |
| `ai-learning/page.tsx` | **REDIRECT stub** | → `/admin-portal/ai-pipeline` |

### Why mount was not fully removed

Removing the mount would return **404** to any stale admin integration. The stub mount:

- Requires `authenticateJWT` + `requireAdmin` (Wave 1D gate preserved)
- Returns **410 Gone** with `Deprecation` + `Link` successor headers
- Adds **no** business logic surface

Full mount removal is optional in **1B** after traffic monitoring confirms zero hits.

---

## Replacement map (operator)

| Former centralized-ai domain | Canonical successor |
|------------------------------|---------------------|
| Learning health / patterns / insights | `/admin-portal/ai-pipeline` + `/api/ai/learning/*` (user twin path) |
| Privacy / consent admin | `/admin-portal/ai-pipeline/compliance` |
| Model catalog | `GET /api/ai/models` |
| Business metrics mock | `/admin-portal/business-ai` |
| A/B testing mock | `/admin-portal/ai-pipeline/test-lab` |
| Analytics mock scaffold | `/admin-portal/analytics` (0C satellite) |

Full per-route mapping: [ADMIN_PORTAL_CENTRALIZED_AI_RETIREMENT_REGISTER.md](./ADMIN_PORTAL_CENTRALIZED_AI_RETIREMENT_REGISTER.md)

---

## Blockers assessment

| Potential blocker | Finding |
|-------------------|---------|
| Hidden production caller | **None found** in `web/` + `server/` TypeScript |
| Twin path bypass | **None** — `POST /api/ai/twin` on `ai.ts`, not centralized-ai |
| Admin operator dependency | **None** — UI redirected since 0D-B |

**No blockers prevent 0D-G retirement completion.**

---

## Test evidence

| File | Cases | Result |
|------|-------|--------|
| `aiCentralizedAdminFence.test.ts` | 28+ | Router deletion, catch-all 410, sample clusters |
| `adminPortalCentralizedAiRetirement.test.ts` | 7 | No web consumers; index without router |

---

## AP-F-008 contribution

| Criterion | Status |
|-----------|--------|
| centralized-ai retired | **Yes** — handler file deleted; mount 410-only |
| ai-learning retired | **Yes** — redirect |
| AI Pipeline canonical | **Yes** |
| Ownership documented | **Yes** |
| Duplicate UX removed | **Yes** (0D-F) |

**Recommended verdict:** **CLOSED**

---

## References

- [ADMIN_PORTAL_CENTRALIZED_AI_DEPENDENCY_MAP.md](./ADMIN_PORTAL_CENTRALIZED_AI_DEPENDENCY_MAP.md)
- [ADMIN_PORTAL_CENTRALIZED_AI_RETIREMENT_REGISTER.md](./ADMIN_PORTAL_CENTRALIZED_AI_RETIREMENT_REGISTER.md)
- [ADMIN_PORTAL_AI_LEARNING_DISPOSITION.md](./ADMIN_PORTAL_AI_LEARNING_DISPOSITION.md)
