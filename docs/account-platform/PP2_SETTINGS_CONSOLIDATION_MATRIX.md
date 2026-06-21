# PP-2 — Settings Consolidation Matrix

**Program:** Account Platform PP-2 Package 2  
**Date:** 2026-06-20  
**Authority:** `server/src/services/account/settingsHubInventory.ts`

---

## Legend

| Disposition | Meaning |
|-------------|---------|
| **canonical** | Authoritative user-facing entry |
| **duplicate** | Still exists; redirects or banner to canonical |
| **deprecated** | Removed or marked obsolete |
| **reference** | Cross-link; external SoR |

---

## Personal hubs

| ID | Label | Path | Before | After | Owner |
|----|-------|------|--------|-------|-------|
| personal-settings-hub | Personal Settings Hub | `/profile/settings` | Partial | **canonical** | settings |
| profile-legacy | Legacy Profile | `/profile` | duplicate | **redirect** | identity |
| analytics-privacy | Analytics & Privacy | `/profile/analytics` | duplicate | **banner → privacy tab** | identity |
| notification-settings | Notification Settings | `/notifications/settings` | standalone | **canonical** | notifications |
| avatar-theme | Avatar Menu Theme | AvatarContextMenu | reference | **reference** (quick access) | settings |
| avatar-settings-dup | Duplicate Settings label | AvatarContextMenu | duplicate | **deprecated** | settings |
| ai-control-center | AI Control Center | `/ai` | reference | reference | ai |
| billing-modal | Billing Modal | BillingModal | reference | reference | billing |
| dashboard-sidebar-customize | Sidebar Customize | `/dashboard` | reference | reference | dashboard |

---

## Business hubs (review only — no moves)

| ID | Label | Path | Disposition | Canonical target |
|----|-------|------|-------------|-------------------|
| business-workspace-settings | Workspace Settings | `/business/[id]/workspace/settings` | canonical | — |
| business-profile-page | Business Profile Page | `/business/[id]/profile` | duplicate | workspace settings profile tab |
| business-branding-page | Business Branding Page | `/business/[id]/branding` | duplicate | workspace settings branding tab |
| business-webhooks | Webhooks | `.../settings/webhooks` | canonical | — |
| module-settings | Module Settings | modules UI | reference | — |
| hr-admin-settings | HR Admin Settings | HR API | reference | — |
| place-privacy | Place Privacy | modal | reference | — |

---

## Summary

| Category | Count |
|----------|-------|
| Total inventoried | 16 |
| Canonical | 4 |
| Duplicate | 3 |
| Deprecated | 1 |
| Reference | 8 |
| Personal hubs before | 6 |
| Personal hubs after | **2** |

---

## Findings mapping

| Finding | Matrix action |
|---------|---------------|
| PP2-F04 (16 fragmented hubs) | Personal consolidated to 2; business documented |
| PP2-F05 (business triplication) | Documented; BA ownership unchanged |
| PP2-F08 (privacy outside hub) | Privacy tab in canonical hub |
| PP2-F10 (avatar duplicate) | Deprecated entry removed |

---

**Last updated:** 2026-06-20 (PP-2 Package 2)
