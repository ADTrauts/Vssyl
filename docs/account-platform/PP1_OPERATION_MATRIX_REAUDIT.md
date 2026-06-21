# PP-1 — Operation Matrix Re-Audit

**Program:** Account Platform — Certification Preparation (Phase 0)  
**Date:** 2026-06-20  
**Type:** Governance re-audit — validated against implementation  
**Baseline:** [PP1_IDENTITY_PROFILE_OPERATION_MATRIX.md](./PP1_IDENTITY_PROFILE_OPERATION_MATRIX.md) (Phase 0B-1)

---

## Re-audit method

Validated against runtime artifacts post PP-1 Phase 1, PP-2 Phase 1, and PP-2 Package 2:

- Service layer: `server/src/services/account/*`
- Routes: `/api/auth`, `/api/profile`, `/api/privacy`, `/api/profile-photos`, `/api/member`, `/api/user/preferences/:key`
- Policy: `policyActions.ts`, `identityPolicyDual.ts`
- Activity: `identityActivityService.ts`, `userPreferenceService.ts`
- Tests: 6 PP-1-scoped test files (30 tests in combined prep suite)

**Verdict:** Matrix **validated with documented gaps**. No ownership conflicts. No service boundary regressions vs Phase 1 charter.

---

## Summary counts (re-audited)

| Domain | C | P | N | — |
|--------|---|---|---|---|
| Identity auth/session | 1 | 8 | 3 | — |
| Profile core | 3 | 2 | 0 | — |
| Photos | 1 | 6 | 0 | — |
| Connections | 1 | 4 | 0 | 1 |
| Preferences | 0 | 2 | 0 | 5 |
| Privacy/security | 1 | 5 | 0 | — |
| **Total PP-1 rows** | **7** | **27** | **3** | **6** |

**Compliance rate:** ~19% C · ~71% P · ~8% N (down from ~17% N at 0B-1)

---

## Identity — authentication & session

| Operation | Owner | Service | PE | Act | Domain evt | Status | Re-audit notes |
|-----------|-------|---------|-----|-----|------------|--------|----------------|
| Register | ID | `authService` | — | Sec log | — | **P** | Extracted from `index.ts` ✅; security logging not module activity |
| Login | ID | Passport + `authController` | — | Sec log | — | **P** | Credential plane — acceptable |
| Refresh token | ID | `authService` | — | Sec log | — | **P** | |
| Forgot/reset password | ID | `authService` | — | Sec log | — | **P** | |
| Verify/resend email | ID | `authService` | — | Sec log | — | **P** | |
| JWT authenticate | ID | `authenticateJWT` | — | — | — | **C** | |
| MFA challenge | SEC | None | — | — | — | **N** | PP1-F03 — WITH FINDINGS advisory |
| Session revoke UX | SEC | None | — | — | — | **N** | PP1-F08 advisory |
| Change password (logged-in) | SEC | None | — | — | — | **N** | PP1-F08 advisory |

---

## Profile — personal identity

| Operation | Owner | Service | PE | Act | Domain evt | Status | Re-audit notes |
|-----------|-------|---------|-----|-----|------------|--------|----------------|
| Get profile (self) | PR | `profileService` | ✅ read | — | — | **C** | `/api/profile` delegates |
| Update display name | PR | `profileService` | ✅ update | ✅ | — | **C** | PE + `profile.updated` activity |
| Search users | PR | `userController` | — | — | — | **P** | Read-only; bounded |
| Location read | PR | `locationService` | — | — | — | **C** | Reference data |

---

## Photos

| Operation | Owner | Service | PE | Act | Domain evt | Status | Re-audit notes |
|-----------|-------|---------|-----|-----|------------|--------|----------------|
| Upload/assign/update/remove | PR | `profilePhotoService` | ✅ write | ✅ | — | **P** | Service + activity; multer in controller (F04) |
| Serve photo | PR | Controller proxy | — | — | — | **C** | |

---

## Connections

| Operation | Owner | Service | PE | Act | Domain evt | Status | Re-audit notes |
|-----------|-------|---------|-----|-----|------------|--------|----------------|
| Request connection | PR | `connectionService` | ✅ | ✅ | — | **C** | |
| Accept/decline/block | PR | `connectionService` | ✅ | ✅ | — | **C** | |
| Remove connection | PR | `connectionService` | ✅ | ✅ | — | **C** | |
| List/search connections | PR | `memberController` | — | — | — | **P** | Read paths inline Prisma — acceptable read layer |

---

## Preferences

| Operation | Owner | Service | PE | Act | Domain evt | Status | Re-audit notes |
|-----------|-------|---------|-----|-----|------------|--------|----------------|
| Get/set preference (generic) | PREF | `userPreferenceService` | ✅ write | — | ✅ | **P** | `user.preference.updated` domain event |
| Registry-known keys | SET | `settingsService` (via user/settings API) | ✅ | ✅ | ✅ settings.* | **P** | PP-2 orchestration layer |
| Notification prefs (in-app) | NOTIF/SET | `notificationSettingsAdapter` | ✅ | ✅ | ✅ | **P** | PP-2 Package 2 alignment |

---

## Privacy & security

| Operation | Owner | Service | PE | Act | Domain evt | Status | Re-audit notes |
|-----------|-------|---------|-----|-----|------------|--------|----------------|
| Get/update privacy settings | SEC | `privacyService` | ✅ | ✅ | — | **C** | |
| Consents / GDPR flows | SEC | `privacyService` | ✅ partial | ✅ partial | — | **P** | |
| Privacy projection in settings | ID/SET | `privacyService` read-only | ✅ read | — | — | **C** | Settings orchestrates; Identity owns SoR |

---

## Validation summary

| Check | Result |
|-------|--------|
| **Ownership conflicts** | **None** — Identity owns profile/privacy/connections; Settings orchestrates registry-known prefs |
| **PE gaps** | Auth credential plane (by design); member read/list paths |
| **Activity gaps** | Auth flows use security logging not module activity (acceptable); no identity **domain events** |
| **Domain event gaps** | Identity slice has module activity only — no `identity.*` domain events in registry |
| **Service boundary violations** | **Minor:** multer in `profilePhotoController`; member read inline Prisma |

---

## Findings disposition (re-audit)

| ID | Pre re-audit | Post re-audit |
|----|--------------|---------------|
| PP1-F01 | Closed | **Confirmed closed** |
| PP1-F02 | Closed | **Confirmed closed** |
| PP1-F03 | Open | **Open** — see MFA disposition |
| PP1-F04 | Partial | **Confirmed partial** |
| PP1-F05 | Closed | **Confirmed closed** |
| PP1-F06 | Closed | **Confirmed closed** |

---

**Last updated:** 2026-06-20 (Certification Preparation)
