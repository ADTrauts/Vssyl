# PP-1 — Identity & Profile Ownership Model

**Program:** Account Platform Phase 0B-1 — Identity & Profile Platform Audit  
**Date:** 2026-06-19  
**Status:** **Authoritative PP-1 boundaries** — discovery ratification pending council; not runtime-enforced

**Supersedes:** Proposed ownership in [ACCOUNT_PLATFORM_OWNERSHIP_MODEL.md](./ACCOUNT_PLATFORM_OWNERSHIP_MODEL.md) for PP-1 scope only.

---

## Authoritative boundary answers

### Identity owns

| Concern | SoR | Write authority |
|---------|-----|-----------------|
| User credentials (`email`, `password`) | `User` | Identity auth flows only |
| Email verification state | `User.emailVerified` | Identity |
| Platform role (`User.role`) | `User` | Identity + Admin Portal user ops |
| JWT access token claims | JWT payload | Auth kernel |
| Refresh token sessions | `RefreshToken` | Identity auth service |
| Password reset / email verify tokens | Token tables | Identity |
| Registration + login + recovery flows | `auth.ts` / target `authService` | Identity |
| Vssyl ID (`userNumber`) | `User` + location FKs | Identity (registration); admin override |
| Geolocation at registration | `geolocationService` | Identity |
| Security event logging (auth failures) | `SecurityEvent` via `securityService` | Identity + Admin Portal |

### Profile owns

| Concern | SoR | Write authority |
|---------|-----|-----------------|
| Personal display name | `User.name` | Profile service |
| Legacy `User.image` | `User` | Profile (deprecate toward photo library) |
| Photo library | `UserProfilePhoto` | Profile photo service |
| Personal/business avatar slots | `personalPhotoId`, `businessPhotoId` | Profile photo service |
| Legacy photo URL strings | `personalPhoto`, `businessPhoto` | Profile (migration target: ID-only) |
| User search (discovery) | `User` read projection | Profile read service |
| Connections graph | `Relationship` | Profile social service |
| Colleague pins (user-scoped) | `PinnedColleague` | Profile + business member context |
| User location display | Location FKs on `User` | Profile read; admin write |

### Settings owns (PP-2 — IA and contract only in PP-1)

| Concern | PP-1 boundary |
|---------|----------------|
| Settings hub navigation | PP-2 owns **where** privacy/notifications appear |
| Bulk `/settings` API contract | PP-2 owns **platform API shape** |
| Theme / appearance server backing | PP-2 owns migration from localStorage |
| Notification prefs **placement** | PP-2 IA; Identity owns **key schema** with Notifications platform |

**PP-1 does not own:** cross-hub settings UX consolidation (PP-2 charter).

### Business Administration owns

| Concern | SoR | Notes |
|---------|-----|-------|
| Business entity profile | `Business` | `businessProfileService` — **L3 certified** |
| Org branding | `Business` branding fields | BA program |
| Business member roles | `BusinessMember` | BA / member module |
| Employee HR profile | `EmployeeHRProfile` | HR module — not user profile |
| Business workspace settings writes | `Business` + webhooks | BA + workspace shell — triplication is PP-2 |

**Rule:** Account Platform **never** becomes write owner of `Business` profile fields.

### Explicitly not owned by PP-1

| Concern | Owner |
|---------|-------|
| AI personality / autonomy / identity questionnaire | **AI Platform** |
| Dashboard layout / sidebar JSON | **Dashboard module** |
| Workspace runtime scope | **Reference Workspace** (archived) |
| Billing / subscriptions / entitlements | **PP-3 Billing** |
| Notification delivery pipeline | **Notifications platform (L2)** |
| Admin impersonation / security ops UI | **Admin Portal (L3)** |

---

## Privacy & security slice (within PP-1 program)

| Concern | SoR | Owner slice |
|---------|-----|-------------|
| `UserPrivacySettings` | Dedicated table | **Security/Privacy** under PP-1 |
| `UserConsent` | Consent records | **Security/Privacy** |
| `DataDeletionRequest` | GDPR requests | **Security/Privacy** |
| Data export API | Aggregated reads | **Security/Privacy** |
| MFA (future) | TBD schema | **Security/Privacy** |
| Account security UX (sessions, password change) | TBD | **Security/Privacy** |

**Settings (PP-2)** owns linking privacy into unified settings hub — not the privacy SoR.

---

## Preferences ownership split

```
UserPreference (KV table)
├── Identity/PREF slice: key registry, validation, generic get/set API
├── Settings slice (PP-2): hub IA, bulk API, theme keys
├── Notifications platform: delivery + preference key conventions (notification_*)
└── AI Platform: ai_preferred_* (migrate or document as cross-reference)

Dedicated tables (not KV):
├── UserPrivacySettings → Security/Privacy slice
├── PushSubscription → Settings + Notifications coordination
└── AIPersonalityProfile → AI Platform (excluded)
```

---

## Write path ownership (constitutional target)

| Mutation | Current | Target owner | Target pattern |
|----------|---------|--------------|----------------|
| Register | Inline `index.ts` | Identity `authService` | authorize(self) → execute → security event |
| Update name | Inline Prisma | Profile `profileService` | JWT scope → execute → activity |
| Upload photo | Controller | Profile `profilePhotoService` | user scope → storage → activity |
| Set generic pref | `userPreferenceService` | PREF slice | JWT → upsert → domain event ✅ |
| Set notification pref | Notification controller | PREF + NOTIF | unify through preference service |
| Update privacy | Privacy controller | `privacyService` | JWT → execute → activity |
| Send connection | Member controller | `connectionService` | JWT → execute → notify ✅ |

---

## Duplication register (PP-1 scope)

| Duplication | Resolution owner |
|-------------|------------------|
| `/profile` vs `/profile/settings` name edit | Profile — consolidate to settings hub |
| `/api/profile` vs photo library for avatars | Profile — single aggregate read API |
| `userController` vs `notificationController` KV writes | PREF slice + PP-2 |
| Member controller size (~1900 LOC) | Split: connections vs business employee ops |
| Privacy at `/profile/analytics` | PP-2 IA links; PP-1 owns API |

---

## Related

- [PP1_IDENTITY_PROFILE_SERVICE_BOUNDARY_ANALYSIS.md](./PP1_IDENTITY_PROFILE_SERVICE_BOUNDARY_ANALYSIS.md)
- [PP1_IDENTITY_PROFILE_OPERATION_MATRIX.md](./PP1_IDENTITY_PROFILE_OPERATION_MATRIX.md)

**Last updated:** 2026-06-19 (Phase 0B-1)
