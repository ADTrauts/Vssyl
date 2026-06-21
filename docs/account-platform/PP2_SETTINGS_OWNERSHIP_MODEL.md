# PP-2 — Settings Platform Ownership Model

**Program:** Account Platform Phase 0B-2 — Settings Platform Audit  
**Date:** 2026-06-19  
**Status:** **Authoritative PP-2 boundaries** — discovery; not runtime-enforced

**Aligns with:** [PP1_IDENTITY_PROFILE_OWNERSHIP_MODEL.md](./PP1_IDENTITY_PROFILE_OWNERSHIP_MODEL.md) · [ACCOUNT_PLATFORM_OWNERSHIP_MODEL.md](./ACCOUNT_PLATFORM_OWNERSHIP_MODEL.md)

---

## Authoritative preference ownership

### Settings Platform owns

| Concern | Responsibility | SoR |
|---------|----------------|-----|
| **Settings hub IA** | Where users find account controls | Navigation map (not data) |
| **Platform settings API** | `/api/settings` contract (bulk + sections) | API schema |
| **Preference key registry** | Valid keys, prefixes, types, defaults | Registry doc + validation layer |
| **Appearance / theme** | Server-backed theme preference | `UserPreference` key `appearance.theme` (target) |
| **Cross-hub linking** | Privacy, notifications, AI, billing entry points | IA |
| **Notification pref orchestration** | Single write adapter for KV notification keys | Coordinates with NOTIF |
| **Module settings index** | Discoverability of module config surfaces | Registry metadata |
| **Settings operation matrix** | Constitutional compliance tracking | Governance |

**Settings does NOT own the underlying domain rows** except appearance KV (target) and registry metadata.

### Identity (PP-1) owns

| Concern | Settings relationship |
|---------|----------------------|
| `User` profile fields, photos, connections | Settings hub **displays/links** — PP-1 services mutate |
| `userPreferenceService` implementation | Identity/PREF **implements**; Settings **defines registry contract** |
| Generic `/api/user/preferences/:key` | Transitional — migrate to `/api/settings` under PP-2 contract |
| Privacy SoR (`UserPrivacySettings`) | PP-1 Security slice mutates; Settings **embeds or links** in hub |

### Notifications platform owns

| Concern | Settings relationship |
|---------|----------------------|
| Notification **delivery** (in-app, email, push transport) | Not Settings |
| Module notification **metadata** (`getModuleNotificationTypes`) | Settings UI consumes |
| `PushSubscription` table | Notifications SoR; Settings coordinates registration UI |
| `notification_*` key **semantics** | Joint: Notifications defines categories; Settings/registry enforces shape |

### AI Platform owns

| Concern | Settings relationship |
|---------|----------------------|
| `AIPersonalityProfile`, `AIAutonomySettings` | AI mutates; Settings provides **link** to `/ai` |
| `ai_preferred_*` UserPreference keys | **Migrate or document** as AI-owned keys in registry |
| AI Control Center UX | **Not** Settings hub — cross-link only |

### Business Administration owns

| Concern | Settings relationship |
|---------|----------------------|
| `Business` entity fields (name, EIN, contact, logo) | BA `businessProfileService` — **L3 certified** |
| Business branding JSON on `Business` | BA owns SoR |
| Business member admin | BA / member module |
| Workspace settings **business tabs** | BA writes; Settings **consolidates IA** (redirect duplicates) |
| HR module settings table | HR module within BA/business context |

**Rule:** PP-2 **never** becomes write owner of `Business` rows.

### Module owners own

| Concern | Examples |
|---------|------------|
| `ModuleInstallation.configured` JSON | Per-module toggles |
| `HRModuleSettings` | HR feature flags |
| Place settings | Place privacy/layout |
| Scheduling business config | Scheduling module + business fields |

Settings **indexes** module settings URLs; modules **own** mutation logic and SoR.

---

## Boundary diagram

```
┌─────────────────────────────────────────────────────────┐
│              Settings Platform (PP-2)                      │
│  IA · /api/settings contract · key registry · theme KV   │
└────────────┬──────────────┬──────────────┬──────────────┘
             │              │              │
     ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
     │ PP-1 Identity │ │ Notifications│ │ AI Platform │
     │ Profile·Privacy│ │  delivery   │ │  persona    │
     └───────┬──────┘ └─────────────┘ └─────────────┘
             │
     ┌───────▼──────────┐     ┌─────────────┐
     │ Business Admin L3 │     │ Modules     │
     │ Business entity   │     │ configured  │
     └───────────────────┘     └─────────────┘
```

---

## API ownership map

| API pattern | Write owner | Settings role |
|-------------|-------------|---------------|
| `GET/PUT /api/settings` (target) | Settings service | **Canonical** |
| `/api/user/preferences/:key` | PREF/Identity | **Deprecate toward settings** |
| `/api/notifications/preferences` | NOTIF + PREF adapter | **Consolidate writes** |
| `/api/email-notifications/preferences` | NOTIF + PREF adapter | **Consolidate writes** |
| `/api/privacy/settings` | PP-1 privacy service | **Link in hub** — API may stay |
| `/api/modules/:id/configure` | Module | **Index only** |
| `/api/hr/admin/settings` | HR module | **Index only** |
| `/api/place/settings` | Place module | **Index only** |
| `/api/ai/*` settings routes | AI Platform | **Cross-link only** |

---

## UX ownership

| Surface | Owner |
|---------|-------|
| Canonical personal settings URL | **Settings** — target `/profile/settings` or `/account/settings` |
| Notification settings full page | **Settings** coordinates; may remain `/notifications/settings` route |
| Privacy controls placement | **Settings** embeds or deep-links PP-1 privacy API |
| Theme control | **Settings** (migrate from avatar-only) |
| AI Identity entry | **AI Platform** — Settings shows link card |
| Business workspace settings | **BA + Settings IA** — collapse duplicates |
| Avatar menu structure | **Settings** defines canonical labels (remove duplicate) |

---

## Duplication resolution authority

| Duplication | Resolution owner |
|-------------|----------------|
| Business profile triplication | **PP-2 IA charter** + BA approval |
| Privacy split | **PP-2** hub placement |
| Notification "coming soon" | **PP-2** — wire to P4 hub |
| Theme orphan | **PP-2** — server KV + hub tab |
| `/settings` API drift | **PP-2** implements; deprecate `useUserSettings` paths |

---

## Related

- [PP2_SETTINGS_FRAGMENTATION_ANALYSIS.md](./PP2_SETTINGS_FRAGMENTATION_ANALYSIS.md)
- [PP2_SETTINGS_CERTIFICATION_READINESS.md](./PP2_SETTINGS_CERTIFICATION_READINESS.md)

**Last updated:** 2026-06-19 (Phase 0B-2)
