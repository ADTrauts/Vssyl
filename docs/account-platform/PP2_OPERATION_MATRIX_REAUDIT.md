# PP-2 — Operation Matrix Re-Audit

**Program:** Account Platform — Certification Preparation (Phase 0)  
**Date:** 2026-06-20  
**Type:** Governance re-audit — validated against implementation  
**Baseline:** [PP2_SETTINGS_OPERATION_MATRIX.md](./PP2_SETTINGS_OPERATION_MATRIX.md) (Phase 0B-2)

---

## Re-audit method

Validated against runtime artifacts post PP-2 Phase 1 and Package 2:

- `settingsService`, `preferenceRegistry`, `notificationSettingsAdapter`, `settingsHubInventory`, `settingsNavigationContract`
- Routes: `/api/settings`, `/api/notifications/preferences`, `/api/user/preferences/:key`
- Client: `/profile/settings`, theme hydration, notification settings page
- Tests: 8 PP-2-scoped test files (24 settings-specific; 30 in combined prep suite)

**Verdict:** Matrix **validated**. Personal settings slice substantially compliant. Business/module rows remain reference-only.

---

## Summary counts (re-audited)

| Category | C | P | N | — |
|----------|---|---|---|---|
| Platform API layer | 5 | 1 | 0 | 0 |
| Personal hub / IA | 4 | 1 | 0 | 2 |
| Notification prefs | 3 | 2 | 0 | 0 |
| Theme | 3 | 0 | 0 | 0 |
| Business (reference) | 0 | 3 | 0 | 7 |
| Module settings | 0 | 4 | 0 | 1 |
| **PP-2 core rows** | **15** | **11** | **0** | **10** |

**PP-2-relevant compliance:** ~58% C · ~42% P · **0% N** (was ~8% C · ~65% P · ~27% N)

---

## Platform API layer

| Operation | Owner | Service | PE | Act | Domain evt | Status | Re-audit notes |
|-----------|-------|---------|-----|-----|------------|--------|----------------|
| Bulk GET settings | SET | `settingsService` | ✅ | — | — | **C** | `/api/settings` |
| Bulk PUT settings | SET | `settingsService` | ✅ | ✅ | ✅ | **C** | |
| GET/PUT/DELETE preference | SET | `settingsService` | ✅ | ✅ | ✅ | **C** | |
| GET sections + hub inventory | SET | `settingsService` | ✅ | — | — | **C** | Package 2 hub metadata |
| Legacy `/api/user/preferences` | PREF/SET | Delegates for registry keys | ✅ | ✅ | ✅ | **P** | Transitional |

---

## Registry & theme

| Operation | Owner | Service | PE | Act | Domain evt | Status | Re-audit notes |
|-----------|-------|---------|-----|-----|------------|--------|----------------|
| Registry validation | SET | `preferenceRegistry` | — | — | — | **C** | Exact + prefix rules |
| `appearance.theme` read/write | SET | `settingsService` | ✅ | ✅ | ✅ theme.changed | **C** | |
| Theme hydration (client) | SET | `settingsTheme.ts` + ThemeProvider | — | — | — | **C** | Server + localStorage |
| Privacy keys (read projection) | ID | `privacyService` via settings | ✅ read | — | — | **C** | Non-writable via settings API |

---

## Notification preferences

| Operation | Owner | Service | PE | Act | Domain evt | Status | Re-audit notes |
|-----------|-------|---------|-----|-----|------------|--------|----------------|
| GET/PUT category prefs | NOTIF/SET | `notificationSettingsAdapter` → `settingsService` | ✅ | ✅ | ✅ | **C** | F06/F09 closed |
| Quiet hours / DND | NOTIF/SET | Adapter → `settingsService` | ✅ | ✅ | ✅ | **C** | Registry keys added P2 |
| Email notification prefs | NOTIF | `emailNotificationController` | — | — | — | **P** | Direct Prisma — advisory |
| Push subscription | NOTIF | `PushSubscription` table | — | — | — | **P** | Not KV — by design |

---

## Hub IA (personal)

| Operation | Owner | Artifact | Status | Re-audit notes |
|-----------|-------|----------|--------|----------------|
| Canonical settings hub | SET | `/profile/settings` | **C** | 8 in-hub sections |
| Notification settings page | NOTIF | `/notifications/settings` | **C** | External link in nav contract |
| Legacy `/profile` redirect | ID/SET | Redirect to hub | **C** | |
| Privacy in hub | ID/SET | `?tab=privacy` | **C** | F08 closed |
| Business settings dedup | BA | Documented reference | **P** | F05 partial — BA owns |

---

## Validation summary

| Check | Result |
|-------|--------|
| **Ownership conflicts** | **None** — Settings orchestrates; Identity/Notifications/AI own SoR rows per registry |
| **PE gaps** | `emailNotificationController` writes without PE (advisory) |
| **Activity gaps** | Email notification writes silent (advisory) |
| **Domain event gaps** | Settings domain events complete for orchestrated writes |
| **Service boundary violations** | **None** in settings-owned paths |

---

## Findings disposition (re-audit)

| ID | Pre Package 2 | Post re-audit |
|----|---------------|---------------|
| PP2-F01–F03 | Closed (P1) | **Confirmed closed** |
| PP2-F04 | Open | **Closed** |
| PP2-F05 | Open | **Partial** — BA dedup documented |
| PP2-F06–F09 | Open | **Closed** |
| PP2-F07 | Partial | **Closed** |
| PP2-F10–F11 | Advisory | **Closed** |

---

**Last updated:** 2026-06-20 (Certification Preparation)
