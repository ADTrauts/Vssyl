# Admin Portal Next Phase Recommendation

**Program:** Admin Portal Modernization  
**Date:** 2026-06-17  
**Inputs:** [Stage 0E/0B Closeout](./ADMIN_PORTAL_STAGE_0E_0B_CLOSEOUT.md) · [Post-0B Readiness](./ADMIN_PORTAL_POST_0B_READINESS_UPDATE.md) · [Remaining Findings](./ADMIN_PORTAL_REMAINING_FINDINGS_REGISTER.md) · [Modernization Sequence](./ADMIN_PORTAL_MODERNIZATION_SEQUENCE.md)

**Constraint:** Recommendation only — no implementation authorized.

---

## 1. Recommendation

# B. Begin 0D AI Administration Modernization

Start **Stage 0D — AI Administration Modernization** as the next implementation package.

---

## 2. Rationale

### 2.1 Sequence position

Per [`ADMIN_PORTAL_MODERNIZATION_SEQUENCE.md`](./ADMIN_PORTAL_MODERNIZATION_SEQUENCE.md):

```
0E → 0B → (0C ∥ 0D ∥ 1A) → 1B → Re-evaluation
```

Stages 0E and 0B are complete. The sequence authorizes **parallel** entry to 0C, 0D, and 1A. One package must be selected to begin next; **0D is recommended first** on architectural risk.

### 2.2 Why 0D over 0C

| Factor | 0C (AP-F-007) | 0D (AP-F-008, AP-F-029) | Weight |
|--------|---------------|-------------------------|--------|
| **Production mount risk** | Frontend chart overlap only | `/api/centralized-ai` live mount — **3,491 LOC**, **97 handlers**, mock-heavy legacy scaffold | 0D higher |
| **Operator false confidence** | Duplicate metrics / confusion | Entire deprecated AI admin API appears implemented | 0D higher |
| **Auth surface** | Uses canonical admin-portal APIs | Separate mount with admin fence but large unattested handler set | 0D higher |
| **Downstream dependency** | Blocks analytics service extraction in 1B | Blocks AI admin disposition before 1B; overlaps AP-F-030 test gap | 0D higher |
| **Effort** | S (1 sprint) | L (1–2 sprints) | 0C smaller, but lower urgency |

**Conclusion:** AP-F-008 presents **higher architectural and operational risk** than AP-F-007. A 97-handler legacy scaffold on a production admin-gated mount creates greater certification and safety exposure than analytics page triplication.

### 2.3 Why not 1A, 1B, or pause

| Option | Assessment |
|--------|------------|
| **A. 0C Analytics** | Valid parallel track; lower risk than 0D; recommend immediately after or in parallel with 0D if capacity allows |
| **C. 1A UX Shell** | Advisory findings only; does not reduce blocking/major architectural risk |
| **D. 1B Governance** | **Blocked on 0C + 0D** per sequence entry criteria; AP-F-004 lives here |
| **E. Pause for certification review** | **Premature** — AP-F-004 blocking + 6 open majors; readiness is CONDITIONALLY READY, not READY FOR CERTIFICATION REVIEW |

---

## 3. 0D package scope (authorized when started)

Per [`ADMIN_PORTAL_IMPLEMENTATION_PACKAGE_PLAN.md`](./ADMIN_PORTAL_IMPLEMENTATION_PACKAGE_PLAN.md) Package 4:

| Finding | Objective |
|---------|-----------|
| **AP-F-008** | Retire `centralized-ai` body (>80% handler retirement or 410); resolve `ai-learning` stubs |
| **AP-F-029** | Consolidate or gate `ai-context-debug` vs pipeline diagnostics |
| **AP-F-030** (partial) | Begin AI pipeline HTTP integration tests |

### Key files (expected touch set)

- `server/src/routes/ai-centralized.ts`
- `server/src/index.ts` (`/api/centralized-ai` mount)
- `web/src/app/admin-portal/ai-learning/page.tsx`
- `web/src/app/admin-portal/ai-context/page.tsx`
- `server/src/routes/ai-context-debug.ts`
- **Preserve:** `adminPortalRoutes.aiPipeline.ts`, `web/src/app/admin-portal/ai-pipeline/**`

### Exit criteria (from package plan)

- centralized-ai retired >80%
- ai-learning stubs resolved
- context debug consolidated or documented satellite

---

## 4. Parallel work guidance

If team capacity allows **two tracks** after 0D kickoff:

1. **Primary:** 0D AI Administration  
2. **Secondary:** 0C Analytics Rationalization (AP-F-007 only — fast win)

Defer **1A** until at least one of 0C/0D reaches closeout to avoid shell work on surfaces slated for rationalization.

**1B** remains gated until 0E + 0B + 0C + 0D exit criteria are met (or in final closeout per sequence).

---

## 5. Entry criteria verification (0D)

| Criterion | Status |
|-----------|--------|
| 0E complete | **Met** |
| 0B complete | **Met** |
| Operation matrix published | **Met** |
| Auth model published | **Met** |
| No conflicting in-flight boundary work | **Met** |

**0D entry: GO**

---

## 6. Success signals for next closeout (after 0D)

- `ai-centralized.ts` materially reduced or mount returns 410 for deprecated paths
- `ai-learning` shows real data or explicit empty/unavailable (no "coming soon" false maturity)
- AP-F-008 closed; AP-F-029 closed or documented exception
- AP-F-030 partial — at least one `admin-portal-ai-pipeline*.test.ts` with catalog/policy smoke coverage

---

## 7. Stop condition acknowledgment

This recommendation **does not** begin 0D implementation. It identifies the correct next package only.

**Do not begin:** 0C (unless parallel), 1A, 1B, or certification review until respective entry criteria are met.

---

**Recommendation close:** **Begin 0D AI Administration Modernization.**
