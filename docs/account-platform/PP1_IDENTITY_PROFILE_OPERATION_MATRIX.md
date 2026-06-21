# PP-1 — Identity & Profile Operation Matrix

**Surface id:** `identity-profile` (Account Platform PP-1)  
**Program:** Account Platform Phase 0B-1 — Identity & Profile Platform Audit  
**Date:** 2026-06-19  
**Status:** Constitutional audit — discovery only

**Related:** [PP1_IDENTITY_PROFILE_REALITY_ASSESSMENT.md](./PP1_IDENTITY_PROFILE_REALITY_ASSESSMENT.md) · [ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md](./ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — correct owner and constitutional pattern |
| **P** | Partial — works; missing PE, activity, service layer, or tests |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Owner:** `ID` = Identity · `PR` = Profile · `SEC` = Security/Privacy · `PREF` = Preferences · `SET` = Settings (PP-2) · `NOTIF` = Notifications platform · `BA` = Business Administration (excluded)

**PE** = Policy Engine · **Act** = normalized module/platform activity · **RT** = realtime

---

## Master operation matrix

### Identity — authentication & session

| Operation | Owner | Service / artifact | PE | Act | RT | Trash | Notes | Status |
|-----------|-------|-------------------|-----|-----|-----|-------|-------|--------|
| Register user | ID | `registerUser` in `auth.ts` | — | N | — | — | Inline `index.ts` handler | **P** |
| Login (credentials) | ID | Passport + `issueJWT` | — | N | — | — | Returns JWT + refresh | **P** |
| Refresh access token | ID | `tokenUtils.validateRefreshToken` | — | N | — | — | Rotates refresh token | **P** |
| Forgot password | ID | `tokenUtils` + `emailService` | — | N | — | — | Inline handler | **P** |
| Reset password | ID | `tokenUtils` + bcrypt | — | N | — | — | Clears all refresh tokens | **P** |
| Verify email | ID | `tokenUtils` | — | N | — | — | Inline handler | **P** |
| Resend verification | ID | `tokenUtils` + email | — | N | — | — | Inline handler | **P** |
| JWT authenticate request | ID | `authenticateJWT` | — | — | — | — | Loads User; impersonation support | **C** |
| Impersonation context swap | — | Admin Portal | C | C | — | — | **Excluded** — admin L3 | **—** |
| MFA challenge | SEC | **None** | — | — | — | — | Not implemented | **N** |
| Logout (client) | ID | NextAuth session clear | — | — | — | — | No server revoke endpoint | **P** |
| List/revoke active sessions | SEC | **None** | — | — | — | — | Missing product surface | **N** |
| Change password (logged-in) | SEC | **None** | — | — | — | — | Missing API | **N** |

### Profile — personal identity surface

| Operation | Owner | Service / artifact | PE | Act | RT | Trash | Notes | Status |
|-----------|-------|-------------------|-----|-----|-----|-------|-------|--------|
| Get profile (self) | PR | `GET /api/profile` → `req.user` | — | — | — | — | Inline `index.ts` | **P** |
| Update display name | PR | Inline `prisma.user.update` | N | N | — | — | No `profileService` | **N** |
| Search users (global) | PR | `userController.searchUsers` | — | — | — | — | Bounded select | **P** |
| Get user location | PR | `locationService.getUserLocation` | — | — | — | — | Read-only | **C** |
| List countries/regions/towns | PR | `locationService` | — | — | — | — | Public reference data | **C** |
| Update user location | PR | **Admin-only** by design | — | — | — | — | No user write API | **—** |

### Profile — avatar / photo library

| Operation | Owner | Service / artifact | PE | Act | RT | Trash | Notes | Status |
|-----------|-------|-------------------|-----|-----|-----|-------|-------|--------|
| List photo library | PR | `profilePhotoController` | — | — | — | P | `trashedAt` filter | **P** |
| Upload photo | PR | Controller + sharp + `storageService` | N | N | — | P | No service layer | **P** |
| Assign personal slot | PR | Controller + User FK update | N | N | — | — | Dual URL + ID fields | **P** |
| Assign business slot | PR | Controller + User FK update | N | N | — | — | Personal/business slots | **P** |
| Update crop/avatar rendition | PR | Controller + sharp | N | N | — | — | | **P** |
| Remove photo (soft) | PR | `trashedAt` on library row | N | N | — | P | Not Global Trash registered | **P** |
| Serve photo image | PR | Authenticated proxy serve | — | — | — | — | GCS-safe paths | **C** |
| Avatar menu cache | PR | `AvatarContextMenu` client | — | — | — | — | Fetches library on open | **P** |

### Profile — social graph (connections)

| Operation | Owner | Service / artifact | PE | Act | RT | Notes | Status |
|-----------|-------|-------------------|-----|-----|-----|-------|--------|
| List connections | PR | `memberController` | — | — | — | Direct Prisma | **P** |
| Send connection request | PR | `memberController` | N | P | C | Notification emitted | **P** |
| Accept/decline/block | PR | `memberController` | N | N | — | No PE | **N** |
| Remove connection | PR | `memberController` | N | P | — | Some domain events | **P** |
| Bulk remove connections | PR | `memberController` | N | N | — | | **N** |
| Search users (member) | PR | `memberController` | — | — | — | Zod validated | **P** |
| Pin colleague (business) | BA/PR | member routes | P | — | — | Business scoped | **P** |

### Preferences (PP-1 slice)

| Operation | Owner | Service / artifact | PE | Act | RT | Notes | Status |
|-----------|-------|-------------------|-----|-----|-----|-------|--------|
| Get preference by key | PREF | `userPreferenceService` | — | — | — | No key registry | **P** |
| Set preference by key | PREF | `userPreferenceService` | — | C | — | Domain event only here | **P** |
| Get notification prefs | SET/NOTIF | `notificationController` | — | N | — | Direct Prisma KV scan | **P** |
| Save notification prefs | SET/NOTIF | `notificationController` | — | N | — | No domain event | **P** |
| Quiet hours / DND | SET/NOTIF | notification routes | — | N | — | KV JSON | **P** |
| Email notification prefs | SET/NOTIF | `emailNotification` routes | — | N | — | Separate prefix | **P** |
| Push subscription register | SET/NOTIF | `PushSubscription` table | — | — | — | Not KV | **P** |

### Security & privacy

| Operation | Owner | Service / artifact | PE | Act | RT | Notes | Status |
|-----------|-------|-------------------|-----|-----|-----|-------|--------|
| Get privacy settings | SEC | `privacyController` | — | — | — | Auto-create defaults | **P** |
| Update privacy settings | SEC | `privacyController` | N | N | — | Direct Prisma upsert | **N** |
| List consents | SEC | `privacyController` | — | — | — | | **P** |
| Grant/revoke consent | SEC | `privacyController` | N | N | — | GDPR types | **P** |
| Request data deletion | SEC | `privacyController` | N | N | — | | **P** |
| Export user data | SEC | `privacyController` | — | — | — | Partial export | **P** |
| Collective AI learning opt-in | SEC | Privacy + `collectiveLearningConsent` | — | — | — | Cross AI platform | **P** |

### Excluded (out of PP-1 matrix)

| Operation | Owner | Reason |
|-----------|-------|--------|
| Update business profile | BA | Business Administration L3 |
| AI personality profile | AI Platform | PP-1 exclusion |
| Dashboard layout prefs | Dashboard | Wave 3 exclusion |
| Billing / subscriptions | PP-3 | Billing exclusion |

---

## Summary counts

| Domain | C | P | N |
|--------|---|---|---|
| Identity auth/session | 1 | 8 | 3 |
| Profile core | 2 | 2 | 1 |
| Photos | 1 | 7 | 0 |
| Connections | 0 | 4 | 2 |
| Preferences | 0 | 7 | 0 |
| Privacy/security | 0 | 6 | 1 |
| **Total** | **4** | **28** | **7** |

**Compliance rate:** ~10% fully compliant (C) · ~70% partial · ~17% non-compliant

---

## Priority remediation rows (PP-1 modernization)

| Priority | Operation rows | Gate impact |
|----------|----------------|-------------|
| **P0** | Update display name, privacy update, connection accept/block | G1, G3 |
| **P0** | Extract auth routes from `index.ts` | G3, G7 |
| **P1** | Photo upload/assign/remove → service + activity | G2, G3, G8 |
| **P1** | Notification prefs → shared preference service + events | G2, G5 |
| **P1** | MFA + session management | G8, G9 |
| **P2** | Global Trash registration for photos | G8 |
| **P2** | Member connection PE | G1 |

---

## Finding disposition (PP-1 audit)

| ID | Finding | Severity | Matrix rows |
|----|---------|----------|-------------|
| PP1-F01 | No `profileService` | Major | Update name, get profile |
| PP1-F02 | Auth in `index.ts` | Major | All auth rows |
| PP1-F03 | No MFA | Major | MFA row |
| PP1-F04 | Photo controller-only | Major | Photo rows |
| PP1-F05 | Member mutations no PE | Major | Accept/block |
| PP1-F06 | Privacy no PE/activity | Major | Privacy update |
| PP1-F07 | Notification prefs fragmented | Advisory | Notification pref rows |
| PP1-F08 | No session revoke UX | Advisory | Session rows |
| PP1-F09 | Legacy photo URL dual fields | Advisory | Photo assign |
| PP1-F10 | Misleading 2FA UI (business settings) | Advisory | Cross-surface — PP-2 |

---

**Last updated:** 2026-06-19 (Phase 0B-1)
