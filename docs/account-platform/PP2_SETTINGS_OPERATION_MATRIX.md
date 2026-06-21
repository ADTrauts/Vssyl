# PP-2 — Settings Platform Operation Matrix

**Surface id:** `settings-platform` (Account Platform PP-2)  
**Program:** Account Platform Phase 0B-2 — Settings Platform Audit  
**Date:** 2026-06-19  
**Status:** Constitutional audit — discovery only

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant |
| **P** | Partial |
| **N** | Non-compliant / missing |
| **—** | Not applicable / out of PP-2 scope |

**Owner:** `SET` = Settings Platform · `ID` = Identity/Profile (PP-1) · `NOTIF` = Notifications platform · `AI` = AI Platform · `BA` = Business Administration · `MOD` = Module · `DASH` = Dashboard · `PP3` = Billing

---

## Master operation matrix

### Platform settings API (missing layer)

| Operation | Owner | Service / artifact | PE | Act | Notes | Status |
|-----------|-------|-------------------|-----|-----|-------|--------|
| Bulk get settings | SET | **Missing** `/api/settings` | — | — | `useUserSettings` broken | **N** |
| Bulk update setting | SET | **Missing** | — | — | Documented in Memory Bank | **N** |
| Delete setting by key | SET | **Missing** | — | — | Client expects `/settings/:key` | **N** |
| Get preference by key | ID/PREF | `userPreferenceService` | — | — | `/api/user/preferences/:key` | **P** |
| Set preference by key | ID/PREF | `userPreferenceService` + domain event | — | C | Only generic path with event | **P** |
| Preference key registry validate | SET | **None** | — | — | Any string key accepted | **N** |

### Personal hub operations

| Operation | Owner | Service / artifact | PE | Act | Notes | Status |
|-----------|-------|-------------------|-----|-----|-------|--------|
| Navigate profile settings hub | SET | `/profile/settings` tabs | — | — | IA only | **P** |
| Account tab (read-only) | ID | Session user | — | — | PP-1 scope | **—** |
| Photos tab | ID | ProfilePhotoManager | — | — | PP-1 scope | **—** |
| Location tab (read) | ID | `locationService` | — | — | PP-1 scope | **—** |
| Preferences placeholder tab | SET | Links sidebar customize | — | — | "Coming soon" stale | **N** |
| Privacy tab (analytics page) | SET/ID | `PrivacySettings` + `/api/privacy` | N | N | Wrong hub placement | **P** |
| Notification settings page | SET/NOTIF | `/notifications/settings` | — | — | Full page hub | **P** |
| Theme light/dark/system | SET | `localStorage` + `useTheme` | — | — | No server persistence | **N** |
| Avatar menu settings dup | SET | Two labels → same URL | — | — | UX debt | **P** |
| Sidebar customize entry | DASH | `sidebar-config` API | — | — | Dashboard scope | **—** |

### Notification preference operations

| Operation | Owner | Service / artifact | PE | Act | Notes | Status |
|-----------|-------|-------------------|-----|-----|-------|--------|
| Get in-app notification prefs | NOTIF/SET | `notificationController` | — | — | Direct Prisma KV scan | **P** |
| Save in-app notification prefs | NOTIF/SET | `notificationController` | — | N | Bypasses preference service | **N** |
| Get email notification prefs | NOTIF/SET | `emailNotification` routes | — | — | `email_*` prefix | **P** |
| Save email notification prefs | NOTIF/SET | email controller | — | N | Separate write path | **N** |
| Register push subscription | NOTIF/SET | `PushSubscription` | — | — | Table not KV | **P** |
| Quiet hours | SET/NOTIF | KV JSON | — | N | | **P** |
| Do not disturb | SET/NOTIF | KV JSON | — | N | | **P** |
| Module notification metadata | NOTIF | `getModuleNotificationTypes` | — | — | Discovery for UI | **C** |

### Business settings operations (reference — BA SoR)

| Operation | Owner | Service / artifact | PE | Act | Notes | Status |
|-----------|-------|-------------------|-----|-----|-------|--------|
| Workspace settings mega-hub | BA/SET | 6 tabs | P | P | Triplication with profile/branding | **P** |
| Business profile tab (workspace) | BA | `updateBusiness` | C | C | Duplicates profile page | **P** |
| Business branding tab | BA | business APIs | C | C | Duplicates branding page | **P** |
| Business security tab (2FA UI) | SET/ID | **No backend** | — | — | Misleading | **N** |
| Business billing tab | PP3 | BillingModal embed | — | — | PP-3 scope | **—** |
| Business notifications tab | BA/NOTIF | Business-scoped prefs | — | — | Partial | **P** |
| Scheduling tab | MOD | `SchedulingConfiguration` | C | — | Scheduling module | **—** |
| Webhooks sub-page | BA/MOD | webhook routes | C | — | | **P** |
| Business profile page | BA | Same as workspace profile tab | C | C | **Duplicate surface** | **P** |
| Branding standalone page | BA | `GlobalBrandingEditor` | C | C | **Duplicate surface** | **P** |

### Module settings operations

| Operation | Owner | Service / artifact | PE | Act | Notes | Status |
|-----------|-------|-------------------|-----|-----|-------|--------|
| Module configure JSON | MOD | `/api/modules/:id/configure` | P | P | Per-module | **P** |
| HR admin settings | MOD/BA | `/api/hr/admin/settings` | C | C | Dedicated table | **C** |
| Place privacy settings | MOD | `/api/place/settings` | P | P | In-context modal | **P** |
| Module settings editor UI | MOD | `ModuleSettingsEditor` | — | — | HR-heavy | **P** |

### AI settings (excluded SoR — cross-link only)

| Operation | Owner | Notes | Status |
|-----------|-------|-------|--------|
| AI provider preferences | AI | `/api/ai/preferences` | **—** |
| AI autonomy settings | AI | `/api/ai/autonomy/settings` | **—** |
| AI personality profile | AI | `/api/ai/personality/profile` | **—** |

---

## Summary counts

| Category | C | P | N | — |
|----------|---|---|---|---|
| Platform API layer | 0 | 2 | 4 | 0 |
| Personal hub | 0 | 4 | 2 | 3 |
| Notification prefs | 1 | 4 | 2 | 0 |
| Business (reference) | 1 | 7 | 1 | 2 |
| Module settings | 1 | 4 | 0 | 0 |
| **PP-2 core rows** | **2** | **17** | **9** | **5** |

**PP-2-relevant compliance:** ~8% C · ~65% P · ~27% N

---

## Finding disposition (PP-2 audit)

| ID | Severity | Finding |
|----|----------|---------|
| PP2-F01 | **Blocking** | No Settings Platform capability / service |
| PP2-F02 | **Blocking** | `/settings` API contract missing — client drift |
| PP2-F03 | **Blocking** | No preference key registry |
| PP2-F04 | **Major** | 16 fragmented hubs — no canonical IA |
| PP2-F05 | **Major** | Business settings triplication |
| PP2-F06 | **Major** | Notification pref triple write path |
| PP2-F07 | **Major** | Theme localStorage only |
| PP2-F08 | **Major** | Privacy not in settings hub |
| PP2-F09 | **Major** | Notification writes bypass preference service |
| PP2-F10 | Advisory | Avatar duplicate "Settings" menu labels |
| PP2-F11 | Advisory | Profile settings preferences tab stale |
| PP2-F12 | Advisory | HR settings page 404 link |
| PP2-F13 | Advisory | Misleading business 2FA UI |

---

## Related

- [PP2_SETTINGS_FRAGMENTATION_ANALYSIS.md](./PP2_SETTINGS_FRAGMENTATION_ANALYSIS.md)
- [PP2_SETTINGS_CERTIFICATION_READINESS.md](./PP2_SETTINGS_CERTIFICATION_READINESS.md)

**Last updated:** 2026-06-19 (Phase 0B-2)
