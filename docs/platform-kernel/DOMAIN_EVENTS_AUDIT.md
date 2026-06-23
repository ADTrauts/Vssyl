# Domain Events — Constitutional Audit

**Program:** Platform Kernel Modernization — Wave 1  
**Date:** 2026-06-22  
**Status:** Discovery only  
**Related:** [DOMAIN_EVENTS.md](../architecture/DOMAIN_EVENTS.md); `server/src/events/domainEventRegistry.ts`

---

## 1. What is Domain Events?

Domain Events are **cross-cutting platform facts** emitted after successful mutations. They decouple producers from consumers (activity log mirror, sockets, notifications, AI learning, webhooks, dashboard bootstrap) without requiring each call site to know every fan-out target.

**Canonical API:** `emitDomainEvent` + `buildTypedDomainEventInput` / typed helpers in `domainEventEmitters.ts`.

**Transport:** In-process `domainEventBus` (`EventEmitter`).

**Persistence:** `activityDomainEventSubscriber` writes `Log.operation = 'domain_event_recorded'`.

**Not domain events:** `emitModuleActivityEvent` (module interoperability), raw socket emits, or analytics rollups.

---

## 2. Who owns Domain Events?

| Role | Owner |
|------|-------|
| **Platform capability owner** | Platform Engineering (Runtime Kernel) |
| **Taxonomy authority** | `domainEventRegistry.ts` — `DOMAIN_EVENT_TYPES` + `DOMAIN_EVENT_CONTRACTS` |
| **Bus + registration** | `domainEventBus.ts`, `registerDomainEventSubscribers.ts` |
| **Module emission** | Per-module `*DomainEventService.ts` + `domainEventEmitters.ts` |
| **Consumer ownership** | Split: Platform (socket, activity log), Notifications, AI, Webhooks, Dashboard seed |

---

## 3. Current maturity: **L1–L2 hybrid**

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Taxonomy / contracts | **L2** | ~180 types; sanitization; tests |
| Emit adoption | **L2 partial** | L3 modules strong; HR gap |
| Bus / orchestration | **L1** | In-process only; no replay |
| Subscribers | **L1–L2** | 7 real + 2 stubs |
| Documentation | **L2** | DOMAIN_EVENTS.md; no platform operation matrix |

**Blended rating for certification:** **L1** until stubs retired and adoption audited.

---

## 4. Inventory

### 4.1 Event registry

| Component | Path | Count |
|-----------|------|-------|
| `DOMAIN_EVENT_TYPES` | `domainEventRegistry.ts` | **~180** type strings |
| `DOMAIN_EVENT_CONTRACTS` | same | 1:1 contract per type |
| `sanitizeDomainEventMetadata` | same | Global + per-type disallowed keys |
| `buildTypedDomainEventInput` | same | Type-safe emit builder |

**Naming convention:** `{domain}.{entity}.{action}` or `{module}.{entity}.{action}` — generally consistent. Exceptions: `approval_hierarchy.*` uses underscore domain prefix.

### 4.2 Event emitters

| Category | Location | Notes |
|----------|----------|-------|
| **Platform typed helpers** | `domainEventEmitters.ts` | Drive, chat, calendar, todo, module install, business, settings-adjacent |
| **V_Link emitters** | `vlinkDomainEventEmitters.ts` | 31 V_Link lifecycle events |
| **Module services** | 13 `*DomainEventService.ts` | Thin wrappers per domain |
| **Inline emit** | `settingsActivityService.ts`, `userPreferenceService.ts`, controllers | Settings/preferences |
| **Drive controllers** | `fileController.ts`, `folderController.ts` | File/folder lifecycle |

### 4.3 Module domain-event services

| Module / domain | Service |
|-----------------|---------|
| `chat` | `chatDomainEventService.ts` |
| `calendar` | `calendarDomainEventService.ts` |
| `todo` | `todoDomainEventService.ts` |
| `notes` | `notes/notesDomainEventService.ts` |
| `notebook` | `notebook/notebookLinkDomainEventService.ts` |
| `place` | `place/placeDomainEventService.ts` |
| `dashboard` | `dashboardDomainEventService.ts` |
| `scheduling` | `schedulingDomainEventService.ts` |
| `workforce_comms` | `workforceDomainEventService.ts` |
| `orgchart` | `business/orgChartDomainEventService.ts` |
| `approval_hierarchy` | `business/approvalHierarchyDomainEventService.ts` |
| Account billing | `account/billingDomainEventService.ts` |
| Account entitlements | `account/entitlementDomainEventService.ts` |

**Missing:** `hrDomainEventService` — HR uses activity only.

### 4.4 Event subscribers (registered at startup)

| Subscriber name | Handler | Status |
|-----------------|---------|--------|
| `activity` | `recordDomainEventToActivityLog` | **Production** |
| `socket` | `broadcastDomainEventOnSocket` | **Production** — actor-only `platform:domain_event` |
| `notification` | `notificationDomainEventConsumer` | **Production** — subset of types |
| `ai_event_consumer` | `consumeDomainEventForAI` | **Production** — 6 types; learning stub |
| `webhook_subscriptions` | `deliverDomainEventToWebhooks` | **Production** |
| `search_index_stub` | `searchIndexDomainEventConsumer` | **STUB** — debug log only |
| `workflow_router_stub` | `routeDomainEventToWorkflows` | **STUB** — debug log only |
| `calendar_dashboard_bootstrap` | `calendarDashboardTabCreatedConsumer` | **Production** |
| `workspace_dashboard_seed` | `workspaceDashboardTabCreatedConsumer` | **Production** |

Registration: `registerDomainEventSubscribers()` — idempotent; called from `server/src/index.ts`.

### 4.5 Event replay patterns

| Pattern | Status |
|---------|--------|
| Out-of-process queue | **None** |
| Event store replay | **None** |
| Dead-letter / retry | **None** — subscriber errors logged only |
| Re-emit from Log | **Not implemented** |

**Implication:** Domain events are **ephemeral in-process signals** with Log persistence as audit mirror — not an event-sourcing system.

### 4.6 Event orchestration flow

```
emitDomainEvent(input)
  → sanitize metadata
  → publishDomainEvent (EventEmitter)
  → subscribeDomainEvents callback (sequential await per subscriber in runSubscriber)
       → each subscriber isolated try/catch
```

**Coupling risk:** Slow subscriber blocks emit return path (documented in `emitDomainEvent` comment). AI ambient scheduling is async; learning stub is await.

---

## 5. Largest Domain Event risks

| Rank | Risk | Impact |
|------|------|--------|
| **1** | **Stub subscribers in production registry** | False sense of search/workflow integration |
| **2** | **HR domain-event gap** | BO L3 CwF workforce lifecycle incomplete fan-out |
| **3** | **Registry >> adoption** | ~180 types; not all mutation paths verified |
| **4** | **No replay / queue** | Lost fan-out on process crash between emit and persist |
| **5** | **AI consumer narrow** | Only 6 types — most events ignored for learning |
| **6** | **Notification consumer narrow** | Small switch — most events don't notify |
| **7** | **Dual Log rows** | `domain_event_recorded` vs `module_activity_event` confuses readers |

---

## 6. Duplicate / orphan / drift analysis

### Duplicate events (potential)

| Scenario | Notes |
|----------|-------|
| Settings bulk update | May emit `SETTINGS_UPDATED` + per-key events — verify call sites |
| Calendar `CALENDAR_EVENT_DELETED` vs trashed/permanentlyDeleted | Legacy type documented in contract |
| File delete vs trash | Distinct types — OK if call sites correct |

### Orphan registry types

Types in registry without verified emit sites require **adoption audit** (Wave 2 scope). High-count modules (Place, Scheduling, Workforce) have broad catalogs — spot-check tests exist but not exhaustive CI.

### Unused subscribers

| Subscriber | Issue |
|------------|-------|
| `search_index_stub` | Registered, intentionally no-op |
| `workflow_router_stub` | Registered, intentionally no-op |

**Recommendation (future):** Unregister or gate behind feature flag until implemented.

### Naming drift

| Pattern | Example | Severity |
|---------|---------|----------|
| Underscore vs dot domain | `approval_hierarchy.created` vs `chat.message.sent` | Low — document convention |
| Action verb variance | `permanently_delete` vs `permanentDelete` | Low — per-module |

### Registration violations

| Issue | Detail |
|-------|--------|
| Raw `emitDomainEvent` without registry type | Billing/entitlement services use string types from registry — OK |
| Unregistered string literals | Should use `DOMAIN_EVENT_TYPES` — spot-check needed in Wave 2 |
| Subscriber not registered | N/A — all consumers go through `registerDomainEventSubscribers` |

---

## 7. Coupling risks

| Coupling | Risk |
|----------|------|
| Domain event → `prisma.log` via activity subscriber | Tight coupling of event bus to logging schema |
| Dashboard bootstrap subscribers | Domain events trigger dashboard mutations — ordering sensitivity |
| AI learning stub in emit path | Await on hot path for 6 event types |
| Webhook delivery in-process | External HTTP from subscriber — latency blast radius |
| Socket via chatSocketService | Realtime platform not independently certified |

---

## 8. Cross-domain dependencies (Domain Events)

| Consumer | Events consumed | Maturity |
|----------|-----------------|----------|
| **AI Platform** | 6 types → learning stub + ambient suggestions | L2 stub |
| **Notifications** | FILE_SHARED, BUSINESS_MEMBER_ADDED, MODULE_INSTALLED, … | L2 partial |
| **Analytics** | None materialized (Phase 2 N/A) | — |
| **Dashboard** | TAB_CREATED → bootstrap widgets | L2 |
| **Workspace** | TAB_CREATED → seed modules | L2 |
| **Webhooks** | Configurable subscriptions | L2 |
| **Search (future)** | Stub only | L0 |

---

## 9. Certification risks (Domain Events-specific)

| Finding | Gates affected |
|---------|----------------|
| Stub subscribers in production path | G3 Service boundaries, G8 Production safety |
| No platform operation matrix | G4, G6 |
| HR emission gap | G5 Ownership (BO domain) |
| In-process-only bus | G8 Production safety (no durability) |

---

## 10. Strengths

1. **Registry scale** — 180 contracts exceed most platform capabilities in taxonomy depth.
2. **Metadata sanitization** — PII/content stripping enforced globally and per-contract.
3. **Test suite** — Registry, bus, drive, chat, calendar, todo, workforce, dashboard domain event tests.
4. **Subscriber fault isolation** — Mutations not rolled back on consumer failure.
5. **Webhook + notification fan-out** — Real cross-cutting value demonstrated.

---

## Related

- [PLATFORM_ACTIVITY_AUDIT.md](./PLATFORM_ACTIVITY_AUDIT.md)
- [PLATFORM_KERNEL_OWNERSHIP_MODEL.md](./PLATFORM_KERNEL_OWNERSHIP_MODEL.md)

**Last updated:** 2026-06-22
