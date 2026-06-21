# PP-2 — Settings API Contract

**Program:** Account Platform PP-2 Phase 1  
**Date:** 2026-06-19  
**Canonical mount:** `/api/settings`  
**Auth:** JWT required (`authenticateJWT`)

---

## GET /api/settings

Bulk resolve registered settings for the authenticated user.

**Response:**

```json
{
  "success": true,
  "settings": {
    "appearance.theme": "system",
    "privacy.profileVisibility": "PUBLIC"
  },
  "registry": [
    {
      "key": "appearance.theme",
      "owner": "settings",
      "scope": "user",
      "type": "enum",
      "default": "system",
      "writableViaSettingsApi": true,
      "section": "appearance"
    }
  ]
}
```

---

## PUT /api/settings

Update one or more settings.

**Single key:**

```json
{ "key": "appearance.theme", "value": "dark" }
```

**Bulk:**

```json
{ "settings": { "appearance.theme": "dark", "notifications.email.enabled": "true" } }
```

**Response:** Same shape as GET.

**Errors:**

| Code | Condition |
|------|-----------|
| 400 | Unknown key, invalid enum/boolean |
| 403 | Key not writable via settings API |
| 401 | Missing auth |

---

## GET /api/settings/sections

Returns section groupings and navigation contract.

```json
{
  "success": true,
  "sections": [
    { "id": "appearance", "label": "Appearance", "owner": "settings", "keys": ["appearance.theme"], "readOnly": false }
  ],
  "navigation": [
    { "id": "appearance", "label": "Appearance", "href": "/profile/settings?tab=appearance", "owner": "settings", "section": "appearance", "apiPath": "/api/settings", "description": "..." }
  ]
}
```

---

## GET /api/settings/preferences/:key

Single preference read.

```json
{ "success": true, "key": "appearance.theme", "value": "dark" }
```

---

## PUT /api/settings/preferences/:key

```json
{ "value": "dark" }
```

---

## DELETE /api/settings/preferences/:key

Removes stored KV value (reverts to default on next read).

```json
{ "success": true }
```

---

## Client contract fix

`shared/src/components/useUserSettings.ts` now calls:

| Operation | Path |
|-----------|------|
| Load | `GET /api/settings` |
| Update | `PUT /api/settings` |
| Delete | `DELETE /api/settings/preferences/:key` |

**Previously broken:** `GET /settings` (unmounted).

---

## Transitional endpoints (compatibility)

| Legacy | Convergence |
|--------|-------------|
| `GET/PUT /api/user/preferences/:key` | Delegates to `settingsService` for registry keys |
| `GET/PUT /api/privacy/settings` | Privacy SoR — unchanged |
| `GET/PUT /api/notifications/preferences` | Future adapter via settings orchestration |

---

## Inventory of settings-related API families (reference)

| Family | Path | PP-2 status |
|--------|------|-------------|
| **Platform settings** | `/api/settings` | **Canonical** ✅ |
| User preferences | `/api/user/preferences/:key` | Transitional |
| Privacy | `/api/privacy/settings` | Identity SoR |
| Notifications | `/api/notifications/preferences` | Notifications SoR |
| Email notifications | `/api/email-notifications/*` | Notifications |
| AI autonomy | `/api/ai/autonomy/settings` | AI Platform |
| AI preferences | `/api/ai/preferences` | AI Platform |
| HR settings | `/api/hr/admin/settings` | Module/BA |
| Place settings | `/api/place/settings` | Module |
| Business | `/api/business/*` | BA |
| Billing | `/api/billing/*` | PP-3 |

---

**Last updated:** 2026-06-19 (PP-2 Phase 1)
