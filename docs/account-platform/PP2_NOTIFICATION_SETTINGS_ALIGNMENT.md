# PP-2 — Notification Settings Alignment

**Program:** Account Platform PP-2 Package 2  
**Date:** 2026-06-20  
**Status:** Implemented

---

## Problem (pre-Package 2)

| Issue | Evidence |
|-------|----------|
| Triple write path | `notificationController` wrote directly to Prisma |
| No settings activity | Saves bypassed `settingsService` |
| Registry drift | `notification_*` keys not orchestrated |

---

## Solution

### `notificationSettingsAdapter`

**Path:** `server/src/services/account/notificationSettingsAdapter.ts`

| Function | Behavior |
|----------|----------|
| `getNotificationCategoryPreferences` | Reads `notification_*` KV rows |
| `saveNotificationCategoryPreferences` | Writes via `settingsService.updatePreference` |
| `getNotificationJsonPreference` | Reads `quiet_hours` / `do_not_disturb` |
| `saveNotificationJsonPreference` | Writes via settings orchestration |

### Controller convergence

`notificationController` delegates:

| Endpoint | Adapter |
|----------|---------|
| `GET /api/notifications/preferences` | `getNotificationCategoryPreferences` |
| `PUT /api/notifications/preferences` | `saveNotificationCategoryPreferences` |
| `GET/PUT quiet-hours` | JSON adapter |
| `GET/PUT do-not-disturb` | `updatePreference('do_not_disturb')` |

### Registry additions

| Key | Type | Writable via settings API |
|-----|------|---------------------------|
| `quiet_hours` | json | ✅ |
| `do_not_disturb` | boolean | ✅ |
| `notification_*` | prefix rule | ✅ |

---

## Activity & events

Notification saves now emit `settings.preference.changed` (and PE via `settingsService`) instead of silent Prisma upserts.

---

## Client alignment

| Surface | Change |
|---------|--------|
| `/notifications/settings` | Unchanged API contract; backend aligned |
| Settings hub | Links to notifications as external section |
| Back link | "← Back to Settings" added |

---

## Findings closed

| Finding | Status |
|---------|--------|
| **PP2-F06** Triple notification write path | **Closed** |
| **PP2-F09** Notification writes bypass preference service | **Closed** |
| PP1-F07 Notification fragmentation | **Partial** — adapter unified writes; email_* paths unchanged |

---

**Last updated:** 2026-06-20 (PP-2 Package 2)
