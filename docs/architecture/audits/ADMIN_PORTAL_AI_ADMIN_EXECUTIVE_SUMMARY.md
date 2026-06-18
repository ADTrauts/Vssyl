# Admin Portal AI Administration Executive Summary

**Program:** Admin Portal Modernization — Stage 0D Planning  
**Date:** 2026-06-17  
**Status:** Planning complete — **no implementation authorized**  
**Readiness baseline:** CONDITIONALLY READY (~74%)

**Artifact set:**

1. [Reality Assessment](./ADMIN_PORTAL_AI_ADMIN_REALITY_ASSESSMENT.md)
2. [Ownership Analysis](./ADMIN_PORTAL_AI_ADMIN_OWNERSHIP_ANALYSIS.md)
3. [Control Plane Architecture](./ADMIN_PORTAL_AI_CONTROL_PLANE_ARCHITECTURE.md)
4. [Convergence Plan](./ADMIN_PORTAL_AI_ADMIN_CONVERGENCE_PLAN.md)
5. [File Target Matrix](./ADMIN_PORTAL_AI_ADMIN_FILE_TARGET_MATRIX.md) — **62 rows**
6. [Implementation Sequence](./ADMIN_PORTAL_AI_ADMIN_IMPLEMENTATION_SEQUENCE.md)
7. [Certification Impact](./ADMIN_PORTAL_AI_ADMIN_CERTIFICATION_IMPACT.md)
8. This document

---

## 1. What is wrong with current AI admin?

AI administration is **split across six API mounts and 14 pages** with **contradictory maturity signals**.

| Problem | Scale (verified) |
|---------|------------------|
| **Legacy scaffold dominates** | `/api/centralized-ai` — **97 handlers**, **3,491 LOC**, mostly mock/stub |
| **Canonical pipeline underrepresented** | `/api/admin-portal/ai-pipeline` — **45 handlers** with real `server/src/ai/pipeline/*` services |
| **Duplicate forensics** | Pipeline diagnostics vs `/api/ai-context-debug` (6 handlers) + `/admin-portal/ai-context` |
| **False operator confidence** | `ai-learning` page shows **"Data coming soon"** while calling centralized-ai |
| **Provider ops hidden** | Real `/api/admin/ai-providers` (8 handlers) buried in ai-system hub |
| **No HTTP test evidence** | **0** pipeline admin integration tests; only centralized-ai fence test |
| **Business AI legacy coupling** | `enable-centralized-learning` ties satellite to retiring scaffold |

**Bottom line:** Operators cannot tell which AI admin surfaces are real. The strongest implementation (AI Pipeline) is numerically smaller than the legacy mount.

---

## 2. What should become canonical?

| Layer | Canonical target |
|-------|------------------|
| **API** | `/api/admin-portal/ai-pipeline/*` (45 handlers) |
| **UI** | `/admin-portal/ai-pipeline/**` (10 pages, 32 components, existing sub-shell) |
| **Services** | `server/src/ai/pipeline/*` |
| **Domains** | Pipeline policies, diagnostics, evaluation, governance, experiments (test-lab) |

**Satellites (keep, document, link from hub):**

- `/api/admin/ai-providers` — provider usage/cost
- `/api/admin/business-ai` — global business AI view
- `/api/admin/modules/ai/*` — module AI registry (governance adjacent)

---

## 3. What should retire?

| Asset | Retirement target |
|-------|-------------------|
| `/api/centralized-ai` body | **>80% handlers** → 410 or delete (≤20 allowlist) |
| `/admin-portal/ai-learning` | Redirect or real-or-empty (no centralized-ai) |
| `/admin-portal/ai-context` | Redirect → pipeline diagnostics |
| `/api/ai-context-debug` | Merge into pipeline or gate + retire |
| `adminApiService` centralized-ai methods | Remove |
| `admin/business-ai` centralized-learning toggles | Remove with scaffold |
| ai-system embedded charts duplicating analytics | Strip in 0D-F (full analytics in 0C) |

**Do not retire:** AI Pipeline routes, provider satellite, business-ai satellite, module AI registry.

---

## 4. What findings are closed by this program?

| Finding | Planning (0D-A) | Implementation (0D-B–G) |
|---------|-----------------|-------------------------|
| **AP-F-008** | Blueprint + retirement path | **Closed** when centralized-ai retired |
| **AP-F-029** | Diagnostics merge plan | **Closed** when debug UI/API consolidated |
| **AP-F-030** | Test plan in matrix | **Partial** — smoke HTTP tests; full coverage 1B |

**Not closed by 0D:** AP-F-004, AP-F-007, AP-F-013–016, AP-F-023–027.

---

## 5. How many implementation packages?

**7 packages** (0D-A through 0D-G):

| Package | Status |
|---------|--------|
| 0D-A Inventory + ownership | **Complete** (this planning program) |
| 0D-B Legacy retirement prep | **Complete (2026-06-17)** |
| 0D-C Provider governance | **Complete (2026-06-17)** |
| 0D-D Pipeline consolidation | **Complete (2026-06-17)** |
| 0D-E Diagnostics + evaluation | **Complete (2026-06-17)** |
| 0D-F UX consolidation | **Complete (2026-06-17)** |
| 0D-G Readiness review | **Complete (2026-06-17)** |

**Stage 0D:** **Complete.** Handoff: **1B Governance Architecture** (blueprint complete 2026-06-17).

**Next implementation:** **1B-A** — impersonation + user service extraction (see [ADMIN_PORTAL_GOVERNANCE_ARCHITECTURE_EXECUTIVE_SUMMARY.md](./ADMIN_PORTAL_GOVERNANCE_ARCHITECTURE_EXECUTIVE_SUMMARY.md)).

**Estimated duration:** 3–4 sprints.

---

## 6. What is the risk?

| Risk | Severity | Mitigation |
|------|----------|------------|
| Unknown centralized-ai callers | **High** | Full-repo grep; staged 410; expanded fence tests |
| Debug endpoint parity gaps during merge | **Medium** | Gap analysis doc; time-boxed retain |
| Scope creep into 1B service extraction | **Medium** | Package guards; no AdminService moves in 0D |
| Operator disruption from redirects | **Low** | Bookmark redirects (0B pattern) |

**Residual risk after 0D:** AP-F-004 (AdminService monolith) remains **blocking** for certification review.

---

## 7. What is the immediate next implementation package?

# 0D-B — Legacy Retirement Prep

**Start here** — highest leverage, unblocks UX consolidation and AP-F-008 closure.

| 0D-B actions | Why first |
|--------------|-----------|
| Inventory all `/api/centralized-ai` callers | Prevents surprise breakage |
| Expand `centralizedAiFence.ts` 410 table | Safe, incremental retirement |
| Remove `adminApiService` centralized helpers | Stops admin UI from legacy API |
| Shrink `ai-centralized.ts` | Reduces auth surface and false maturity |

**Do not start with** 0D-F (UX) or 0D-E (diagnostics tests) until 0D-B caller removal is underway.

---

## 8. One recommendation

**Proceed to implementation with package 0D-B (Legacy Retirement Prep)** after approving this blueprint — retire the centralized-ai scaffold before consolidating diagnostics UX, so operators never see redirected pages that still call dying APIs.

Parallel **0D-C (Provider Governance)** is optional if capacity allows; it does not block 0D-B.

**Do not** begin 0C Analytics, 1A UX Shell, or 1B Governance Architecture as part of 0D.

---

## 9. Deliverable summary

| Metric | Value |
|--------|-------|
| **Platform AI admin API handlers** | 170 (45 canonical + 97 legacy + 22 satellite + 6 debug) |
| **Admin Portal AI pages** | 14 (10 pipeline + 4 legacy/hub/satellite) |
| **Pipeline components** | 32 |
| **File matrix rows** | 62 |
| **Convergence initiatives** | 5 (AP-AI-01 through AP-AI-05) |
| **Findings addressed** | AP-F-008, AP-F-029, AP-F-030 (partial) |
| **Projected readiness post-0D** | ~85–89% gates; CONDITIONALLY READY (stronger); not certification review |

---

## 10. Stop condition

**Planning program complete.** All 8 artifacts published. No code modified. No implementation started. No certification awarded. No ledger updates.

**Await approval** to begin **0D-B — Legacy Retirement Prep**.
