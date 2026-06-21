# PP-1 — G1–G9 Evidence Binder

**Program:** Account Platform — Certification Preparation (Phase 0)  
**Sub-program:** PP-1 Identity & Profile  
**Date:** 2026-06-20  
**Status:** Refreshed evidence package — evaluation not authorized

**Readiness score:** **~24/27 (~89%)**

---

## G1 — Authorization

| Evidence | Location | Status |
|----------|----------|--------|
| Policy actions defined | `server/src/auth/policyActions.ts` — `user:profile.*`, `user:privacy.*`, `user:photo.write`, `user:preference.write`, `connection:*` | ✅ |
| Policy engine handlers | `server/src/auth/policyEngine.ts` — identity self-policy block | ✅ |
| Service enforcement | `profileService`, `privacyService`, `profilePhotoService`, `connectionService`, `userPreferenceService` | ✅ |
| Auth credential plane | Security logging via `logger.logSecurityEvent` — no PE (documented) | ⚠️ By design |
| **Gate score** | **3/3** | |

---

## G2 — Auditability

| Evidence | Location | Status |
|----------|----------|--------|
| Module activity | `identityActivityService.ts` — profile, photo, privacy, connection events | ✅ |
| Preference domain event | `user.preference.updated` via `userPreferenceService` | ✅ |
| Identity domain events | **Not registered** — module activity only | ⚠️ WITH FINDINGS gap |
| Auth security events | `authController` — login/register security logging | ✅ |
| **Gate score** | **2/3** | |

---

## G3 — Service boundaries

| Evidence | Location | Status |
|----------|----------|--------|
| `authService` | `server/src/services/account/authService.ts` | ✅ |
| `profileService` | `server/src/services/account/profileService.ts` | ✅ |
| `profilePhotoService` | `server/src/services/account/profilePhotoService.ts` | ✅ |
| `privacyService` | `server/src/services/account/privacyService.ts` | ✅ |
| `connectionService` | `server/src/services/account/connectionService.ts` | ✅ |
| Auth routes extracted | `server/src/routes/auth.ts` — not in `index.ts` | ✅ |
| Multer in photo controller | `profilePhotoController.ts` — transitional (F04) | ⚠️ Partial |
| **Gate score** | **3/3** | |

---

## G4 — API coherence

| Evidence | Location | Status |
|----------|----------|--------|
| `/api/auth` | `routes/auth.ts` | ✅ |
| `/api/profile` | `routes/profile.ts` | ✅ |
| `/api/privacy` | `routes/privacy.ts` | ✅ |
| `/api/profile-photos` | `routes/profilePhotos.ts` | ✅ |
| `/api/member` | `routes/member.ts` — mutations via connectionService | ✅ |
| `/api/user/preferences/:key` | Transitional; registry keys delegate to settings | ✅ |
| **Gate score** | **3/3** | |

---

## G5 — Ownership

| Evidence | Location | Status |
|----------|----------|--------|
| Ownership model | [PP1_IDENTITY_PROFILE_OWNERSHIP_MODEL.md](./PP1_IDENTITY_PROFILE_OWNERSHIP_MODEL.md) | ✅ |
| Privacy SoR separation | Identity owns; Settings read-only projection | ✅ |
| BA profile excluded | Documented in matrix | ✅ |
| **Gate score** | **3/3** | |

---

## G6 — Test evidence

| Test file | Tests | Scope |
|-----------|-------|-------|
| `profileService.test.ts` | 2 | Name update + PE + activity |
| `userPreferenceService.test.ts` | 4 | PE + domain event |
| `account-identity.integration.test.ts` | 2 | Profile routes |
| **Total PP-1 scoped** | **8** | Partial matrix coverage |

| Gap | Disposition |
|-----|-------------|
| No privacy integration test | WITH FINDINGS |
| No connection integration test | WITH FINDINGS |
| No auth route integration suite | WITH FINDINGS |

**Gate score:** **2/3**

---

## G7 — Documentation

| Document | Status |
|----------|--------|
| [PP1_PHASE1_ARCHITECTURE.md](./PP1_PHASE1_ARCHITECTURE.md) | ✅ |
| [PP1_OPERATION_MATRIX_REAUDIT.md](./PP1_OPERATION_MATRIX_REAUDIT.md) | ✅ This binder cycle |
| [PP1_CERTIFICATION_PLAN.md](./PP1_CERTIFICATION_PLAN.md) | ✅ |
| **Gate score** | **3/3** |

---

## G8 — Production safety

| Evidence | Status |
|----------|--------|
| JWT auth on protected routes | ✅ |
| Password hashing (bcrypt) | ✅ |
| Refresh token rotation | ✅ |
| **MFA not implemented** | ⚠️ PP1-F03 — see MFA disposition |
| Session revoke UX missing | ⚠️ Advisory |
| **Gate score** | **2/3** |

---

## G9 — UX consistency

| Evidence | Status |
|----------|--------|
| Settings hub consolidates identity surfaces | ✅ PP-2 Package 2 |
| `/profile` redirects to settings hub | ✅ |
| Privacy tab in canonical hub | ✅ |
| **Gate score** | **3/3** |

---

## Total score

| Gates passed (≥2) | **24/27 (~89%)** |
| Evaluation posture | **READY FOR EVALUATION** → L3 WITH FINDINGS |
| Plain L3 | **Not targeted** |

---

**Last updated:** 2026-06-20 (Certification Preparation)
