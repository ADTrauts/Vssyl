# Module Capability Integration Matrix

**Program:** Marketplace & Module Ecosystem — Phase 0A Discovery  
**Date:** 2026-06-23  
**Status:** Discovery only  
**Authority:** [`docs/architecture/PLATFORM_CAPABILITY_CATALOG.md`](../architecture/PLATFORM_CAPABILITY_CATALOG.md)

---

## 1. Purpose

Evaluate platform capability access for modules — what first-party modules use today vs. what third-party modules can realistically consume.

Legend: ✅ Available | 🟡 Partial | ❌ Unavailable

---

## 2. Summary matrix

| Platform capability | First-party modules | Third-party modules | Integration mechanism |
|---------------------|--------------------|--------------------|------------------------|
| **Identity / Auth** | ✅ | 🟡 | JWT via platform session; partner validates on their API |
| **Permissions (Policy Engine)** | ✅ | 🟡 | Install/uninstall only; entity PE in-process |
| **Activity feed** | ✅ | ❌ | `emitModuleActivityEvent` — no partner ingest API |
| **Domain events (outbound)** | ✅ | 🟡 | Webhook subscriptions for select event types |
| **Domain events (inbound)** | ✅ | ❌ | Internal bus only |
| **Notifications** | ✅ | 🟡 | Manifest metadata ✅; platform delivery API ❌ |
| **Realtime / Socket.IO** | ✅ | ❌ | No iframe socket bridge |
| **Platform Entities** | ✅ | ❌ | In-process registration |
| **Unified Search** | ✅ (9 providers) | ❌ | Static registry; M-02 delegate not built |
| **AI Retrieval** | ✅ (via search) | ❌ | Depends on search participation |
| **Context Graph** | ✅ (8 adapters) | ❌ | Static adapter registry |
| **V_Link** | ✅ | ❌ | In-process resolver required |
| **AI context providers** | ✅ | ✅ | Partner HTTPS endpoints + manifest sync |
| **AI action executors** | ✅ | ✅ | Webhook + HMAC |
| **Analytics (platform)** | ✅ | 🟡 | Partner analytics stay external |
| **Global trash** | ✅ | 🟡 | Contract requires `trashedAt`; partner implements |
| **Storage (GCS)** | ✅ | 🟡 | Module artifacts only; no general partner storage API |

---

## 3. Unified Search participation

### Current state

| Component | Path | Partner-ready? |
|-----------|------|----------------|
| Provider registry | `searchProviderRegistry.ts` | ❌ Static |
| Orchestrator | `searchCapabilityService.ts` | ❌ No delegate loader |
| PE gate | `searchPolicyDual.ts` (`search:read`) | ✅ Would apply to delegates |
| Compliance spec | `SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md` | ✅ M-01–M-05 defined |

### Required for partner participation (from Search compliance)

1. **M-02:** Register via marketplace manifest loader — **not yet runtime**
2. **M-03:** Visibility in partner boundary (HTTP delegate, not Prisma in orchestrator)
3. **M-05:** Manifest must not claim `capabilities.search` until delegate exists

### Module manifest search declaration

Built-ins with `capabilities.search: true`: drive, chat, calendar, todo, place.  
Marketplace modules declaring search without delegate will fail certification or must not claim capability.

**Third-party status: ❌ Unavailable until Phase 2 search delegate**

---

## 4. AI Retrieval participation

### Architecture

```
AI consumer intent
    → aiRetrievalPipelineHook
    → aiRetrievalCapabilityService.discover()
    → searchCapabilityService.executeGlobalSearch()  ← partner gap here
    → aiRetrievalEvidenceMapper
    → context patch to pipeline
```

Parallel path: module AI context providers (structured summaries, not query search).

| Path | Third-party | Notes |
|------|-------------|-------|
| Query-driven discovery | ❌ | Blocked by search M-02 |
| Context provider summaries | ✅ | `ModuleAIContextService` fetches partner HTTPS |
| Webhook action executors | ✅ | `ActionExecutorRegistry` |
| Retrieval consumer registration | ❌ | Consumers are platform-defined intents |

Compliance: `AI_RETRIEVAL_COMPLIANCE_REQUIREMENTS.md` §6 — RC-M1–M-4 deferred for marketplace.

---

## 5. Context Graph participation

| Component | Status | Partner path |
|-----------|--------|--------------|
| Adapter registry | 8 static adapters | ❌ No registration API |
| Orchestrator | `contextGraphOrchestrator.ts` | Read-only federation |
| Retrieval bridge | Pilot for project assistant | First-party only |
| L4 blocker L5-B03 | Partner graph conformance untested | — |

Partners may **appear indirectly** in bundles if first-party adapters surface related entities, but cannot register graph adapters.

**Third-party status: ❌ Unavailable**

---

## 6. V_Link participation

V_Link is a **platform layer**, not installable.

First-party integration requires:
1. `entities[]` in manifest
2. In-process `*VlinkAccessService`
3. Resolver case in `vlinkEntityResolverService.ts`
4. Lifecycle unlink on permanent delete

| Capability | Third-party |
|------------|-------------|
| Link to partner entities | ❌ |
| Consume V_Link UI components | 🟡 (inside iframe if bundled) |
| Appear in V_Link search provider | ❌ (in-process) |
| `MODULE_ENTITY` enum placeholder | Exists; no resolver |

**Third-party status: ❌ Unavailable without platform engineering per entity type**

---

## 7. Activity & domain events

### Activity feed

| Function | Path | Partner |
|----------|------|---------|
| Emit normalized events | `moduleActivityService.ts` | ❌ No external API |
| Feed query | `activityFeedController.ts` | N/A |
| Contract | `moduleSpecs.md` envelope | ✅ Documented |

Partners must implement compatible events on their infrastructure; platform feed will not show partner actions without an ingest bridge (future).

### Domain events

| Direction | Mechanism | Partner |
|-----------|-----------|---------|
| Platform → partner | Webhook subscriptions | ✅ `WEBHOOK_SUBSCRIPTIONS.md` |
| Partner → platform | — | ❌ |
| Module install/uninstall | `module.installed`, `module.uninstalled` | ✅ Outbound only |

---

## 8. Notifications

| Stage | First-party | Third-party |
|-------|-------------|-------------|
| Manifest `notifications[]` | ✅ | ✅ Validated in certification |
| Type discovery in UI | ✅ | ✅ From approved manifest |
| `NotificationService.createNotification` | ✅ In-process | ❌ No partner API |
| Settings integration | ✅ | 🟡 Types appear; delivery partner-side |

---

## 9. Realtime

| Pattern | First-party | Third-party |
|---------|-------------|-------------|
| Socket.IO rooms | `chatSocketService.ts` | ❌ |
| Module-specific events | drive, chat, activity refresh | Partner implements own realtime |
| Membership proof before join | ✅ Required | N/A |
| postMessage to host | — | 🟡 Possible extension; not standardized |

---

## 10. Identity & permissions

| Capability | First-party | Third-party |
|------------|-------------|-------------|
| Session JWT | ✅ | 🟡 Partner may receive via postMessage (not standardized) |
| Policy Engine entity actions | ✅ Per-module | ❌ Partner enforces on their API |
| `module:install` / `module:uninstall` | ✅ | ✅ Same gates |
| Tenant scoping (dashboardId/businessId) | ✅ Enforced in API | 🟡 Partner must enforce |
| Manifest permission strings | Declarative | Not PE-mapped |

---

## 11. Platform entities & jobs

| Registry | Path | Partner |
|----------|------|---------|
| Platform entities | `registerPlatformEntities.ts` | ❌ In-process |
| Platform jobs | `registerPlatformJob()` | ❌ In-process |
| Module entity declarations | Manifest `entities[]` | Structural validation only |

---

## 12. Missing contracts (ecosystem blockers)

| Contract ID | Description | Blocking |
|-------------|-------------|----------|
| **EC-01** | Search provider delegate from manifest | Global findability |
| **EC-02** | Context Graph adapter delegate | Graph federation |
| **EC-03** | V_Link partner entity proxy | Cross-module linking |
| **EC-04** | Activity feed ingest API | Unified activity timeline |
| **EC-05** | Notification create API for partners | Platform notification center |
| **EC-06** | Realtime bridge spec (postMessage/socket) | Live updates in workspace |
| **EC-07** | Platform storage API for partner attachments | Beyond artifact bucket |
| **EC-08** | Standard module SDK (auth, context, events) | Developer velocity |

---

## 13. Participation readiness by vertical (illustrative)

If an external developer built Inventory, CRM, or POS today:

| Need | Available? |
|------|------------|
| UI in sandboxed iframe | ✅ |
| Own backend + database | ✅ (external) |
| Install from marketplace | ✅ |
| AI twin reads partner data | ✅ (context providers) |
| AI writes via webhook executor | ✅ |
| Appear in global search | ❌ |
| Link to Drive/Chat entities via V_Link | ❌ |
| Show actions in activity feed | ❌ |
| Push platform notifications | ❌ |
| Live updates in Vssyl shell | ❌ |
| Business workspace native tab | ❌ |

---

## 14. Recommended integration priority (Phase 1+)

1. **Search delegate (M-02)** — unlocks retrieval + findability  
2. **Workspace runtime resolver** — third-party in business hub  
3. **Activity ingest API** — ecosystem visibility  
4. **postMessage auth/context bridge** — reduce partner auth friction  
5. **V_Link proxy** — long-lead; requires architecture council  

---

**Last updated:** 2026-06-23
