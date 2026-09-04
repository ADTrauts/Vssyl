# Project next phase — open work (living plan)

**Last updated:** 2026-04-19  
**Purpose:** Single place to answer “what’s left?” after **system audit remediation A–F** (`D-020`) and the historical **AI platform phased plan** (Phases 1–8 marked complete; archive: [`docs/archive/session-summaries/AI_PLATFORM_PHASED_PLAN.md`](../archive/session-summaries/AI_PLATFORM_PHASED_PLAN.md)). This is **not** a commitment to dates; it is a prioritized backlog map. Current AI architecture discovery starts at [`docs/architecture/AI_SYSTEM_MENTAL_MODEL.md`](../architecture/AI_SYSTEM_MENTAL_MODEL.md).

**Related:** `docs/plans/SYSTEM_AUDIT_SOURCE_OF_TRUTH.md`, `memory-bank/progress.md`, `memory-bank/activeContext.md`, `memory-bank/futureIdeas.md` (historical roadmap: `docs/archive/session-summaries/roadmap-archive-2026-09.md`; MB `roadmap.md` is a redirect stub).

---

## 1. Snapshot — what is *not* “done”

| Area | Status | Notes |
|------|--------|--------|
| **Dashboard dark mode QA** | Open (polish) | `progress.md`: major fixes done; **route-by-route authenticated QA** and edge cases remain. |
| **Audit deferred A-051** | Partial | Env matrix doc shipped (`docs/guides/MODULE_PLATFORM_ENVIRONMENT_MATRIX.md`); optional: **tests**, deeper prod review. |
| **Audit deferred A-052** | Open | Multimodal **downgrade** UX/docs: when attachments become summary/text-only; provider/model matrix. |
| **CI / quality** | Optional | **A-055** note: add **`pnpm lint`** to CI when eslint debt is manageable. |
| **Roadmap Phases 2.5+** | Planned / partial | Historical rebuild phases archived; prefer `activeContext.md` / `progress.md` / current `docs/plans/` (MB `roadmap.md` is redirect stub). |
| **HR module enhancement plan** | Partial | Prefer `hrProductContext.md` + HR operation matrix; historical plan archived under `docs/archive/hr-merged-2026/HR_MODULE_ENHANCEMENT_PLAN.md`. |
| **Strategic / vision** | Future | Prefer current ProductContexts + `futureIdeas.md` (non-committing); historical roadmap archived. |

---

## 2. Suggested sequencing — “next phases” (themes)

Workstreams below can overlap; order is **recommended**, not mandatory.

### Phase N1 — **UX completion & confidence** (short horizon)

1. **Finish dashboard dark-mode pass** — Complete authenticated QA on `/dashboard`, `/chat`, `/drive`, `/notifications`, `/business`, `/admin-portal`; fix remaining contrast/hover/disabled/icon issues.  
   - *Exit:* `progress.md` can mark this focus **complete** with a short verification note.

2. **Optional CI hardening** — When ready: enable **`pnpm lint`** in CI (per **A-055**) or scope/lint-incrementally so main stays green.

### Phase N2 — **Audit follow-through** (medium priority, bounded)

1. **A-051 (finish)** — Add **targeted tests** or runbooks where env matrix promises behavior (GCS required for artifact path; sandbox best-effort). Production-safety review checklist.  
2. **A-052** — **Backend:** explicit signals when vision/multimodal is downgraded (logging + response metadata). **Product/docs:** user-visible copy when attachments are summarized only. **Docs:** supported provider/model combinations (`docs/ai/` runbooks as needed).

### Phase N3 — **Product roadmap picks** (choose 1–2 tracks per quarter)

Pick based on business priority; all are “open” at the platform level:

| Track | Source | Illustrative scope |
|-------|--------|---------------------|
| **Global search** | `roadmap.md` Phase 2.5 | Unified search bar, providers per module, results + deep links. |
| **Presence / realtime** | `roadmap.md` Phase 3 | Finish “presence” roadmap item; align with chat/socket patterns. |
| **Testing strategy** | `roadmap.md` Phase 3 | E2E placement, coverage goals — see `memory-bank/testingStrategy.md` when updated. |
| **HR Phase 3+** | `HR_MODULE_ENHANCEMENT_PLAN.md` | Shift templates, assignment UI, coverage; then geolocation / enterprise attendance. |

### Phase N4 — **Strategic / larger bets** (defer until N1–N3 are stable)

- **Extensibility & ecosystem** (`roadmap.md` Phase 4): advanced admin, team dashboards, PWA/mobile.  
- **Migration, launch-scale QA** (`roadmap.md` Phase 5).  
- **Vssyl_Place** and **`futureIdeas.md`** items — prioritize only when strategy dictates.

---

## 3. What *is* complete (context — do not re-audit blindly)

- **System audit execution phases A–F** — closed (**D-020**).  
- **AI platform Phases 1–8** — checklist complete in historical [`docs/archive/session-summaries/AI_PLATFORM_PHASED_PLAN.md`](../archive/session-summaries/AI_PLATFORM_PHASED_PLAN.md) (verify in product if any drift; not current AI SoT).  
- **Module upload backend** phased plan — complete per `MODULE_UPLOAD_BACKEND_PHASED_PLAN.md` / Phase 7 rollout guide.

---

## 4. Maintenance

- **Owner:** Platform / product + engineering.  
- **When to update:** After each shipped theme (e.g. dark mode done, A-052 done), or quarterly.  
- **Conflict resolution:** Feature truth for shipped behavior lives in code + module product contexts; this file is **planning only**.

---

## 5. Quick reference — key files

| Topic | Where |
|-------|--------|
| Audit tracker & deferred A-051 / A-052 | `docs/plans/SYSTEM_AUDIT_SOURCE_OF_TRUTH.md` |
| Current engineering focus & history | `memory-bank/progress.md`, `memory-bank/activeContext.md` |
| Long-range rebuild phases | Historical: `docs/archive/session-summaries/roadmap-archive-2026-09.md` (MB `roadmap.md` stub) |
| HR backlog | `memory-bank/hrProductContext.md` + HR operation matrix; historical: `docs/archive/hr-merged-2026/HR_MODULE_ENHANCEMENT_PLAN.md` |
| Module env / GCS / sandbox | `docs/guides/MODULE_PLATFORM_ENVIRONMENT_MATRIX.md` |
| Wishlist (non-committing) | `memory-bank/futureIdeas.md` |
