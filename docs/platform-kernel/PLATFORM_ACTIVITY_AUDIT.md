# Platform Activity — Constitutional Audit

**Program:** Platform Kernel Modernization — Wave 1  
**Date:** 2026-06-22  
**Status:** Discovery only  
**Related:** [DOMAIN_EVENTS.md](../architecture/DOMAIN_EVENTS.md); `memory-bank/moduleSpecs.md` (normalized activity envelope)

---

## 1. What is Platform Activity?

Platform Activity is the **immutable record of successful module actions** using the normalized interoperability envelope: actor, action, target, parent, context (tenant scope), visibility, metadata. It answers: *"What did this user do, in which module, on which entity, under which tenant scope?"*

**Canonical API:** `emitModuleActivityEvent` in `server/src/services/moduleActivityService.ts`.

**Persistence:** `prisma.log.create` with `operation: 'module_activity_event'` and full envelope in `metadata` JSON.

**Not Platform Activity:** Domain events (`domain_event_recorded`), operator logs, AI learning stubs, analytics rollups, or legacy `Activity` table rows without normalized envelope.

---

## 2. Who owns Platform Activity?

| Role | Owner |
|------|-------|
| **Platform capability owner** | Platform Engineering (Runtime Kernel) |
| **Write contract** | `moduleActivityService` — sole canonical writer |
| **Module emission** | Each module's `*ActivityService` adapter |
| **Read federation** | **Unowned** — fragmented across controllers (gap) |
| **Envelope authority** | `memory-bank/moduleSpecs.md` + per-module activity models (e.g. [DASHBOARD_ACTIVITY_MODEL.md](../dashboard/DASHBOARD_ACTIVITY_MODEL.md)) |

---

## 3. Current maturity: **L1**

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Write path | **L2 partial** | Canonical emitter; 18 module adapters |
| Read path | **L0–L1** | ACT-R1 legacy multi-source reads |
| Ownership | **L1** | No platform read service |
| Testing | **L2 partial** | Per-module activity tests; no read-contract CI |
| Documentation | **L2** | Module models exist; no kernel operation matrix |

---

## 4. Inventory

### 4.1 Canonical writer

| Component | Path | Role |
|-----------|------|------|
| `emitModuleActivityEvent` | `server/src/services/moduleActivityService.ts` | Persist envelope + `activity:feed:refresh` socket |

### 4.2 Module activity adapters (writers)

| Module / domain | Adapter | Notes |
|-----------------|---------|-------|
| `drive` | Via services/controllers | Normalized on primary paths; legacy `Activity` table remnants |
| `chat` | `chatActivityService.ts` | L3 certified |
| `calendar` | `calendarActivityService.ts` | L3 certified |
| `todo` | `todoActivityService.ts` | L3 certified |
| `notes` | `notes/notesActivityService.ts` | Notebook sub-domain |
| `notebook` | `notebook/notebookLinkActivityService.ts` | L3 certified |
| `place` | `place/placeActivityService.ts` | L3 certified |
| `dashboard` | `dashboardActivityService.ts` | L3 CwF — 8+ actions |
| `analytics` | `analytics/analyticsActivityService.ts` | Platform capability L2 CwF |
| `hr` | `hrActivityService.ts` | BO L3 CwF |
| `scheduling` | `schedulingActivityService.ts` | BO L3 CwF |
| `workforce_comms` | `workforceActivityService.ts` | BO L3 CwF |
| `business` | `business/businessActivityService.ts` | BA / business admin |
| `orgchart` | `business/orgChartActivityService.ts` | BA #OC-* |
| `approval_hierarchy` | `business/approvalHierarchyActivityService.ts` | BA #OC-3 |
| Account PP-1 | `account/identityActivityService.ts` | AP L3 CwF |
| Account PP-2 | `account/settingsActivityService.ts` | Also emits domain events inline |
| Account PP-3 | `account/billingActivityService.ts` | AP L3 CwF |
| Entitlements | `account/entitlementActivityService.ts` | AP L3 CwF |

### 4.3 Activity taxonomies (registry-like)

| File | Scope |
|------|-------|
| `business/businessActivityTaxonomy.ts` | Business admin actions |
| `platform/workforceCommsActivityTaxonomy.ts` | Workforce comms actions |

**Gap:** No **platform-wide** activity type registry — types are module-local strings.

### 4.4 Activity consumers (read paths)

| Consumer | Path | Read pattern | ACT-R1? |
|----------|------|--------------|---------|
| **Global activity feed** | `activityFeedController.ts` | `Activity` + `Message` + `Event` + `Task` + partial `Log` | **Yes** |
| **Place activity feed** | `placeVisibilityService.ts` | `Log` (`module_activity_event`, module=place) | **No** — model pattern |
| **File activity history** | `fileController.ts` | `Activity` + `Log` merge | **Yes** |
| **Folder activity history** | `folderController.ts` | `Activity` + `Log` merge | **Yes** |
| **Personal analytics** | `analyticsCapabilityService.ts` | `prisma.activity.findMany` | **Yes** (AN-M2) |
| **AI cross-module context** | `CrossModuleContextEngine.ts` | `prisma.activity.findMany` | **Yes** |
| **Digital Life Twin** | `DigitalLifeTwinService.ts` | `prisma.activity.findMany` | **Yes** |
| **AI context debug** | `ai-context-debug.ts` | `prisma.activity.findMany` | **Yes** |
| **Workforce reporting** | `workforceReportingService.ts` | `Log` module_activity_event | **No** |

### 4.5 Realtime consumer

| Event | Emitter | Subscriber |
|-------|---------|------------|
| `activity:feed:refresh` | `moduleActivityService` | Actor's socket via `chatSocketService` |

### 4.6 Legacy store (`prisma.activity`)

| Operation | Location | Status |
|-----------|----------|--------|
| Read | Feed, analytics, AI, file history | **Legacy — ACT-R1** |
| Delete on file purge | `driveDeleteService.ts` | Legacy cleanup |
| Write | Largely superseded by normalized path on File Hub primary mutations | Residual risk |

---

## 5. Largest Activity risks

| Rank | Risk | Impact |
|------|------|--------|
| **1** | **ACT-R1** — `activityFeedController` multi-source aggregation | Daily dashboard feed not constitutionally honest |
| **2** | **AN-M2** — analytics personal reads `Activity` table | Certified capability G2 partial |
| **3** | **AI grounding** — context engines read legacy Activity | UX Ref #4 / AI trust |
| **4** | **No platform read service** — each consumer invents queries | Duplication, tenant leakage risk |
| **5** | **Partial normalized inclusion** — feed only queries `Log` for drive/chat modules | Incomplete L3 module visibility in feed |
| **6** | **No activity type registry** — string actions vary by module | Federation and certification matrix difficulty |

---

## 6. Duplicate activity paths

| Pattern | Paths | Issue |
|---------|-------|-------|
| Drive file action | Normalized `Log` + legacy `Activity` row (historical) | Dual truth for same action |
| Feed aggregation | SoR queries (messages, tasks, events) **and** activity log | Re-derives activity from source tables |
| Domain event → Log | `domain_event_recorded` separate from `module_activity_event` | Consumers may double-count if merged naively |
| Settings updates | `settingsActivityService` emits **both** activity and domain events | Intentional dual-write; readers must not merge blindly |

---

## 7. Missing activity coverage (estimated)

Modules with adapters are strong on **write** paths for certified mutations. Gaps likely on:

| Area | Gap |
|------|-----|
| Read APIs | No unified platform read — **all feed consumers** |
| HR read surfaces | Writes present; feed does not include HR normalized events |
| Notebook / Place in global feed | Feed does not query their `Log` rows |
| Widget layout debouncing | Dashboard charter allows coalescing — verify single emit per save |
| AI action executions | Not all AI writes emit activity (separate from kernel but coupled) |

---

## 8. Ownership violations

| Violation | Location | Severity |
|-----------|----------|----------|
| Controller-direct legacy reads | `activityFeedController` | **High** — should use platform read service |
| Analytics capability reads SoR/legacy | `analyticsCapabilityService` | **High** — capability should read kernel only |
| AI reads legacy table | `CrossModuleContextEngine`, `DigitalLifeTwinService` | **Medium** |
| Module SoR as activity substitute | Feed queries `Message`, `Task`, `Event` | **High** — violates activity vs analytics separation |

**No violation:** Module adapters delegating to `emitModuleActivityEvent` — correct pattern.

---

## 9. Certification risks (Activity-specific)

| Finding | Gates affected |
|---------|----------------|
| ACT-R1 on dashboard feed | G2 Auditability (Dashboard CwF, WS shell) |
| AN-M2 personal analytics | G2, G5 (Analytics L2 CwF) |
| No operation matrix for `GET /api/activity-feed` | G4, G6 |
| No PE on activity read APIs | G1 (implicit user scope only) |

---

## 10. Reference pattern (positive)

`placeVisibilityService.getActivityFeed` — queries `prisma.log` with `operation: 'module_activity_event'`, maps envelope to feed DTO, enforces `placePolicyDual` before read. **This is the target read pattern** for platform federation.

---

## Related

- [PLATFORM_KERNEL_OWNERSHIP_MODEL.md](./PLATFORM_KERNEL_OWNERSHIP_MODEL.md)
- [DOMAIN_EVENTS_AUDIT.md](./DOMAIN_EVENTS_AUDIT.md)

**Last updated:** 2026-06-22
