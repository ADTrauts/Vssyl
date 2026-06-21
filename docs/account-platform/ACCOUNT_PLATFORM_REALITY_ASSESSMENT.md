# Account Platform — Reality Assessment

**Program:** Account Platform Phase 0A — Reality Assessment & Domain Discovery  
**Assessment date:** 2026-06-19  
**Status:** Discovery only — **no implementation, certification, or ledger changes**

**Scope:** Identity, Profile, Photos/Avatars, Preferences, Settings, Billing, Subscriptions, Entitlements, Account Security, Privacy, Notification Preferences, Appearance/Personalization

**Constraint:** Workspace shell certification is **complete** (WS-L3 WITH FINDINGS). **Dashboard module** remains a **separate** platform surface — not part of this assessment's product scope except where layout prefs overlap.

---

## Executive finding

Vssyl does **not** today operate a named, bounded **Account Platform** runtime domain. Instead, account-adjacent capabilities exist as **overlapping subsystems** sharing `User`, `UserPreference`, and JWT auth substrate but lacking:

- A unified ownership model
- A canonical settings API contract
- A consolidated profile service
- A single entitlement source of truth
- Constitutional audits or ledger rows

**Recommendation:** **Option C — Hybrid** (see §F). Treat **Account Platform** as a **governance and modernization program umbrella** with **distinct certifiable sub-domains** (Identity, Settings, Billing) plus **cross-cutting slices** (Security, Preferences) — not a single monolithic product module on day one.

---

## A. Identity & Profile

### Inventory

| Layer | Artifacts |
|-------|-----------|
| **User model** | `prisma/modules/auth/user.prisma` — `name`, `email`, `password`, `role`, `image`, legacy photo URLs, `personalPhotoId`/`businessPhotoId`, `userNumber`, location FKs, `stripeCustomerId`, `lastActiveAt` |
| **Photo library** | `UserProfilePhoto` — `prisma/modules/auth/profile-photos.prisma`; crop, rotation, `trashedAt`; GCS via `storageService` |
| **Generic metadata** | `UserPreference` KV store — no schema registry |
| **Privacy row** | `UserPrivacySettings`, `UserConsent`, `DataDeletionRequest` |
| **Contacts graph** | `Relationship` model (member connections) — not a `Contact` entity |
| **Colleague pins** | `PinnedColleague`, `BusinessFollow` |
| **Vssyl ID** | `Country`/`Region`/`Town`/`UserSerial` numbering |

### APIs

| Route | Handler | Notes |
|-------|---------|-------|
| `GET/PUT /api/profile` | Inline in `server/src/index.ts` | Name only; direct Prisma |
| `GET/PUT /api/user/preferences/:key` | `user.ts` → `userPreferenceService` | Per-key KV |
| `GET /api/user/search` | `userController` | User discovery |
| `/api/profile-photos/*` | `profilePhotoController` | Upload, assign, serve, trash |
| `/api/location/*` | `locationService` | Read-only user location |
| `/api/member/connections*` | `memberController` | Social graph |
| `/api/privacy/*` | `privacyController` | GDPR-style controls |

### UI

| Surface | Path |
|---------|------|
| Legacy profile edit | `/profile` |
| Profile settings hub | `/profile/settings` (account, photos, location, preferences tabs) |
| Privacy | `/profile/analytics` + `PrivacySettings.tsx` |
| Photo manager | `ProfilePhotoManager.tsx` |
| Connections | `/member` |
| Avatar menu entry | `AvatarContextMenu.tsx` |
| Business profile | `/business/[id]/profile` — **Business Administration domain** (L3) |

### Ownership & source of truth

| Concern | SoR | Owner (de facto) | Maturity |
|---------|-----|------------------|----------|
| Personal identity fields | `User` | Auth / platform kernel (fragmented) | **L1** |
| Avatar slots | `UserProfilePhoto` + User FKs | Profile photos controller | **L1–L2** |
| Contacts | `Relationship` | Member subsystem | **L1** |
| Business identity | `Business` | Business Administration (`businessProfileService`) | **L2** — **out of Account Platform scope** |
| AI persona | `AIPersonalityProfile`, AI routes | AI Platform | **L2** — parallel identity track |

**Gap:** No canonical `profileService`; `/api/profile` lives in `index.ts` beside auth routes.

---

## B. Preferences & Personalization

### Inventory by persistence model

| Category | Persistence | Access |
|----------|-------------|--------|
| Generic user prefs | DB `UserPreference` | `/api/user/preferences/:key` |
| AI provider/model | `UserPreference` keys | `/api/ai/preferences` |
| AI personality | `AIPersonalityProfile` JSON | `/api/ai/personality/profile` |
| AI autonomy | `AIAutonomySettings` | `/api/ai/autonomy/settings` |
| AI context/memory | `UserAIContext`, `UserMemoryFact` | `/api/ai/user-context`, `/api/ai/memory/facts` |
| In-app notifications | `UserPreference` (`notification_*`) | `/api/notifications/preferences` |
| Email notifications | `UserPreference` (`email_*`) | `/api/email-notifications/preferences` |
| Push | `PushSubscription` | `/api/push-notifications/subscriptions` |
| Quiet hours / DND | `UserPreference` JSON strings | `/api/notifications/quiet-hours` |
| **Appearance / theme** | **localStorage only** | `useTheme.ts`, `AvatarContextMenu` |
| Dashboard layout | `Dashboard.layout`, `Dashboard.preferences` | `/api/dashboard/*` — **Dashboard module scope** |
| Sidebar config | Per-dashboard DB | `/api/dashboard/:id/sidebar-config` |
| Last active dashboard | `UserPreference` | `DashboardContext` |
| Calendar visibility | DB + localStorage fallback | `CalendarContext` |
| Business front page | `UserFrontPageCustomization` | `/api/business-front/*` |
| Module config | `ModuleInstallation.configured` JSON | `/api/modules` |
| Scheduling drafts | localStorage | `ScheduleBuilderVisual` |

### Duplication & ownership issues

| Issue | Severity |
|-------|----------|
| **Three notification preference backends** (in-app KV, email KV, push table) | Medium |
| **Theme client-only** while profile settings lists "theme coming soon" | Medium |
| **AI prefs isolated** at `/ai` — 7+ route modules | Medium |
| **`useUserSettings` → `/settings` bulk API documented but not mounted** | **High** |
| **Calendar/scheduling localStorage fallbacks** alongside DB | Medium |
| **No preference key registry** on `UserPreference` | High |

**Ownership:** Preferences are **cross-cutting** — Account Platform owns generic KV and notification key conventions; AI Platform owns persona/autonomy; Dashboard owns layout JSON; modules own `configured` blobs.

---

## C. Settings Platform

### Settings hubs (user-facing)

| # | Hub | Web path | API backbone |
|---|-----|----------|--------------|
| 1 | Profile settings | `/profile/settings` | `/api/profile`, photos, location, preferences |
| 2 | Legacy profile | `/profile` | `/api/profile` |
| 3 | Privacy & analytics | `/profile/analytics` | `/api/privacy/*` |
| 4 | AI Identity Control Center | `/ai` | 7+ AI route modules |
| 5 | Notification settings | `/notifications/settings` | notifications, email, push APIs |
| 6 | Theme (avatar menu) | `AvatarContextMenu` | **None** (localStorage) |
| 7 | Billing modal | `BillingModal` | `/api/billing/*` |
| 8 | Business workspace settings | `/business/[id]/workspace/settings` | `/api/business/*` |
| 9 | Business profile (overlap) | `/business/[id]/profile` | Same business APIs |
| 10 | Business branding | `/business/[id]/branding` | Business branding APIs |
| 11 | Webhooks | `/business/[id]/workspace/settings/webhooks` | webhook routes |
| 12 | Module settings | Module panels, HR editors | `/api/modules`, `/api/hr/admin/settings` |
| 13 | Place privacy | `PlacePrivacySettings` | `/api/place/settings` |
| 14 | Member connections | `/member` | `/api/member/*` |

**Count:** **12–14** distinct user-facing settings entry points; **~20+** API route families; **no** `/api/settings` platform namespace.

### Architectural drift

| Drift signal | Evidence |
|--------------|----------|
| Memory Bank documents `/settings` bulk API | `memory-bank/settingsProductContext.md` — not implemented |
| `shared/src/components/useUserSettings.ts` calls missing `/settings` | Client/server contract break |
| Privacy not in profile settings IA | Split across `/profile/analytics` |
| Business settings triplication | profile + workspace/settings + branding |
| HR settings href 404 | `/business/[id]/admin/hr/settings` linked but page missing |
| Business workspace "Enable 2FA" UI | No backend MFA |

### Maturity

**L1** — functional but fragmented. No operation matrix. No cross-cutting ownership model.

---

## D. Billing & Commerce

### Inventory

| Capability | Routes / services | Models |
|------------|-------------------|--------|
| Core subscriptions | `/api/billing/subscriptions*` | `Subscription` |
| Module subscriptions | `/api/billing/modules*` | `ModuleSubscription` |
| Legacy payment | `/api/payment/*` | `paymentController`, `paymentService` |
| Stripe webhooks | `POST /api/payment/webhook` | `stripeService`, `moduleSubscriptionService` |
| Feature gating | `/api/feature-gating`, `/api/features` | `featureGatingService` (+ simplified variant) |
| Pricing admin | `/api/pricing` | `PricingConfig`, `PriceChange` |
| Usage metering | `/api/usage`, billing usage routes | `UsageRecord` |
| AI query packs | `/api/ai/queries` | `AIQueryBalance`, `AIQueryPurchase` |
| Developer revenue | `/api/developer`, billing developer routes | `DeveloperRevenue` |
| Admin billing ops | `/api/admin-portal/billing/*` | `adminBillingService` |
| Tier override | `/api/admin-override` | Bypass payment for business tier |

### Platform capability vs product module

| Classification | Rationale |
|----------------|-----------|
| **Platform capability** | Subscriptions, entitlements, Stripe, usage, AI query balance gate AI/HR/modules platform-wide |
| **Not a product module** | No `moduleId`; no workspace landing; modal-driven UX |
| **Admin-adjacent** | Certified Admin Portal includes billing analytics ops — partial coverage only |

### Dependency graph (summary)

```
Stripe → Subscription/ModuleSubscription → FeatureGatingService
                                        → hrFeatureGating (HR routes)
                                        → AI routes (feature + query balance)
                                        → Module enterprise UI (useFeatureGating)
                                        → platformCronJobs (overage, revenue split)
Business.tier (parallel SoR) ──────────→ HR tier checks
```

### Tier vocabulary drift (critical debt)

| Source | Enum values |
|--------|-------------|
| `Subscription.tier` | `free`, `pro`, `business_basic`, `business_advanced`, `enterprise` |
| `Business.tier` / `subscriptionMiddleware` | `free`, `standard`, `enterprise` |
| `billing.ts` create validation | `free`, `standard`, `enterprise` |
| `FeatureGatingService` | `free`, `pro`, `business_basic`, `business_advanced`, `enterprise` |

### Maturity & certification readiness

| Signal | Rating |
|--------|--------|
| Backend services | **L2** — Stripe, webhooks, services, some tests |
| End-user UX | **L1** — modal-only; no billing dashboard |
| Constitutional alignment | **Low** — no PE on writes; no normalized activity |
| Audit / operation matrix | **None** |
| Ledger row | **None** |
| Portfolio rank | **PP-3** — Billing platform audit |

---

## E. Security & Privacy

### Inventory

| Capability | Implementation | Maturity |
|------------|----------------|----------|
| Registration / login | `server/src/auth.ts`, Passport local, bcrypt ≥10 | **L2** |
| JWT access (24h) | `issueJWT`, `authenticateJWT` | **L2** |
| Refresh tokens | `RefreshToken` model, rotation | **L2** |
| Password reset | `PasswordResetToken`, email flow | **L2** |
| Email verification | `EmailVerificationToken` | **L2** |
| **MFA / 2FA** | **Not implemented** | **L0** |
| Session revocation UI | Password reset clears refresh tokens only | **L1** |
| Impersonation | Admin header + `AdminImpersonation` | **L3-adjacent** (Admin Portal) |
| Privacy settings | `UserPrivacySettings` + `/api/privacy/*` | **L1–L2** |
| Consent / GDPR | `UserConsent`, deletion requests, export | **L1–L2** |
| Collective AI learning opt-in | Privacy + `collectiveLearningConsent.ts` | **L2** |
| Business SSO config | `/api/sso/*` — workforce, not platform login | **L1** |
| Security events | `SecurityService`, Admin Portal security routes | **L2–L3** (admin ops) |

### Ownership

| Concern | Owner |
|---------|-------|
| Auth kernel | Platform Engineering — inline in `index.ts` + `auth.ts` |
| User privacy API | Privacy controller — fragmented from settings IA |
| Admin security ops | Admin Portal (certified L3) |
| Account security UX (password change, sessions, MFA) | **Missing product owner** |

---

## F. Account Ecosystem Topology

### Option A — Three independent domains

```
Identity & Profile  |  Settings Platform  |  Billing & Commerce
     (separate audits, separate ledger rows, no shared program)
```

**Pros:** Respects different maturity (Billing L2 backend vs Identity L1); avoids big-bang.  
**Cons:** Perpetuates shared-substrate drift (`User`, `UserPreference`); no IA coherence; portfolio already chains Identity → Settings → Billing.

### Option B — Single unified Account Platform domain

```
Account Platform
├─ Identity
├─ Profile
├─ Preferences
├─ Settings
├─ Billing
├─ Entitlements
└─ Security
```

**Pros:** Single certification narrative; unified settings hub target.  
**Cons:** Over-merges certified adjacent domains (Business Administration profile, AI identity, Dashboard layout); unrealistic single operation matrix; Billing backend ready before Identity/Settings.

### Option C — Hybrid (recommended)

```
Account Platform (governance program + eventual platform capability row)
├─ Sub-domain: Identity & Profile        (PP-1 — certifiable slice)
├─ Sub-domain: Settings Platform         (PP-2 — certifiable slice)
├─ Sub-domain: Billing & Commerce        (PP-3 — certifiable slice)
├─ Cross-cutting: Security & Privacy     (auth kernel + privacy API — spans sub-domains)
├─ Cross-cutting: Preferences            (KV registry — spans Account + AI + Dashboard)
└─ Explicit exclusions:
    · Business profile → Business Administration (L3)
    · AI persona/autonomy → AI Platform (deferred L3)
    · Dashboard layout → Dashboard module (Wave 3)
    · Module configured JSON → per-module ownership
```

**Council recommendation:** **Option C — Hybrid.**

- **Program umbrella:** "Account Platform" for discovery, audits, IA targets, and eventual ledger **platform capability** row(s).
- **Certification units:** Phased sub-domain certifications (Identity capability, Settings capability, Billing capability) — not one monolithic L3 on day one.
- **Dependency order:** Identity → Settings → Billing (portfolio PP-1 → PP-2 → PP-3).

---

## G. Certification Outlook

| Sub-domain | Current maturity | Readiness | Likely path |
|------------|------------------|-----------|-------------|
| **Identity & Profile** | L1 | **Low** | Phase 0B audit → operation matrix → L2 hardening → platform capability L3 WITH FINDINGS |
| **Settings Platform** | L1 | **Low** | Phase 0B audit → IA charter → API contract (`/settings` resolution) → L3 WITH FINDINGS |
| **Billing & Commerce** | L2 backend / L1 UX | **Medium backend / Low UX** | Phase 0B audit → retire `/payment` → tier SoR → PE/activity → platform capability L3 WITH FINDINGS |
| **Security (user-facing)** | L1–L2 ops / L0 MFA | **Low** | Bundled with Identity sub-domain; MFA is plain-L3 blocker |
| **Entitlements** | L2 (fragmented SoR) | **Medium** | Subordinate to Billing audit; tier enum canonicalization first |
| **Preferences (cross-cutting)** | L1 KV | **Low** | Key registry + notification unification under Settings |

**No certification execution in Phase 0A.** No ledger updates.

**Earliest realistic platform row:** Q1 2027 per portfolio roadmap — after Phase 0B audits and implementation charters for Identity + Settings; Billing may trail or parallel depending on tier-drift remediation.

---

## Related deliverables

| Document | Purpose |
|----------|---------|
| [ACCOUNT_PLATFORM_DOMAIN_MAP.md](./ACCOUNT_PLATFORM_DOMAIN_MAP.md) | Topology and boundaries |
| [ACCOUNT_PLATFORM_OWNERSHIP_MODEL.md](./ACCOUNT_PLATFORM_OWNERSHIP_MODEL.md) | Ownership and SoR |
| [ACCOUNT_PLATFORM_ARCHITECTURAL_RISK_MATRIX.md](./ACCOUNT_PLATFORM_ARCHITECTURAL_RISK_MATRIX.md) | Risk scoring |
| [ACCOUNT_PLATFORM_CERTIFICATION_READINESS.md](./ACCOUNT_PLATFORM_CERTIFICATION_READINESS.md) | Gate posture |
| [ACCOUNT_PLATFORM_EXECUTIVE_SUMMARY.md](./ACCOUNT_PLATFORM_EXECUTIVE_SUMMARY.md) | Executive brief + 15 questions |

**Last updated:** 2026-06-19 (Phase 0A)
