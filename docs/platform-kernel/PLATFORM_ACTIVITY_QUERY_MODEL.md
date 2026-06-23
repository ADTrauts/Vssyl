# Platform Activity Query Model

**Program:** Platform Kernel Modernization — Wave 2 Package 1 (ACT-R1 Charter)  
**Date:** 2026-06-22  
**Status:** Governance charter — **no implementation**

**Authority:** [PLATFORM_ACTIVITY_AUDIT.md](./PLATFORM_ACTIVITY_AUDIT.md); [PLATFORM_KERNEL_OWNERSHIP_MODEL.md](./PLATFORM_KERNEL_OWNERSHIP_MODEL.md)

---

## 1. Purpose

Define the **authoritative read architecture** for Platform Activity — the normalized query layer that sits between the activity log (write path) and all consumers (feeds, analytics, AI, dashboard, future search).

---

## 2. Constitutional principles

| # | Principle |
|---|-----------|
| P1 | **Single source of truth for reads** — `Log` rows where `operation = 'module_activity_event'` with validated envelope in `metadata` |
| P2 | **Modules write; platform reads** — only `emitModuleActivityEvent` writes; consumers never query module SoR tables as activity substitutes |
| P3 | **Tenant scope on every query** — `dashboardId`, `businessId`, `householdId`, and `actorUserId` filters enforced in query layer |
| P4 | **Visibility respected** — envelope `visibility.scope` honored on federated reads |
| P5 | **Bounded results** — all operations require `limit` caps; AI/analytics use stricter bounds |
| P6 | **No legacy `Activity` table reads** in production paths after ACT-R1 completion |
| P7 | **Presentation is not persistence** — feed DTO mapping may live in module or platform UI adapters; **queries** live in platform service only |

---

## 3. Future-state architecture

```
┌─────────────────────────────────────────────────────────────┐
│  L3+ Modules (drive, chat, todo, calendar, place, …)        │
│  *ActivityService → emitModuleActivityEvent()               │
└──────────────────────────┬──────────────────────────────────┘
                           │ write (post-auth, post-mutation)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Normalized Activity Log                                    │
│  prisma.log WHERE operation = 'module_activity_event'       │
│  metadata = moduleSpecs envelope (JSON)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ read (authorized)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  platformActivityQueryService  ← Platform Engineering       │
│  (proposed — NOT implemented in W2P1)                       │
└──────────┬──────────┬──────────┬──────────┬───────────────┘
           │          │          │          │
           ▼          ▼          ▼          ▼
      Feeds     Analytics      AI      Dashboard
   (global +    (derived      (bounded  (widgets +
    module)      reads)        context)   scoped)
           │
           └──► Search (future — index subscriber, out of ACT-R1)
```

**Out of scope for activity reads:** `domain_event_recorded`, operator logs, `vLinkActivity` (module-local SoR), `AIConversationHistory` (misnamed "activity" in AI engines).

---

## 4. Canonical query API (Decision A)

**Decision:** Platform Activity **shall** expose a dedicated query service.

| Field | Value |
|-------|-------|
| **Proposed name** | `platformActivityQueryService` |
| **Location (future)** | `server/src/services/platform/platformActivityQueryService.ts` |
| **Owner** | Platform Engineering (Runtime Kernel) |
| **HTTP exposure** | Controllers remain thin; no new public routes in W2P1 |

### 4.1 Required read operations (charter)

| Operation | Purpose | Primary consumers |
|-----------|---------|-------------------|
| `queryActivityFeed` | Federated timeline for user + optional `dashboardId` scope | `activityFeedController`, `ActivityFeedWidget` |
| `queryByTarget` | History for entity (`moduleId`, `targetType`, `targetId`) | File Hub `getItemActivity`, module detail panels |
| `queryByActor` | Actor-scoped events in time range + module filter | Analytics personal, AI context |
| `queryRecentForContext` | Bounded envelope list for grounding (no SoR bodies) | `CrossModuleContextEngine`, `DigitalLifeTwinService` |
| `countByModule` | Time-bounded counts per `moduleId` | Analytics aggregates, workforce metrics pattern |
| `queryModuleFeed` | Module-filtered feed with visibility rules | Place feed (via delegate), future module feeds |

### 4.2 Standard query input (all operations)

```typescript
// Charter shape — illustrative only; not implemented
interface PlatformActivityQueryScope {
  actorUserId: string;           // required — authenticated user
  dashboardId?: string;          // personal/business/household shell scope
  businessId?: string;
  householdId?: string;
  moduleIds?: string[];          // optional filter
  visibilityScopes?: ActivityScope[];
  since?: Date;
  until?: Date;
  limit: number;                 // required, max enforced per operation
  offset?: number;
}
```

### 4.3 Standard result envelope

```typescript
interface PlatformActivityRecord {
  logId: string;
  eventId: string;               // from envelope.eventId
  timestamp: string;
  moduleId: string;
  action: string;
  target: { type: string; id: string };
  parent?: { type: string; id: string };
  context: {
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
    moduleId: string;
  };
  visibility: { scope: ActivityScope };
  metadata: Record<string, unknown>;
  actor: { userId: string; role?: string };
}
```

---

## 5. Source-of-truth rules (Decision B)

### Feed

| Rule | Detail |
|------|--------|
| **SoT** | Normalized `module_activity_event` log only |
| **Owner** | Platform query service + `activityFeedController` (thin) |
| **Forbidden** | `prisma.activity`, `Message`, `Event`, `Task` as feed sources |
| **Module feeds** | Place (and future) call `queryModuleFeed` — do not duplicate Log Prisma |

### Analytics

| Rule | Detail |
|------|--------|
| **SoT** | Platform query service (`queryByActor`, `countByModule`) |
| **Owner** | Analytics Capability reads **through** platform API — does not own activity SoR |
| **Forbidden** | `prisma.activity` for personal/module analytics (closes AN-M2) |
| **Note** | SoR counts (files created, messages sent) remain valid **metrics** — not activity feed substitutes |

### AI

| Rule | Detail |
|------|--------|
| **SoT** | `queryRecentForContext` — bounded normalized envelopes |
| **Owner** | AI Platform consumes platform API; does not query `Activity` table |
| **Forbidden** | `prisma.activity.findMany` in production AI paths |
| **Separate** | `AIConversationHistory` — not platform activity; rename/isolate in AI refactor |

### Search

| Rule | Detail |
|------|--------|
| **SoT (future)** | Event-derived index from domain events + optional activity metadata — **Search program** |
| **ACT-R1** | No search consumer changes; query layer **enables** future index hydration |
| **Forbidden** | Search querying `Activity` table or module SoR as activity |

### Dashboard

| Rule | Detail |
|------|--------|
| **SoT** | `queryActivityFeed` with `dashboardId` tenant scope |
| **Owner** | Dashboard widget (`ActivityFeedWidget`) → `/api/activity-feed` → thin controller → query service |
| **Forbidden** | Widget calling module APIs or legacy tables directly |

---

## 6. Legacy reader retirement (Decision C)

| Phase | Action |
|-------|--------|
| **C1 — Charter** | Inventory + migration matrix (this package) |
| **C2 — Query service** | Implement `platformActivityQueryService` with contract tests |
| **C3 — Consumer migration** | Rewire consumers per matrix priority |
| **C4 — Legacy freeze** | ESLint / CI rule: ban `prisma.activity.findMany` outside allowlist |
| **C5 — Legacy deprecation** | Stop `driveDeleteService` Activity row deletes when table empty |
| **C6 — Schema horizon** | `Activity` table archival — separate DB program; not ACT-R1 |

**Allowlist during transition:** query service implementation + one-off migration scripts only.

---

## 7. Read ownership model (Decision D)

| Layer | Owner | Responsibility |
|-------|-------|------------------|
| **Query service** | Platform Engineering | SoT reads, tenant filters, limits, envelope validation |
| **HTTP controllers** | Platform Engineering | Auth (`req.user`), param validation, delegate to query service |
| **Feed DTO mapping** | Platform (global) / Module (specialized feeds) | Place keeps `mapModuleActivityToFeedType`; uses platform query |
| **Analytics derivation** | Analytics Capability | Calls query service; owns presentation/metrics only |
| **AI grounding** | AI Platform | Calls `queryRecentForContext`; owns prompt assembly |
| **Module item history** | Module (Drive) | `getItemActivity` delegates to `queryByTarget` |

---

## 8. Consumer classification (Decision E)

| Class | Definition | Examples |
|-------|------------|----------|
| **Platform** | Cross-module federation | Global activity feed, future admin diagnostics |
| **Module** | Module-scoped presentation | Place feed, Drive item history |
| **Analytics** | Derived metrics from activity | Personal analytics, module usage stats |
| **AI** | Context grounding | CrossModuleContextEngine, DigitalLifeTwin |

---

## 9. Notifications (Decision F)

**Decision:** Notifications **shall not** consume Platform Activity directly for fan-out.

| Path | Use |
|------|-----|
| **Domain Events** | `notificationDomainEventSubscriber` — authoritative for user notifications |
| **Platform Activity** | Audit trail and feeds only — not notification trigger SoT |

**Rationale:** Activity envelope is for *what happened* in module contract; notifications require typed cross-cutting facts with recipient resolution already on domain event path. Merging would duplicate domain event semantics.

**Exception:** Future read-only "activity digest" notifications may **read** activity via query service — not subscribe to write path.

---

## 10. Authorization (read path)

| Operation | Auth pattern |
|-----------|--------------|
| `queryActivityFeed` | `req.user` + optional `dashboardId` ownership/membership proof |
| `queryByTarget` | Module visibility service (e.g. drive permission) before query |
| `queryByActor` | Self-only unless business admin policy (future PE action) |
| `queryModuleFeed` | Module policy dual (Place pattern) |

**Future:** `POLICY_ACTIONS.ACTIVITY_READ` — charter recommends PE action in Package 3 (post query service).

---

## 11. Indexing and performance (charter notes)

| Concern | Direction |
|---------|-----------|
| Query pattern | `log` filtered by `operation`, `userId`, `module`, `timestamp` |
| Index | Recommend composite DB index charter for W2P2 implementation — `(operation, userId, timestamp DESC)` |
| Envelope filter | Target id/type filtering may require JSON path — cap `take` before in-memory filter (Drive today) |
| Caching | None in v1 — bounded limits sufficient |

---

## 12. Relationship to Domain Events

ACT-R1 **does not** merge activity and domain event logs. Consumers needing reaction semantics continue via domain events. Activity query layer reads **`module_activity_event` only**.

---

## Related

- [ACT_R1_MIGRATION_MATRIX.md](./ACT_R1_MIGRATION_MATRIX.md)
- [ACT_R1_MODERNIZATION_PROGRAM.md](./ACT_R1_MODERNIZATION_PROGRAM.md)

**Last updated:** 2026-06-22
