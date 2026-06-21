# PP-2 — Settings Activity & Domain Events

**Program:** Account Platform PP-2 Phase 1  
**Date:** 2026-06-19  
**Status:** Foundation only

---

## Module activity (`settings` module id)

Emitted via `settingsActivityService` → `emitModuleActivityEvent`.

| Action | Trigger | targetType |
|--------|---------|------------|
| `settings.updated` | Multi-key bulk update | `user_settings` |
| `theme.changed` | `appearance.theme` write | `appearance.theme` |
| `preference.changed` | Single preference write/delete | `user_preference` |

**Order:** `authorize (PE) → execute → emit activity → domain event`

---

## Domain events

Registered in `domainEventRegistry.ts`:

| Type | Constant | Metadata |
|------|----------|----------|
| `settings.updated` | `SETTINGS_UPDATED` | `{ keys: string[] }` |
| `settings.theme.changed` | `SETTINGS_THEME_CHANGED` | `{ theme: string }` |
| `settings.preference.changed` | `SETTINGS_PREFERENCE_CHANGED` | `{ key: string }` |

**Value exclusion:** Event metadata never includes preference values (privacy).

---

## Implementation

| File | Role |
|------|------|
| `server/src/services/account/settingsActivityService.ts` | Emitters |
| `server/src/events/domainEventRegistry.ts` | Contracts |
| `server/src/services/moduleActivityService.ts` | Persistence + realtime refresh |

---

## Relationship to PP-1 events

| Event | Owner |
|-------|-------|
| `user.preference.updated` | PP-1 generic path (non-registry keys via `userPreferenceService`) |
| `settings.*` | PP-2 settings platform orchestration |

Registry-key writes through `settingsService` emit **settings** events. Legacy `/api/user/preferences` non-registry keys continue to emit `user.preference.updated`.

---

## Future packages (out of scope)

- Notification pref adapter unified writes
- Business-scoped settings events
- Realtime settings sync to clients

---

**Last updated:** 2026-06-19 (PP-2 Phase 1)
