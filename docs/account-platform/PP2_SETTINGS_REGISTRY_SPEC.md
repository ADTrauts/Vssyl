# PP-2 — Settings Preference Registry Specification

**Program:** Account Platform PP-2 Phase 1  
**Date:** 2026-06-19  
**Authority:** `server/src/services/account/preferenceRegistry.ts`

---

## Registry schema

Each entry defines:

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Canonical preference key |
| `owner` | enum | `settings` \| `identity` \| `notifications` \| `ai` \| `billing` |
| `scope` | enum | `user` \| `business` |
| `type` | enum | `string` \| `enum` \| `json` \| `boolean` |
| `default` | string | Default when no stored value |
| `storage` | enum | `user_preference` \| `privacy_settings` \| `external` |
| `writableViaSettingsApi` | boolean | Can `PUT /api/settings` write this key? |
| `section` | string | Settings section grouping |
| `allowedValues` | string[]? | Required for `enum` type |

---

## Exact-key entries

| key | owner | scope | type | default | writable | section |
|-----|-------|-------|------|---------|----------|---------|
| `appearance.theme` | settings | user | enum | `system` | ✅ | appearance |
| `privacy.profileVisibility` | identity | user | enum | `PUBLIC` | ❌ | privacy |
| `privacy.activityVisibility` | identity | user | enum | `PUBLIC` | ❌ | privacy |
| `notifications.email.enabled` | notifications | user | boolean | `true` | ✅ | notifications |

### `appearance.theme` allowed values

`light` · `dark` · `system`

---

## Prefix rules

| prefix | owner | type | writable | section |
|--------|-------|------|----------|---------|
| `notification_` | notifications | json | ✅ | notifications |
| `email_` | notifications | json | ✅ | notifications |
| `ai_preferred_` | ai | string | ❌ | ai |

Unknown keys are **rejected** by `settingsService` unless matching a prefix rule.

---

## Validation rules

1. Enum keys must match `allowedValues`
2. Boolean keys must be `true` or `false`
3. Non-writable keys return **403** on settings API write
4. Privacy keys are **read projections** from `privacyService`

---

## Extension process (future packages)

1. Add entry to `PREFERENCE_REGISTRY` or `PREFERENCE_PREFIX_RULES`
2. Update `PP2_SETTINGS_API_CONTRACT.md`
3. Add tests in `preferenceRegistry.test.ts`
4. Council review for cross-domain owner conflicts

---

**Last updated:** 2026-06-19 (PP-2 Phase 1)
