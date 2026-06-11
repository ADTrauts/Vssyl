# Active Context - Vssyl Business Admin & AI Integration

## QA-ENV-01 — Environment blocker remediation (June 2026) ✅

**Status:** **RESOLVED** — runtime/build investigation only; no QA re-run; no certification changes.

**Root cause:** `ContextMenu.tsx` / `DropdownMenu.tsx` imported `./menuShared.js` while Next.js bundles `shared/src` via path alias — `.js` sibling does not exist in source; TypeScript `bundler` resolution masked the gap.

**Fix:** Extensionless `./menuShared` imports in both files (matches shared component convention).

**Validation:** `/calendar/month|day|week|year`, `/chat`, `/todo`, `/notifications` compile (dev turbo); `pnpm type-check` PASS.

**Evidence:** [`QA_ENV_01_ROOT_CAUSE_ANALYSIS.md`](../docs/ux/audits/QA_ENV_01_ROOT_CAUSE_ANALYSIS.md).

**Residual:** **QA-ENV-02** — `JWT_SECRET` missing blocks local backend; **E-14** still open.

---

## Calendar — Wave 5G-QA-EXEC (June 2026) ⚠️

**Status:** **ATTEMPTED — BLOCKED** (session 2026-06-03) — QA evidence wave only; no certification promotion.

**Outcome:** **0 PASS / 24 BLOCKED** — blocked by **QA-ENV-01** (now resolved).

**E-14:** **Open** — cannot close without successful matrix run.

**Evidence:** [`CALENDAR_QA_EXECUTION_REPORT_2026.md`](../docs/ux/audits/CALENDAR_QA_EXECUTION_REPORT_2026.md), [`qa-evidence/5G-QA/calendar/`](../docs/ux/audits/qa-evidence/5G-QA/calendar/).

**Next:** Re-run **5G-QA-EXEC** (local or staging; address QA-ENV-02 if API cases needed) → **5G-Calendar-D**.

---

## Calendar — UX-L3 Readiness Review (Wave 5G-Calendar-L3 Prep) (June 2026) ✅

**Status:** **COMPLETE** — readiness audit only; no code changes; no L3 promotion.

**Posture:** **UX-L2 CwF** (9 PASS / 2 PWF); **78%** L3-ready; 3C-7 engineering **complete**.

**Blockers:** **E-14** manual QA (CAL-01–24); cat **4** core quartet PWF until QA signed.

**E-10 / E-13:** Implementation **resolved** — cat 4/5 upgrade is **QA outcome**, not engineering.

**Next:** **5G-QA-EXEC** (Calendar Part 2D) → **5G-Calendar-D** → Reference UX **#5** prep.

**Evidence:** [`CALENDAR_UX_L3_READINESS_REVIEW.md`](../docs/ux/audits/CALENDAR_UX_L3_READINESS_REVIEW.md).

---

## AI Platform — L3 Readiness & Strategic ROI Review (June 2026) ✅

**Status:** **COMPLETE** — planning/governance only; no runtime changes; **no L3 promotion**.

**Decision:** **Defer AI Platform L3** — readiness **52/100**; UX certification higher ROI.

**Evidence:** [`AI_PLATFORM_LEVEL3_READINESS_REVIEW.md`](../docs/architecture/audits/AI_PLATFORM_LEVEL3_READINESS_REVIEW.md).

**Recommended next:** **UX Wave 5G-QA** + **Calendar → UX-L3 → Reference UX #5**; parallel **Notifications L3** path. **Do not start** AI Waves 2A–2C yet.

---

## AI Platform — Level 2 Certification Review (June 2026) ✅

**Status:** **CERTIFIED** — formal governance review only; no runtime changes.

**Decision:** **APPROVED WITH FINDINGS** — **Level 2 — Platform Compliant** (2026-06-03).

**Evidence:** [`AI_PLATFORM_LEVEL2_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/AI_PLATFORM_LEVEL2_CERTIFICATION_REVIEW.md), [`CERTIFICATION_LEDGER.md`](../docs/architecture/CERTIFICATION_LEDGER.md), [`AI_PLATFORM_SCORECARD.md`](../docs/architecture/AI_PLATFORM_SCORECARD.md).

**Maturity:** **Level 2 — Platform Compliant** (ledger). Waves **1A–1E** + formal L2 review complete.

**Next:** See **L3 Readiness & ROI Review** above — L3 deferred.

---

## AI Platform — Wave 1E Provider Capability Matrix (June 2026) ✅

**Status:** **SHIPPED** — canonical LLM capability matrix, routing/fallback hardening, trace diagnostics.

**Changes:** `providerCapabilityMatrix.ts`, `providerRouting.ts`; `GET /api/ai/models` exposes `capabilities`; `llmProviderRouting` on pipeline trace; 12 vitest cases.

**Evidence:** [`AI_PLATFORM_WAVE_1E_PROVIDER_CAPABILITY_CLOSEOUT.md`](../docs/architecture/audits/AI_PLATFORM_WAVE_1E_PROVIDER_CAPABILITY_CLOSEOUT.md).

**Maturity:** Historical — superseded by **Level 2 certification** above.

---

## AI Platform — Wave 1D Admin Gates & Diagnostics (June 2026) ✅

**Status:** **SHIPPED** — centralized-ai admin fence; diagnostics trace/reasoning alignment.

**Changes:** Mount `requireAdmin` + `centralizedAiDeprecatedMiddleware` on `/api/centralized-ai`; 410 for `/learning/event` and `/models/*`; `mergeDiagnosticsFromHistoryContext`; twin history saves `_conversationReasoning`.

**Evidence:** [`AI_PLATFORM_WAVE_1D_ADMIN_DIAGNOSTICS_CLOSEOUT.md`](../docs/architecture/audits/AI_PLATFORM_WAVE_1D_ADMIN_DIAGNOSTICS_CLOSEOUT.md).

**Maturity:** Historical — superseded by Wave **1E**.

---

## AI Platform — Wave 1C Drive Context Provider (June 2026) ✅

**Status:** **SHIPPED** — Drive AI context on canonical `driveVisibilityService`; controller Prisma removed.

**Changes:** `driveAIContextService`; `listAccessibleRecentFilesForAIContext`, `aggregateAccessibleDriveStorageForAIContext`, `countAccessibleDriveFilesForAIContext`; 21 vitest cases; matrices **N → C** for Drive context providers.

**Evidence:** [`AI_PLATFORM_WAVE_1C_DRIVE_CONTEXT_CLOSEOUT.md`](../docs/architecture/audits/AI_PLATFORM_WAVE_1C_DRIVE_CONTEXT_CLOSEOUT.md), [`AI_CONTEXT_PROVIDER_MATRIX.md`](../docs/architecture/audits/AI_CONTEXT_PROVIDER_MATRIX.md).

**Maturity:** Historical — superseded by Wave **1D**.

---

## AI Platform — Wave 1B Constitutional Remediation (June 2026) ✅

**Status:** **SHIPPED** — P1 blockers resolved; superseded for context path by 1C.

**Changes:** `/api/ai/user-context` canonical mount; `driveAIActionService`, `hrAIActionService`, `schedulingAIActionService`; `grantFileShareByEmail`; autonomous writes **410**; `POST /api/ai/chat` deprecated; twin `/:module` UUID guard.

**Evidence:** [`AI_PLATFORM_SCORECARD.md`](../docs/architecture/AI_PLATFORM_SCORECARD.md), [`AI_CANONICAL_ROUTE_MAP.md`](../docs/architecture/AI_CANONICAL_ROUTE_MAP.md), tests under `server/src/ai/**/__tests__`.

**Maturity:** Historical — see Wave **1C** section above.

---

## AI Platform — Wave 1A Route Audit (June 2026) ✅

**Status:** **COMPLETE** — planning artifact; superseded by 1B implementation.

---

## AI Platform — Wave G0 Constitutional Framework (June 2026) ✅

**Status:** **GOVERNANCE COMPLETE** — no runtime changes.

**Constitutional authority:** [`AI_PLATFORM_CONSTITUTION.md`](../docs/architecture/AI_PLATFORM_CONSTITUTION.md), [`AI_PLATFORM_BOUNDARY_MODEL.md`](../docs/architecture/AI_PLATFORM_BOUNDARY_MODEL.md), [`AI_PLATFORM_OPERATION_MATRIX.md`](../docs/architecture/AI_PLATFORM_OPERATION_MATRIX.md), [`AI_PLATFORM_CERTIFICATION_STRATEGY.md`](../docs/architecture/AI_PLATFORM_CERTIFICATION_STRATEGY.md)

**Wave 0 audits (evidence):** [`audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md`](../docs/architecture/audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md) + tool/context/admin/legacy matrices.

---

## AI Platform — Wave 0 Audit (June 2026) ✅

**Status:** **DISCOVERY COMPLETE** — superseded for governance by G0 docs; audits remain evidence baseline.

---

## Business Workspace — Wave 0 Constitutional Audit (June 2026) ✅

**Status:** **DISCOVERY COMPLETE** — governance only; no runtime changes.

**Identity:** **Platform shell + workspace runtime** (Hybrid **D**) — **not** a product `moduleId`, **not** L3 certifiable as Drive/Todo, **not** Reference Module #6.

**Evidence:** [`BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md`](../docs/architecture/audits/BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md), [`BUSINESS_WORKSPACE_OPERATION_MATRIX.md`](../docs/architecture/audits/BUSINESS_WORKSPACE_OPERATION_MATRIX.md)

**Maturity:** **Level 1 — Stabilizing** (ledger). Wave 3 target: **Level 2 platform shell** after 1A–2C.

**Next:** Wave **1A** — boundary doc + wire/delete dead `*WorkspaceLanding`; **1B** hub standard; **2B** retire stub dashboard/analytics/members widgets.

---

## UX Modernization — Wave 1.5 Skeleton Tokens (June 2026) ✅

**Status:** **SHIPPED** — Family 6 `--v-skeleton-*`, `.v-skeleton` + `skeleton-loading` in `ux.css`, `LoadingSkeleton` migrated. Zero module consumers today.

**Closeout:** [`docs/ux/audits/WAVE1_QA_CLOSEOUT.md`](../docs/ux/audits/WAVE1_QA_CLOSEOUT.md) — PASS. **Wave 2B-3 Batch 1:** **closed** — [`CONFIRMMODAL_BATCH1_CLOSEOUT.md`](../docs/ux/audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md) (**PASS WITH FINDINGS**). **Batch 2 closed** — [`CONFIRMMODAL_BATCH2_CLOSEOUT.md`](../docs/ux/audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md); **43** confirms remaining. **Wave 3A-0–2:** **done** — menu primitives hardened — [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](../docs/ux/CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md). **Wave 3A-3:** **done** — Drive Reference Menu Certification — [`DRIVE_MENU_REFERENCE_CLOSEOUT.md`](../docs/ux/audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md). **Wave 3A-4A:** **done** — AI menu rollout — [`AI_MENU_ROLLOUT_CLOSEOUT.md`](../docs/ux/audits/AI_MENU_ROLLOUT_CLOSEOUT.md). **Wave 3A-4B:** **done** — Notifications menu rollout — [`NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md`](../docs/ux/audits/NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md). **Wave 3A-4C:** **done** — Chat menu rollout — [`CHAT_MENU_ROLLOUT_CLOSEOUT.md`](../docs/ux/audits/CHAT_MENU_ROLLOUT_CLOSEOUT.md). **Wave 3A-4D:** **done** — Todo menu rollout — [`TODO_MENU_ROLLOUT_CLOSEOUT.md`](../docs/ux/audits/TODO_MENU_ROLLOUT_CLOSEOUT.md): `TaskItem` → `DropdownMenu`; `pnpm type-check` PASS. **3A-4 platform rollout complete.** **Wave 3A-5:** **done** — platform menu certification — [`PLATFORM_MENU_CERTIFICATION.md`](../docs/ux/audits/PLATFORM_MENU_CERTIFICATION.md) (**PASS WITH FINDINGS**): `ContextMenu`/`DropdownMenu`/`Popover` ratified; 7+9+1 `web/` consumers; manual QA gate pending. **Wave 3C-0:** **done** — layout shell inventory — [`LAYOUT_SHELL_STANDARDIZATION_REVIEW.md`](../docs/ux/LAYOUT_SHELL_STANDARDIZATION_REVIEW.md): ~12 shell families; Drive = workspace reference; `WorkspaceSplitLayout` + `PlatformShell` extraction recommended. **Wave 3C-1:** **done** — `WorkspaceSplitLayout` primitive + Drive pilot (`DrivePageContent`, `DriveModule`); `pnpm type-check` PASS. **Wave 3C-2:** **done** — Drive `WorkspaceSplitLayout` rollout (starred/shared/recent/trash + business drive branch); `pnpm type-check` PASS. **Wave 3C-3:** **done** — Chat `WorkspaceSplitLayout` rollout (`ChatContent` 3-col + `EnhancedChatModule` 2/3-col); certified exceptions: `MobileChat`, `UnifiedGlobalChat`; `pnpm type-check` PASS. **Wave 3C-4:** **done (PLAN)** — PlatformShell standardization plan — [`PLATFORMSHELL_STANDARDIZATION_PLAN.md`](../docs/ux/PLATFORMSHELL_STANDARDIZATION_PLAN.md). **Wave 3C-4A:** **done** — `PlatformShell` foundation (`layouts/PlatformShell.tsx` + slot subcomponents); zero consumers; `pnpm type-check` PASS. **Wave 3C-4B:** **done** — `PlatformLeftSidebar` + `PlatformRightRail` extracted; `DashboardLayoutInner` + `DashboardLayoutWrapper` wired (behavior preserved); `pnpm type-check` PASS. **Wave 3C-4C:** **done** — `DashboardLayoutWrapper` → `PlatformShell` (`mode="business"`, `useNativePanels`); first production consumer; `pnpm type-check` PASS. **Wave 3C-4D:** **done (PLAN)** — header unification plan — [`PLATFORM_HEADER_STANDARDIZATION_PLAN.md`](../docs/ux/PLATFORM_HEADER_STANDARDIZATION_PLAN.md): Option B (`PlatformHeader` + shared tabs); unify before Inner → PlatformShell. **Wave 3C-4D.1:** **done** — `PlatformHeader` + `platformHeaderTabs` + `useNativeHeader` on `PlatformShell`. **Wave 3C-4D.2:** **done** — `GlobalHeaderTabs` → `PlatformHeader` (`mode="business"`); `DashboardLayoutWrapper` `useNativeHeader`. **Wave 3C-4D.3:** **done** — `DashboardLayoutInner` personal header → `PlatformHeader` (`mode="personal"`). **Wave 3C-4D.4:** **done** — `PlatformHeaderActionRow` shared by both headers. **Wave 3C-4E:** **done** — `DashboardLayoutInner` → `PlatformShell`. **Wave 3C-4F:** **done** — PlatformShell certified — [`PLATFORMSHELL_CERTIFICATION.md`](../docs/ux/audits/PLATFORMSHELL_CERTIFICATION.md) (**PASS WITH FINDINGS**); Wave 3C PlatformShell program **complete**; manual QA pending. **Wave 3C-5:** **done** — AI Chat deduplication — [`AI_CHAT_DEDUPLICATION_CLOSEOUT.md`](../docs/ux/audits/AI_CHAT_DEDUPLICATION_CLOSEOUT.md): `AIChatWorkspace` single implementation; `ai-chat/page.tsx` + `AIChatModule.tsx` thin entry points; `pnpm type-check` PASS. **Wave 3C-6:** **done** — Notifications layout consolidation — [`NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md`](../docs/ux/audits/NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md): `PageHeader` + `PageToolbar` primitives; `/notifications` double chrome removed; `pnpm type-check` PASS. **Wave 3C paused.** **Wave 3B-0:** **done (PLAN)** — Drive interaction completion review — [`DRIVE_INTERACTION_COMPLETION_REVIEW.md`](../docs/ux/DRIVE_INTERACTION_COMPLETION_REVIEW.md). **Wave 3B-1:** **done** — empty-trash permanent purge ConfirmModal — [`DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md`](../docs/ux/audits/DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md): `drive/trash/page.tsx` + `GlobalTrashBin.tsx`; 0 native empty-trash confirms; `pnpm type-check` PASS. **Wave 3B-3:** **done** — per-item permanent delete ConfirmModal — [`DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md`](../docs/ux/audits/DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md): trash page + GlobalTrashBin per-item flows; `pnpm type-check` PASS. **Wave 3B-2:** **done** — drag-to-trash parity — [`DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md`](../docs/ux/audits/DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md): `DriveModule` `handleDragEnd` → `requestMoveToTrash`; reuses existing `ConfirmModal`; `pnpm type-check` PASS. **Wave 3B-4:** **done** — folder create modal — [`DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md`](../docs/ux/audits/DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md): `DriveCreateFolderModal` + 7 prompt sites migrated; 0 scoped `prompt()`; `pnpm type-check` PASS. **Wave 3B-4b:** **done** — business workspace folder create parity — [`DRIVE_FOLDER_CREATE_BUSINESS_PARITY_BATCH3B4B_CLOSEOUT.md`](../docs/ux/audits/DRIVE_FOLDER_CREATE_BUSINESS_PARITY_BATCH3B4B_CLOSEOUT.md): `BusinessWorkspaceContent` → `DriveCreateFolderModal`; 0 Drive folder-create `prompt()`; `pnpm type-check` PASS. **Wave 3B-5:** **done** — keyboard + a11y pass — [`DRIVE_KEYBOARD_A11Y_BATCH3B5_CLOSEOUT.md`](../docs/ux/audits/DRIVE_KEYBOARD_A11Y_BATCH3B5_CLOSEOUT.md). **Wave 3B-6:** **done** — Drive interaction certification — [`DRIVE_INTERACTION_CERTIFICATION.md`](../docs/ux/audits/DRIVE_INTERACTION_CERTIFICATION.md) + [`DRIVE_REFERENCE_UX_SCORECARD.md`](../docs/ux/audits/DRIVE_REFERENCE_UX_SCORECARD.md): **Reference UX Module #1 — Approved with Findings**; 3B program **complete**. **Next:** Human QA matrix execution + Wave 5 numeric UX-L3 audit (program choice; not 3C-7 unless reprioritized).

## UX Modernization — Wave 1 Token Foundation (June 2026) ✅

**Status:** **SHIPPED** — `Spinner`, `EmptyState`, `Card`, `Input`, `Button`, `LoadingOverlay` on `v.*` tokens.

## UX Modernization — Wave 0 Foundation (June 2026) ✅

**Status:** **SHIPPED** — UX governance docs (`docs/ux/`), `ux-standards.mdc`, additive `--v-*` tokens in `web/src/styles/tokens.css` + Tailwind `v.*` namespace.

**Canonical:** [`docs/ux/UX_CONSTITUTION.md`](../docs/ux/UX_CONSTITUTION.md), [`UX_MODERNIZATION_ROADMAP.md`](../docs/ux/UX_MODERNIZATION_ROADMAP.md)

**Reference UX Module #1:** Drive / File Hub — **Approved with Findings** (3B-6 + 5A registration — [`REFERENCE_MODULE_DRIVE.md`](../docs/ux/audits/REFERENCE_MODULE_DRIVE.md)). **Wave 5A:** **done** — platform UX-L3 framework — [`UX_CERTIFICATION_STANDARD.md`](../docs/ux/UX_CERTIFICATION_STANDARD.md), [`UX_CERTIFICATION_SCORECARD.md`](../docs/ux/UX_CERTIFICATION_SCORECARD.md), [`REFERENCE_MODULE_PROGRAM.md`](../docs/ux/REFERENCE_MODULE_PROGRAM.md). **Wave 5B:** **done** — Chat UX certification — [`CHAT_UX_CERTIFICATION.md`](../docs/ux/audits/CHAT_UX_CERTIFICATION.md) + [`CHAT_UX_SCORECARD.md`](../docs/ux/audits/CHAT_UX_SCORECARD.md): **UX-L1 Certified with Findings**; Reference UX Module #2 **Rejected** (pending re-cert). **Wave 5B.1:** **done** — Chat interaction safety — [`CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md`](../docs/ux/audits/CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md): C-1/C-2/C-3 resolved. **Wave 5B.2:** **done** — Chat mobile parity — [`CHAT_MOBILE_PARITY_BATCH5B2_CLOSEOUT.md`](../docs/ux/audits/CHAT_MOBILE_PARITY_BATCH5B2_CLOSEOUT.md). **Wave 5B.3:** **done** — Chat UX re-certification — [`CHAT_UX_RECERTIFICATION_2026.md`](../docs/ux/audits/CHAT_UX_RECERTIFICATION_2026.md): **UX-L1 CwF**; Reference UX #2 **Rejected**. **Wave 5C:** **done** — Notifications UX certification (initial audit). **Wave 5C.1:** **done** — interaction safety — [`NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md`](../docs/ux/audits/NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md): N-1 resolved. **Wave 5C.2:** **done** — Notifications UX re-certification — **UX-L2 CwF** (9 PASS). **Wave 5D:** **done** — Todo UX certification (initial). **Wave 5D.1:** **done** — interaction safety — T-1 resolved. **Wave 5D.2:** **done** — Todo UX re-certification — [`TODO_UX_RECERTIFICATION_2026.md`](../docs/ux/audits/TODO_UX_RECERTIFICATION_2026.md): **UX-L1 CwF** (6 PASS / 5 PWF); L2/L3 not certified. **Wave 5D.3:** **done** — Todo layout/workflow — [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](../docs/ux/audits/TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md): T-2–T-5 resolved. **Wave 5D.4:** **done** — Todo UX re-certification — [`TODO_UX_RECERTIFICATION_2026_5D4.md`](../docs/ux/audits/TODO_UX_RECERTIFICATION_2026_5D4.md): **UX-L1 CwF** (8 PASS / 3 PWF); UX-L2 not met (one short). **Wave 5E:** **done** — Calendar UX certification — [`CALENDAR_UX_CERTIFICATION.md`](../docs/ux/audits/CALENDAR_UX_CERTIFICATION.md): **UX-L1 not certified** (2 PASS / 2 FAIL). **Wave 5E.1:** **done** — Calendar interaction safety — [`CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md): E-1–E-3, E-9 resolved; 0 native dialogs. **Wave 5E.2:** **done** — month workflow parity — [`CALENDAR_MONTH_WORKFLOW_PARITY_BATCH5E2_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_MONTH_WORKFLOW_PARITY_BATCH5E2_CLOSEOUT.md): E-4, E-5 resolved. **Wave 5E.3:** **done** — Calendar UX re-certification — [`CALENDAR_UX_RECERTIFICATION_2026_5E3.md`](../docs/ux/audits/CALENDAR_UX_RECERTIFICATION_2026_5E3.md): **UX-L1 CwF** (6 PASS / 5 PWF). **Wave 3C-7 plan:** **done** — [`CALENDAR_LAYOUT_MODERNIZATION_PLAN.md`](../docs/ux/CALENDAR_LAYOUT_MODERNIZATION_PLAN.md). **Wave 3C-7A:** **done** — [`CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md): E-6, E-7 resolved; month + business hub on `WorkspaceSplitLayout`. **Wave 3C-7B:** **done** — [`CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md): day/week/year on `CalendarPageShell`; mobile sidebar; E-8, E-10, E-16 resolved; `BusinessCalendarWidget` removed. **Wave 3C-7C:** **done** — [`CALENDAR_LAYOUT_POLISH_3C7C_CLOSEOUT.md`](../docs/ux/audits/CALENDAR_LAYOUT_POLISH_3C7C_CLOSEOUT.md): `EmptyState`, `ContextMenu` on chips, shortcuts help; E-11–E-13 resolved. **Wave 3C-7D:** **done** — [`CALENDAR_UX_RECERTIFICATION_2026_3C7D.md`](../docs/ux/audits/CALENDAR_UX_RECERTIFICATION_2026_3C7D.md): **UX-L1 Certified**; **UX-L2 CwF** (9 PASS). **3C-7 complete.** **Wave 5F:** **done** — [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](../docs/ux/PLATFORM_CERTIFICATION_GAP_ANALYSIS.md): platform gap report; fastest L2 = Todo; highest ROI = Calendar; Ref #2 = Notifications; Ref #5 = Calendar. **Wave 5G-Todo:** **done** — [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](../docs/ux/audits/TODO_L2_POLISH_BATCH5G_CLOSEOUT.md): T-8 shared `EmptyState`, T-9 overflow `aria-label`, T-7 partial responsive detail; `pnpm type-check` PASS. **Wave 5G-Todo-D:** **done** — [`TODO_UX_RECERTIFICATION_2026_5G.md`](../docs/ux/audits/TODO_UX_RECERTIFICATION_2026_5G.md): **9 PASS / 2 PWF**; **UX-L1 Certified**; **UX-L2 CwF**. **Wave 5G-QA (plan):** **done** — [`PLATFORM_MANUAL_QA_MATRIX.md`](../docs/ux/PLATFORM_MANUAL_QA_MATRIX.md) + [`PLATFORM_MANUAL_QA_RUNBOOK.md`](../docs/ux/PLATFORM_MANUAL_QA_RUNBOOK.md). **Wave 5G-QA-D:** **done** — [`PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md`](../docs/ux/audits/PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md): QA **not executed**; levels unchanged. **Next:** **5G-QA-EXEC** (human) → **5G-Calendar-D**.

---

## AI Conversation Reasoning Layer (June 2026) ✅

**Status:** **IMPLEMENTED** — deterministic pre-generation layer in `server/src/ai/conversation/`, wired into `DigitalLifeTwinCore` after query analysis.

**Canonical doc:** [`docs/architecture/AI_CONVERSATION_REASONING.md`](../docs/architecture/AI_CONVERSATION_REASONING.md)

**Behavior:** Detects objective (`explore` | `diagnose` | `decide` | `plan` | `execute` | `learn`), understanding confidence (0–100), premature-solution risk, and coaching policy. In explore/diagnose + low confidence, suppresses recommendation richness and injects coaching prompt blocks (reflect/probe vs generic advice).

**Diagnostics:** `metadata.conversationReasoning` on twin responses; logged at `[AI_CONTEXT_ASSEMBLY]`.

---

## Most recent completed project — Notebook Level 3 Certified (June 2026) ✅

**Status:** **Level 3 — Certified** (composition module). **Not** Reference Module #5 — Place is Reference #5 **Strong Candidate** (**Level 2 Certified**).

**Evidence:** [`NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md), [`CERTIFICATION_LEDGER.md`](../docs/architecture/CERTIFICATION_LEDGER.md)

**Next:** Business Workspace Wave 1A+ shell hardening, then Dashboard / Analytics modernization. Optional Place post-Reference hygiene PL-H1–H7.

**Place Wave 4B (2026-06-02):** **Reference Module #5 designated** — [PLACE_REFERENCE_COUNCIL_REVIEW.md](../docs/architecture/audits/PLACE_REFERENCE_COUNCIL_REVIEW.md). Council vote: **Approve**.

**Place Wave 4A (2026-06-02):** Reference #5 evidence package.

**Place Wave 2D (2026-06-02):** **Level 2 — Certified** — [PLACE_LEVEL2_CERTIFICATION_REVIEW.md](../docs/architecture/audits/PLACE_LEVEL2_CERTIFICATION_REVIEW.md).

**Place Wave 2C (2026-06-03):** [PLACE_LEVEL2_READINESS_REVIEW.md](../docs/architecture/audits/PLACE_LEVEL2_READINESS_REVIEW.md) — P0 cleanup complete; eligible for L2 review.

**Place Wave 2A (2026-06-03):** Global Trash + V_Link + platform entities + Notebook `PLACE_LISTING` validation.

**Place Wave 1G (2026-06-03):** `placeCommunityService`; dismiss in `placeService`; `getEnrichedPlaceGraph`; connection boundary; transactions deferred — **Wave 1 extraction complete**.

**Place Wave 1F (2026-06-03):** `placeAIActionService`; ActionExecutor/toolExecutor read-only twins; thin `placeAIController`.

**Place Wave 1D (2026-06-03):** Listing/meeting write services + Calendar fix.

---

## Platform Standards Migration Batches 1–4 (May 2026) ✅

**Status:** **IMPLEMENTED** — Constitutional framework published **and** core migration batches executed in code (manifest/provisioning, workspace gaps, trash, events, V_Link resolvers, job registry).

**Canonical doc:** [`docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)  
**Agent rule:** `.cursor/rules/platform-standards.mdc`  
**Migration tracker:** §30 in constitutional doc + [`memory-bank/progress.md`](progress.md)

### What shipped

| Batch | Outcome |
|-------|---------|
| **1 Foundation** | `BUILT_IN_MODULE_IDS`; manifest reconcile (`builtInModuleManifests.ts`); `moduleProvisionController` all 10 built-ins; `todo`/`place` in `BusinessWorkspaceContent` + `coreModuleRegistry`; ActionExecutor `todo` alias; `testingStrategy.md` → Vitest |
| **2 Contracts** | Notes `trashedAt` + migration `20260628120000_notes_trashed_at`; module activity on todo/notes create-delete; `moduleMutationPolicyDual`; notification domain-event subscriber (file.shared, member.added, module.installed) |
| **3 Integration** | V_Link resolvers for TASK/TODO, NOTE, CHAT_CONVERSATION; `orgChartPolicyAdapter.ts`; `BrandedWorkDashboard` → `MODULE_ICONS`; extended `ModuleCapability` type |
| **4 Platform infra** | `registerPlatformJob()` + `platformCronJobs.ts`; cleanup dedupe; workflow router + search index stubs on domain event bus |

### Key paths

- `server/src/constants/builtInModuleIds.ts`
- `server/src/startup/builtInModuleManifests.ts`
- `server/src/jobs/platformJobRegistry.ts`, `platformCronJobs.ts`
- `server/src/auth/moduleMutationPolicyDual.ts`, `orgChartPolicyAdapter.ts`
- `server/src/services/vlinkEntityResolverService.ts` (expanded)
- `docs/architecture/LEGACY_CLEANUP.md`, `DOMAIN_EVENTS.md` (adoption matrix)

### Deploy note

Run `pnpm prisma:migrate:deploy` for Notes Global Trash migration before relying on `trashedAt` in production.

### Deferred (next platform work)

- Extract `todoService` / `notesService`; slim `toolExecutor` + `ActionExecutor`
- hr/scheduling module activity + domain events
- Retire dead `WorkspaceLanding` components or wire hubs
- Wrap `WorkflowAutomationService` behind domain-event workflow router
- Optional `drive` → `file-hub` module id rename

**Cross-ref:** Runtime Kernel, extension boundaries, read/write paths, tiers — all in constitutional doc §1–3, §16, Appendix B.

---

## Context Provider Contract Phase A / B / B.5 (May 2026) ✅

**Status:** **IMPLEMENTED** — Intent-aware **Context Provider Orchestrator** replaces ad-hoc module fetches in `CrossModuleContextEngine`; pipeline grounding for module-backed sources; metadata-only **orchestration snapshots** for replay/debug.

**Canonical docs:**
- [`docs/guides/AI_CONTEXT_PROVIDER_API.md`](../docs/guides/AI_CONTEXT_PROVIDER_API.md) — provider API + orchestrator + snapshots
- [`docs/architecture/AI_CONTEXT_ASSEMBLY.md`](../docs/architecture/AI_CONTEXT_ASSEMBLY.md) — assembly + orchestration flow
- [`memory-bank/aiContextSystem.md`](aiContextSystem.md) — full AI context system reference (orchestrator section)

### Phase A — Orchestrator core ✅

| Delivered | Path / behavior |
|-----------|-----------------|
| **Contract types** | `shared/src/types/ai-context-provider-contract.ts` |
| **Orchestrator** | `ContextProviderOrchestrator.ts` — selection, fetch, lazy `fullContext` (`lazyUserContext.ts`) |
| **Registry / selection** | `contextProviderRegistry.ts`, `contextProviderSelection.ts`, `legacyProviderCanHandle.ts`, `fetchModuleContextProvider.ts` |
| **Engine delegate** | `CrossModuleContextEngine.getContextForAIQuery` → orchestrator (legacy if `AI_CONTEXT_ORCHESTRATOR_ENABLED=false`) |
| **Twin wiring** | `DigitalLifeTwinCore` — scope (`businessId`, `dashboardId`, `householdId`, `requestId`); `contextGenerations[]` cap **2** |
| **`contextGenerationId`** | New UUID **per orchestration pass** (module fetch + optional grounding pass) |

### Phase B — Metadata, grounding bridge, diagnostics ✅

| Delivered | Notes |
|-----------|--------|
| **Wave-1 provider metadata** | `registerBuiltInModules.ts`: `drive`, `calendar`, `chat`, `place`, `hr`, `scheduling` — optional `supportedIntents`, `retrievalCost`, `priority`, `pipelineSourceIds`, `volatility`, `freshnessPolicy` |
| **Certification parse** | `parseContextProviders` preserves optional metadata from registry JSON |
| **Grounding bridge** | `pipelineGroundingRetrieval` → `orchestratePipelineModuleSources` for `vssyl_place`, `drive_files`, `calendar`; **no double-fetch** when `existingModuleContexts` has place/drive/calendar |
| **Platform sources unchanged** | `location`, `vlink`, `web_search`, `business_context` |
| **Freshness diagnostics** | `contextProviderFreshness.ts` — `fresh` \| `stale` \| `unknown`, `staleContextWarnings[]` (no invalidation/SWR yet) |
| **Required grounding (hybrid)** | `requiredSourceFailures` always recorded; block only when enforcement `block` / `regenerate` |
| **Diagnostics** | `contextDensityReport.orchestration`, `mapPipelineTraceInputs`, `ai-context-debug` — selection, grounding map, generations |
| **Build order** | Root `type-check` / `verify:ci` run `build:shared` first; server `pretest` / `pretype-check` build shared |

### Phase B.5 — Orchestration snapshots ✅

| Delivered | Notes |
|-----------|--------|
| **Types** | `shared/src/types/ai-orchestration-snapshot.ts` — `AIOrchestrationSnapshot` |
| **Builder** | `orchestrationSnapshot.ts` — `buildOrchestrationSnapshot`, `deriveOrchestrationTraceTags`, `redactQueryPreview` |
| **Emit** | Structured log `operation: ai_orchestration_snapshot`; in-request `query.context.orchestrationSnapshots[]` (cap 2); trace `contextDensity.orchestration.snapshots` |
| **`orchestratorVersion`** | Central constant `phase-b5-v1` (bump when selection/freshness/ranking semantics change) |
| **`traceTags`** | Deterministic: `grounding_failure`, `required_source_failure`, `stale_context`, `admin_debug`, `grounding_boost`, `fallback_provider`, `high_latency`, `sampled_snapshot` (prod emit) |
| **Env** | `AI_ORCHESTRATION_SNAPSHOT_ENABLED` (default off prod), `AI_ORCHESTRATION_SNAPSHOT_SAMPLE_RATE`, `AI_ORCHESTRATION_SNAPSHOT_LOG_LEVEL` |
| **Admin** | `POST /api/ai-context-debug/assemble` uses `snapshotForce: true` |

**Env (orchestrator):** `AI_CONTEXT_ORCHESTRATOR_ENABLED=false` → legacy `getContextForAIQueryLegacy` path.

**Tests:** `contextProviderSelection.test.ts`, `contextProviderOrchestrator.test.ts`, `lazyUserContext.test.ts`, `contextProviderFreshness.test.ts`, `contextProviderRegistryMetadata.test.ts`, `pipelineGroundingRetrieval.orchestrator.test.ts`, `orchestrationSnapshot.test.ts`, `mapPipelineTraceInputs.test.ts` (60+ cases in context/grounding suite).

**Deferred (Phase C — not started):** runtime `invalidatedByEvents` cache bust; websocket context refresh; stale-while-revalidate queues; health-based adaptive ranking; Active Context Graph; dedicated snapshot Prisma table + replay API; Test Lab snapshot UI panel; vector/embedding routing in orchestrator.

**Next (Phase C candidates):** event invalidation subscriber; optional `AI_CONTEXT_FRESHNESS_RANKING_ENABLED`; admin Test Lab orchestration snapshot card; certification validator for optional metadata shapes.

**Cross-ref:** `memory-bank/progress.md` (Context Provider Contract); `memory-bank/aiContextSystem.md` (orchestrator + snapshots).

---

## V_Link AI Pipeline integration (May 2026) ✅

V_Link is a **first-class AI Pipeline Context Source** (`vlink` / V_Link Relationships): registry + idempotent DB reconcile (context sources + grounding rules), permission-filtered runtime grounding in `DigitalLifeTwinCore`, `persistedVLinks` entity linking, and pipeline traces with `source: vlink`.

---

## V_Link platform layer (May 2026) ✅

**Status:** **IMPLEMENTED** — platform-wide contextual relationship layer (not a marketplace module).

**Canonical plan:** [`docs/plans/V_LINK_PLATFORM_LAYER_PLAN.md`](../docs/plans/V_LINK_PLATFORM_LAYER_PLAN.md)  
**Product context:** [`memory-bank/vlinkProductContext.md`](vlinkProductContext.md)

**Shipped (VL-0–VL-10):**
| Area | Delivered |
|------|-----------|
| **Schema** | `prisma/modules/platform/vlink.prisma`; migration `20260601120000_vlink_platform_foundation` |
| **API** | `/api/vlinks` — CRUD, members, entity link/unlink, archive, ownership transfer, suggestions, activity |
| **Events + search** | 14 `vlink.*` domain events; global search provider `vlink` |
| **Hub UI** | `/vlink` — filters, detail tabs (Files/Calendar functional; Chat/Tasks placeholders) |
| **Shell** | Right-sidebar icon under AI; drag-to-link + `VLinkConnectModal` |
| **Integrations** | Drive (indicators, context menu, upload toast); Calendar (`EventDrawer`, event chips) |
| **AI** | Context provider + **pipeline source `vlink`**; `entityLinking` persisted vlink merge; traces show `source: vlink` |

**AI pipeline completion (May 2026):** V_Link is a first-class Admin Portal Context Source (`vlink` / V_Link Relationships). Confirmed vlinks ground the twin via `vlinkPipelineContextService`; unapproved suggestions never ground responses.

**Corrective fix (May 2026):** Grounding rules now reconcile idempotently (`reconcileSystemPipelineGroundingRules`) so existing DBs receive optional `vlink` on system intents without overwriting admin-customized non-system rows.

**Non-negotiable (v1):** V_Link membership **does not** grant access to linked entity content; membership-only access (no UNLISTED); one primary vlink per entity.

**Ops follow-up:** `pnpm prisma:migrate:deploy` (includes `20260601120000_vlink_platform_foundation`).

---

## AI platform execution principles (May 2026) ✅

**Status:** **IMPLEMENTED (May 2026)** — Phases **1–4** and **Autonomy A1–A8** shipped per [`docs/plans/AI_PLATFORM_MATURITY_PLAN.md`](../docs/plans/AI_PLATFORM_MATURITY_PLAN.md).

**Docs:**
- **What to build:** `docs/plans/AI_PLATFORM_MATURITY_PLAN.md` (Memory → Learning → Cross-module → Extensibility)
- **How to build:** `docs/plans/AI_PLATFORM_EXECUTION_PRINCIPLES.md`

**Anchor principle:** **Visible Intelligence > Hidden Intelligence** — a feature is not real unless the user can feel it, the system can explain it, and diagnostics can prove it.

**Ship summary (this run):**
| Track | Status |
|-------|--------|
| Phase 1 Memory (1A–1E) | ✅ |
| Phase 2 Learning (2A–2D) | ✅ |
| Phase 3 Cross-module (3A–3D) | ✅ |
| Phase 4 Extensibility (4A–4D) | ✅ |
| Autonomy de-emphasis (A1–A8) | ✅ |

**Ops follow-up (not code):** deploy pending migrations (`20260521180000_user_memory_fact_provenance`, `20260521190000_module_context_provider_cache`, `20260521200000_webhook_subscriptions`) when ready.

## AI Phase 5 — Ambient Contextual Assistance (May 2026) ✅

**Status:** **IMPLEMENTED (May 2026)** — Phases **5A–5F** complete per [`docs/plans/AI_AMBIENT_CONTEXTUAL_ASSISTANCE_PLAN.md`](../docs/plans/AI_AMBIENT_CONTEXTUAL_ASSISTANCE_PLAN.md).

**Canonical plan:** [`docs/plans/AI_AMBIENT_CONTEXTUAL_ASSISTANCE_PLAN.md`](../docs/plans/AI_AMBIENT_CONTEXTUAL_ASSISTANCE_PLAN.md)

**Goal:** Move from “AI that answers with context” to “AI that gently helps users navigate life and work by surfacing relevant, explainable suggestions.” **Not autonomy** — user accepts, dismisses, or ignores; no auto-execution.

**Builds on Phases 1–4:** memory influence, learning signals, context density, `contextUsed` / `responseInfluence`, context synthesis, domain events, webhook infrastructure, provider health, explain drawer, Learning tab, Memory tab.

**Subphases:** 5A model + lifecycle → 5B event correlation → 5C meeting/file/thread rules → 5D UI surfaces → 5E feedback + learning loop → 5F admin diagnostics + tests.

**Phase 5A (May 2026):** ✅ Schema + `ambientSuggestionService`; domain event → signal → document upload suggestion; API tenant filters + explain GET; migration `20260522120000` + `20260522120100`

**Phase 5B (May 2026):** ✅ `SuggestionCorrelationService`, `SuggestionRankingService`, `suggestionRules.ts`; async consumer path; hourly expiry cron; tests

**Phase 5C (May 2026):** ✅ `meeting_prep_v1`, `file_after_chat_v1`, `thread_activity_spike_v1` rules; entity linking for file/chat; correlation integration tests

**Phase 5D (May 2026):** ✅ `AmbientSuggestionCard`, `AmbientSuggestionsView` tab; dashboard `ai` widget wired; header dropdown explain expander; NotificationsWidget `ai` category; GET `/api/ai/suggestions?scope=history|all`

**Phase 5E (May 2026):** ✅ Dismissal decay in ranking; 90d do-not-show-again; repeated-accept → pending Learning proposal; quiet hours defer outbound `ai_suggestion` notification; correlation rule id in learning signals

**Phase 5F (May 2026):** ✅ Admin suggestion dry-run + funnel metrics; `SuggestionCorrelationDryRunPanel` on Test Lab; `ambientSuggestionAcceptance.test.ts` (§14); Phase 5 exit criteria met

**Next:** Phase 5 ambient assistance is **complete** — optional polish or Phase 6 per maturity plan.

### Implementation log (May 2026)
- **Autonomy de-emphasis A1–A8:** Action-boundaries copy; More → Actions hidden unless `NEXT_PUBLIC_AI_ACTIONS_UI=true`; onboarding/widget proactive toggle removed; pattern insights copy softened (`PredictiveIntelligenceDashboard`); `/api/ai/autonomous/*` + `AutonomyManager` deprecated in code (prompt boundaries via `PreferenceResolver` only); admin AI Context docs updated
- **Phase 1A (Memory):** Tenant-safe list filters, `PATCH /api/ai/memory/facts/:id`, expiry in resolver, business membership validation, dedupe on create, household scope rejected
- **Phase 1B (Memory provenance):** `sourceType`, `category`, `isExplicit` on `UserMemoryFact`; remember-that wiring; UI source badges; influence metadata
- **Phase 1C (Memory retrieval):** `MemoryRetrievalService` + `memoryScoring`; unified twin/resolver path; pipeline trace memory influence fields
- **Phase 1D (Influence UX):** Assembler explicit/inferred injection tiers; `memoryItems` in `responseInfluence`; explain drawer “Memories that shaped this reply”; Memory tab “Why I remembered this” expandable + source conversation link
- **Phase 1E (Memory UX + Phase 1 exit):** Edit/forget memories; filters (scope/category/source); pin via confidence; expiry on create/edit; Identity → “Manage in Memory”; Phase 1 exit tests (personalization, tenancy)
- **Phase 2A (Learning contract):** `LearningProposal` types; `learningEventContract` artifact envelope; one sync primary event per interaction + async derived upserts; human-reviewable filter in personal learning list; fixed pattern/prediction/insight parsing
- **Phase 2B (Behavioral signals):** `userLearningSignalService`; suggestion accept/dismiss + feedback + module usage signals; `POST /api/ai/learning/signals`; tenant-scoped `dashboardId`/`businessId` in signal payload
- **Phase 2C (Learning application):** `LearningApplicationService` promotes approved events → `UserMemoryFact` / `UserAIContext` / personality traits; confidence bump on approve, decay on dismiss; `PreferenceResolver` consumes applied events (`learning_applied` inferred kind); `GET /api/ai/learning/what-changed`; Learning tab **What changed** before/after UI; context promote records last promotion
- **Phase 2D (Learning observability):** Pipeline trace `learningRetrieved` stages (extract → pending → promote → resolver); learning confidence in explain drawer `learningItems`; collective patterns gated on `allowCollectiveLearning` (opt-in toggle in Learning tab); `PatternAnalysisScheduler` env-gated (`ENABLE_PATTERN_ANALYSIS_SCHEDULER`); LearningDashboard fake fallback metrics removed
- **Phase 3A (Context density):** `contextDensityReport` on pipeline trace + twin metadata summary; provider fetch audit (attempt/success/fail/cache/failure reason); assembly metrics from `assembleAIContext`; admin Test Lab + `POST /api/ai-context-debug/assemble`; dev flag `NEXT_PUBLIC_AI_CONTEXT_DENSITY_DEBUG`
- **Phase 3B (Fetch policy & provider cache):** Multi-module queries fetch high+medium modules via `resolveModulesToFetch`; sub-intent provider selection (`selectContextProvider`); per-provider cache on `ModuleInstallation.contextProviderCache` (keyed `provider:scope`); @mention aliases for todo, notes, place, dashboard; `businessId` passed consistently via `buildModuleContextFetchParams`; migration `20260521190000_module_context_provider_cache`
- **Phase 3C (Context synthesis):** Synthetic cross-module insights gated (`AI_SYNTHETIC_CONTEXT_ENABLED`); `ContextSynthesisService` + `entityLinking` v1 (chat↔calendar people, chat↔drive files); data-backed **Cross-module summary** block in assembler; `identifyCrossModuleConnections` uses entity links; admin assemble dry-run exposes `crossModuleSynthesis` + `referencesMultipleModules`
- **Phase 3D (Context budget & used vs available):** `ContextBudgetManager` tier allocation (35/25/25/15) with drop reasons; blocks marked `available`/`usedInPrompt`; `contextAvailability` on assembled context; `contextUsed` in `responseInfluence` + explain drawer; metadata `contextUsed` lists module names actually injected
- **Phase 4A (Domain events + AI consumption):** Adopted `chat.message.sent`, `calendar.event.created`, `module.enabled`/`module.disabled`; `AIEventConsumer` → `domain_event` learning stubs (idempotent); proactive upload suggestion unchanged at emit site; documented payload schemas in `DOMAIN_EVENTS.md`
- **Phase 4B (Module AI Context API hardening):** Canonical **`docs/guides/AI_CONTEXT_PROVIDER_API.md`**; `moduleContextProviderCertification` + marketplace validator 1.1.0 (fail without valid providers); admin **`POST /api/admin/ai-pipeline/context-providers/health`** + Test Lab **Context Provider Health** panel; timeout/payload limits in `moduleContextProvider` constants
- **Phase 4C (Webhook subscriptions MVP):** `WebhookSubscription` + delivery attempts schema; HMAC signing (`webhookSigning.ts`); retry/dead-letter delivery; domain event fan-out (`module.installed`, `file.shared`); signed **`ActionExecutorRegistry`** webhook path; business admin API + settings webhooks shell; **`docs/architecture/WEBHOOK_SUBSCRIPTIONS.md`**
- **Phase 4D (SDK boundaries + Phase 4 exit):** **`docs/guides/MODULE_AI_SDK_BOUNDARIES.md`**; AI maturity gates G1–G7 in third-party pipeline docs; reference manifest **`docs/test-modules/full-ai-contract-module.json`** + certification test

**Phase 4 (Extensibility) — COMPLETE. Autonomy de-emphasis — COMPLETE.**

---

## Dynamic AI orchestration registry — R0–R5 (May 2026) ✅

**Status:** **COMPLETE** — Admin-managed **orchestration registry** for intents, context sources, tool policies, and grounding rules. Validated, archive-only lifecycle, audit on every mutation. Foundation for a future cognitive/relationship graph — not plain CRUD.

**Canonical doc:** `docs/architecture/AI_PIPELINE_ADMIN_TOOLS.md` (§ Dynamic AI orchestration registry)

**Commits on `main`:** `c648ce2d` (R0–R5), `966a8121` (type-check seed types)

| Slice | Delivered |
|-------|-----------|
| **R0** | String-compatible registry IDs; `SYSTEM_*_IDS`; no silent ID stripping in `pipelineCatalogService` |
| **R1** | Prisma registry metadata (`isSystem`, `archived`, `capabilities`, `runtimeKind`, `mappedTools`, …); migration `20260520120000_ai_pipeline_registry_metadata` |
| **R2** | `pipelineRegistryValidator.ts` — `validateRegistryChange`, `buildRegistryGraph`, `buildCatalogValidationSummary` |
| **R3** | `pipelineRegistryService.ts` — create/duplicate/archive/restore/enable/disable + policy audit |
| **R4** | Admin APIs: `POST /registry/validate`, `GET /registry/graph`, registry CRUD under `/policies/*` |
| **R5** | Registry UI shell, filters, validation panel, dependency chips; full create/duplicate/archive on **Intents**; filters + modal editors on sources/tools/grounding |

**Product decisions (v1):**
- One grounding rule per intent (PK = `intentId`)
- Archive only — no hard delete
- Auto-create grounding rule on intent create (UI checkbox, default on when `groundingRequired`)
- Custom `mappedTools[]` on context source rows
- Capability flags: `executable`, `inferable`, `retrievalEnabled`, `enforceable`
- Tool `runtimeKind`: `openai_tool` \| `prepass` \| `policy_only`
- **Custom intents are policy metadata only** until catalog-driven inference (**v2**)

**Key paths:** `server/src/ai/pipeline/pipelineRegistryIds.ts`, `pipelineRegistryValidator.ts`, `pipelineRegistryService.ts`, `pipelineCatalogMappers.ts`, `web/src/components/admin-portal/ai-pipeline/registry/`

**Deploy:** `pnpm prisma:migrate:deploy` (includes `20260520120000`); `pnpm prisma:build` after module schema changes.

**Tests:** `server/src/ai/pipeline/__tests__/pipelineRegistryValidator.test.ts` (9 cases)

**Deferred (intentional):** catalog-driven inference for custom intents; graph visualization UI; `web_search` runtime; provider/prompt changes; hard delete.

**Cross-ref:** `memory-bank/progress.md` (Dynamic AI orchestration registry); Admin AI Pipeline Phases 1–5 + operations console below.

**Next:** Extend create/duplicate/archive modals to sources/tools/grounding pages; v2 catalog-driven inference; optional graph UI.

---

## Admin AI Pipeline tools — Phases 1–5 (May 2026) ✅

**Status:** **COMPLETE** — Admin Portal **AI Pipeline** instruments the live Digital Life Twin for grounding/orchestration inspection, editable policies, test lab, enforcement, evidence viewer, and compliance export. Additive; does not replace `QueryIntent` or rewrite provider prompts by default.

**Canonical doc:** `docs/architecture/AI_PIPELINE_ADMIN_TOOLS.md`

| Phase | Delivered |
|-------|-----------|
| **1A–1B** | `buildPipelineTrace`, catalog, twin `metadata.pipelineTrace`, admin APIs, history `_pipelineTrace` |
| **1 UI** | `/admin-portal/ai-pipeline` hub, diagnostics, test-lab, read-only catalog, AI System card |
| **2** | `AIPipelineDiagnostic` persistence, quality stats dashboard, sampling env |
| **3** | DB-backed intent/grounding/source/tool policies + audit log + editable admin UI |
| **4** | Enforcement modes (off/disclose/block/regenerate), Place + IP location prepass, response gating |
| **5** | `evidenceBundle` (assembled vs structured vs tools), retention/export/purge |

**Key paths:** `server/src/ai/pipeline/*`, `server/src/routes/admin-portal/adminPortalRoutes.aiPipeline.ts`, `web/src/app/admin-portal/ai-pipeline/`, `prisma/modules/ai/ai-pipeline.prisma`

**Env:** `AI_PIPELINE_DIAGNOSTICS_ENABLED`, `AI_PIPELINE_DIAGNOSTIC_SAMPLE_RATE`, `AI_PIPELINE_ENFORCEMENT_ENABLED`, `AI_PIPELINE_ENFORCEMENT_MODE`

**Operations console (May 2026):** Hub health metrics, live activity feed, trace insights (`pipelineTraceInsights.ts`) — commits `c877cf9f`, `4066c4e7`.

**Deploy:** `pnpm prisma:migrate:deploy` (migrations `20260520010440` … `20260520013518`, **`20260520120000_ai_pipeline_registry_metadata`**)

**Tests:** `server/src/ai/pipeline/__tests__/` (32+ vitest cases incl. registry validator)

**Cross-ref:** `memory-bank/progress.md` (Admin AI Pipeline + Dynamic registry); `memory-bank/aiContextSystem.md` (assembled context)

**Next:** Registry UI parity on sources/tools/grounding; optional scheduled retention purge cron; wire `web_search` when product-ready; v2 catalog-driven inference for custom registry entries.

---

## AI cross-session memory recall — hardened (May 2026) ✅

**Status:** **COMPLETE** — Cross-session “we last talked about…” recall is production-shaped: broader intent detection, combined lexical scoring, topics fallback when `threadSummary` is missing, recall-biased `UserMemoryFact` loading, backfill for historical messages, and integration tests.

**Architecture (canonical):** `memory-bank/AI_CONTEXT_MEMORY_ARCHITECTURE.md`

**Commits on `main`:**
- `8432ed83` — `feat(ai): wire module context, thread memory, recall, and user facts into twin` (initial MVP)
- `297f4ffc` — `fix(ai): harden cross-session memory recall for production reliability`

**Layers (twin path):**

| Layer | Implementation |
|-------|----------------|
| Same-thread | `conversationContinuity.ts`, last 20 `AIMessage` rows, metadata on assistant turns |
| Cross-thread summaries | `AIConversation.threadSummary`, `topics` JSON; `GET /api/ai-conversations/memory/recent`, `/memory/topics` |
| Semantic recall | `AIMessageRecallIndex` + `indexAIMessageForRecall` on `POST .../messages`; `recallRelevantMessages` when `hasExplicitRecallIntent` |
| User facts | `UserMemoryFact` + `/api/ai/memory/facts`; on recall queries, top high-confidence facts even with weak token overlap |
| Module live context | `moduleContexts` in `assembleAIContext`; enterprise/non-conversation legacy prompt also gets `MODULE LIVE CONTEXT` |

**Recall intent (`server/src/ai/utils/recallIntent.ts`):** Phrases like “we last talked”, “what were we talking about”, “continue our trip planning”, “that vacation”, “those places you mentioned”, “where were we”, “what were the options”, plus travel follow-ups.

**Scoring (`recallScoring.ts`):** `combinedRecallScore` = semantic + keyword overlap + travel boost; recall queries use lower min similarity (`0.08`) and travel-snippet fallback when scores are empty.

**Assembler:** When `threadSummary` is null but `topics` exists, injects **“Recent conversation topics (other threads)”** with `activeTopic`, constraints, last assistant summary. Recalled chunks appear as **“Recalled prior messages (semantic)”** (private to providers via `assembledContext`).

**Backfill (deploy once per env):**
```bash
pnpm prisma:migrate:deploy   # includes 20260518120000, 20260518120100, 20260518120200
pnpm --filter vssyl-server backfill:ai-recall-index
```

**Migrations:** `20260518120000_ai_conversation_thread_memory`, `20260518120100_user_memory_facts`, `20260518120200_ai_message_recall_index`

**Tests:** `server/src/services/__tests__/aiMemoryRecall.integration.test.ts`, `server/src/routes/__tests__/ai-memory-routes.integration.test.ts`, `server/src/ai/utils/__tests__/recallIntent.test.ts`, `server/src/ai/context/__tests__/recallContextAssembly.test.ts`

**Preserved:** Conversation mode stays lean (no noisy module blocks in casual answers); enterprise modes unchanged; memory mechanics not surfaced in user-facing copy.

**Cross-ref:** `memory-bank/progress.md` (AI memory recall hardening); `memory-bank/aiContextSystem.md` (twin pipeline § Digital Life Twin).

**Next:** Production backfill after migrate; optional Phase E continuity QA on all AI chat surfaces; consider stronger embeddings later (out of scope for this hardening pass).

---

## AI Identity UX (May 2026) — Phases 0–4 ✅

**Status:** **COMPLETE** — `/ai` restructured as **AI Identity** (not a settings graveyard); identity snapshot API, chat explainability, Workspace AI employee drawer, Insights polish.

| Phase | Delivered |
|-------|-----------|
| **0** | Tabs: AI Identity, Learning, Memory, Behavior, More; legacy URL redirects |
| **1** | `GET /api/ai/identity`; `AIIdentityHome` influence stack |
| **2** | `metadata.responseInfluence`; `AIResponseExplainDrawer`; `AILearningNotice` in `/ai-chat` |
| **3** | `WorkspaceAIDrawer`; admin Workspace AI copy; `policyDigest` on employee-access |
| **4** | Insights collapsed (3 sub-tabs + activity strip); orphan components removed; docs updated |
| **5** | First-visit tour (Style / Learning / Memory); warm first-person microcopy; influence stack motion |

**Routes:** `/ai` default identity; `/ai?tab=more&section=insights`; legacy `?tab=intelligence` redirects. **Tour:** `AIIdentityTour` + `Tour` replay in header; `vssyl_ai_identity_hub_tour_v1` in localStorage.

**Docs:** `docs/architecture/AI_INTELLIGENCE_HUB.md` (Insights), `AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md`.

---

## AI Control Center → Digital Life Twin wiring (May 2026) ✅

**Status:** **COMPLETE** — Phases **0A–5** shipped; personal Control Center settings, consent-gated inferred learning, session style promotion, business policy injection, and Intelligence hub are wired into the live `/api/ai/twin` path.

**Architecture (canonical — do not duplicate here):**
- `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md` — single prompt path; legacy `buildDigitalTwinPrompt` removed (Phase 0B)
- `docs/architecture/AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md` — personal prefs vs `BusinessAIDigitalTwin` when `context.businessId` set (Phase 4)
- `docs/architecture/AI_INTELLIGENCE_HUB.md` — More → Insights (formerly Intelligence tab)

**Phase summary:**

| Phase | Delivered |
|-------|-----------|
| **0A** | `PreferenceResolver` merges `UserPreference`, `AIPersonalityProfile`, `AIAutonomySettings`, active `UserAIContext`, `UserMemoryFact` → `assembleAIContext` + provider options (`DigitalLifeTwinCore`) |
| **0B** | Canonical routes documented; monolithic twin prompt removed |
| **1** | `/ai?tab=memories` — facts CRUD, effective-preferences preview, onboarding hooks (`AIMemoriesView`) |
| **2** | `UserAIContext.learningStatus` (`active` \| `pending` \| `dismissed`); extraction → pending; `GET /api/ai/context/pending`, review + `POST /api/ai/teach`; only **active** in prompts |
| **3** | Questionnaire → soft prose templates; session detection/overrides; `POST /api/ai/preferences/promote-session`; chat learning banner (`AILearningNotice`) |
| **4** | `businessWorkspaceBoundaries` + business policy context block; effective preview stays `preferenceScope: personal` |
| **5** | Intelligence hub; personal `AILearningEvent` review (`GET/PUT /api/ai/learning/events`); orphaned dashboards routed with `embedded` |

**Key APIs:** `GET /api/ai/effective-preferences`; `GET/PUT /api/ai/autonomy/settings`; `GET/POST/DELETE /api/ai/personality/profile`; `GET /api/ai/learning/events`; `POST /api/ai/preferences/promote-session`.

**UI:** `/ai` — see **AI Identity UX** above for current tab IA. Business learning events remain on Workspace AI admin (separate from personal).

**Migration (deploy):** `20260518130000_user_ai_context_learning_status` — run `pnpm prisma migrate deploy` if not applied.

**Git:** `789c5f05` on `main` — `feat(ai): wire Control Center preferences into Digital Life Twin pipeline`.

**Tests:** `server/src/ai/preferences/__tests__/*`, `preferenceContextAssembly`, `businessWorkspaceBoundaries`, `userAIContextLearningService`, `personalAILearningEventsService`, `digitalLifeTwinPromptPipeline`.

**Cross-ref:** `memory-bank/progress.md` (AI Control Center audit); `memory-bank/aiContextSystem.md` (§ Digital Life Twin preferences).

**Next product focus:** Phase E conversational hardening checklist (optional); production validation of Intelligence API endpoints; continue structured logging migration.

---

## Platform hardening phase (May 2026) ✅

**Status:** Complete — policy engine, domain events, workspace realtime, marketplace certification gates, and Drive authorization are in production shape for wired paths. **No further horizontal hardening** unless a feature requires it.

**Quick refs:** `memory-bank/progress.md` (Platform Hardening Phase Complete table); `docs/architecture/POLICY_ENGINE.md`, `DOMAIN_EVENTS.md`, `WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`.

**Implementation map (agents):**

| Concern | Where |
|---------|--------|
| Policy actions / engine | `server/src/auth/policyActions.ts`, `policyEngine.ts` |
| Dual enforcement | `drivePolicyDual.ts`, `businessMemberPolicyDual.ts`, `businessUpdatePolicyDual.ts`, `moduleInstallPolicyDual.ts`, `moduleUninstallPolicyDual.ts` |
| Domain events | `server/src/events/domainEventRegistry.ts`, `domainEventEmitters.ts` |
| Drive permissions | `server/src/services/drivePermissionHelpers.ts` |
| Certification gate | `server/src/services/moduleVersionCertificationGate.ts` |
| Workspace + socket | `web/src/runtime/`, `web/src/lib/realtimeClient.ts` |

**Known Drive deferrals:** restore/hard-delete/reorder/revoke policy; task-dashboard upload (`assertUserOwnsDashboard` vs folder write); socket events target actor not file owner.

**Tests:** server vitest ~286; web runtime ~22 (CI `verify` job).

**Git:** Pushed `9bf0e596` on `main` (May 2026 hardening bundle).

**Next product focus:** resume feature roadmap (not PE-D3 / calendar policy unless scheduled).

---

## Workspace Runtime Foundation v1 (May 2026) ✅

**Principle:** **Module = capability; widget = projection.**

**Source of truth:** `docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`

**Goal:** Additive frontend contracts so personal, business, and future household/education contexts can derive available modules/widgets consistently—without replacing legacy registries or switch-based rendering.

**Shipped:**

| Area | What |
|------|------|
| **Contracts** | `web/src/runtime/modules/types.ts` — `ModuleDefinition`, `WidgetDefinition`, `RouteDefinition`; optional `source` (`core` \| `marketplace` \| `custom`), `capabilities`, `status` |
| **Core registry** | `web/src/runtime/modules/coreModuleRegistry.ts` — 17 first-party modules (dashboard, drive, chat, calendar, todo, notes, ai, utility widgets, hr, scheduling, analytics, members, admin) |
| **Lookup** | `web/src/runtime/modules/moduleRegistry.ts` — `normalizeModuleId`, `getModuleDefinition`, context filter; `connections` → `members` |
| **Adapters** | `fromWidgetRegistry.ts`, `widgetPickerAdapter.ts` — read-only bridge to `WIDGET_REGISTRY` (legacy registry unchanged) |
| **Runtime** | `web/src/runtime/workspace/` — pure helpers, **`WorkspaceRuntimeProvider` mounted** via `WorkspaceRuntimeScopeBridge` / `BusinessLayoutRuntimeShell`; `permissionSnapshot` bridged from `BusinessConfigurationContext` + `PositionAwareModuleProvider`; scope-key resets on tenant/context change; RT-Q1 shared socket via `realtimeClient.ts` + `WorkspaceRealtimeLifecycle` |
| **Integrations** | `WidgetPicker` uses contract adapter + legacy fallback; `BusinessWorkspaceContent` read-only contract lookup (switch unchanged); `BrandedWorkDashboard` display names via `getModuleDisplayName` |
| **Tests** | `pnpm --filter vssyl-web test` — ~22 unit tests under `web/src/runtime/__tests__/`; **in CI** (`verify` job) |

**Explicitly not replaced:** `WIDGET_REGISTRY`, `BusinessWorkspaceContent` `switch`, routing, widget components, business front-page `WidgetRegistry.tsx`.

**Follow-up (feature-driven, not hardening):**
1. ~~Mount `WorkspaceRuntimeProvider` at dashboard + business workspace roots.~~ ✅ WR-Q1
2. ~~Feed `permissionSnapshot` from `BusinessConfigurationContext`.~~ ✅ WR-Q1
3. Replace duplicate module name/icon helpers with `getModuleDefinition` + `MODULE_ICONS`.
4. ~~Add `pnpm --filter vssyl-web test` to CI.~~ ✅ in `.github/workflows/ci.yml`
5. Wire feature surfaces (e.g. `WidgetPicker`) to `useWorkspaceRuntime()` where beneficial (additive).
6. ~~RT-Q1: consolidate socket clients + runtime subscription ownership.~~ ✅ RT-Q1

**Cross-ref:** `memory-bank/progress.md` (Workspace Runtime v1); `memory-bank/dashboardProductContext.md` (§ Workspace runtime); `memory-bank/systemPatterns.md` (Business workspace + runtime layer).

---

## AI conversational continuity, rendering, and streaming UX (May 2026) ✅ / 🟡

**Source of truth:** `docs/plans/AI_CONVERSATIONAL_CONTINUITY_AND_RENDERING_SOURCE_OF_TRUTH.md` (indexed in `docs/plans/README.md`). **Phase E** (hardening/QA checklist) is documented there and intentionally not executed as a broad refactor until scheduled.

**Goal:** Move the Digital Life Twin from “structured report” tone to natural conversation while keeping a strict internal contract: orchestration metadata stays internal unless debug/analytical modes apply; users see conversational text first; `fileIssues` / vision badges remain visible.

**Shipped (implementation wave on `main`):**

| Area | What |
|------|------|
| **UI** | `AIResponseRenderer` gains `showOrchestrationDetails` (default off). Full chat, header dropdown, and embed module hide key insights, evidence, assumptions/risks, recommended actions, and numeric confidence unless explicitly enabled. |
| **Server text** | `polishConversationalResponse` + integration in `normalizeAIResponse.ts` strips internal phrasing (“Based on conversation history”, scaffold headings) from plain-text `response`. |
| **Continuity & topic** | `conversationContinuity.ts`: `ConversationContinuityState` + `ActiveTopicState`, transition classification, prompt injection via `DigitalLifeTwinCore` / `DigitalLifeTwinService` (persisted on assistant message metadata where applicable). |
| **Context tiers** | `AIContextAssembler` + Core scoring: tier labels (`tier1`–`tier4`), stricter trimming of broad cross-module blocks; richer `[AI_CONTEXT_BUDGET]` / relevance logging. |
| **Response modes** | `responseMode.ts` + prompt sections: inferred `conversational` / `analytical` / `planning` / `debug` / etc., wired through twin metadata. |
| **Structured JSON in chat (non-stream)** | `web/src/lib/aiResponseHandler.ts` + `AIAssistantMessageBody.tsx`: parse v2 JSON, render `summary` prose; wired on ai-chat, `AIChatDropdown`, `AIChatModule` (`976a2658`). |
| **Streaming UX (full-page ai-chat only)** | `web/src/lib/aiStreamHandler.ts`: buffer SSE chunks in memory; detect structured JSON start (`{`, `[`, fenced code); **never** append raw orchestration JSON to conversation state. While streaming: `isAILoading` + `AIThinkingIndicator` only (no `ai_stream_*` placeholder bubble). On `done`: single `finalizeTwinStream` → `buildAIConversationItemFromTwinData` append. Render safety net: `shouldHideStreamingContent` in `AIAssistantMessageBody`. **Commit:** `1deb6d48` — `fix(web): buffer AI stream and hide raw JSON during conversation`. Earlier guard: `19c2cc56`. |

**Streaming flow (client):**
1. User sends → thinking bubble (`AIThinkingIndicator`, animated dots).
2. `consumeTwinSseLine` accumulates `text` deltas in `TwinStreamState` (not in visible messages).
3. Structured streams set `bufferingStructured` → `displayText: null` (thinking only).
4. `done` + `data` → `normalizeTwinResponseData` → one assistant row with prose/`structured.summary`.
5. Plain-prose streams could stream incrementally via `displayText`, but conversation mode prefers polish over token typing (no mid-stream assistant row).

**Surfaces:** SSE streaming enabled on `web/src/app/ai-chat/page.tsx` (`stream: true`). `AIChatDropdown` / `AIChatModule` use non-stream twin JSON (already normalized via `aiResponseHandler`).

**Tests:** `web/src/lib/__tests__/aiStreamHandler.test.ts` (8); `web/src/lib/__tests__/aiResponseHandler.test.ts` (9); server orchestration visibility test (`aiResponseRendererVisibility.test.ts`). Do **not** import `web/` from `server/` tests.

**Residual / next:** Phase E checklist in plan doc; optional progressive `summary` typewriter during buffer (helpers exist: `extractPartialSummaryFromStream`); wire `showAIDetails` to a real debug toggle when product exposes it.

---

## AI assembled context — compression, relevance, token budget (May 2026) ✅

**Goal:** Keep provider prompts focused and cheaper by trimming assembled context blocks after deterministic compression and keyword relevance ranking—without embeddings, summarization, provider refactors, or frontend changes.

**Implementation (`server/src/ai/context/AIContextAssembler.ts`):**
- Pipeline: `contextBlocks` → compress → `rankContextBlocksForProvider` → **`applyContextBudget`** → returned as `contextBlocks`.
- Default budget: **`DEFAULT_CONTEXT_BUDGET_ESTIMATED_TOKENS` ≈ 6000** (char/4 token estimate via `estimateTokenCount`).
- **High** priority blocks always retained (even if over budget); **medium/low** filled in relevance order while under budget; **diversity pass** tries to keep at least one block per `sourceType` when budget allows.
- Each kept block may include **`budgetTokensEstimate`** for debugging; structured log **`[AI_CONTEXT_BUDGET]`** (`maxEstimatedTokens`, `blocksBefore`, `blocksAfter`, `estimatedTokensKept`).

**Cross-ref:** `memory-bank/aiContextSystem.md` (assembled context pipeline); `memory-bank/progress.md`.

---

## GitHub Actions CI — `verify` job green (May 2026) ✅

**Problem:** CI `pnpm type-check` failed with widespread `TS6305` because `web` resolves `shared` via `shared/dist/*.d.ts`, but the workflow did not build `shared` before recursive type-check. Later, `pnpm test` failed on missing `Module` row `scheduling` and a flaky admin analytics assertion under parallel Vitest.

**Shipped:**
- `.github/workflows/ci.yml` — after `pnpm install`, run `pnpm run build` with `working-directory: ./shared` so declarations exist before `pnpm type-check`.
- `server/src/routes/__tests__/scheduling-tenant-scope.integration.test.ts` — `beforeAll` self-seeds built-in `scheduling` module when absent (CI DB has no startup seed).
- `server/src/routes/__tests__/admin-analytics.integration.test.ts` — growth test no longer assumes monotonic global `totalUsers` while other suites delete users concurrently.

**Commits (main):** `d7fbb746` (CI shared build), `8a89bc04` (scheduling test seed), `66d6b1d7` (analytics assertion stabilization).

**Validation:** User confirmed GitHub Actions `verify` all green after push.

---

## Structured logging migration — `console.*` → `logger` (May 2026) 🟡

**Goal:** Replace runtime `console.log` / `console.warn` / `console.error` with project `logger` (`server/src/lib/logger.ts`, web `@/lib/logger`) plus structured fields (`operation`, error payloads). Exclude tests (`__tests__/`, `*.test.ts`) unless explicitly requested.

**Shipped (this wave):**
- Broad server sweep: controllers, routes, middleware (`auth`, `hrPermissions`, `hrFeatureGating`, `schedulingFeatureGating`, `usageLimitMiddleware`), many services (Stripe/notifications/org-chart/email/security behavior modules), AI surfaces (`DigitalLifeTwinCore`, `RealTimeAnalyticsEngine`, `AnthropicProvider`, `OpenAIProvider`, related utils/types where touched).
- Startup / registration: `registerBuiltInModules.ts`, `seedTodoModule` / `seedNotesModule`, script `register-built-in-modules.ts`.
- Stripe ops scripts: `setupStripeProducts`, `setupQueryPackProducts`, `syncStripePrices`, `syncPerEmployeeStripePrices`, `syncQueryPackPrices`, `listStripePerEmployeePrices`.
- Web API proxy + trash routes migrated where previously outstanding.

**New / helper artifacts:** `server/src/ai/context/AIContextAssembler.ts`, `server/src/ai/utils/validateAIResponseQuality.ts`, `scripts/patch-console-to-logger.js` (do **not** bulk-run until `insertAfterImports` is fixed for multi-line imports — prefer manual edits).

**Remaining:** ~36 non-test server files still contain `console.*` (heavy hits: `AutoMLService`, `AIModelManagementService`, `WorkflowAutomationService`, `PatternAnalysisScheduler`, `SSOIntegrationService`, plus scripts like `initialize-logging-policies`, `verifyStripeSetup`). Continue iterative migration + `pnpm exec tsc --noEmit -p server` after batches.

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
