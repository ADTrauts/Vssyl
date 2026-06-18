# Admin Portal — AI Learning Surface Disposition

**Package:** 0D-B — Legacy AI Retirement Preparation  
**Finding:** AP-F-008  
**Date:** 2026-06-17  
**Surface:** `/admin-portal/ai-learning`

---

## 1. Decision

| Field | Value |
|-------|-------|
| **Disposition** | **Redirect** to canonical AI Pipeline hub |
| **Canonical destination** | `/admin-portal/ai-pipeline` |
| **Rationale** | Page was a **stub/duplicate** of centralized-ai admin; no unique product capability |

---

## 2. Assessment

### 2.1 Pre-0D-B state

| Criterion | Finding |
|-----------|---------|
| **Live vs stub** | **Stub** — mixed real API calls with "Data coming soon" placeholders |
| **Duplicate** | **Yes** — duplicated centralized-ai mock admin not owned by AI Pipeline |
| **Unique value** | **None** — no operations unavailable via AI Pipeline + `/api/ai/learning/*` |
| **Nav presence** | Not in `layout.tsx` primary nav; reachable via AI System launcher only |
| **API dependency** | Sole admin-portal consumer of `/api/centralized-ai` (13 call sites) |

### 2.2 API calls retired with redirect

| Call | Purpose on page | Replacement |
|------|-----------------|-------------|
| `GET /health` | System health card | AI Pipeline diagnostics |
| `GET /patterns` | Pattern list | Pipeline / user learning APIs |
| `GET /insights` | Collective insights | Pipeline hub |
| `GET/PUT /privacy/settings` | Privacy admin | `/admin-portal/ai-pipeline/compliance` |
| `POST /patterns/analyze` | Trigger analysis | Platform jobs / pipeline ops |
| `GET /consent/stats` | Consent metrics | Pipeline compliance |
| `GET/POST /scheduler/*` | Scheduler triggers | Scaffold — retired |
| `GET /analytics/*` | Forecasts, impact, predictions | `/admin-portal/analytics` |

### 2.3 Why redirect (not delete route file)

- Preserves bookmark compatibility via **middleware + page redirect** (same pattern as `test-impersonation` → `impersonation-test`).
- Avoids 404 for operators with saved links.
- No feature redesign — immediate removal of false maturity signals.

---

## 3. Implementation (0D-B)

| Change | File |
|--------|------|
| Server component redirect | `web/src/app/admin-portal/ai-learning/page.tsx` |
| Edge redirect | `web/src/middleware.ts` — `/admin-portal/ai-learning` → `ai-pipeline` |
| Launcher card | `ai-system/page.tsx` — path/title updated |
| Quick action link | `ai-system/page.tsx` — AI Pipeline |
| Client helpers removed | `adminApiService.ts` — 4 `getCentralizedAI*` methods |

---

## 4. Preserved surfaces (explicitly not changed)

| Surface | Status |
|---------|--------|
| AI Pipeline (`/admin-portal/ai-pipeline`) | **Canonical** — unchanged |
| Provider Governance | **Preserved** |
| Business AI | **Preserved** |
| AI System diagnostics hub | **Preserved** — launcher only updated |
| User learning path `POST /api/ai/learning/*` | **Canonical** — not centralized-ai |

---

## 5. Functional regression check

| Check | Result |
|-------|--------|
| Operator can reach AI admin | Yes — via AI Pipeline |
| User learning ingestion | Unaffected — twin/learning APIs |
| AI Pipeline handlers | Unaffected — 45 handlers preserved |
| False "production ready" centralized UI | **Eliminated** |

---

## 6. Deferred (not 0D-B)

| Item | Package |
|------|---------|
| Delete `ai-learning/page.tsx` entirely | 0D-F / 0D-G |
| Real learning status dashboard on pipeline | 0D-F |
| `ai-context` redirect | 0D-F |

---

**Conclusion:** AI Learning admin page is **redundant**; redirect to AI Pipeline is the correct 0D-B disposition with zero user-facing capability loss.
