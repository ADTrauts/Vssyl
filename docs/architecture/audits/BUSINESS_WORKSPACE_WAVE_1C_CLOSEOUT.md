# Business Workspace Wave 1C — Navigation Contracts and Registry Enforcement

**Status:** **Complete** — implementation and enforcement wave  
**Date:** 2026-06-14  
**Wave:** Business Workspace **1C**  
**Prior:** [BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md](./BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md)

> **No Workspace certification. No Reference Workspace registration. No UX certification changes.**

---

## Required report

| # | Topic | Outcome |
|---|-------|---------|
| 1 | Navigation contract coverage | **PASS** — resolver, href builder, children gate, duplicate checks |
| 2 | Registry enforcement coverage | **PASS** — registry ↔ navigation ↔ switch bidirectional drift tests |
| 3 | Canonical module entry paths | **Documented** — §3 + [WORKSPACE_ROUTING_CONTRACT.md](../WORKSPACE_ROUTING_CONTRACT.md) §5 |
| 4 | Legacy route disposition | **Audited** — §4 |
| 5 | Remaining WS-L1 blockers | **2 hygiene** (orphan segment pages) — §5 |
| 6 | WS-L1 readiness assessment | **Eligible for reassessment** — §6 |
| 7 | Recommended certification review scope | §7 |

**Validation:** `pnpm type-check` **PASS** · navigation contract tests **PASS** · registry drift tests **PASS**

---

## 1. Navigation contract coverage (1C-1)

| Test area | File | Assertions |
|-----------|------|------------|
| Module resolution | `businessWorkspaceNavigation.test.ts` | Hub default, legacy query, all segment paths, alias normalization |
| Href builder | same | Unique hrefs, segment URLs, round-trip segment → module |
| Children gate | same | `shouldRenderWorkspaceChildren` for page vs switch modules |
| Contract integrity | same | No duplicate switch ids; registry modules have contracts |
| Duplicate routes | same + drift test | Unique href set; unique segment set |

**Artifacts:**

- `web/src/lib/businessWorkspaceContracts.ts` — authoritative mount metadata
- `web/src/lib/businessWorkspaceNavigation.ts` — resolver + `buildBusinessWorkspaceModuleHref` + `shouldRenderWorkspaceChildren`

**Navigation alignment:**

- `DashboardLayoutWrapper.navigateToModule` → segment hrefs ✅
- `BrandedWorkDashboard.handleModuleClick` → segment hrefs ✅ (was `?module=`)
- AI right-rail button → segment href ✅

---

## 2. Registry enforcement coverage (1C-2)

| Drift check | Direction | CI |
|-------------|-----------|-----|
| Registry business routes ⊆ mounted modules | registry → contracts | Fail on missing |
| Mounted modules ⊆ registry business routes | contracts → registry | Fail on orphan |
| `REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS` = registry filter | constant ↔ runtime | Fail on mismatch |
| Switch cases ⊆ registry | aliases normalized | Fail on unknown |
| Switch file coverage | contracts → `BusinessWorkspaceContent` | Fail on missing `case` |
| Href builder coverage | all mounted ids | No `?module=` for products |

**File:** `web/src/lib/__tests__/businessWorkspaceRegistryDrift.test.ts`

---

## 3. Canonical module entry paths (1C-4)

See [WORKSPACE_ROUTING_CONTRACT.md](../WORKSPACE_ROUTING_CONTRACT.md) §5.

**Summary:** All 13 registry business modules use **segment URLs** from `buildBusinessWorkspaceModuleHref`. Hub = `/workspace`. Products = `/workspace/:segment`.

---

## 4. Legacy route disposition (1C-3)

| Module | Canonical segment | Legacy query | Redirect strategy | Deprecation |
|--------|-------------------|--------------|-------------------|-------------|
| **Drive** | `/workspace/drive` | `?module=drive` | Resolve-only; old `drive/page.tsx` redirect to `/drive` **removed** | Query deprecated |
| **Chat** | `/workspace/chat` | `?module=chat` | Switch mounts `ChatModuleWrapper` | Delete orphan `chat/page.tsx` stub |
| **Calendar** | `/workspace/calendar` | `?module=calendar` | Switch mounts `CalendarWorkspaceLanding` | Delete orphan `calendar/page.tsx` stub |
| **Todo** | `/workspace/todo` | `?module=todo` | Switch mount | — |
| **Place** | `/workspace/place` | `?module=place` | Switch mount | — |
| **AI** | `/workspace/ai` | `?module=ai` | Switch mounts `AIWorkspaceLanding` | `ai/page.tsx` orphan (control center) |
| **Members** | `/workspace/members` | `?module=members` / `connections` | Page mount; switch redirects legacy | `connections` alias deprecated |
| **Analytics** | `/workspace/analytics` | `?module=analytics` | Page mount; switch redirects legacy | — |
| **VLink** | `/workspace/vlink` | `?module=vlink` | Switch mount | — |
| **Notebook** | `/workspace/notebook` | `?module=notebook` / `notes` | Page mount + nested `page/:pageId` | `notes` alias deprecated |
| **HR** | `/workspace/hr` | `?module=hr` | Page mount + `hr/me`, `hr/team` | — |
| **Scheduling** | `/workspace/scheduling` | `?module=scheduling` | Page mount + nested team/me | — |

**Children gate fix (B-4 partial close):** `shouldRenderWorkspaceChildren` replaces `hasNestedWorkspaceRoute` only — prevents members/analytics redirect loops and correctly routes segment-page modules to App Router children.

---

## 5. Remaining WS-L1 blockers

| # | Blocker | Status after 1C | Notes |
|---|---------|-----------------|-------|
| B-1 | Stub product UI in shell | ✅ Resolved (1B) | — |
| B-2 | Dead landing files | ✅ Resolved (1B) | — |
| B-3 | Drive handlers in shell | ✅ Resolved (1B) | — |
| B-4 | Dual mount paths | ✅ **Resolved** | Explicit `routeKind` + children gate; legacy query resolve-only |
| B-5 | Duplicated dashboard bootstrap | ✅ Resolved (1B) | — |
| B-6 | Members duplicate UI | ✅ Resolved (1B) | — |
| B-7 | No navigation contract tests | ✅ **Resolved** | CI enforcement |
| B-8 | Dual URL model | ✅ **Resolved** | Segment canonical; query legacy |
| B-9 | Registry vs switch drift | ✅ **Resolved** | Bidirectional drift tests |

**Hygiene (non-blocking):**

| Item | Recommendation |
|------|----------------|
| Orphan `chat/page.tsx`, `calendar/page.tsx` | Delete in Wave 1D hygiene |
| Orphan `ai/page.tsx` | Consolidate or delete when AI business entry unified |
| `notes/page.tsx` | Keep redirect alias until traffic zero |

**WS-L1 blocker count:** **0 / 9** (9 resolved; 2 hygiene items deferred)

---

## 6. WS-L1 readiness assessment

| Criterion | Status |
|-----------|--------|
| Shell owns orchestration only | ✅ |
| Module interiors in module entry components | ✅ |
| Single dashboard bootstrap | ✅ |
| Canonical segment navigation | ✅ |
| Automated drift prevention | ✅ |
| Documented routing contract | ✅ |

**Verdict:** Business Workspace is **eligible for WS-L1 reassessment**. Strict WS-L1 certification review is **out of scope** for Wave 1C per charter — recommend scheduling as separate governance gate.

---

## 7. Recommended Workspace certification review scope

When WS-L1 reassessment is scheduled, reviewers should verify:

1. **Routing contract** — all new modules follow [WORKSPACE_ROUTING_CONTRACT.md](../WORKSPACE_ROUTING_CONTRACT.md) onboarding checklist.
2. **CI gates** — navigation + drift tests remain mandatory on `vssyl-web` package.
3. **Orphan route cleanup** — confirm deletion of mock segment pages (chat, calendar).
4. **Personal Dashboard co-surface** — parity check for runtime bridge (not in 1C scope).
5. **No regression** — stub widgets, dead landings, Drive shell leak remain absent.

**Not in scope:** WS-L2 (deep link parity across contexts), WS-L3 (partner module iframe mounts), Reference Workspace registration.

---

## 8. Files changed

| File | Change |
|------|--------|
| `web/src/lib/businessWorkspaceContracts.ts` | **Create** — mount contracts + registry ids |
| `web/src/lib/businessWorkspaceNavigation.ts` | **Rewrite** — segment hrefs, children gate |
| `web/src/lib/__tests__/businessWorkspaceNavigation.test.ts` | **Create** |
| `web/src/lib/__tests__/businessWorkspaceRegistryDrift.test.ts` | **Create** |
| `web/src/components/business/DashboardLayoutWrapper.tsx` | `shouldRenderWorkspaceChildren` |
| `web/src/components/BrandedWorkDashboard.tsx` | Segment href navigation |
| `web/src/app/business/[id]/workspace/drive/page.tsx` | Retire bad redirect → `null` |
| `docs/architecture/WORKSPACE_ROUTING_CONTRACT.md` | **Create** |
| `docs/architecture/REFERENCE_MODULE_CATALOG.md` | Wave 1C cross-links |
| `memory-bank/activeContext.md` | Status update |
| `memory-bank/progress.md` | Status update |

---

## 9. Cross-links

- [WORKSPACE_ROUTING_CONTRACT.md](../WORKSPACE_ROUTING_CONTRACT.md)
- [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](../WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md)
- [BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md](./BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md)
- [BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md](./BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md)

*Last updated: 2026-06-14*
