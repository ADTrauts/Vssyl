# Reference Module Registration — AI Experience

**Registration type:** Reference UX Module **#4**  
**Status:** **Approved with Findings**  
**Date registered:** 2026-06-03  
**moduleId:** `ai` (surfaces: `ai-chat`, embedded twin)  
**User-facing name:** AI Experience / AI Chat

> **Track clarification:** This is the **UX Reference AI Experience Module** (twin/chat conversational workspace UX) per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) slot **#4**. It is **independent** of **program type #4 Reference AI Module** (platform AI layer — [`AI_PLATFORM_CERTIFICATION_STRATEGY.md`](../../architecture/AI_PLATFORM_CERTIFICATION_STRATEGY.md)) and **independent** of Architecture Reference Module #2 (Chat code).

---

## Purpose

Register AI Experience as the platform **canonical copy target** for user-facing **conversational AI / twin workspace** UX:

- Streaming LLM chat threads with conversation lifecycle (create, pin, rename, archive, delete)
- Page + embedded twin surfaces sharing one workspace engine
- Provider/model selection, attachments, explain drawers, and identity control center (`/ai`)
- Interaction safety (ConfirmModal, global trash), mobile sheet, and cross-route navigation

Fills the portfolio gap left after Drive #1, Notifications #2, Todo #3, and Calendar #5 — none model **streaming chat workspace** patterns.

---

## Scope

### In scope (registered surfaces)

| Surface | Role |
|---------|------|
| `AIChatWorkspace` | Primary twin/chat workspace (`page` + `embedded` variants) |
| `AIChatModule` | Embedded dashboard/business mount |
| `AIChatPageShell` | Page layout shell (`WorkspaceSplitLayout` + chrome) |
| `/ai-chat` | Full-page chat route |
| `/ai` | AI Identity control center (memory, behavior, provider settings) |
| `AIWorkspaceLanding` | Business workspace hub entry |
| `AIExperienceNavLinks` | Cross-nav between chat and identity |
| `AIChatDropdown` | Header quick-chat entry (certified exception) |
| `AIWidget` | Dashboard widget thin-wrapper → `AIChatModule` |
| `AIChatEmptyState` | Shared empty-state wrapper |
| `AIFileUpload` / attachment flows | Drive-linked attachments in composer |
| `AIProviderModelPicker` | End-user model/provider controls (page/header) |
| `AIResponseExplainDrawer` | Explainability for responses |
| `WorkspaceAIDrawer` | Business workspace AI policy side panel |

### Out of scope (this registration)

- AI Platform L2/L3/L4 architecture certification
- `ActionExecutor`, provider routing internals, pipeline diagnostics
- Admin-only AI tooling (`BusinessAIControlCenter` depth)
- Architecture Reference Module designation for `ai` code (separate track)

---

## Architecture summary (UX-relevant)

| Layer | Pattern | Key artifacts |
|-------|---------|---------------|
| **Single engine** | Page + embedded → `AIChatModule` → `AIChatWorkspace` | 3C-5 dedup; 5H-C widget parity |
| **Navigation model** | Canonical routes in `aiExperienceNavigation.ts` | `/ai-chat`, `/ai`, header, hub, widget |
| **Global trash** | `ai_conversation` entity; `trashItem` on confirm | `requestDeleteConversation` → `ConfirmModal` |
| **Cross-module attach** | Drive upload/save via `AIFileUpload` | File Hub integration |
| **Business hub** | `AIWorkspaceLanding` + `BusinessWorkspaceContent` `case 'ai'` | `module-development.mdc` |
| **AI manifest** | `ModuleAIContext` + context providers in built-in manifest | Read paths for twin; separate from this UX registration |

**Note:** AI Experience **UX registration** does not certify architecture L3 for the `ai` module. Platform AI layer remains governed by [`AI_PLATFORM_CERTIFICATION_STRATEGY.md`](../../architecture/AI_PLATFORM_CERTIFICATION_STRATEGY.md).

---

## UX summary

### 11-category scorecard (5H-AI-L1L2-D authoritative)

| # | Category | Rating |
|---|----------|--------|
| 1 | Interaction Consistency | **PASS** |
| 2 | Layout Consistency | **PASS** |
| 3 | Navigation | **PASS** |
| 4 | Accessibility | **PASS** |
| 5 | Mobile | **PASS** |
| 6 | Cross-Module Integration | **PASS** |
| 7 | Error Handling | **PASS** |
| 8 | Empty States | **PASS** |
| 9 | Loading States | **PASS** |
| 10 | Discoverability | **PASS** |
| 11 | Workflow Completion | **PASS** |

| Metric | Value |
|--------|-------|
| PASS | **11** |
| PASS WITH FINDINGS | **0** |
| FAIL | **0** |

Full detail: [`AI_EXPERIENCE_UX_SCORECARD.md`](./AI_EXPERIENCE_UX_SCORECARD.md)

### UX certification

| Level | Award |
|-------|-------|
| UX-L1 | **Certified** |
| UX-L2 | **Certified** |
| UX-L3 | **Certified with Findings** |

Evidence: [`AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md`](./AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md)

### QA evidence (Part 2F)

| Metric | Value |
|--------|------:|
| PASS | **20** |
| FAIL | **0** |
| BLOCKED | **2** |
| P0 FAIL | **0** |

Evidence folder: [`qa-evidence/5G-QA/ai/`](./qa-evidence/5G-QA/ai/)

---

## Registration summary

| Field | Value |
|-------|-------|
| **Decision** | **Approved with Findings** |
| **UX level** | **UX-L3 Certified with Findings** (11 PASS / 0 PWF / 0 FAIL) |
| **Benchmark role** | Primary copy target for twin/chat workspace, conversation lifecycle, streaming composer, and AI identity control center |
| **UX certification** | [`AI_EXPERIENCE_UX_CERTIFICATION.md`](./AI_EXPERIENCE_UX_CERTIFICATION.md) |
| **L3 review** | [`AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md`](./AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md) |
| **Readiness review** | [`AI_EXPERIENCE_REFERENCE_UX4_READINESS_REVIEW.md`](./AI_EXPERIENCE_REFERENCE_UX4_READINESS_REVIEW.md) |

---

## Why AI Experience qualified (program rules)

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) Reference UX Module definition and certification process:

| Step | Requirement | Status |
|------|-------------|--------|
| 1 | Modernization waves (interaction + layout + menus) | ✅ 3A-4A + 3C-5 + **5H-AI-UX-B/C** |
| 2 | Module scorecard (11 categories) | ✅ [`AI_EXPERIENCE_UX_SCORECARD.md`](./AI_EXPERIENCE_UX_SCORECARD.md) — **11 PASS / 0 PWF** |
| 3 | Interaction certification | ✅ Unified `ConfirmModal` delete; drag-to-trash gate; functional menus (5H-B) |
| 4 | Manual QA matrix | ✅ AI-10 closed — [`AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md`](./AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md) |
| 5 | Registration decision | ✅ **Approved with Findings** (this document) |
| 6 | Register benchmark | ✅ This document |

**Prerequisite met:** UX-L3 Certified with Findings (meets UX-L3 CwF minimum per scorecard).

**Not strict Approved:** R-AI-3 keyboard shortcuts help; R-AI-1/R-AI-2 verification BLOCKED rows; R-AI-4 dark-mode matrix gap — mirror Notifications #2, Todo #3, and Calendar #5 **Approved with Findings** precedent.

---

## Certification history

| Wave | Contribution | Closeout / evidence |
|------|--------------|---------------------|
| **3A-4A** | Menu primitives on conversation menus | [`AI_MENU_ROLLOUT_CLOSEOUT.md`](./AI_MENU_ROLLOUT_CLOSEOUT.md) |
| **3C-5** | `AIChatWorkspace` dedup — unified page/embedded path | [`AI_CHAT_DEDUPLICATION_CLOSEOUT.md`](./AI_CHAT_DEDUPLICATION_CLOSEOUT.md) |
| **5H-AI-UX-A** | Initial formal UX audit (3/6/2 baseline) | [`AI_EXPERIENCE_UX_AUDIT_2026.md`](./AI_EXPERIENCE_UX_AUDIT_2026.md) |
| **5H-AI-UX-B** | Interaction + layout + mobile + empty + a11y (AI-1–8) | [`AI_EXPERIENCE_UX_BATCH5H_B_CLOSEOUT.md`](./AI_EXPERIENCE_UX_BATCH5H_B_CLOSEOUT.md) |
| **5H-AI-UX-C** | Navigation + widget parity + Part 2F prep (AI-12–14) | [`AI_EXPERIENCE_UX_BATCH5H_C_CLOSEOUT.md`](./AI_EXPERIENCE_UX_BATCH5H_C_CLOSEOUT.md) |
| **5H-AI-UX-D** | Part 2F manual QA (AI-10, AI-11, AI-15 closed) | [`AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md`](./AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md) |
| **5H-AI-L1L2-D** | UX-L1/L2/L3 CwF certification review | [`AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md`](./AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md) |
| **5H-AI-Ref4-Prep** | Registration readiness **Approved with Findings** | [`AI_EXPERIENCE_REFERENCE_UX4_READINESS_REVIEW.md`](./AI_EXPERIENCE_REFERENCE_UX4_READINESS_REVIEW.md) |
| **5H-AI-Ref4-Registration** | **Reference UX #4** designation (this document) | — |

Strategic reservation: [`REFERENCE_UX_4_STRATEGIC_REVIEW.md`](./REFERENCE_UX_4_STRATEGIC_REVIEW.md)

---

## Reusable patterns catalog

When building conversational AI, twin, or assistant surfaces, copy AI Experience patterns for:

| # | Need | AI reference | Key files |
|---|------|--------------|-----------|
| 1 | **Twin workspace shell** | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` | `AIChatPageShell.tsx` |
| 2 | **Page + embedded single engine** | One `AIChatWorkspace`; variant prop | `AIChatModule.tsx`, `AIChatWorkspace.tsx` |
| 3 | **Conversation delete confirm** | `requestDeleteConversation` → `ConfirmModal` → `trashItem` | `AIChatWorkspace.tsx` |
| 4 | **Row + header menus** | `DropdownMenu` on sidebar row and chat header | `AIChatWorkspace.tsx` |
| 5 | **Header dropdown menus** | Functional overflow in `AIChatDropdown` | `AIChatDropdown.tsx` |
| 6 | **Drag-to-trash confirm** | Sidebar drag → `GlobalTrashBin` → `ConfirmModal` | Global trash integration |
| 7 | **Mobile conversations sheet** | Calendar 3C-7B collapsible sheet | `AIChatPageShell.tsx` |
| 8 | **Shared EmptyState** | `AIChatEmptyState` → shared primitive | `AIChatEmptyState.tsx` |
| 9 | **Cross-route navigation** | Canonical routes + nav link component | `aiExperienceNavigation.ts`, `AIExperienceNavLinks.tsx` |
| 10 | **Business hub entry** | `AIWorkspaceLanding` in workspace switch | `AIWorkspaceLanding.tsx` |
| 11 | **Dashboard widget parity** | Thin wrapper → `AIChatModule` | `AIWidget.tsx` |
| 12 | **Drive attachments** | Upload/save in composer | `AIFileUpload.tsx` (via workspace) |
| 13 | **Composer a11y** | `aria-label` on attach, voice, send | Part 2F AI-18 |
| 14 | **Identity control center** | `PageHeader` + tabs on `/ai` | `web/src/app/ai/page.tsx` |

**Primary references by archetype:**

- **File / entity browser** → Drive #1
- **Inbox / notification feed** → Notifications #2
- **Task / project workspace** → Todo #3
- **Conversational AI / twin workspace** → **AI Experience #4** (this document)
- **Scheduling / time-grid** → Calendar #5
- **Realtime messaging code** → Chat Architecture #2 (not UX)

---

## Certified exceptions

Intentional non-parity surfaces — do not treat as regression when copying patterns:

| Surface | Classification | Rationale |
|---------|----------------|-----------|
| `AIChatDropdown` | **Certified exception** | Header portal overlay for quick-access twin; must link to `/ai-chat` for extended sessions |
| Embedded `provider: 'auto'` | **Certified exception** | Dashboard/widget embed defaults; full `AIProviderModelPicker` on page/header routes |
| `/ai` identity tabs | **Certified exception** | Control-center archetype — `PageHeader` + `Tabs`, not `WorkspaceSplitLayout` |
| `AI-9` monolith LOC | **Non-scorecard debt** | ~2,688 LOC in `AIChatWorkspace.tsx` — maintainability; shells QA-verified |
| Business hub QA BLOCKED | **Verification gap** | R-AI-1 — `AIWorkspaceLanding` implemented; QA account lacked business context |
| Mobile row select QA BLOCKED | **Verification gap** | R-AI-2 — AI-15/17 pass; seed row visibility in automation |

---

## Known findings (carry-forward)

| ID | Finding | Severity | Blocks reference? |
|----|---------|----------|-------------------|
| **R-AI-1** | AI-06 BLOCKED — business hub not QA-verified | P2 (verification) | No |
| **R-AI-2** | AI-16 BLOCKED — mobile row select in sheet | P2 (verification) | No |
| **R-AI-3** | Keyboard shortcuts help absent | P3 | No — L3 CwF documented |
| **R-AI-4** | Dark mode not in Part 2F matrix | P2 (verification) | No — L2 code audit |
| **QA-ENV-02** | `JWT_SECRET` not in root `.env` during QA | P1 (env) | No |
| **AI-9** | Monolith workspace LOC | P3 (debt) | No — non-scorecard |

**No P0 or P1 product FAIL findings remain.**

---

## Platform integration

| System | AI Experience integration | Copy note |
|--------|---------------------------|-----------|
| **Drive** | Attach/upload/save in composer; file context in threads | Copy attachment bridge — not Drive shell |
| **Global Trash** | `ai_conversation` soft delete; drag + menu paths | Copy confirm → `trashItem()` pattern |
| **Notifications** | AI event types in platform feed | Copy manifest `notifications[]` metadata |
| **Business Workspace** | `AIWorkspaceLanding` hub; `WorkspaceAIDrawer` policy digest | Copy hub-first module entry |
| **AI Platform** | Context providers; twin pipeline (platform layer) | Copy **UX surfaces** from this doc — not platform L3 gates |
| **Chat** | Distinct product module; architecture #2 | Do not conflate messaging UX with twin workspace UX |
| **Header / global entry** | `AIChatDropdown` certified exception | Copy quick-access overlay pattern with full-page escape hatch |

---

## Comparison against peer Reference UX holders

| Criterion | Drive #1 | NTF #2 | Todo #3 | Cal #5 | **AI #4** |
|-----------|----------|--------|---------|--------|-----------|
| UX-L3 at registration | Pre-11-cat | CwF | Certified | Certified | **CwF** |
| PASS / PWF / FAIL | Pre-11-cat | 11/1/0 | 11/0/0 | 11/0/0 | **11/0/0** |
| Manual QA | F-1 historical | N-6 closed | T-11 closed | E-14 closed | **AI-10 closed** |
| Primary archetype | File workspace split | Management inbox | Task workspace split | Time-grid split | **Twin/chat workspace** |
| Registration decision | AwF | AwF | AwF | AwF | **AwF** |

**Conclusion:** AI Experience is the **only registered archetype** for conversational AI workspace UX. Correct holder for UX **#4**.

---

## Future obligations

### Recertification triggers

Re-register or re-audit when:

1. New conversation delete flows ship without `ConfirmModal`
2. `AIChatPageShell` / `WorkspaceSplitLayout` / `PageHeader` removed from `/ai-chat`
3. Page and embedded variants diverge to separate delete/menu implementations
4. Native `prompt()`/`confirm()`/`alert()` reintroduced on user paths
5. Drag-to-trash bypasses `GlobalTrashBin` confirm contract
6. Major mobile redesign without 375px Part 2F re-run
7. New P0 FAIL in platform manual QA Part 2F
8. `AIWidget` reimplements chat UI outside `AIChatModule`

**Recommended cadence:** Annual or after any interaction-class wave on AI Experience surfaces.

### Registration maintenance

| Obligation | Owner | Cadence |
|------------|-------|---------|
| Update scorecard on material UX wave | UX / product | Per wave closeout |
| Re-run Part 2F matrix after destructive-flow changes | QA | Per trigger above |
| Track R-AI-3 keyboard shortcuts help | Engineering | P3 backlog |
| Re-verify R-AI-1 business hub when QA account has business | QA | Next matrix run |
| Re-verify R-AI-2 mobile row select with seeded conversation | QA | Next matrix run |
| Optional AI-9 monolith decomposition | Engineering | On-demand / next product touch |

### Carry-forward remediation (optional, non-blocking)

| ID | Remediation | Impact |
|----|-------------|--------|
| R-AI-3 | Add keyboard shortcuts help or trim documented shortcuts | Path to strict UX-L3 Certified |
| R-AI-1 | Execute AI-06 with business-enabled QA account | Verification closure |
| R-AI-2 | Fix mobile sheet row visibility in QA automation | Verification closure |
| R-AI-4 | Add dark-theme row to Part 2F matrix | Verification closure |
| AI-9 | Extract sidebar/composer/message list from monolith | Maintainability |

---

## Official holder determination

| Question | Answer |
|----------|--------|
| Does AI Experience become **Reference UX Module #4**? | **Yes** — effective upon publication of this document |
| Registration decision | **Approved with Findings** |
| UX certification level change? | **No** — remains UX-L3 Certified with Findings |
| Slot conflict? | **None** — UX #4 was vacant/reserved; no other candidate |
| Independent of AI Platform? | **Yes** — platform L2 compliant; UX #4 is product-surface registration |
| Independent of Chat UX #2? | **Yes** — Chat UX Reference #2 **Rejected** (5B.3); twin ≠ messaging inbox |

---

## Related

- [`AI_EXPERIENCE_UX_CERTIFICATION.md`](./AI_EXPERIENCE_UX_CERTIFICATION.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)
- [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md)
- [`REFERENCE_MODULE_CATALOG.md`](../../architecture/REFERENCE_MODULE_CATALOG.md)

**Last updated:** 2026-06-03 (Wave 5H-AI-Ref4-Registration)
