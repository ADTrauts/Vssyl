# AI Experience UX — Wave 5H-AI-UX-C Closeout

**Status:** **Engineering + QA preparation complete** — no certification review; no QA execution  
**Date:** 2026-06-03  
**Wave:** **5H-AI-UX-C**  
**Prior baseline:** [`AI_EXPERIENCE_UX_BATCH5H_B_CLOSEOUT.md`](./AI_EXPERIENCE_UX_BATCH5H_B_CLOSEOUT.md) (**7 PASS / 4 PWF / 0 FAIL** projected)

---

## 1. Findings resolved

| ID | Resolution |
|----|------------|
| **AI-12** | Canonical navigation model in `web/src/lib/aiExperienceNavigation.ts`; shared `AIExperienceNavLinks` on `/ai`, `/ai-chat`, embedded sidebar, header dropdown, and widget chrome. |
| **AI-13** | `AIWidget` refactored to delegate to `AIChatModule` (same engine as embedded/full-page). Legacy `/api/ai/chat` widget UI removed. Header dropdown retains certified quick-access exception with unified nav links. |
| **AI-14** | Business workspace `case 'ai'` mounts `AIWorkspaceLanding` → `AIChatModule` instead of legacy `AIWidget`. |
| **AI-15** | Drag-to-trash + menu delete paths documented in **Part 2F** §2 (`AI-07`–`AI-10`); menu delete uses `ConfirmModal`; drag supplies `trashItem` payload to global trash (QA to verify bin confirm behavior). |

---

## 2. Findings deferred

| ID | Disposition |
|----|-------------|
| **AI-9** | **Architectural debt** — see §6. Decomposition **not required** for UX-L1/L2 certification; deferred to post-L3 maintenance window. |
| **AI-10** | **QA preparation only** — Part 2F matrix published (22 cases); execution deferred to **5H-AI-UX-D**. |
| **AI-11** | **QA preparation only** — Menu coverage rows in Part 2F §3; sign-off deferred to **5H-AI-UX-D**. |

---

## 3. Navigation model decision

**Canonical routes**

| Route | Role |
|-------|------|
| `/ai-chat` | Primary twin workspace (full-page `AIChatWorkspace`) |
| `/ai` | AI Identity control center (memory, behavior, provider) |

**Surface hierarchy** (`AI_EXPERIENCE_SURFACE_MODEL`)

| Surface | Chat engine | Notes |
|---------|-------------|-------|
| Full-page | `AIChatWorkspace` | `variant="page"` |
| Embedded module | `AIChatWorkspace` | `variant="embedded"` via `AIChatModule` / `AIWorkspaceLanding` |
| Dashboard widget | `AIChatWorkspace` | `AIWidget` → `AIChatModule` + nav chrome |
| Header dropdown | Twin APIs + shared handlers | **Certified exception:** portal overlay for in-context quick access; must link to full-page for extended sessions |

**Cross-links:** `AIExperienceNavLinks` provides **Open chat** ↔ **AI Identity** on all surfaces except when already on target route.

---

## 4. Embedded / page parity decision

| Capability | Full-page | Embedded | Widget | Dropdown |
|------------|-----------|----------|--------|----------|
| `AIChatWorkspace` engine | ✅ | ✅ | ✅ | ❌ (separate component) |
| `ConfirmModal` delete | ✅ | ✅ | ✅ | ✅ |
| `DropdownMenu` conversation actions | ✅ | ✅ | ✅ | ✅ |
| Provider/model picker | ✅ | Partial (`auto` embedded) | Partial | ✅ |
| Attachments / streaming | ✅ | ✅ | ✅ | ✅ |
| Mobile sheet | ✅ | ✅ | ✅ | N/A (overlay) |

**Certified exceptions (intentional non-parity)**

1. **Embedded `provider: 'auto'`** — dashboard embed defaults; full picker on page/header (3C-5 product decision).
2. **Header dropdown** — overlay UX, not workspace shell; shares nav model and destructive patterns.
3. **AI Identity (`/ai`)** — settings archetype, not chat workspace.

---

## 5. Widget / business workspace decision

| Before | After |
|--------|-------|
| Business `case 'ai'` → legacy `AIWidget` (separate `/api/ai/chat` UI) | `AIWorkspaceLanding` → `AIChatModule` |
| Dashboard grid `AIWidget` → 700+ LOC bespoke widget | Thin wrapper → `AIChatModule` + remove control + nav links |
| No workspace landing pattern | Aligns with Todo `TodoWorkspaceLanding` / Place hub pattern |

Personality/insights panels removed from widget; canonical home is **`/ai`** (Identity).

---

## 6. AI-9 disposition

| Question | Answer |
|----------|--------|
| LOC | `AIChatWorkspace.tsx` ≈ **2,688** lines |
| Required for UX-L1/L2 certification? | **No** — certification framework gates on category ratings and QA evidence, not file size |
| Classification | **Architectural debt** (maintainability, reviewability) |
| Deferral | Post-**5H-AI-UX-D** optional refactor wave; extract sidebar, composer, message list when touching AI chat for product features |
| Risk | Low for certification; medium for long-term engineering velocity |

---

## 7. Updated projected PASS / PWF / FAIL

| # | Category | 5H-B | **5H-C (projected)** |
|---|----------|------|----------------------|
| 1 | Interaction Consistency | PASS | **PASS** |
| 2 | Layout Consistency | PWF | **PASS WITH FINDINGS** |
| 3 | Navigation | PWF | **PASS** |
| 4 | Accessibility | PWF | **PASS WITH FINDINGS** |
| 5 | Mobile | PWF | **PASS WITH FINDINGS** |
| 6 | Cross-Module Integration | PASS | **PASS** |
| 7 | Error Handling | PASS | **PASS** |
| 8 | Empty States | PASS | **PASS** |
| 9 | Loading States | PASS | **PASS** |
| 10 | Discoverability | PWF | **PASS WITH FINDINGS** |
| 11 | Workflow Completion | PASS | **PASS** |

| Metric | 5H-B | **5H-C (projected)** |
|--------|------|----------------------|
| **PASS** | 7 | **8** |
| **PASS WITH FINDINGS** | 4 | **3** |
| **FAIL** | 0 | **0** |

**Validation:** `pnpm type-check` — **PASS** (2026-06-03).

---

## 8. Readiness for next gates

| Gate | Readiness | Blocker |
|------|-----------|---------|
| **UX-L1 review** | **~88%** | 8 PASS meets strict L1 bar; formal review + sign-off in **5H-AI-UX-D** |
| **UX-L2 review** | **~78%** | 8/9 PASS; one more category PASS or documented CwF after QA |
| **Part 2F QA** | **Prepared** | 22 cases in [`PLATFORM_MANUAL_QA_MATRIX.md`](../PLATFORM_MANUAL_QA_MATRIX.md) Part 2F; execution + evidence in **5H-AI-UX-D** |

---

## Files modified

| File | Change |
|------|--------|
| `web/src/lib/aiExperienceNavigation.ts` | **New** — canonical routes + surface model |
| `web/src/components/ai/AIExperienceNavLinks.tsx` | **New** — shared cross-navigation |
| `web/src/components/ai/AIWorkspaceLanding.tsx` | **New** — business/personal hub mount |
| `web/src/components/widgets/AIWidget.tsx` | Refactored → `AIChatModule` delegate |
| `web/src/components/business/BusinessWorkspaceContent.tsx` | `AIWorkspaceLanding` for `case 'ai'` |
| `web/src/components/ai/AIChatWorkspace.tsx` | Nav links in page header + embedded sidebar |
| `web/src/app/ai/page.tsx` | `AIExperienceNavLinks` in header |
| `web/src/components/header/AIChatDropdown.tsx` | Unified nav links; close button `aria-label` |
| `docs/ux/PLATFORM_MANUAL_QA_MATRIX.md` | **Part 2F** AI Experience (22 prep cases) |
| Scorecard / certification / roadmap / memory bank | Updated |

---

## Related

- [`AI_EXPERIENCE_UX_SCORECARD.md`](./AI_EXPERIENCE_UX_SCORECARD.md)
- [`AI_EXPERIENCE_UX_CERTIFICATION.md`](./AI_EXPERIENCE_UX_CERTIFICATION.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03 (Wave 5H-AI-UX-C — no certification award)
