# Active Context - Vssyl Business Admin & AI Integration

## GitHub Actions CI — `verify` job green (May 2026) ✅

**Problem:** CI `pnpm type-check` failed with widespread `TS6305` because `web` resolves `shared` via `shared/dist/*.d.ts`, but the workflow did not build `shared` before recursive type-check. Later, `pnpm test` failed on missing `Module` row `scheduling` and a flaky admin analytics assertion under parallel Vitest.

**Shipped:**
- `.github/workflows/ci.yml` — after `pnpm install`, run `pnpm run build` with `working-directory: ./shared` so declarations exist before `pnpm type-check`.
- `server/src/routes/__tests__/scheduling-tenant-scope.integration.test.ts` — `beforeAll` self-seeds built-in `scheduling` module when absent (CI DB has no startup seed).
- `server/src/routes/__tests__/admin-analytics.integration.test.ts` — growth test no longer assumes monotonic global `totalUsers` while other suites delete users concurrently.

**Commits (main):** `d7fbb746` (CI shared build), `8a89bc04` (scheduling test seed), `66d6b1d7` (analytics assertion stabilization).

**Validation:** User confirmed GitHub Actions `verify` all green after push.

---

## Vssyl_Business — naming source of truth (April 2026) ✅

Canonical domain definition and vocabulary (Work tab vs business workspace, tier meanings, member role vs org position): **`memory-bank/vssylBusinessNaming.md`**. Use it to avoid mixed terminology in specs and AI sessions.

## Module interoperability alignment — Phases 1–5 closed (April 2026) ✅

**Plan:** `docs/plans/MODULE_INTEROPERABILITY_ALIGNMENT_PHASED_PLAN.md` — **Status: Complete.**

**Shipped across phases (summary):**
1. Canonical contract in `memory-bank/moduleSpecs.md`; third-party guide and system/permissions/thread-activity/compliance docs aligned.
2. Backend: normalized module activity via `Log` (`module_activity_event`), Drive folder/file + Chat hooks, aggregated activity feed.
3. UI: dashboard `ActivityFeedWidget` push via `activity:feed:refresh`; Drive details activity; Chat right-panel activity tab; `chatSocket` event forwarding.
4. Enforcement: `.cursor/rules/module-interoperability.mdc`, pipeline publish gate (5), review checklist parity first-party/third-party.
5. **Phase 5 verification (2026-04-21):** `pnpm type-check` pass; `pnpm test` pass (30 files, 149 tests).

**Residual risks (owner: Platform Engineering):** semantic certification still human-gated (R1); dual activity storage until optional consolidation (R2); shared-folder full audit trail may need broader log query (R3). See plan Phase 5 table.

---

## System audit remediation — Phases A–F closed (April 2026)

Lettered remediation **A–F** for `docs/plans/SYSTEM_AUDIT_SOURCE_OF_TRUTH.md` is **complete** (**D-020**). There is no open audit execution backlog; optional follow-ups **A-051** / **A-052** are **Deferred** on the tracker. **A-051 (partial):** environment matrix for module upload/GCS vs local and Docker sandbox limits — `docs/guides/MODULE_PLATFORM_ENVIRONMENT_MATRIX.md`. **Consolidated “what’s next” plan:** `docs/plans/PROJECT_NEXT_PHASE_OPEN_WORK.md`. Current engineering focus is normal product roadmap work (this file), not audit closure.

---

## Most Recent UX + Stability Fix: Profile Settings & Avatar Reliability (April 2026) ✅

### **Profile settings now inside dashboard shell + sidebar IA**

**Issue summary**:
- Avatar menu route `/profile/settings` opened outside the expected global dashboard shell in some flows.
- Profile settings content was a long single-page stack without internal navigation.
- Profile photo behavior was inconsistent in production-like Google environments (personal slot breaking after business assignment).

**What was fixed**:
- Added profile route layout wrapper:
  - `web/src/app/profile/layout.tsx` now wraps profile pages with `DashboardLayout`.
- Refactored profile settings UX:
  - `web/src/app/profile/settings/page.tsx` now uses internal left-sidebar navigation with tabbed sections (`account`, `photos`, `location`, `preferences`) via `?tab=...`.
- Hardened profile photo serving path:
  - `server/src/controllers/profilePhotoController.ts` now emits proxy-relative image URLs (`/api/profile-photos/serve/:id?...`) so auth is consistently injected through Next proxy.
  - Replaced brittle manual storage URL parsing in `serveProfilePhoto` with `storageService.extractPathFromUrl(...)`.
- Fixed assignment regression causing personal photo breakage:
  - `assignProfilePhoto` no longer clears the opposite slot when assigning one slot.
  - Added distinct-slot validation so the same photo cannot be assigned to both personal and business.
  - Added legacy fallback in `getProfilePhotos` to resolve missing `*_photo_id` from library URLs when older records still have URL but no id.

**Validation status**:
- Lint checks passed on modified profile settings/controller files.
- User-confirmed behavior: profile settings layout and avatar flow now working as expected.

---

## Most Recent Completed Project: Module Upload Backend Phases 1-7 (April 2026) ✅

### **Third-party module upload/review/runtime hardening complete**

**Source of truth**: `docs/plans/MODULE_UPLOAD_BACKEND_PHASED_PLAN.md`

**What was completed**:
- **Phase 1-2**: Enforced module-to-business link policy (active business member allowed), ownership checks, idempotent linking, and audit events.
- **Phase 3**: Added developer-business designation fields (`isDeveloperBusiness`, `developerBusinessLinkedAt`, `developerBusinessLinkedBy`) and migration.
- **Phase 4**: Made admin module review operational with checklist signals, sandbox actions, and publish-readiness guardrails.
- **Phase 5**: Reconciled developer financial paths (subscriptions/revenue/payouts) and aligned API/UI contracts for developer and billing admin pages.
- **Phase 6**: Hardened marketplace/runtime business-scope checks and fixed business runtime subscription gating (`businessSubscriptions`).
- **Phase 7**: Added regression tests for critical module controller paths and created deployment runbook:
  - `server/src/controllers/__tests__/moduleController.phase7.test.ts`
  - `docs/deployment/MODULE_UPLOAD_PHASE7_ROLLOUT_GUIDE.md`

**Verification status**:
- Phase 7 test suite passed (`5/5`):
  - `pnpm vitest run src/controllers/__tests__/moduleController.phase7.test.ts`
- Lint checks on edited TS files passed.

---

## Most Recent Resolved Incident: Third-party Module Upload Pipeline (April 2026) ✅

### **Module upload to GCS — signing + CORS blockers resolved**

**Issue summary**:
- `POST /api/modules/:id/uploads/init` intermittently failed with 500.
- Initial blocker was GCS V4 signed URL generation (`iam.serviceAccounts.signBlob` denied).
- After signing was fixed, browser upload failed on preflight with GCS CORS error (`No 'Access-Control-Allow-Origin' header`).

**What was verified/fixed**:
- Confirmed runtime service account for `vssyl-server`: `235369681725-compute@developer.gserviceaccount.com`.
- Confirmed bucket access existed on `vssyl-storage-472202` (`roles/storage.objectAdmin`).
- Added missing signing permission: runtime SA granted `roles/iam.serviceAccountTokenCreator` on itself.
- Applied bucket CORS policy for signed browser uploads:
  - Origins: `https://vssyl.com`, `https://www.vssyl.com`, local dev origins
  - Methods: `GET`, `HEAD`, `PUT`, `POST`, `OPTIONS`
  - Headers include `Content-Type` (required by signed PUT flow)

**Current state**:
- User confirmed module ZIP upload flow is now working end-to-end.
- API now returns `errorCode` + `hint` for upload-init failures, and frontend surfaces those hints.

---

## Most Recent UX Hardening: Dashboard Dark Mode Readability (April 2026) ✅

### **Dashboard/module contrast and theming pass**

**Issue summary**:
- Dark mode dashboard still had low-contrast surfaces and unreadable text in several module widgets.
- React dev warning surfaced style collisions in dashboard tabs (`border` shorthand mixed with `borderBottom`).

**What was fixed**:
- `web/src/app/dashboard/DashboardLayout.tsx`
  - Replaced conflicting tab border style usage with explicit side widths (`borderTop/Right/Left/BottomWidth`) to remove rerender warning.
  - Improved personal left-sidebar dark-mode fallback colors (background/text/customize button) for readable contrast.
- `web/src/components/dashboard/WidgetShell.tsx`
  - Increased visual separation for widgets in dark mode (deeper surface, stronger border, stronger shadow).
  - Added explicit dark header/content surfaces so module cards pop from the page background.
- `web/src/components/widgets/DriveWidget.tsx`
  - Added dark-mode variants for household/family panels, list rows, dividers, and text so File Hub content remains readable.
- `web/src/components/widgets/NotificationsWidget.tsx`
  - Added dark-mode row/background/text states (read + unread) and dark-safe select/input styling in settings panel.

**Validation status**:
- Lint checks clean for edited files.
- Remaining work is iterative visual QA across authenticated routes (dashboard/chat/drive/admin) for any edge-case contrast regressions.

---

## Most Recent Completed Project: Connections & Member Management (March 2026) ✅

### **Connections & Member Management — Phases 1–4 COMPLETE ✅**

**Build Document**: `memory-bank/CONNECTIONS_AND_MEMBERS_BUILD_PLAN.md`

**Overview**: Aligned personal connections (ALL, Personal, Household, Following, Colleagues), business “Members” experience, and Phase 4 features: pinned colleagues, Place deep link, and colleague presence.

**Phases completed**:
- **Phase 1**: Personal connections viewer — Household and Following tabs; Colleagues = current colleagues only (filter by shared active business).
- **Phase 2**: Sidebar “Members” label and route to `/business/:id/workspace/members`; workspace members page uses real API; List / By department view.
- **Phase 3**: “Add as personal connection” on workspace members; canonical business roster API (member API: getBusinessMembers, updateEmployeeRole, removeEmployee); profile MemberManagement uses member API for update/remove.
- **Phase 4**: (1) **Pinned colleagues** — `PinnedColleague` model, GET/POST/DELETE `/api/member/business/:id/pinned`, “People I work with most” section and pin/unpin on workspace members. (2) **Place deep link** — `?tab=my-place&highlight=businessId`; PlaceGraph opens business panel when node exists; ConnectionList “View on Place” uses deep link. (3) **Colleague presence** — `User.lastActiveAt`, auth middleware updates on request; `getBusinessMembers` returns `lastActive`; workspace members list shows “Last active”.

**Key files**: `web/src/components/member/ConnectionList.tsx`, `web/src/app/business/[id]/workspace/members/page.tsx`, `web/src/app/business/[id]/profile/MemberManagement.tsx`, `server/src/controllers/memberController.ts`, `server/src/routes/member.ts`, `web/src/api/member.ts`, `web/src/app/place/page.tsx`, `web/src/components/place/PlaceGraph.tsx`, `prisma/modules/auth/user.prisma` (lastActiveAt), `prisma/modules/business/business.prisma` (PinnedColleague).

---

## Older context (archived)

Completed-project narratives and older session history that previously lived in this file were moved to **`docs/archive/session-summaries/active-context-archive-2026-04-pretrim.md`** (April 2026 cleanup). Keep this file focused on the last ~3 months of work; summarize new completions briefly and link to plans or PRs when detail is needed.
