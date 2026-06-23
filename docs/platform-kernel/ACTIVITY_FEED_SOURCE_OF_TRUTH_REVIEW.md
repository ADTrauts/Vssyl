# Activity Feed Source-of-Truth Review

**Program:** Platform Kernel Modernization — Wave 2 Package 1  
**Date:** 2026-06-22  
**Status:** Governance review — **no implementation**

---

## 1. Scope

This review covers **all user-facing activity feeds** and their backend source-of-truth, with emphasis on the global dashboard feed (`GET /api/activity-feed`) identified as the highest-risk ACT-R1 violation.

---

## 2. Feed inventory

| Feed | HTTP route | Backend handler | Primary SoT today | Correct SoT |
|------|------------|-----------------|-------------------|-------------|
| **Global / Dashboard** | `GET /api/activity-feed` | `activityFeedController` | **Mixed** (see §3) | `module_activity_event` via query service |
| **Place module** | `GET /api/place/feed` | `placeAnalyticsController` → `placeVisibilityService` | **Normalized Log** ✓ | Same (via query service delegate) |
| **Drive item history** | `GET /api/drive/items/:itemId/activity` | `fileController.getItemActivity` | Log + legacy Activity | `queryByTarget` only |
| **Drive recent** | `GET /api/folder/activity/recent` | `folderController.getRecentActivity` | Activity + Log | `queryByActor` |
| **V_Link activity** | V_Link API | `listVLinkActivity` | `vLinkActivity` table | **Not platform feed** — module-local |
| **Admin AI pipeline** | Admin UI | `PipelineLiveActivityFeed` | Trace data | **Not platform activity** |

---

## 3. Global feed deep review (`activityFeedController`)

### 3.1 Current data sources (5 parallel queries)

| # | Store | Query | Rationale (historical) | Constitutional status |
|---|-------|-------|------------------------|----------------------|
| 1 | `Activity` | `prisma.activity.findMany` by userId | Drive-era audit table | **INVALID** — legacy |
| 2 | `Message` | `prisma.message.findMany` | Chat "activity" proxy | **INVALID** — SoR surrogate |
| 3 | `Event` | `prisma.event.findMany` | Calendar "activity" proxy | **INVALID** — SoR surrogate |
| 4 | `Task` | `prisma.task.findMany` | Todo "activity" proxy | **INVALID** — SoR surrogate |
| 5 | `Log` | `operation: module_activity_event`, modules `drive` \| `chat` only | Partial normalization | **PARTIAL** — correct store, incomplete modules |

### 3.2 Failure modes

| Failure | User impact |
|---------|-------------|
| **Missing modules** | HR, Place, Todo, Calendar, Dashboard, Analytics actions absent from feed despite L3 emission |
| **Duplicate representation** | Same chat message may appear from `Message` query and from normalized chat activity |
| **Inconsistent tenant scope** | `dashboardId` scopes SoR queries differently than Log envelope `context.dashboardId` |
| **Content leakage** | Message preview text pulled from SoR body — bypasses envelope metadata rules |
| **False completeness** | Feed appears rich while omitting certified module actions |

### 3.3 Frontend coupling

| Component | Behavior |
|-----------|----------|
| `ActivityFeedWidget.tsx` | `fetch('/api/activity-feed?dashboardId=…&limit=…')` |
| `DashboardClient.tsx` | Embeds widget on personal dashboard |
| `FrontPageWidgetEditor.tsx` | Business "recent-activity" widget type — same API expected |

**Charter:** Widget remains; API contract preserved at HTTP level; **payload derivation changes** behind query service.

---

## 4. Place feed — reference implementation

`placeVisibilityService.fetchPlatformActivityFeedItems`:

1. Queries `Log` where `operation = 'module_activity_event'` and `module = 'place'`
2. Parses envelope from `metadata`
3. Maps to feed DTO via `mapModuleActivityToFeedType`
4. Enforces visibility (connection graph) before display
5. Policy gate via `assertPlacePolicyAllowed` on feed entry

**This is the template** for global feed federation — with platform-owned query + module-owned DTO mapping where specialized types are needed.

---

## 5. Target feed architecture

```
ActivityFeedWidget / business recent-activity widget
        │
        ▼
GET /api/activity-feed  (unchanged route)
        │
        ▼
activityFeedController  (thin: auth, validate dashboardId, limit)
        │
        ▼
platformActivityQueryService.queryActivityFeed({
  actorUserId, dashboardId?, limit, moduleIds?: all installed
})
        │
        ▼
platformActivityFeedMapper.toActivityFeedItem(record)  (new — platform owned)
        │
        ▼
{ activities: ActivityFeedItem[] }  (stable JSON shape)
```

### 5.1 Feed item mapping rules

| Field | Source |
|-------|--------|
| `id` | `envelope.eventId` or `logId` |
| `type` | `target.type` |
| `action` | `envelope.action` |
| `module` | `context.moduleId` |
| `description` | Derived from action + metadata — **no SoR fetch** |
| `createdAt` | `envelope.timestamp` |
| `metadata` | Envelope `metadata` + `targetId` |

### 5.2 Module-specific feed types

Place feed uses custom `FeedItemShape` (FOLLOWED_BUSINESS, etc.). **Charter:** global feed uses generic envelope mapping; modules with specialized feeds keep dedicated routes calling `queryModuleFeed`.

---

## 6. Feed ownership model (Decision)

| Concern | Owner |
|---------|-------|
| **Federated query** | Platform Engineering — `platformActivityQueryService` |
| **Global feed HTTP API** | Platform Engineering — `activityFeedController` |
| **Global feed DTO mapping** | Platform Engineering — `platformActivityFeedMapper` |
| **Module-specialized feeds** | Module owner — mapping only; query delegated |
| **Widget UI** | Dashboard / workspace module |

**Answer:** Yes — `activityFeedController` **shall become a thin consumer** of the query service.

---

## 7. Dashboard dependency

| Surface | Dependency |
|---------|------------|
| Dashboard L3 CwF | Widget ecosystem includes activity feed |
| WS-L3 shell | Personal landing uses `ActivityFeedWidget` |
| Certificate majors | Feed honesty supports G2 auditability narrative |

Dashboard module **does not own** activity SoT — it **consumes** platform feed API.

---

## 8. Acceptance criteria (feed SoT)

- [ ] Single store: `module_activity_event` log rows
- [ ] All L3 modules with activity adapters represented in federation
- [ ] No `Message` / `Event` / `Task` / `Activity` table reads in feed path
- [ ] `dashboardId` scope matches envelope `context.dashboardId` filter
- [ ] Integration test: emit events from todo, calendar, drive → appear in feed
- [ ] Place feed refactored to query service delegate (no duplicate Prisma)

---

## Related

- [PLATFORM_ACTIVITY_QUERY_MODEL.md](./PLATFORM_ACTIVITY_QUERY_MODEL.md)
- [ACT_R1_MIGRATION_MATRIX.md](./ACT_R1_MIGRATION_MATRIX.md)

**Last updated:** 2026-06-22
