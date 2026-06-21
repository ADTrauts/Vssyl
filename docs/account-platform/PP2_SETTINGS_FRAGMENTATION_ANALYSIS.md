# PP-2 — Settings Platform Fragmentation Analysis

**Program:** Account Platform Phase 0B-2 — Settings Platform Audit  
**Date:** 2026-06-19  
**Status:** Discovery only

---

## Hub inventory (user-facing)

### Personal account hubs

| # | Hub name | Web path | Primary APIs | Persistence | Overlap |
|---|----------|----------|--------------|-------------|---------|
| P1 | **Profile Settings** | `/profile/settings?tab=*` | `/api/profile`, `/api/profile-photos`, `/api/location` | `User`, photos, location | Account + photos = PP-1 data |
| P2 | **Legacy profile** | `/profile` | `PUT /api/profile` (name) | `User.name` | Duplicates P1 account |
| P3 | **Analytics & Privacy** | `/profile/analytics` | `/api/privacy/*`, `/api/analytics` | Privacy tables + analytics | Privacy not in P1 tabs |
| P4 | **Notification Settings** | `/notifications/settings` | notifications, email, push APIs | `UserPreference` + `PushSubscription` | Separate from P1 "coming soon" |
| P5 | **AI Identity Control Center** | `/ai?tab=*` | 7+ `/api/ai/*` routes | AI models | **AI Platform** — not Settings SoR |
| P6 | **Theme (avatar menu)** | `AvatarContextMenu` submenu | **None** | `localStorage` | Not in P1 despite placeholder |
| P7 | **Dashboard sidebar customize** | Dashboard left rail "Customize" | `/api/dashboard/:id/sidebar-config` | Dashboard JSON | **Dashboard module** shell |
| P8 | **Billing modal** | Avatar → Billing | `/api/billing/*` | Subscriptions | **PP-3** — not Settings |

**Personal primary hubs (Settings-relevant):** **6** (P1–P4, P6, P7) excluding AI and Billing.

### Business account hubs

| # | Hub name | Web path | Primary APIs | Persistence | Overlap |
|---|----------|----------|--------------|-------------|---------|
| B1 | **Workspace Settings** | `/business/[id]/workspace/settings` | `/api/business/*`, scheduling | `Business`, scheduling config | **6 tabs** — mega-hub |
| B2 | **Business Profile page** | `/business/[id]/profile` | Same business APIs | `Business` | Profile tab duplicates B1 profile tab |
| B3 | **Business Branding** | `/business/[id]/branding` | Business branding APIs | `Business.branding` | Duplicates B1 branding tab |
| B4 | **Webhooks** | `/business/.../workspace/settings/webhooks` | webhook subscription routes | Webhook models | Sub-hub of B1 |
| B5 | **Modules admin** | `/business/[id]/modules` | `/api/modules` | `ModuleInstallation` | Module settings entry |
| B6 | **Module settings modal** | Workspace / modules UI | `/api/modules/:id/configure` | `configured` JSON | Per-module |
| B7 | **HR module settings** | `ModuleSettingsEditor` / HR admin | `/api/hr/admin/settings` | `HRModuleSettings` | Tier-gated features |
| B8 | **Scheduling config** | Tab in B1 | business + scheduling APIs | `Business.schedulingConfig` | Also scheduling module |
| B9 | **Place privacy** | `PlacePrivacySettings` modal | `/api/place/settings` | Place models | Place module |
| B10 | **Front page customization** | `FrontPageWidgetEditor` | `/api/business-front/*` | `UserFrontPageCustomization` | User+business scoped |

**Business primary hubs:** **10** (significant overlap B1/B2/B3).

### Operator / admin (reference only — not end-user Settings)

| Hub | Path | Notes |
|-----|------|-------|
| Admin Portal | `/admin-portal/*` | Certified L3 control plane |
| Retention settings | `/api/retention` | Admin governance |
| Governance policies | `/api/governance` | Enterprise |
| Developer Portal | `/developer-portal` | Partner settings |
| Admin log retention | `/api/admin/logs/retention` | Operator |

---

## Total hub count

| Category | Count |
|----------|-------|
| Personal settings-relevant hubs | **6** |
| Business settings-relevant hubs | **10** |
| **Combined user-facing** | **16** |
| With AI + Billing adjacent | **18** |
| Avatar menu duplicate paths | **+1** ("Profile Settings" vs "Settings" → same URL) |

**Phase 0A estimate (12–14):** **Confirmed and expanded** to **16** settings-relevant hubs at PP-2 granularity.

---

## Duplicate surfaces

### Critical duplications

| Duplication | Surfaces | Severity |
|-------------|----------|----------|
| **Business entity profile** | B1 profile tab · B2 profile page · B2 form components | **Critical** |
| **Business branding** | B1 branding tab · B3 branding page · `GlobalBrandingEditor` | **High** |
| **Personal settings entry** | Avatar "Profile Settings" + "Settings" (same href) | **Medium** |
| **Privacy controls** | P3 analytics privacy tab · not in P1 · `PrivacySettings.tsx` | **High** |
| **Notification prefs** | P4 dedicated page · P1 lists as "coming soon" | **High** |
| **Theme** | P6 avatar menu · P1 preferences placeholder | **High** |
| **Billing** | B1 billing tab · Avatar billing modal | **Medium** (PP-3) |

### API duplications

| Pattern | Locations | Issue |
|---------|-----------|-------|
| Notification prefs write | `notificationController` direct Prisma | Bypasses `userPreferenceService` |
| Email prefs write | `emailNotification` controller | Separate `email_*` prefix |
| Generic pref write | `userController` | Only path using `userPreferenceService` + domain event |
| Privacy update | `privacyController` | Dedicated table — correct SoR but wrong IA |
| Missing bulk API | `useUserSettings` → `/settings` | **Broken contract** |

### Storage location conflicts

| Setting type | Locations | Canonical target |
|--------------|-----------|------------------|
| Theme | localStorage only | `UserPreference` key `appearance.theme` |
| Notification in-app | `UserPreference` `notification_*` | Registry + unified service |
| Notification email | `UserPreference` `email_*` | Unified notification schema |
| Notification push | `PushSubscription` table | Keep table; Settings coordinates UI |
| Quiet hours | `UserPreference` JSON | Registry key `notifications.quiet_hours` |
| AI provider | `UserPreference` + AI tables | AI Platform SoR with Settings link |
| Sidebar layout | `Dashboard` JSON | Dashboard module |
| Module toggles | `ModuleInstallation.configured` | Module owners |

---

## Conflicting APIs

| Conflict | Detail |
|----------|--------|
| **`/settings` vs `/api/user/preferences/:key`** | Client hook uses wrong path; Memory Bank documents bulk API |
| **`/api/privacy/settings` vs settings hub** | Privacy uses dedicated namespace — correct API, wrong UX placement |
| **`/api/notifications/preferences` vs per-key API** | Two write paths to same `UserPreference` table |
| **`PUT /api/place/settings` vs module configure** | Different patterns for module-scoped settings |
| **`/api/hr/admin/settings` vs `/api/modules/configure`** | HR uses dedicated table; others use JSON blob |

---

## Fragmentation heat map

```
Personal                          Business
────────                          ────────
P1 Profile Settings ──┐           B1 Workspace Settings (6 tabs)
P2 Legacy profile     │ overlap   B2 Profile page ────┐
P3 Analytics/Privacy  │           B3 Branding page ───┤ triplication
P4 Notifications      │           B4 Webhooks
P6 Theme (orphan)     │           B5-B7 Module settings
P7 Sidebar (Dashboard)│           B8-B10 Domain settings
P5 AI (excluded)      │
```

---

## Consolidation targets (for future charter — not authorized)

| Target hub | Should link/embed |
|------------|-----------------|
| **Personal Account Settings** (canonical) | Privacy (read-through PP-1 API), notifications link, theme, AI link, billing link |
| **Business Workspace Settings** (canonical business) | Absorb or redirect B2 profile tab, B3 branding page |
| **Module Settings Index** | Discover B5–B7, HR, Place, scheduling |

---

## Related

- [PP2_SETTINGS_OWNERSHIP_MODEL.md](./PP2_SETTINGS_OWNERSHIP_MODEL.md)
- [PP2_SETTINGS_OPERATION_MATRIX.md](./PP2_SETTINGS_OPERATION_MATRIX.md)

**Last updated:** 2026-06-19 (Phase 0B-2)
