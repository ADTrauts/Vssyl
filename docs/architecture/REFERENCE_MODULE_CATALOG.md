# Reference Module Catalog

**Status:** Living guide (2026-06-01)  
**Purpose:** Single map of **what to copy from which reference module** when modernizing built-in modules.  
**Authorities:** [CERTIFICATION_LEDGER.md](./CERTIFICATION_LEDGER.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md), [RELATIONSHIP_FRAMEWORK_INDEX.md](./RELATIONSHIP_FRAMEWORK_INDEX.md), [PLATFORM_CAPABILITY_CATALOG.md](./PLATFORM_CAPABILITY_CATALOG.md)

---

## Reference modules at a glance

| # | Module | Level | Role | Primary audit |
|---|--------|-------|------|----------------|
| 1 | **File Hub** (`drive`) | 4 — Reference Implementation | Trash, visibility, PE, V_Link, entities, manifest truth | [FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md) |
| 2 | **Chat** (`chat`) | 3 — Certified | Realtime, AI routing, notifications, thin controllers | [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) |
| 3 | **Calendar** (`calendar`) | 3 — Certified | Scheduler, reminders, recurrence, time-based reads | [CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md) |
| 4 | **Todo** (`todo`) | 3 — Certified | Task lifecycle, assignment, work management, calendar/file links | [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md) |
| 5 | **Place** (`place`) | 3 — Certified | External graph, directory, discovery, commerce routing, dual-surface | [PLACE_REFERENCE_COUNCIL_REVIEW.md](./audits/PLACE_REFERENCE_COUNCIL_REVIEW.md), [PLACE_PATTERN_GUIDE.md](./PLACE_PATTERN_GUIDE.md) |
| — | **Notebook** (`notebook`) | 3 — Certified (composition) | Operational links, workspace intelligence, grounded AI orchestration — **not Reference #5** | [NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md](./audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md) |

**Rule:** Copy **patterns**, not file names blindly. Every module still needs its own constitutional audit and operation matrix before implementation.

### UX Reference Modules (independent track)

UX reference slots live under `docs/ux/audits/` per [`REFERENCE_MODULE_PROGRAM.md`](../ux/REFERENCE_MODULE_PROGRAM.md). **Not the same numbering as architecture Reference Modules above.**

| UX slot | Module | Status | Registration |
|---------|--------|--------|--------------|
| **#1** | Drive / File Hub | **Approved with Findings** | [`REFERENCE_MODULE_DRIVE.md`](../ux/audits/REFERENCE_MODULE_DRIVE.md) |
| **#2** | Notifications | **Approved with Findings** | [`REFERENCE_MODULE_NOTIFICATIONS.md`](../ux/audits/REFERENCE_MODULE_NOTIFICATIONS.md) |
| **#3** | Todo | **Approved with Findings** | [`REFERENCE_MODULE_TODO.md`](../ux/audits/REFERENCE_MODULE_TODO.md) |
| **#4** | AI Experience (`ai` / AI Chat) | **Approved with Findings** | [`REFERENCE_MODULE_AI.md`](../ux/audits/REFERENCE_MODULE_AI.md) |
| **#5** | Calendar | **Approved with Findings** | [`REFERENCE_MODULE_CALENDAR.md`](../ux/audits/REFERENCE_MODULE_CALENDAR.md) |
| **#6** *(expansion — vacant)* | Place *(primary candidate)* | **Eligible With Findings** — not registered | Wave 6C review: [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md) |

**Clarification:** Architecture **Reference Module #5** = **Place** (external graph). UX **Reference #5** = **Calendar** (scheduling/time-grid UX). UX **Reference #2** = **Notifications** (management-page inbox UX) — **not** Architecture **Reference Module #2** (Chat). UX **Reference #3** = **Todo** (task workspace / multi-view UX) — **not** a separate architecture slot (Todo is also Architecture **Reference Module #4**). UX **Reference #4** = **AI Experience** (twin/chat workspace UX) — **registered** 2026-06-03 — independent of AI Platform architecture certification. Calendar is Architecture **Reference Module #3** (Level 3 code). **UX #6** is expansion tier — baseline #1–#5 frozen per Wave 6C.

### UX pattern standards (Wave 6A)

**Authoritative pattern registry:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../ux/UX_REFERENCE_PATTERN_CATALOG.md) — **56** `UX-PAT-*` standards extracted from UX references #1–#5.

| Archetype | Primary UX reference | Pattern doc |
|-----------|---------------------|-------------|
| File / entity browser | Drive #1 | [`patterns/WORKSPACE_PATTERNS.md`](../ux/patterns/WORKSPACE_PATTERNS.md) |
| Inbox / feed | Notifications #2 | [`patterns/CROSS_MODULE_INTEGRATION_PATTERNS.md`](../ux/patterns/CROSS_MODULE_INTEGRATION_PATTERNS.md) |
| Task / work management | Todo #3 | WORKSPACE + NAVIGATION |
| AI / twin workspace | AI Experience #4 | [`patterns/AI_EXPERIENCE_PATTERNS.md`](../ux/patterns/AI_EXPERIENCE_PATTERNS.md) |
| Scheduling / time-grid | Calendar #5 | WORKSPACE + MOBILE |
| Graph / dual-surface / discovery | Place *(future #6)* | Wave 6D extraction — [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md) |

**Closeout:** [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](../ux/UX_REFERENCE_PROGRAM_CLOSEOUT.md) · **Expansion review:** [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md)

---

## AI Platform — cross-cutting (Wave G0, 2026-06-04)

**Not** a reference module slot. Module AI compliance copies **from** References #1–2 below; the platform layer is governed by **constitutional docs** (not module Level 3 gates).

| Pattern | Copy from | Platform artifact |
|---------|-----------|-------------------|
| AI writes → canonical service | Chat #2, Todo #4 | `*AIActionService` + `ActionExecutor` / `toolExecutor` |
| AI reads → visibility service | File Hub #1 | Context provider HTTP → thin controller |
| Read-only external AI | Place #5 | `placeAIActionService` |
| Composition AI | Notebook (L3) | Reuse notes/todo providers |
| Twin pipeline / diagnostics | Platform constitution | `DigitalLifeTwinCore`, [AI_PLATFORM_OPERATION_MATRIX.md](./AI_PLATFORM_OPERATION_MATRIX.md) |

**Constitutional authority:** [AI_PLATFORM_CONSTITUTION.md](./AI_PLATFORM_CONSTITUTION.md), [AI_PLATFORM_BOUNDARY_MODEL.md](./AI_PLATFORM_BOUNDARY_MODEL.md), [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md) (levels 0–4).

**Evidence / audits:** [AI_PLATFORM_CONSTITUTIONAL_AUDIT.md](./audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md), [AI_TOOL_ACTION_COMPLIANCE_MATRIX.md](./audits/AI_TOOL_ACTION_COMPLIANCE_MATRIX.md), [AI_CONTEXT_PROVIDER_MATRIX.md](./audits/AI_CONTEXT_PROVIDER_MATRIX.md). **Do not duplicate** certified module extraction work in platform waves.

---

## Unified Search — Platform Capability L2 CwF (2026-06-23)

**Not** a Reference Module #N integer. Search is **platform discovery infrastructure** — modules **consume and register**, they do not copy File Hub trash/notification patterns for search itself.

| Field | Value |
|-------|-------|
| **Capability id** | `unified_search` |
| **Certification** | **LEVEL 2 CERTIFIED WITH FINDINGS** (RD-US-001) |
| **G1–G9** | **21/27 (~78%)** |
| **Architecture** | Option C Hybrid — federated providers authoritative |

### What modules copy from Search

| Pattern | Copy from | Key artifacts |
|---------|-----------|---------------|
| Visibility-bounded search | File Hub #1, Calendar, Todo | `searchAccessible*` in `*VisibilityService` |
| Global provider registration | Unified Search standard | `RegisteredSearchProvider` in `searchProviderRegistry.ts` |
| Tenant context in search | Search Phase 1A | `filters.context` + PE `search:read` |
| Result normalization | Search constitution | `SearchResult` in `shared/types/search.ts` |
| Manifest honesty | Search compliance | `capabilities.search` ↔ provider parity test |

### What this designation is NOT

- Not a product module with workspace landing
- Not Level 4 Reference Implementation
- Not a substitute for module visibility services — **providers delegate to SoR**

**Governance records:** [SEARCH_CONSTITUTION.md](../search/SEARCH_CONSTITUTION.md), [SEARCH_PLATFORM_STANDARD.md](../search/SEARCH_PLATFORM_STANDARD.md), [SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md](../search/SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md), [SEARCH_CAPABILITY_CERTIFICATION_REVIEW.md](../search/SEARCH_CAPABILITY_CERTIFICATION_REVIEW.md), [PLATFORM_CAPABILITY_CATALOG.md](./PLATFORM_CAPABILITY_CATALOG.md)

---

## AI Retrieval Adapter — Phase 2A (2026-06-23)

**Certified platform capability** — AI discovery orchestration (not a product module).

| Field | Value |
|-------|-------|
| **Capability id** | `ai_retrieval` |
| **Status** | **LEVEL 2 CERTIFIED WITH FINDINGS** (RD-AR-001) |
| **Maturity** | L3 runtime · L4 certified governance |
| **Architecture** | Option B Hybrid — Search for discovery, providers for summaries |
| **Consumers** | `planning`, `workflow_action` |
| **Search dependency** | `unified_search` (RD-US-001) |

**Copy for modules:** Query-driven AI discovery must delegate through Retrieval Adapter — do not add parallel Prisma search in AI paths for Tier A/B intents.

**Governance records:** [AI_RETRIEVAL_CONSTITUTION.md](../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md), [AI_RETRIEVAL_PLATFORM_STANDARD.md](../ai/retrieval/AI_RETRIEVAL_PLATFORM_STANDARD.md), [AI_RETRIEVAL_COMPLIANCE_REQUIREMENTS.md](../ai/retrieval/AI_RETRIEVAL_COMPLIANCE_REQUIREMENTS.md), [AI_RETRIEVAL_CAPABILITY_CERTIFICATION_REVIEW.md](../ai/retrieval/AI_RETRIEVAL_CAPABILITY_CERTIFICATION_REVIEW.md), [AI_RETRIEVAL_PHASE_2A_EXECUTIVE_SUMMARY.md](../ai/retrieval/AI_RETRIEVAL_PHASE_2A_EXECUTIVE_SUMMARY.md), [PLATFORM_CAPABILITY_CATALOG.md](./PLATFORM_CAPABILITY_CATALOG.md)

---

## Admin Portal / Control Plane — Reference With Findings (2026-06-18)

**Not** a Reference Module #N integer. Control-plane reference designation is tracked separately from product module catalog slots.

| Field | Value |
|-------|-------|
| **Designation** | **Control Plane Reference With Findings** |
| **Certification** | **LEVEL 3 CERTIFIED** (ratified & promoted 2026-06-18) |
| **Prior designation** | Reference Candidate (partial) — superseded at promotion |
| **Gates** | G1–G9 PASS (27/27) |
| **Open findings** | **0** |

### Qualifying reference areas

| Area | What to copy | Key artifacts |
|------|--------------|---------------|
| AI Pipeline admin | Policy CRUD, diagnostics, retention/compliance; HTTP test coverage | `adminPortalAiPipeline*` routes; 45/45 handler tests |
| Admin audit taxonomy | Privileged-mutation audit where module activity N/A | `ADMIN_*` actions; single write path |
| Route / service governance | Thin controllers; 0 route Prisma; facade deprecation | `adminPortalRoutes.*`; static enforcement tests |
| Dangerous-op safety | Env gate + confirmation + audit deny | High-privilege operator checklist |
| Analytics ownership (0C) | Canonical analytics surface; ownership registry | `adminAnalyticsOwnership.ts`; `/admin-portal/analytics` |

### What this designation is NOT

- Not Level 4 Reference Implementation (File Hub only)
- Not a Reference Module #N integer (requires separate catalog vote)
- Not a UX Reference #N row (Admin Portal uses adapted G9, not UX-L3 11-gate)

**Governance records:** [ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md](./audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md), [ADMIN_PORTAL_REFERENCE_DESIGNATION_DECISION.md](./audits/ADMIN_PORTAL_REFERENCE_DESIGNATION_DECISION.md), [ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md](./audits/ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md)

---

## Business Administration — Platform Capabilities With Findings (2026-06-18)

**Not** a Reference Module #N integer. Platform capability references under subdomain certification — separate OC taxonomy from architecture Reference Modules #1–#5.

| Field | Value |
|-------|-------|
| **Certification** | **LEVEL 3 CERTIFIED** (ratified & promoted 2026-06-18) |
| **Prior certification** | LEVEL 3 CERTIFIED WITH FINDINGS (BA-3) — superseded at promotion |
| **Gates** | G1–G9 **23/27 (~85%)** — G2/G3/G6/G8/G9 PASS |
| **Open majors** | **0** |
| **Open advisories** | **6** (+ BA-F-013 hygiene) — tracked; do not block certification |

### Platform capabilities

| # | Capability | Designation | Primary audit |
|---|------------|-------------|---------------|
| **OC-1** | Org Chart Identity & Structure | **Reference Platform Capability With Findings** | [BUSINESS_ADMINISTRATION_PROMOTION_REVIEW.md](../business-administration/BUSINESS_ADMINISTRATION_PROMOTION_REVIEW.md) |
| **OC-2** | Permission Sets & Module Access | **Reference Platform Capability With Findings** | [BA_1C_IMPLEMENTATION_REPORT.md](../business-administration/BA_1C_IMPLEMENTATION_REPORT.md) |
| **OC-3** | Approval Boundaries | **Reference Platform Capability With Findings** | [BA_4_APPROVAL_HIERARCHY_ARCHITECTURE.md](../business-administration/BA_4_APPROVAL_HIERARCHY_ARCHITECTURE.md) |

### Qualifying reference areas

| Area | What to copy | Key artifacts |
|------|--------------|---------------|
| Org chart structure (#OC-1) | Thin routes; named services; PE dual; activity + domain events | `orgChartService`, `orgChartPolicyDual`, `orgChartActivityService` |
| Permission sets (#OC-2) | Catalog vs PE dual layer; module access gating | `permissionService`, `PermissionManager.tsx` |
| Approval boundaries (#OC-3) | Hierarchy CRUD; chain resolution; platform consumer API | `approvalHierarchyService`, `/api/org-chart/approval-hierarchy/*` |
| Business profile (#OC-annex) | Service extraction; config realtime | `businessProfileService`, `businessConfigRealtimeService` |

### What this designation is NOT

- Not Level 4 Reference Implementation (File Hub only)
- Not a Reference Module #N integer
- Not Reference Domain (Business Operations program)
- Not plain Reference Platform Capability (open advisories remain)

**Governance records:** [BUSINESS_ADMINISTRATION_REFERENCE_STATUS_RECORD.md](../business-administration/BUSINESS_ADMINISTRATION_REFERENCE_STATUS_RECORD.md), [BUSINESS_ADMINISTRATION_CERTIFICATION_PROMOTION_RECORD.md](../business-administration/BUSINESS_ADMINISTRATION_CERTIFICATION_PROMOTION_RECORD.md), [BUSINESS_ADMINISTRATION_COUNCIL_RATIFICATION.md](../business-administration/BUSINESS_ADMINISTRATION_COUNCIL_RATIFICATION.md)

---

## Context Graph — Platform Capabilities (2026-06-23)

**Not** a Reference Module #N integer. Platform capability references under Tier 0 Context Graph certification — separate **#CG** taxonomy from architecture Reference Modules #1–#5 and Business Administration **#OC** capabilities.

| Field | Value |
|-------|-------|
| **Certification** | **LEVEL 4 CERTIFIED WITH FINDINGS** (consumption amendment RD-CG-L4-001 2026-06-23) |
| **Prior certification** | LEVEL 3 CERTIFIED (RD-CG-010, 2026-06-19) — federation substrate reaffirmed |
| **Gates** | G1–G9 **26/27 (~96%)** — G1–G3, G5–G7 PASS; G4, G8, G9 PARTIAL (findings) |
| **Open blocking** | **0** |
| **Major on certificate** | **1** (L4-F01 — production soak gate) |
| **Open advisories** | **7** (L4) + **8** (L3 carryover) |
| **Program status** | L4 consumption track active; L3 program **ARCHIVED** — [CONTEXT_GRAPH_PROGRAM_ARCHIVE.md](../context-graph/CONTEXT_GRAPH_PROGRAM_ARCHIVE.md) |

### Platform capabilities

| # | Capability | Designation | Level | Primary audit |
|---|------------|-------------|-------|---------------|
| **CG-1** | Federated Context Graph Read Model | **Reference Capability** | 3 | [CONTEXT_GRAPH_PROMOTION_REVIEW.md](../context-graph/CONTEXT_GRAPH_PROMOTION_REVIEW.md) |
| **CG-2** | V_Link Cross-Module Association Substrate | **Reference Capability** | 3 | [CG_1A_ADAPTER_REGISTRY.md](../context-graph/CG_1A_ADAPTER_REGISTRY.md) |
| **CG-3** | Context Bundle Descriptor / AI Grounding | **Reference Capability With Findings** | 3 | [CG_1D_AI_GROUNDING_CONTRACT.md](../context-graph/CG_1D_AI_GROUNDING_CONTRACT.md) |
| **CG-4** | Consumption Unification (Retrieval Bridge + Grounding Reconcile) | **Reference Capability With Findings** | **4** | [CONTEXT_GRAPH_L4_CERTIFICATION_REVIEW.md](../context-graph/CONTEXT_GRAPH_L4_CERTIFICATION_REVIEW.md) |

### Qualifying reference areas

| Area | What to copy | Key artifacts |
|------|--------------|---------------|
| Federation read (#CG-1) | Read-only orchestrator; adapter registry; PE every hop; traversal caps | `contextGraphOrchestrator.ts`, `adapterRegistry.ts`, `bundleResolver.ts` |
| V_Link substrate (#CG-2) | `*VlinkAccessService` PE; federation without parallel edge store | Module vlink services; `vlinkEntityResolverService` |
| AI grounding bundle (#CG-3) | Constitutional provider → orchestrator; `graph_bundle` catalog | `contextGraphBundleProvider.ts`, `graphBundlePipelineContextService.ts` |
| Consumption unification (#CG-4) | Retrieval bridge; grounding reconcile; inference provenance; pilot flags | `retrievalBundleInferenceBridge.ts`, `groundingReconcile.ts`, `projectAssistantPilotEnv.ts` |
| Tag metadata index | Read-only federated tag lookup; tags as node metadata | `tagIndexService.ts`, `tagProviderRegistry.ts` |

### What this designation is NOT

- Not Level 4 Reference Implementation (File Hub only)
- Not a Reference Module #N integer
- Not Reference Domain
- Not plain Reference Capability for #CG-3 (G9 partial; advisories remain)
- Not authorization for Phase 1B-prime / 2B (program archived)

**Governance records:** [CONTEXT_GRAPH_REFERENCE_STATUS_RECORD.md](../context-graph/CONTEXT_GRAPH_REFERENCE_STATUS_RECORD.md), [CONTEXT_GRAPH_CERTIFICATION_PROMOTION_RECORD.md](../context-graph/CONTEXT_GRAPH_CERTIFICATION_PROMOTION_RECORD.md), [CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md](../context-graph/CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md), [CONTEXT_GRAPH_COUNCIL_RATIFICATION.md](../context-graph/CONTEXT_GRAPH_COUNCIL_RATIFICATION.md)

---

## Business Operations — Reference Candidates (2026-06-19)

**Not** Architecture Reference Module #N integers (#1–#5 remain File Hub, Chat, Calendar, Todo, Place). Business Operations reference candidates use a **separate BO taxonomy** (#1, #6, #7) ratified at domain certification.

| Field | Value |
|-------|-------|
| **Certification** | **LEVEL 3 CERTIFIED WITH FINDINGS** (ratified BO-3 2026-06-19; executed BO-4 2026-06-19) |
| **Prior certification** | Ratified but not executed (BO-3); WC informal plain L3 (2026-06-14) — superseded at BO-3 alignment |
| **Gates** | G1–G9 **24/27 (~89%)** — G2/G3/G4/G5/G7/G9 PASS; G1/G6/G8 PARTIAL |
| **Open blockers** | **0** |
| **Open majors** | **0** |
| **Open advisories** | **17** — tracked on certificate; 90-day remediation plan |
| **Program status** | **ARCHIVED** — [BUSINESS_OPERATIONS_PROGRAM_ARCHIVE.md](../business-operations/BUSINESS_OPERATIONS_PROGRAM_ARCHIVE.md) |

### Reference candidates (ratified language)

| # | Module | Designation | Primary audit |
|---|--------|-------------|---------------|
| **#1** | HR (`hr`) | **Reference Candidate #1 — Workforce Lifecycle** | [HR_OPERATION_MATRIX.md](./audits/HR_OPERATION_MATRIX.md) |
| **#6** | Scheduling (`scheduling`) | **Reference Candidate WITH FINDINGS #6 — Planning** | [SCHEDULING_OPERATION_MATRIX.md](./audits/SCHEDULING_OPERATION_MATRIX.md) |
| **#7** | Workforce Communications (`workforce_comms`) | **Reference Candidate #7 — Workforce Broadcast** | [WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](./audits/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md) |

### Qualifying reference areas

| Area | What to copy | Key artifacts |
|------|--------------|---------------|
| Employee lifecycle (#1) | Service architecture, V-Link, trash, PE dual types, org-chart symmetry | `employeeManagementService`, `hrPolicyDual`, `hrWorkforceBridgeIntegrationService` |
| Shift planning (#6) | Schedule/shift services, domain events, claim lifecycle, manager publish facade | `scheduling*Service`, `schedulingDomainEventService`, `schedulingTrashService` |
| Workforce broadcast (#7) | Audience resolution, publish/ack/report pipeline, read-only AI OK | `workforceComms*Service`, broadcast lifecycle, HR bridge consumption |
| Domain integration | HR→WC bridge contract; BO UX shell bar | `hrWorkforceBridgeIntegrationService`, `BusinessOperationsEmptyState` |
| Operation matrices | Published trio + domain annex | [BUSINESS_OPERATIONS_OPERATION_MATRIX_ANNEX.md](./audits/BUSINESS_OPERATIONS_OPERATION_MATRIX_ANNEX.md) |

### What this designation is NOT

- Not Level 4 Reference Implementation (File Hub only)
- Not Architecture Reference Module #N integer (#1–#5 slots unchanged)
- Not Reference Domain (deferred — post plain L3 or separate charter)
- Not plain Reference Candidate for #6 (WITH FINDINGS suffix until advisories reduce)
- Not plain LEVEL 3 CERTIFIED at domain scope (17 advisories + partial G1/G6/G8)
- Not authorization for new modernization waves (program archived)

**Governance records:** [BUSINESS_OPERATIONS_REFERENCE_STATUS_RECORD.md](../business-operations/BUSINESS_OPERATIONS_REFERENCE_STATUS_RECORD.md), [BUSINESS_OPERATIONS_REFERENCE_DECISION.md](../business-operations/BUSINESS_OPERATIONS_REFERENCE_DECISION.md), [BUSINESS_OPERATIONS_CERTIFICATION_RECORD.md](../business-operations/BUSINESS_OPERATIONS_CERTIFICATION_RECORD.md), [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](../business-operations/BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md)

---

## Reference Workspace — With Findings (2026-06-19)

**Not** Architecture Reference Module #N (#1–#5). **Not** UX Reference #6. Reference Workspace uses **program #3** taxonomy (Reference Workspace Module per [REFERENCE_MODULE_PROGRAM.md](../ux/REFERENCE_MODULE_PROGRAM.md)).

| Field | Value |
|-------|-------|
| **Designation** | **Reference Workspace With Findings** |
| **Certification** | **WS-L3 CERTIFIED WITH FINDINGS** (ratified WS-L3-2 2026-06-19; executed WS-L3-3 2026-06-19) |
| **Registration** | **Approved with Findings** (2026-06-14) — affirmed at WS-L3 |
| **Gates** | G1–G9 **23/27 (~85%)** — G3/G4/G5/G7/G8/G9 PASS; G1/G2/G6 PARTIAL |
| **Open blockers** | **0** |
| **Open majors** | **0** |
| **Open advisories** | **11** — tracked on certificate; 90-day remediation plan |
| **Co-surfaces** | Business Workspace shell · Personal Dashboard shell |
| **Dashboard module** | **Separate certification** — `dashboard` **L3 WITH FINDINGS** executed 2026-06-21 (see Dashboard section below) |
| **Program status** | **ARCHIVED** — [WORKSPACE_PROGRAM_ARCHIVE.md](../workspace/WORKSPACE_PROGRAM_ARCHIVE.md) |

### Qualifying reference areas

| Area | What to copy | Key artifacts |
|------|--------------|---------------|
| Workspace navigation SSOT | Canonical href builders + contracts | `businessWorkspaceNavigation.ts`, `personalDashboardNavigation.ts`, `businessWorkspaceContracts.ts` |
| Module switch authority | Single switch mount | `BusinessWorkspaceContent.tsx` |
| Hub landing mount | Per-module `*WorkspaceLanding` | `module-development.mdc` pattern |
| Segment-switch null deferral | App Router page defers to switch | `workspace/{segment}/page.tsx` (incl. **place** — ENG-1) |
| Cross-surface transitions | B↔P↔Place map | `crossSurfaceNavigation.ts`, [CROSS_SURFACE_TRANSITIONS.md](./CROSS_SURFACE_TRANSITIONS.md) |
| PlatformShell consumer | Personal 3C-4E · Business 3C-4F | `PlatformShell`, `DashboardLayoutWrapper`, `DashboardLayoutInner` |
| Drift enforcement | Registry ↔ switch ↔ contract CI | 64+ contract tests |
| Runtime scope bridge | Tenant/dashboard binding | `WorkspaceRuntimeScopeBridge` — **B-F3 advisory** |

### What this designation is NOT

- Not Level 4 Reference Implementation (File Hub only)
- Not Architecture Reference Module #N integer
- Not UX Reference #6 slot
- Not plain Reference Workspace (11 advisories + REG-B3 open)
- Not Dashboard **module** plain L3 — **L3 WITH FINDINGS** executed 2026-06-21; separate from shell certification
- Not authorization for new workspace modernization program waves (program archived)

**Governance records:** [WORKSPACE_REFERENCE_STATUS_RECORD.md](../workspace/WORKSPACE_REFERENCE_STATUS_RECORD.md), [WORKSPACE_REFERENCE_DECISION.md](../workspace/WORKSPACE_REFERENCE_DECISION.md), [WORKSPACE_CERTIFICATION_RECORD.md](../workspace/WORKSPACE_CERTIFICATION_RECORD.md), [WORKSPACE_COUNCIL_RATIFICATION.md](../workspace/WORKSPACE_COUNCIL_RATIFICATION.md)

---

## Dashboard — Level 3 Certified With Findings (2026-06-21)

**Not** a Reference Module #N integer (#1–#5 remain File Hub, Chat, Calendar, Todo, Place). Dashboard certification is tracked as a **product module L3 WITH FINDINGS** — reference designation **Deferred**.

| Field | Value |
|-------|-------|
| **Module id** | `dashboard` |
| **Certification** | **LEVEL 3 CERTIFIED WITH FINDINGS** (ratified RD-DASH-001 2026-06-21; executed 2026-06-21) |
| **Gates** | G1–G9 **24/27 (~89%)** — G1/G2/G3/G7/G8/G9 PASS; G4/G5/G6 PARTIAL |
| **Open blockers** | **0** |
| **Open majors** | **4** — M1-R (registry), M4 (matrix CI), M5 (tenancy), M7 (business hub) |
| **Open advisories** | **7** — A1–A5, A7, A8 |
| **Reference Module** | **Not designated** — **Deferred** |
| **Program status** | **ARCHIVED** — [DASHBOARD_PROGRAM_ARCHIVE.md](../dashboard/DASHBOARD_PROGRAM_ARCHIVE.md) |

### Qualifying teachable patterns (citation allowed — not Reference Module)

| Pattern | What to copy | Key artifacts |
|---------|--------------|---------------|
| Widget composition host | Dashboard owns grid; modules supply widgets | `widgetRegistry`, `DashboardClient` |
| Analytics consumption | Facade over Analytics capability API | `dashboardAnalyticsFacade`, `GET /api/analytics/dashboard-summary` |
| Trust remediation sequence | PE + activity on all mutations | `dashboardActivityService`, `dashboardPolicyDual` |
| Cross-module decoupling | Domain events for foreign side effects | `dashboardDomainEventService`, P2 subscribers |
| Degraded honest metrics | Strict degraded mode when analytics unavailable | `QuickStatsWidget`, enterprise panel gating |

### What this certification is NOT

- Not Level 4 Reference Implementation (File Hub only)
- Not Reference Module #N designation
- Not plain **LEVEL 3 CERTIFIED** (27/27)
- Not Personal/Business **Workspace shell** certification (WS-L3 separate co-surfaces)
- Not Analytics **capability** certification (separate program)

**Governance records:** [DASHBOARD_CERTIFICATION_RECORD.md](../dashboard/DASHBOARD_CERTIFICATION_RECORD.md), [DASHBOARD_GOVERNANCE_EXECUTION.md](../dashboard/DASHBOARD_GOVERNANCE_EXECUTION.md), [DASHBOARD_COUNCIL_RATIFICATION.md](../dashboard/DASHBOARD_COUNCIL_RATIFICATION.md), [DASHBOARD_REFERENCE_REVIEW.md](../dashboard/DASHBOARD_REFERENCE_REVIEW.md), [DASHBOARD_OPERATION_MATRIX.md](../dashboard/DASHBOARD_OPERATION_MATRIX.md)

---

## Account Platform — Sub-program Capabilities (2026-06-20)

**Not** Reference Module #N integers (#1–#5 remain File Hub, Chat, Calendar, Todo, Place). Account Platform uses a **separate AP taxonomy** for sub-program certifications and platform capabilities. **Umbrella composite certification executed; program archived.**

| Field | Value |
|-------|-------|
| **Program status** | **ARCHIVED** — [ACCOUNT_PLATFORM_PROGRAM_ARCHIVE.md](../account-platform/ACCOUNT_PLATFORM_PROGRAM_ARCHIVE.md) |
| **Umbrella certification** | **LEVEL 3 CERTIFIED WITH FINDINGS** (22/27) — executed 2026-06-20 |
| **Certification model** | L3 WITH FINDINGS (all surfaces) |
| **Reference Module #N** | **Not assigned** — sub-program capabilities, not workspace modules |

### PP-1 Identity & Profile

| Field | Value |
|-------|-------|
| **Certification** | **LEVEL 3 CERTIFIED WITH FINDINGS** (ratified & executed 2026-06-20) |
| **Gates** | G1–G9 **24/27 (~89%)** |
| **Open blockers** | **0** |
| **Open majors on certificate** | PP1-F03 (MFA), PP1-F04 (photo controller partial) |
| **Open advisories** | **9** — tracked on certificate |
| **Pattern reference** | **Deferred** — identity substrate candidate |
| **Certification track** | **ARCHIVED** |

**Qualifying teachable areas (not reference designation):** `identityPolicyDual`, `identityActivityService`, `profileService`/`privacyService` extraction, privacy SoR vs settings projection.

**Governance records:** [PP1_CERTIFICATION_RECORD.md](../account-platform/PP1_CERTIFICATION_RECORD.md), [PP1_CERTIFICATION_RATIFICATION.md](../account-platform/PP1_CERTIFICATION_RATIFICATION.md), [PP1_REFERENCE_REVIEW.md](../account-platform/PP1_REFERENCE_REVIEW.md), [PP1_OPERATION_MATRIX_REAUDIT.md](../account-platform/PP1_OPERATION_MATRIX_REAUDIT.md)

### PP-2 Settings Platform

| Field | Value |
|-------|-------|
| **Certification** | **LEVEL 3 CERTIFIED WITH FINDINGS** (ratified & executed 2026-06-20) |
| **Gates** | G1–G9 **26/27 (~96%)** |
| **Open blockers** | **0** |
| **Open majors on certificate** | PP2-F05 partial (BA-owned business dedup) |
| **Open advisories** | **6** — tracked on certificate |
| **Pattern reference** | **Deferred** — settings orchestration candidate (strongest future promotion) |
| **Certification track** | **ARCHIVED** |

**Qualifying teachable areas (not reference designation):** `settingsService` orchestration, `preferenceRegistry`, `notificationSettingsAdapter`, settings hub IA consolidation.

**Governance records:** [PP2_CERTIFICATION_RECORD.md](../account-platform/PP2_CERTIFICATION_RECORD.md), [PP2_CERTIFICATION_RATIFICATION.md](../account-platform/PP2_CERTIFICATION_RATIFICATION.md), [PP2_REFERENCE_REVIEW.md](../account-platform/PP2_REFERENCE_REVIEW.md), [PP2_OPERATION_MATRIX_REAUDIT.md](../account-platform/PP2_OPERATION_MATRIX_REAUDIT.md)

### PP-3 Billing & Entitlements

| Field | Value |
|-------|-------|
| **Certification** | **LEVEL 3 CERTIFIED WITH FINDINGS** (ratified & executed 2026-06-20) |
| **Gates** | G1–G9 **23/27 (~85%)** |
| **Open blockers** | **0** |
| **Open majors on certificate** | PP3-F08 (modal UX), PP3-F05/F07 partial, PP3-EVAL-F01 |
| **Open advisories** | **5+** — tracked on certificate |
| **Reference capability** | **#AP-BILL-1** — Reference Capability With Findings |
| **Certification track** | **ARCHIVED** |

**Governance records:** [PP3_CERTIFICATION_RECORD.md](../account-platform/PP3_CERTIFICATION_RECORD.md), [PP3_CERTIFICATION_RATIFICATION.md](../account-platform/PP3_CERTIFICATION_RATIFICATION.md), [PP3_REFERENCE_DECISION.md](../account-platform/PP3_REFERENCE_DECISION.md), [PP3_OPERATION_MATRIX_REAUDIT.md](../account-platform/PP3_OPERATION_MATRIX_REAUDIT.md)

### Account Platform — Umbrella Composite

| Field | Value |
|-------|-------|
| **Certification** | **LEVEL 3 CERTIFIED WITH FINDINGS** (ratified & executed 2026-06-20 · RD-AP-UMB-001) |
| **Gates** | G1–G9 **22/27 (~81%)** |
| **Open blockers** | **0** |
| **Open majors on certificate** | **7** — AP-UMB-M01 through M07 |
| **Open advisories** | **19** — ADV-01 through ADV-18 + EVAL-F01 |
| **Reference domain** | **Denied** — composite validates coherence; not a copyable teaching artifact |
| **Program status** | **ARCHIVED** |

**Governance records:** [ACCOUNT_PLATFORM_CERTIFICATION_RECORD.md](../account-platform/ACCOUNT_PLATFORM_CERTIFICATION_RECORD.md), [ACCOUNT_PLATFORM_CERTIFICATION_RATIFICATION.md](../account-platform/ACCOUNT_PLATFORM_CERTIFICATION_RATIFICATION.md), [ACCOUNT_PLATFORM_REFERENCE_DECISION.md](../account-platform/ACCOUNT_PLATFORM_REFERENCE_DECISION.md), [ACCOUNT_PLATFORM_UNIFIED_OPERATION_MATRIX.md](../account-platform/ACCOUNT_PLATFORM_UNIFIED_OPERATION_MATRIX.md)

### #AP-BILL-1 — Billing Platform Pattern

| Field | Value |
|-------|-------|
| **Designation** | **Reference Capability With Findings** |
| **Ratification** | RD-AP3-REF-001 (PP-3); affirmed RD-AP-UMB-REF-002 (umbrella) |
| **Catalog execution** | **2026-06-20** — Final Governance Execution |
| **Open findings on reference** | M02 (modal UX), M05 (invoice activity), M07 (module PE), ACC-01 (tier boundary) |
| **Plain Reference Capability** | **Not ratified** — open majors block |

| Pattern | What to copy | Key artifacts |
|---------|--------------|---------------|
| Billing service facade | Canonical mutations; no Prisma in controllers | `billingService`, `entitlementService` |
| Stripe checkout sync | Webhook → entitlement cache convergence | Stripe handlers, checkout sync |
| API convergence | Single `/api/billing` surface; 410 retirement | `billingController`, `web/src/api/billing.ts` |
| Entitlement reads | Tier normalization boundary | `normalizeTier()`, entitlement cache |

**Teaching docs:** [PP3_BILLING_SERVICE_MODEL.md](../account-platform/PP3_BILLING_SERVICE_MODEL.md), [PP3_BILLING_CLIENT_ARCHITECTURE.md](../account-platform/PP3_BILLING_CLIENT_ARCHITECTURE.md)

**Promotion path to plain Reference Capability:** Close M02, M05, M07; separate reference promotion vote.

### What this designation is NOT

- Not Level 4 Reference Implementation (File Hub only)
- Not Reference Module #N integer
- Not Reference Domain (Account Platform composite)
- Not plain LEVEL 3 CERTIFIED (open findings on all certificates)
- Not authorization for new Account Platform modernization program waves

**Program records:** [ACCOUNT_PLATFORM_STATUS_RECORD.md](../account-platform/ACCOUNT_PLATFORM_STATUS_RECORD.md), [ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md](../account-platform/ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md), [ACCOUNT_PLATFORM_PROGRAM_ARCHIVE.md](../account-platform/ACCOUNT_PLATFORM_PROGRAM_ARCHIVE.md), [ACCOUNT_PLATFORM_POST_RATIFICATION_ROADMAP.md](../account-platform/ACCOUNT_PLATFORM_POST_RATIFICATION_ROADMAP.md)

---

## File Hub — Reference Module #1 (Level 4)

**Copy for:** Any module with user data, deletes, sharing, search, or cross-module links.

| Pattern | What to copy | Key artifacts |
|---------|--------------|-----------------|
| Canonical service boundaries | One service per mutation domain; no Prisma in controllers | `driveDeleteService`, `driveUploadService`, `driveVisibilityService` |
| Global Trash | `trashedAt` + `*TrashService` + `registerGlobalTrashHandlers` | [GLOBAL_TRASH.md](./GLOBAL_TRASH.md) |
| Permission-aware visibility | Central list/read/search; tenant scope | `driveVisibilityService`, `listAccessible*` |
| Owned / shared / Policy Engine reads | `*PolicyDual` + post-query or pre-check filter | `drivePolicyDual`, `authorize()` |
| V_Link access + lifecycle | Membership ≠ content; unlink on permanent delete | `driveVlinkAccessService`, `driveVlinkLifecycleService` |
| Platform Entity registration | `register*PlatformEntities` + manifest `entities[]` | `platformEntityRegistry.ts` |
| Manifest truth | Capabilities match runtime; no aspirational types | `builtInModuleManifests.ts` |
| Domain events | Registered types; emit from services after success | `driveDomainEventService`, registry |
| Module activity | `emitModuleActivityEvent` on writes | `driveActivityService` |
| Notifications | `*NotificationService` + manifest metadata | `driveNotificationService` |
| Lifecycle correctness | `authorize → execute → activity → domain → notify → realtime` | Operation matrix **C** rows |

**Do not copy:** File-specific storage (GCS), folder tree semantics, enterprise drive parity — unless the target module is file-like.

---

## Notifications — UX Reference #2 (management inbox)

**Copy for:** Platform inbox feeds, management-page modules, cross-module notification routing, bulk feed actions. **UX surfaces only** — [`REFERENCE_MODULE_NOTIFICATIONS.md`](../ux/audits/REFERENCE_MODULE_NOTIFICATIONS.md).

| Pattern | What to copy | Key artifacts |
|---------|--------------|-----------------|
| Management page shell | `PageHeader` + `PageToolbar` on feed route | `web/src/app/notifications/page.tsx` |
| Row action menu | `NotificationActionsMenu` → `DropdownMenu` | 3A-4B closeout |
| Bulk + per-row delete confirm | `ConfirmModal` gates | 5C.1 closeout |
| Mobile category sidebar | Collapsible sheet (Calendar 3C-7B pattern) | 5G N-5 |
| Cross-module deep links | Metadata-driven routing per module type | Feed row click handlers |
| Quick actions | `NotificationQuickActions` from manifest metadata | `builtInModuleManifests` `notifications[]` |
| Feed error toasts | `showNotificationActionError()` | 5G N-2 |
| Keyboard feed shortcuts | `j`/`k`/`Space`/`Escape` | NTF-11/12 QA evidence |

**Do not copy:** Notification payload schemas per module (module-specific); settings sub-route chrome until N-3 migrated.

---

## Chat — Reference Module #2 (Level 3 · Architecture)

**Copy for:** Collaboration, messaging, realtime **code**, AI actions on conversational data. **Not** UX Reference #2 (Rejected at 5B.3).

| Pattern | What to copy | Key artifacts |
|---------|--------------|-----------------|
| Realtime collaboration | Adapter owns socket fan-out; controller/socket thin | `chatRealtimeService` |
| AI → service routing | `ActionExecutor` calls `*AIActionService`, not controllers | `chatAIActionService` |
| Socket → service routing | Mutations on socket paths delegate to services | `chatMessageService`, `chatSocketService` |
| Notification adapters | Payload shaping + manifest types | `chatNotificationService` |
| Activity adapters | Normalized actions per write | `chatActivityService` |
| Domain event ownership | `chatDomainEventService`; no controller emit | Registry + service emitters |
| Thin controller collapse | Zero Prisma; contract tests | `chatController.contract.test.ts` |
| Message/conversation visibility | Participant scope + `trashedAt: null` + PE read | `chatVisibilityService` |
| V_Link content-access separation | V_Link membership does not grant content | `chatVlinkAccessService` |
| Global Trash (conversation) | Handler + `chatTrashService` | Phase 2 doc |

**Do not copy:** Conversation/message model specifics, thread enum without entity registration.

---

## Calendar — Reference Module #3 (Level 3) · UX Reference #5

**Copy for:** Time-based data, schedules, reminders, recurrence, availability. **UX surfaces:** also **Reference UX #5** — scheduling/time-grid interaction patterns ([`REFERENCE_MODULE_CALENDAR.md`](../ux/audits/REFERENCE_MODULE_CALENDAR.md)).

| Pattern | What to copy | Key artifacts |
|---------|--------------|-----------------|
| Scheduler → service ownership | Cron calls module scheduler only | `platformCronJobs` → `calendarSchedulerService` |
| Reminder lifecycle | Dispatch in module service; not raw cron Prisma | `calendarReminderService` |
| Recurrence ownership | RRULE expansion isolated | `calendarRecurrenceService` |
| Availability / free-busy reads | Visibility-owned range queries | `calendarVisibilityService` |
| Time-based notifications | Reminder type in manifest + adapter | `calendar_reminder` |
| Event lifecycle | Trash/restore/permanent + domain events | `calendarTrashService` |
| ICS isolation | Import/export in dedicated service | `calendarIcsService` |
| AI calendar actions | `calendarAIActionService` + visibility AI helpers | Phase 1F |
| Calendar event V_Link / entity | Single conservative entity (`event`) | `calendarVlinkAccessService`, `registerCalendarPlatformEntities` |
| Policy dual on reads | Post-query filter on list/search | `evaluateCalendarPolicyDual` |

**Do not copy:** Calendar attendee RSVP model, ICS timezone edge cases as generic patterns — document module-specifically.

---

## Todo — Reference Module #4 (Level 3) · Reference UX #3

**Copy for:** Task/work-item modules, assignment flows, operational satellites, cross-module links. **UX surfaces:** also **Reference UX #3** — workspace-split task / list-board-calendar patterns ([`REFERENCE_MODULE_TODO.md`](../ux/audits/REFERENCE_MODULE_TODO.md)).

| Pattern | What to copy | Key artifacts |
|---------|--------------|-----------------|
| Core task lifecycle | Single write service + side-effect adapters | `todoTaskService`, `todoActivityService`, `todoDomainEventService` |
| Assignment fan-out | Notify + domain + realtime on assign change | `todoNotificationService`, assign hooks in `todoTaskService` |
| Global Trash (task) | `todoTrashService` + handler | [TODO_PHASE2_TRASH_ENTITY_VLINK.md](./audits/TODO_PHASE2_TRASH_ENTITY_VLINK.md) |
| Visibility + PE reads | Legacy scope + post-query filter | `todoVisibilityService`, `filterTasksByReadPolicy` |
| V_Link (task only) | Creator/assignee + PE; unlink on permanent delete | `todoVlinkAccessService`, `todoVlinkLifecycleService` |
| AI task actions | `todoAIActionService` — no controller imports | Phase 1F tests |
| Calendar/file bridges | Integration service; visibility on linked assets | `todoIntegrationLinkService`, `todoCalendarBridgeService` |
| Satellite extraction | One service per sub-domain; thin controller delegates | `todoCommentService`, `todoProjectService`, etc. |

**Do not copy:** Creator/assignee-only ACL as generic pattern for shared workspaces; subtask/comment models without entity registration; in-app due reminders until `todo_reminder_dispatch` exists.

---

## AI Experience — Reference UX #4

**Copy for:** Conversational AI / twin workspace modules, streaming chat UX, conversation lifecycle, embedded AI surfaces. **UX surfaces only** — [`REFERENCE_MODULE_AI.md`](../ux/audits/REFERENCE_MODULE_AI.md). **Not** AI Platform architecture certification.

| Pattern | What to copy | Key artifacts |
|---------|--------------|----------------|
| Twin workspace shell | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` | `AIChatPageShell.tsx` |
| Single chat engine | Page + embedded → `AIChatModule` → `AIChatWorkspace` | `AIChatModule.tsx`, `AIChatWorkspace.tsx` |
| Conversation delete confirm | `requestDeleteConversation` → `ConfirmModal` → `trashItem` | Unified delete path (5H-B) |
| Row + header menus | `DropdownMenu` on sidebar + chat header | 3A-4A + 5H-B |
| Drag-to-trash confirm | Sidebar drag → `GlobalTrashBin` → `ConfirmModal` | Drive 3B-6 class |
| Mobile conversations sheet | Calendar 3C-7B pattern | `AIChatPageShell.tsx` |
| Cross-route navigation | `aiExperienceNavigation.ts` + `AIExperienceNavLinks` | `/ai-chat` ↔ `/ai` |
| Business hub entry | `AIWorkspaceLanding` + workspace switch | `module-development.mdc` |
| Widget thin-wrapper | `AIWidget` → `AIChatModule` | 5H-C parity |
| Drive attachments | Composer upload/save bridge | `AIFileUpload.tsx` |
| Shared EmptyState | `AIChatEmptyState` wrapper | 5H-B |

**Do not copy:** Header `AIChatDropdown` as primary workspace (certified quick-access exception only); embedded `provider: 'auto'` as full picker substitute on page routes; platform twin pipeline internals as UX patterns.

**Evidence:** [`REFERENCE_MODULE_AI.md`](../ux/audits/REFERENCE_MODULE_AI.md). **Reference UX #4** registered (2026-06-03).

---

## Place — Reference Module #5 (Level 3)

**Copy for:** External graph modules, business directory surfaces, commerce routing, dual consumer/publisher UX.

| Pattern | What to copy | Key artifacts |
|---------|--------------|----------------|
| External personal graph | User-scoped Main Street; typed nodes | `placeService`, `PlaceNode`, `BusinessFollow` sync |
| Dual-surface module | Consumer `/place` + publisher workspace | `PlaceWorkspaceLanding`, scoped PE |
| Directory + verification gates | Published listing; EIN gate on discovery | `placeListingService`, `placeVisibilityService` |
| Commerce routing (not checkout) | Interaction links + click telemetry | [PLACE_COMMERCE_BOUNDARY.md](./PLACE_COMMERCE_BOUNDARY.md) |
| Connection mirror | Member Relationship + PlaceNode on accept | `placeConnectionService` |
| Meeting-at-place + Calendar delegate | Social meeting; event via Calendar service | `placeMeetingService.linkToCalendar` |
| Bounded community | Join/leave side effects; no Chat messages | `placeCommunityService` |
| Global Trash + V_Link | Listing + meeting entities | `placeTrashService`, `placeVlinkAccessService` |

**Do not copy:** Payment processing, PO/invoice workflows, vendor onboarding, public follower counts, Chat message persistence.

**Evidence:** [PLACE_PATTERN_GUIDE.md](./PLACE_PATTERN_GUIDE.md), [PLACE_COMMERCE_BOUNDARY.md](./PLACE_COMMERCE_BOUNDARY.md), [PLACE_REFERENCE_COUNCIL_REVIEW.md](./audits/PLACE_REFERENCE_COUNCIL_REVIEW.md). **Designated Reference Module #5** (Wave 4B, 2026-06-02).

### Place — UX certification (Wave 6B, 2026-06-14)

**Architecture #5 ≠ UX Reference #6.** Independent tracks. Place is **UX-L3 Certified** and **recommended primary candidate** for expansion-tier UX #6 — not registered.

| Metric | Value |
|--------|-------|
| Scorecard | **11 PASS / 0 PWF / 0 FAIL** |
| UX-L1 / L2 / L3 | **Certified** (strict L3) |
| QA matrix Part 2G | **27 PASS / 0 FAIL / 0 BLOCKED** |
| Reference UX #6 | **Eligible With Findings** — registration deferred |
| Reference Workspace | **Ineligible** (product module, not platform shell) |
| Wave 6C expansion review | **Approve governed expansion** — Place primary #6 candidate |

**Unique UX archetype (future Wave 6D patterns):** dual-surface consumer/publisher, React Flow neighborhood graph, explore/follow discovery, publisher listing editor, external commerce links, meeting-at-place + calendar bridge, transaction history privacy.

**Evidence:** [`PLACE_UX_CERTIFICATION_REVIEW.md`](../ux/audits/PLACE_UX_CERTIFICATION_REVIEW.md), [`PLACE_UX_SCORECARD.md`](../ux/audits/PLACE_UX_SCORECARD.md), [`PLACE_UX_CERTIFICATION.md`](../ux/audits/PLACE_UX_CERTIFICATION.md), [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md).

**Prior baseline (superseded):** [`PLACE_UX_BASELINE_AUDIT.md`](../ux/audits/PLACE_UX_BASELINE_AUDIT.md) — 1/7/3 pre-remediation.

---

## Module guidance — which references to weight

| Target module | Primary references | Secondary | Unique teachable angle |
|---------------|-------------------|-----------|------------------------|
| **Todo** | *(certified — see Reference #4 + UX #3 above)* | Calendar (#3 UX #5) calendar bridge | **Reference UX #3** — task workspace split |
| **Notes** | *(paused 2026-06-01 — see Notebook initiative)* | — | Superseded by Notebook product track |
| **Notebook** | Todo (#4), File Hub (#1), Calendar (#3) | Chat (#2) AI facade patterns | Composition + NotebookLink; Phase 7 audit complete — **not L3 certified** |
| **AI surfaces** | File Hub (#1) read providers | Notifications (#2) routing | **Reference UX #4** — twin/chat workspace |
| **Place** | **Self (future UX #6)** — graph/dual-surface; Drive #1 (confirm/trash/empty) | Calendar #5 (scheduling links), Todo UX #3 (hub chrome), File Hub (V_Link) | **Arch #5** + **UX-L3 Certified** — Ref UX **#6 Eligible CwF** (not registered) |
| **Inbox / feed modules** | **Notifications UX #2** | Drive #1 (workspace), Calendar #5 (time-grid) | Management-page archetype; cross-module routing hub |
| **Dashboard** | File Hub (manifest, activity), Chat (realtime widgets) | Analytics facade (consumer) | **L3 CwF** — composition host + analytics consumer; not Reference Module |
| **Analytics** | File Hub (activity vs analytics separation) | — | Read-only / derived metrics; often N/A trash |
| **Business Workspace** | Notebook (composition), File Hub (manifest) | [WORKSPACE_ROUTING_CONTRACT.md](./WORKSPACE_ROUTING_CONTRACT.md) | **Registered** Reference Workspace hub — segment navigation, CI drift tests |

### Notebook — composition module (Phases 1–6.5 shipped; Phase 7 audit 2026-06-02)

Product module **`notebook`** composes Notes pages, Todo tasks, Calendar events, and File Hub files via **NotebookLink** (operational links, not V_Link replacement).

| Pattern | Status | Key artifacts |
|---------|--------|----------------|
| Composition reads | ✅ | `notebookContextService`, `notebookWorkspaceContextService` |
| Operational links | ✅ | `notebookLinkService`, PE `notebook:link:*` |
| AI orchestration | 🟢 | `notebookAIActionService` — HTTP + ActionExecutor + toolExecutor (read-only) |
| Page domain | Delegated | `notes*Service`, Global Trash `moduleId: notes` |
| Platform entity | 🟢 | `notebook:page` registered; `NOTEBOOK_PAGE_ENTITY_TYPE`; V_Link alias `NOTE` |
| Manifest truth | ✅ | `entities[]`, `operationalLinks`, no false `trash`/`vlink` on `notebook` |
| Certification | **Level 3 Certified** (2026-06-02) | Composition module; not Reference #5 — see review doc |

**Reference #5:** **Place** is **Reference Module #5** (**Level 3 Certified**, council Wave **4B**, 2026-06-02). Teachable patterns: [PLACE_PATTERN_GUIDE.md](./PLACE_PATTERN_GUIDE.md), commerce law: [PLACE_COMMERCE_BOUNDARY.md](./PLACE_COMMERCE_BOUNDARY.md), council record: [PLACE_REFERENCE_COUNCIL_REVIEW.md](./audits/PLACE_REFERENCE_COUNCIL_REVIEW.md). Notebook is L3 Certified composition module — **not** Reference #5.

### Notes — sub-domain (dependency)

Standalone Notes product cert is **superseded** by Notebook. **`notes`** remains installed for page persistence and trash handler. Copy order for remaining page-domain gaps:

1. **File Hub** — `notebook:page` entity registration (NB-P0-1).
2. **Chat** — ActionExecutor registration pattern for notebook AI.
3. **Todo (#4)** — task writes stay in `todoAIActionService` — never merge into notebook controllers.

---

## Phase 0 deliverables (every module wave)

Before Phase 1 implementation, produce:

1. `{MODULE}_CONSTITUTIONAL_AUDIT.md`
2. `{MODULE}_OPERATION_MATRIX.md`
3. `{MODULE}_SERVICE_EXTRACTION_PLAN.md` — Place: [PLACE_SERVICE_EXTRACTION_PLAN.md](./PLACE_SERVICE_EXTRACTION_PLAN.md) ✅
4. `{MODULE}_DOMAIN_MODEL.md` — Place: [PLACE_DOMAIN_MODEL.md](./PLACE_DOMAIN_MODEL.md) ✅ (Wave 1B gate)
5. Ledger + roadmap index updates

Use this catalog when filling **“reference module pattern to copy”** columns in the extraction plan.

---

## Evidence links

| Module | Certification | Extraction / trash / V_Link |
|--------|---------------|---------------------------|
| File Hub | [FILE_HUB_MATURITY_ASSESSMENT.md](./audits/FILE_HUB_MATURITY_ASSESSMENT.md) | [FILE_HUB_OPERATION_MATRIX.md](./audits/FILE_HUB_OPERATION_MATRIX.md) |
| Chat | [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) | [CHAT_SERVICE_EXTRACTION_PLAN.md](./audits/CHAT_SERVICE_EXTRACTION_PLAN.md) |
| Calendar (Arch #3 · UX #5) | [CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md), [REFERENCE_MODULE_CALENDAR.md](../ux/audits/REFERENCE_MODULE_CALENDAR.md) | [CALENDAR_SERVICE_EXTRACTION_PLAN.md](./audits/CALENDAR_SERVICE_EXTRACTION_PLAN.md) |
| Notifications (UX #2) | [NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md](../ux/audits/NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md), [REFERENCE_MODULE_NOTIFICATIONS.md](../ux/audits/REFERENCE_MODULE_NOTIFICATIONS.md) | 3A-4B / 3C-6 / 5C / 5G UX closeouts |
| Todo (Phase 0) | [TODO_LEVEL3_CERTIFICATION_REVIEW.md](./audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md) | [TODO_CONSTITUTIONAL_AUDIT.md](./audits/TODO_CONSTITUTIONAL_AUDIT.md) |
| Notebook (L3) | [NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md](./audits/NOTEBOOK_LEVEL3_CERTIFICATION_REVIEW.md) | [NOTEBOOK_CONSTITUTIONAL_AUDIT.md](./audits/NOTEBOOK_CONSTITUTIONAL_AUDIT.md), [NOTEBOOK_OPERATION_MATRIX.md](./audits/NOTEBOOK_OPERATION_MATRIX.md) |
| Place (Reference #5) | [PLACE_REFERENCE_COUNCIL_REVIEW.md](./audits/PLACE_REFERENCE_COUNCIL_REVIEW.md) | [PLACE_PATTERN_GUIDE.md](./PLACE_PATTERN_GUIDE.md), [PLACE_COMMERCE_BOUNDARY.md](./PLACE_COMMERCE_BOUNDARY.md), [PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md](./audits/PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md) |
| Reference Workspace | [REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md) | [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](./REFERENCE_WORKSPACE_PLATFORM_SHELL.md) |
| Dashboard (L3 CwF) | [DASHBOARD_CERTIFICATION_RECORD.md](../dashboard/DASHBOARD_CERTIFICATION_RECORD.md) | [DASHBOARD_OPERATION_MATRIX.md](../dashboard/DASHBOARD_OPERATION_MATRIX.md), [DASHBOARD_GOVERNANCE_EXECUTION.md](../dashboard/DASHBOARD_GOVERNANCE_EXECUTION.md) |
| AI Platform (cross-cutting) | [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md) | [AI_PLATFORM_CONSTITUTION.md](./AI_PLATFORM_CONSTITUTION.md), [AI_PLATFORM_OPERATION_MATRIX.md](./AI_PLATFORM_OPERATION_MATRIX.md), [audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md](./audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md) |

---

### Personal Dashboard — platform shell (WS-L1 Certified with Findings, 2026-06-03)

**Reference Workspace co-surface** — dashboard archetype (widget grid + module routes). **WS-L1 + WS-L2 + WS-L3 Certified with Findings** (combined program) · **Registered Approved with Findings** (2026-06-14). Dashboard **module** widget grid remains separate product scope.

| Pattern | Status | Key artifacts |
|---------|--------|----------------|
| WS-L1 certification | ✅ **Certified with Findings** | [PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md](./audits/PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md) |
| WS-L2 certification | ✅ **Certified with Findings** | [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) |
| WS-L3 certification (program) | ✅ **Certified with Findings** | [WORKSPACE_CERTIFICATION_RECORD.md](../workspace/WORKSPACE_CERTIFICATION_RECORD.md) |
| Registration | ✅ **Approved with Findings** (co-surface) | [REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md) |
| Routing contract | ✅ | [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) |
| Widget boundary | ✅ | [PERSONAL_DASHBOARD_WIDGET_CONTRACT.md](./PERSONAL_DASHBOARD_WIDGET_CONTRACT.md) |
| Cross-surface map | ✅ | [CROSS_SURFACE_TRANSITIONS.md](./CROSS_SURFACE_TRANSITIONS.md) |
| Context variants | ✅ | [PERSONAL_CONTEXT_VARIANTS.md](./PERSONAL_CONTEXT_VARIANTS.md) |
| Navigation enforcement | ✅ | `personalDashboardNavigation.ts` · `crossSurfaceNavigation.ts` |
| CI navigation tests | ✅ | 15 + 6 tests PASS |
| PlatformShell (personal) | ✅ | `DashboardLayoutInner` → 3C-4E |
| Registry drift CI | ✅ | `personalDashboardRegistryDrift.test.ts` (15 tests, Wave 2D) |
| Widget escalation in components | 🟡 Finding F-2 | Shell API ready; module interiors deferred |

**WS-L2 readiness:** **88%** — **WS-L2 Certified with Findings** (2026-06-14) — [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md)

**Evidence:** [PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md](./audits/PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md), [PERSONAL_DASHBOARD_WAVE_2B_CLOSEOUT.md](./audits/PERSONAL_DASHBOARD_WAVE_2B_CLOSEOUT.md), [PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md](./audits/PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md), [PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md](./audits/PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md).

### Business Workspace — platform shell (WS-L1 + WS-L2 + Registered, 2026-06-14)

**Reference Workspace Program** — **not** UX slot #6, **not** architecture Reference #6. **Registered holder** (hub archetype) — **Approved with Findings**. **WS-L3 CERTIFIED WITH FINDINGS** at program level (2026-06-19).

| Pattern | Status | Key artifacts |
|---------|--------|----------------|
| WS-L1 certification | ✅ **Certified with Findings** | [BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md](./audits/BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md) |
| WS-L2 certification | ✅ **Certified with Findings** | [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) |
| WS-L3 certification (program) | ✅ **Certified with Findings** | [WORKSPACE_CERTIFICATION_RECORD.md](../workspace/WORKSPACE_CERTIFICATION_RECORD.md) |
| Registration | ✅ **Approved with Findings** (co-surface) | [REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md) |
| Module mount switch | ✅ | `BusinessWorkspaceContent.tsx` (authoritative) |
| Navigation single source | ✅ | `businessWorkspaceNavigation.ts` + `businessWorkspaceContracts.ts` |
| Segment URL canonical | ✅ | `buildBusinessWorkspaceModuleHref` — all mounted modules |
| CI drift enforcement | ✅ | `businessWorkspaceNavigation.test.ts`, `businessWorkspaceRegistryDrift.test.ts` |
| PlatformShell (business mode) | ✅ | `DashboardLayoutWrapper` → 3C-4F certified |
| Runtime scope | 🟡 Finding F-4 | `BusinessLayoutRuntimeShell`, `WorkspaceRuntimeScopeBridge` |
| Installed-module filter | 🟡 Finding F-4 | `BusinessConfigurationContext`, `DashboardLayoutWrapper` |
| Hub standardization | ✅ | Dead landings removed (1B); segment-page vs switch documented |
| Stub product UI | ✅ | **Removed** (Wave 1B) |
| Orphan segment pages | ✅ **Closed (1D)** | — |
| Route hygiene CI | ✅ | `businessWorkspaceRouteHygiene.test.ts` |

**WS-L2 readiness:** **90%** — **WS-L2 Certified with Findings** (2026-06-14) — [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md)

**Canonical entries:** [WORKSPACE_ROUTING_CONTRACT.md](./WORKSPACE_ROUTING_CONTRACT.md) §5.

**Personal Dashboard shell:** `DashboardLayoutInner` — co-surface; **Registered Approved with Findings** (2026-06-14).

### Reference Workspace Program — combined (registered 2026-06-14; WS-L3 2026-06-19)

| Metric | Value |
|--------|-------|
| WS-L1 | Both co-surfaces certified |
| WS-L2 | ✅ **Certified with Findings** |
| **WS-L3** | ✅ **Certified with Findings** (2026-06-19) |
| Registration | ✅ **Approved with Findings** |
| Reference designation | ✅ **Reference Workspace With Findings** |
| Holder model | **Hybrid** — Platform Shell + Business (hub) + Personal (dashboard shell) |
| G1–G9 at WS-L3 | **23/27 (~85%)** |
| Open findings | **11** advisory (RWS-F1 **closed** ENG-1) |
| Dashboard module | **L3 WITH FINDINGS** (2026-06-21) — separate from shell; M7 hub open |
| Program | **ARCHIVED** — [WORKSPACE_PROGRAM_ARCHIVE.md](../workspace/WORKSPACE_PROGRAM_ARCHIVE.md) |

**Evidence:** [REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md) · [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) · [REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md](./audits/REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md)

**Prior evidence:** [BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md](./audits/BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md), [BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md](./audits/BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md), [BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md](./audits/BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md), [BUSINESS_WORKSPACE_WAVE_1C_CLOSEOUT.md](./audits/BUSINESS_WORKSPACE_WAVE_1C_CLOSEOUT.md), [BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md](./audits/BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md), [PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md](./audits/PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md), [PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md](./audits/PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md), [PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md](./audits/PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md), [REFERENCE_WORKSPACE_CHARTER_REVIEW.md](./audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md).

### Domain pattern annexes (Wave 6C — no numbered UX slots)

| Domain | Primary UX inheritance | Notes |
|--------|------------------------|-------|
| **HR** | Todo UX #3 + Drive UX #1 | Work management + entity browser annex |
| **Scheduling** | Calendar UX #5 | Time-grid already covered |
| **Marketplace (partner)** | Nearest built-in archetype + `moduleSpecs.md` | **L3 CwF** partner delegate foundation (RD-MP-1B-G-001) · Pilot `vssyl-pilot-assets` · [MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD](../marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md) |
| **Analytics** | Notifications UX #2 (feed/dashboard cards) | Annex when certification matures |
| **Business Workspace** | Reference Workspace **registered** holder (hub) | Platform shell orchestration — [REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md) |

---

*Last updated: 2026-06-24 (Marketplace Partner Runtime L3 CwF — Phase 1B-G)*
