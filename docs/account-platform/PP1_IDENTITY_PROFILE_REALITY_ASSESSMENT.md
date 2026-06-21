# PP-1 — Identity & Profile Reality Assessment

**Program:** Account Platform Phase 0B-1 — Identity & Profile Platform Audit  
**Assessment date:** 2026-06-19  
**Authority:** Account Platform Phase 0A (Hybrid Option C)  
**Status:** Constitutional audit — discovery only

**Prior baseline:** [ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md](./ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md)

**Excluded:** Business profile (BA L3) · AI personality (AI Platform) · Billing/entitlements (PP-3) · Dashboard layout · Workspace persistence

---

## Executive finding

**Identity** and **Profile** are **not coherent platform capabilities** today. They are **kernel-adjacent subsystems** with functional auth and photo pipelines but **no constitutional boundary**, **no profile service**, and **heavy inline routing** in `server/src/index.ts`.

**Profile** is weaker than **Identity** at the service layer — name updates are inline Prisma; photos are controller-centric (~750 LOC) without service extraction or Global Trash registration.

**Recommendation:** PP-1 modernization requires **mandatory service extraction** before certification evaluation. Target outcome: **Identity & Profile platform capability L3 WITH FINDINGS** (not plain L3 on first pass).

---

## A. Identity Architecture

### Models

| Model | File | Role |
|-------|------|------|
| `User` | `prisma/modules/auth/user.prisma` | Core identity + credentials + legacy photo URLs |
| `RefreshToken` | same | Session refresh (7-day) |
| `PasswordResetToken` | same | Recovery (1-hour) |
| `EmailVerificationToken` | same | Email verify (1-day) |
| `Country` / `Region` / `Town` / `UserSerial` | same | Vssyl ID numbering |

### Services & middleware

| Component | Path | Role |
|-----------|------|------|
| `auth.ts` | `server/src/auth.ts` | Passport local, `issueJWT`, `registerUser` |
| `authenticateJWT` | `server/src/middleware/auth.ts` | JWT verify, user load, impersonation header |
| `tokenUtils.ts` | `server/src/utils/tokenUtils.ts` | Refresh/password/email token CRUD |
| `userNumberService` | `server/src/services/userNumberService.ts` | Vssyl ID generation |
| `geolocationService` | `server/src/services/geolocationService.ts` | Registration location detect |
| `securityService` | `server/src/services/securityService.ts` | Security event logging |

### Auth routes (inline `index.ts`)

| Route | Flow | Service boundary |
|-------|------|------------------|
| `POST /api/auth/register` | `registerUser()` | **Inline handler** — not extracted |
| `POST /api/auth/login` | Passport → JWT + refresh | **Inline** |
| `POST /api/auth/refresh` | `validateRefreshToken` rotate | **Inline** |
| `POST /api/auth/forgot-password` | Create reset token + email | **Inline** |
| `POST /api/auth/reset-password` | Validate token, hash password, clear refresh tokens | **Inline** |
| `POST /api/auth/verify-email` | Token validation | **Inline** |
| `POST /api/auth/resend-verification` | Token + email | **Inline** |

### Frontend auth

| Surface | Path |
|---------|------|
| Login / register | `web/src/app/auth/*` |
| NextAuth proxy | `web/src/app/api/auth/[...nextauth]/route.ts` |
| Session refresh | `web/src/app/refresh-session/page.tsx` |
| Client auth | `web/src/lib/auth.ts` |

### Ownership & SoR

| Concern | SoR | Owner (target) |
|---------|-----|----------------|
| Credentials | `User.password`, `User.email` | **Identity slice** |
| JWT claims | `sub`, `email`, `role` (24h) | **Platform auth kernel** |
| Refresh sessions | `RefreshToken` | **Identity / Security slice** |
| Vssyl ID | `User.userNumber` + location FKs | **Identity slice** |
| Role | `User.role` | **Identity slice** (admin role also Admin Portal ops) |

### Maturity: **L1–L2**

- **L2 signals:** bcrypt ≥10, refresh rotation, password reset clears sessions, security event logging on auth failures, schema-fallback login query
- **L1 gaps:** All auth routes in `index.ts`; no `authService`; no MFA; no account security UX; no normalized activity on registration

---

## B. Profile Architecture

### Routes & handlers

| Route | Handler | Pattern |
|-------|---------|---------|
| `GET /api/profile` | `index.ts` inline | Returns `req.user` subset |
| `PUT /api/profile` | `index.ts` inline | Direct `prisma.user.update` (name only) |
| `GET /api/user/search` | `userController.searchUsers` | Direct Prisma |
| `GET/PUT /api/user/preferences/:key` | `userController` | `userPreferenceService` |
| `/api/profile-photos/*` | `profilePhotoController` | Direct Prisma + `storageService` + sharp |
| `GET /api/location/user-location` | `locationService` | Read-only user location |
| `/api/member/*` | `memberController` | Connections graph (~1900 LOC controller) |

### Photo / avatar pipeline

| Stage | Implementation |
|-------|----------------|
| Upload | Multer → sharp avatar rendition → GCS/local via `storageService` |
| Library | `UserProfilePhoto` with `trashedAt` soft delete |
| Slot assignment | `personalPhotoId` / `businessPhotoId` on User |
| Legacy compat | `personalPhoto` / `businessPhoto` URL strings retained |
| Serve | Authenticated `/api/profile-photos/serve/:photoId` |

**Gaps:** No `profilePhotoService`; no Global Trash handler registration; no module activity events; controller holds business logic.

### Social / profile features

| Feature | Model | API | PE on writes |
|---------|-------|-----|--------------|
| Connections | `Relationship` | `/api/member/connections*` | **No** on connection mutations |
| Pinned colleagues | `PinnedColleague` | member routes | Partial (business member PE elsewhere) |
| User search | `User` | `/api/user/search`, member search | N/A read |

### UI

| Surface | Path |
|---------|------|
| Profile settings hub | `/profile/settings` (account read-only, photos, location, placeholder preferences) |
| Legacy profile | `/profile` (name edit) |
| Photo manager | `ProfilePhotoManager.tsx` |
| Avatar menu | `AvatarContextMenu.tsx` |
| Connections | `/member` |

### Maturity: **L1 personal**

- Photos **L1–L2** (strong pipeline, weak governance)
- No consolidated profile capability; business profile **L2** under BA (excluded)

---

## C. Preferences & User Settings (PP-1 slice)

### UserPreference substrate

| Consumer | Key pattern | API |
|----------|-------------|-----|
| Generic KV | Ad hoc | `/api/user/preferences/:key` |
| Notifications | `notification_{category}_{channel}` | `/api/notifications/preferences` (direct Prisma in controller) |
| Email notifications | `email_*` | `/api/email-notifications/preferences` |
| Quiet hours / DND | JSON in KV | `/api/notifications/quiet-hours`, `/do-not-disturb` |
| AI provider prefs | `ai_preferred_*` | `/api/ai/preferences` (**AI Platform**) |
| Dashboard context | `lastActiveDashboardId` | Client via user prefs |

**Only generic KV writes emit domain event:** `emitUserPreferenceUpdatedEvent` in `userController` — notification prefs **do not**.

### Overlap with PP-2 Settings Platform

| Data | PP-1 owns (Identity) | PP-2 owns (Settings) |
|------|----------------------|----------------------|
| Generic `UserPreference` keys | **Registry + validation** | **IA hub + bulk API contract** |
| Notification prefs | **Key schema** (with Notifications platform) | **Settings hub placement** |
| Theme / appearance | — | **PP-2** (localStorage today) |
| Privacy settings | **Security/Privacy slice** (dedicated table) | **IA unification** |

---

## D. Security Surface

| Capability | Status | Notes |
|------------|--------|-------|
| Password registration/login | ✅ | bcrypt, Passport |
| Password reset | ✅ | Token + email; clears refresh tokens |
| Email verification | ✅ | Token flow |
| Refresh token rotation | ✅ | 7-day DB tokens |
| JWT access | ✅ | 24h |
| **MFA / 2FA** | ❌ **L0** | No schema, no routes; misleading business settings UI |
| **Password change (logged-in)** | ❌ | No dedicated surface/API found |
| **Active session list / revoke** | ❌ | Only bulk clear on password reset |
| **Device trust** | ❌ | Not implemented |
| Privacy controls | ✅ API | `privacyController` — no PE, no activity |
| Consent / GDPR | ✅ API | Deletion requests, export (partial) |
| Collective AI learning opt-in | ✅ | Privacy setting + consent type |
| Impersonation | ✅ | Admin Portal — out of PP-1 user scope |

### Certification implications

- **Plain L3 blocker:** MFA for business-tier security promises
- **WITH FINDINGS acceptable:** MFA deferred with documented gap if UI misleading text removed

---

## E. API & Route Audit Summary

### Identity + profile route inventory

| Namespace | Routes | Inline Prisma | Inline auth | Controller | Service |
|-----------|--------|---------------|-------------|------------|---------|
| `/api/auth/*` | 7 | Yes (handlers) | Yes | No | Partial (`auth.ts`) |
| `/api/profile` | 2 | Yes | JWT middleware | No | **None** |
| `/api/user` | 3 | Partial | JWT | `userController` | `userPreferenceService` |
| `/api/profile-photos` | 6 | Yes | Mixed | `profilePhotoController` | `storageService` only |
| `/api/location` | 4 | No | Partial | Router inline | `locationService` |
| `/api/member` | 15+ | Yes | JWT | `memberController` | Notifications on some paths |
| `/api/privacy` | 7 | Yes | JWT (router mount) | `privacyController` | **None** |
| `/api/notifications/preferences` | 4 | Yes | JWT | `notificationController` | **None** |
| `/api/email-notifications` | prefs | Yes | JWT | email controller | **None** |
| `/api/push-notifications` | subs | Yes | JWT | push controller | **None** |

### Constitutional compliance gaps

| Pattern | Status |
|---------|--------|
| `authorize → execute → activity` | **Fails** on profile, photos, privacy, connections, notification prefs |
| Policy Engine on writes | **Fails** on profile, photos, privacy, connections |
| Thin controllers | **Fails** — photos, member, privacy, notifications |
| Tenant scoping | **Pass** — userId-scoped (personal account) |
| Service layer per mutation domain | **Fails** — majority inline |

### Extraction requirements (mandatory for PP-1 modernization)

1. `authRouteModule` — move `/api/auth/*` from `index.ts`
2. `profileService` — name, read projection, profile aggregate
3. `profilePhotoService` — upload, assign, trash, serve
4. `privacyService` — settings, consent, deletion, export
5. `memberConnectionService` — relationship mutations (subset of member controller)
6. `notificationPreferenceService` — unify KV writes + events (coordinate Notifications platform)

---

## F. Ownership Model (authoritative PP-1 boundaries)

See [PP1_IDENTITY_PROFILE_OWNERSHIP_MODEL.md](./PP1_IDENTITY_PROFILE_OWNERSHIP_MODEL.md).

| Domain | Owns |
|--------|------|
| **Identity** | Credentials, email, role, JWT/session substrate, Vssyl ID, registration/login/recovery |
| **Profile** | Personal display name, photo library, slot assignments, connections graph, user search |
| **Settings (PP-2)** | Settings hub IA, bulk API contract, theme server backing, cross-hub navigation |
| **Business Administration** | Business entity profile, org branding, business settings writes with PE |

**Privacy** and **account security UX** are **Identity program slices** (Security/Privacy) — Settings owns **placement in hub IA** only.

---

## G. Certification Outlook

| Metric | Estimate |
|--------|----------|
| G1–G9 (today) | **~12–14/27 (~44–52%)** |
| Likely first award | **L3 WITH FINDINGS** at ~18–22/27 after PP-1 implementation |
| Plain L3 blockers | MFA, service layer, PE on mutations, activity events, operation matrix C-rows |
| Reference potential | **Reference Candidate — Identity Foundation** (post-L3) — not L4 |

See [PP1_IDENTITY_PROFILE_CERTIFICATION_READINESS.md](./PP1_IDENTITY_PROFILE_CERTIFICATION_READINESS.md).

---

## Related deliverables

| Document | Purpose |
|----------|---------|
| [PP1_IDENTITY_PROFILE_OPERATION_MATRIX.md](./PP1_IDENTITY_PROFILE_OPERATION_MATRIX.md) | Operation-level audit |
| [PP1_IDENTITY_PROFILE_SERVICE_BOUNDARY_ANALYSIS.md](./PP1_IDENTITY_PROFILE_SERVICE_BOUNDARY_ANALYSIS.md) | Service extraction map |
| [PP1_IDENTITY_PROFILE_EXECUTIVE_SUMMARY.md](./PP1_IDENTITY_PROFILE_EXECUTIVE_SUMMARY.md) | 15 questions |

**Last updated:** 2026-06-19 (Phase 0B-1)
