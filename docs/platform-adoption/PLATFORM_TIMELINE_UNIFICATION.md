# Platform Timeline Unification

**Program:** Platform Adoption — Wave 1  
**Date:** 2026-06-25  
**Status:** Unified read model established

---

## 1. Problem (pre-Wave 1)

Vssyl had **two parallel read truths**:

1. **Kernel writes** — `emitModuleActivityEvent` → `Log` (`module_activity_event`)
2. **Legacy reads** — `prisma.activity`, `Message`, `Event`, `Task`, ad hoc `Log` queries

Users could see an action in a module but not in the Activity Feed or AI twin.

---

## 2. Unified read model (post-Wave 1)

```
┌─────────────────────────────────────────────────────────────┐
│                  platformTimelineReadService               │
│  getUnifiedTimelineForUser · mappers · type exports        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              platformActivityQueryService                  │
│  parseModuleActivityLogRow · scope filters · sort            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│         Log table (operation = module_activity_event)        │
│         metadata = normalized module activity envelope       │
└─────────────────────────────────────────────────────────────┘
```

**Rule:** Timeline consumers import from `platformTimelineReadService`. They do **not** query `prisma.activity` or module SoR tables for cross-module activity.

---

## 3. Consumer map

### Tier A — Federated timeline (all modules)

| Consumer | Entry function |
|----------|----------------|
| Activity Feed API | `getUnifiedTimelineForUser` |
| AI CrossModuleContextEngine | `getUnifiedTimelineForUser` |
| DigitalLifeTwinService | `getUnifiedTimelineForUser` |
| AI context debug | `getUnifiedTimelineForUser` |
| Personal analytics recent slice | `getRecentActivity` |

### Tier B — Module-scoped timeline

| Consumer | Entry function |
|----------|----------------|
| Drive item activity | `getActivityForEntity` |
| Drive recent activity | `getRecentActivity` (moduleId: drive) |
| Module analytics | `getModuleActivity` |
| Place social feed | `getModuleActivityForUserIds` |

### Tier C — Not timeline (do not migrate)

| Consumer | Source | Why |
|----------|--------|-----|
| Chat recent messages in AI | `prisma.message` | SoR content, not activity envelope |
| Drive recent files in AI | `prisma.file` | SoR listing |
| Admin operator metrics | `adminAnalyticsService` | Operator plane |
| V_Link timeline | `vLinkActivity` | Module-local store (blocker) |

---

## 4. API contract — Activity Feed

**`GET /api/activity-feed`**

| Query param | Validation | Filter |
|-------------|------------|--------|
| `limit` | max 50 | result cap |
| `dashboardId` | user must own dashboard | `record.dashboardId` |
| `businessId` | active `businessMember` | `record.businessId` |
| `householdId` | `householdMember` | `record.householdId` |

Response activities include `metadata.source = normalized_event`.

---

## 5. Envelope → record mapping

| Envelope field | `PlatformActivityRecord` field |
|----------------|-------------------------------|
| `eventId` | `eventId` |
| `timestamp` | `timestamp` |
| `context.moduleId` | `moduleId` |
| `action` | `action` |
| `target.type` / `target.id` | `targetType` / `targetId` |
| `context.dashboardId` | `dashboardId` |
| `context.businessId` | `businessId` |
| `context.householdId` | `householdId` |
| `visibility.scope` | `visibilityScope` |
| `metadata` | `metadata` |
| `actor.userId` | `actorUserId` |

---

## 6. Extension guidelines

When adding a new timeline consumer:

1. Import from `platformTimelineReadService`
2. Choose the narrowest query function (federated vs entity vs module)
3. Apply tenant scope at query layer — not in UI
4. Add a row to [ACTIVITY_READ_PARITY_MATRIX.md](./ACTIVITY_READ_PARITY_MATRIX.md)
5. Add unit test proving no `prisma.activity` usage

---

**Last updated:** 2026-06-25
