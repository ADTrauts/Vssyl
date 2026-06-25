# Platform Controller — UX Simplification

**Program:** Platform Controller Program — Phase 1A  
**Date:** 2026-06-24  
**Status:** Design only — **no UI redesign or component rewrites**

**Related:** [Navigation Model](./PLATFORM_CONTROLLER_NAVIGATION_MODEL.md) · [Workflow Analysis](./PLATFORM_CONTROLLER_WORKFLOW_ANALYSIS.md)

---

## 1. Executive summary

UX simplification in Phase 1A is achieved through **information architecture and progressive disclosure** — not visual redesign. Target state reduces **cognitive load** by cutting top-level nav items **22 → 14**, eliminating redundant launchers, and grouping configuration/diagnostics without removing any capability.

---

## 2. Simplification levers (no redesign)

| Lever | Application | Capability impact |
|-------|-------------|-------------------|
| **Nav regrouping** | 10 domains vs 6 legacy sections | None removed |
| **Hub federation** | Platform Programs link grid | None duplicated |
| **Retire redundant launchers** | Remove AI System from nav | ai-system route remains |
| **Collapse Labs** | Debug/overrides/seed hidden | Env-gated access preserved |
| **Configuration tabs** | governance + retention under system | Same components |
| **Deep-link Providers** | Hash to existing panel | Same panel |
| **Redirect duplicates** | test-impersonation → impersonate | Same impersonation |

---

## 3. Page density review

| Page | LOC (approx) | Density | Simplification approach |
|------|-------------:|---------|-------------------------|
| `modules/page.tsx` | ~2,100 | **High** | Phase 1B: extract tab components (SubmissionsPanel, AIContextPanel) — **not 1A** |
| `support/page.tsx` | ~1,100 | High | Leave — functional; optional section anchors later |
| `impersonate/page.tsx` | ~1,300 | High | Leave — complex workflow justified |
| `ai-pipeline` hub | Modular components | **Good** | Reference pattern — do not change |
| `dashboard` | ~400 | Medium | Leave — overview role clear |
| `security` | Medium | Medium | Leave |
| `MarketplaceReadinessCard` | ~230 | Low | Phase 1B: inline probe results — UX not IA |

**Rule:** Density reduction via **component extraction** is Phase 1B engineering — not IA.

---

## 4. Navigation depth

| Metric | Current | Target |
|--------|---------|--------|
| Sidebar sections | 6 | 10 (smaller sections) |
| Max visible items (expanded) | 22 | 14 unique destinations |
| Hops to AI diagnostics | 2–3 (via ai-system) | **2** (Diagnostics nav) |
| Hops to module certification | 2 | **1** (Marketplace top-level) |
| Hops to provider panel | 2–3 | **1** (Providers deep link) |
| Orphan pages in default IA | 12 | **0** (hidden or merged) |

---

## 5. Operator discoverability

| Discoverability gap | Simplification fix |
|--------------------|--------------------|
| "Where is Search ops?" | Platform Programs → Unified Search card |
| "Where is Context Graph?" | Platform Programs → Context Graph card |
| "Where is BI?" | Removed — analytics insights tab only (already done) |
| "Where are probes?" | Marketplace submission modal (unchanged) + Programs card note |
| "Where is AI diagnostics?" | Diagnostics in sidebar |
| Debug tools | Operator Labs footer |

---

## 6. Progressive disclosure model

```
Level 0 — Overview (dashboard)
    ↓
Level 1 — Domain entry (Programs, Marketplace, Operations, …)
    ↓
Level 2 — Program/workflow page (modules, ai-pipeline, billing)
    ↓
Level 3 — Depth (pipeline sub-pages, submission modal, traces)
```

**Principle:** Operators see **status at L1**, act at **L2**, forensics at **L3**.

---

## 7. Shell and labeling (conceptual only)

| Element | Current | Target (copy only) |
|---------|---------|-------------------|
| Header title | Admin Portal | **Platform Controller** |
| Header subtitle | Platform Administration | **Operational control plane** |
| Overview nav label | Overview | **Overview** (unchanged) |
| dashboard title | Admin Dashboard | **Platform Overview** |

**No code renames in Phase 1A.**

---

## 8. Empty / loading / error states

**Leave unchanged** — G9 UX shell PASS (2026-06-18). Existing patterns:
- `AdminPortalEmptyState`
- `ConfirmModal`
- `Spinner` + retry on API failure

Phase 1B enhancement: probe result panel on readiness card (not simplification — feedback).

---

## 9. Token and component standards

Continue `v-*` token migration on touched files only. **No broad token rewrite** in Phase 1B IA work.

Reuse:
- `AdminPortalPageShell` for Programs hub
- `PipelineSubpageShell` for AI depth (unchanged)
- `AdminStatCard` for hub chips (optional compact)

---

## 10. Accessibility and mobile

| Area | Phase 1A action |
|------|-----------------|
| Sidebar collapse | Preserve |
| Section chevrons | Preserve |
| Pipeline back links | Preserve aria labels |
| 375px layout | **UNKNOWN** — test in Phase 1B QA |

---

## 11. UX simplification anti-patterns (avoid)

| Anti-pattern | Why avoid |
|--------------|-----------|
| Merge analytics + performance into one page | Different operator questions |
| Merge modules + developers into one page | Different workflows |
| Build Programs hub with full dashboards | Duplicates existing pages |
| Remove AI Pipeline sub-nav | Depth is intentional |
| Hide impersonation | Critical ops workflow |

---

## 12. Metrics for Phase 1B validation

| Metric | Target |
|--------|--------|
| Sidebar unique destinations | ≤14 |
| Orphan pages in nav IA | 0 |
| Hops to diagnostics | ≤2 |
| Operator task success (informal QA) | Certification workflow without ai-system |
| New components for hub | ≤2 (ProgramCard, config registry) |

---

**Last updated:** 2026-06-24 (Phase 1A design)
