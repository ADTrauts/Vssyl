# PP-2 Package 2 — Information Architecture

**Program:** Account Platform PP-2 Package 2 — Settings Experience Consolidation  
**Date:** 2026-06-20  
**Status:** Implemented

---

## Canonical personal settings hub

**Primary entry:** `/profile/settings`

All personal account settings IA flows through this hub. Sidebar navigation is driven by `SETTINGS_NAVIGATION_CONTRACT` (exposed via `GET /api/settings/sections`).

---

## Canonical sections

| Section | Tab / route | Owner | Disposition |
|---------|-------------|-------|-------------|
| **Profile** | `?tab=account`, `?tab=photos`, `?tab=location` | Identity | In hub |
| **Appearance** | `?tab=appearance` | Settings | In hub |
| **Privacy** | `?tab=privacy` | Identity | In hub (was `/profile/analytics` only) |
| **Notifications** | `/notifications/settings` | Notifications | External link |
| **Security** | `?tab=security` | Identity | In hub (placeholder — MFA deferred) |
| **Billing** | `?tab=billing` | Billing | In hub (opens BillingModal) |
| **Connected Accounts** | `?tab=connected-accounts` | Identity | In hub |
| **Business Settings** | `/business/*` | BA | Reference cross-link |
| **AI Control Center** | `/ai` | AI Platform | Reference cross-link |

---

## Navigation disposition

| Type | Behavior |
|------|----------|
| `in_hub` | Rendered as sidebar tab in `/profile/settings` |
| `external_link` | Linked from sidebar; dedicated page (notifications) |
| `reference` | Cross-link only; owning platform retains SoR |

---

## Hub consolidation outcome

| Metric | Before | After |
|--------|--------|-------|
| Personal settings-relevant primary hubs | **6** | **2** (`/profile/settings`, `/notifications/settings`) |
| Duplicate avatar menu entries | 2 ("Profile Settings" + "Settings") | **1** ("Settings") |
| Stale preferences tab | "Coming soon" placeholder | **Replaced** with Appearance + nav links |
| Privacy placement | Analytics page only | **Canonical** in settings hub |

---

## Deprecated / redirected surfaces

| Surface | Action |
|---------|--------|
| `/profile` | Redirects → `/profile/settings?tab=account` |
| `/profile/analytics` privacy tab | Banner → Settings → Privacy |
| Avatar duplicate "Settings" label | Removed |

---

## Business settings (reference only)

Business configuration remains **Business Administration SoR**. Settings hub links to `/business` as reference. Deduplication documented in `PP2_BUSINESS_SETTINGS_DEDUPLICATION_REVIEW.md` — no ownership moves in Package 2.

---

**Last updated:** 2026-06-20 (PP-2 Package 2)
