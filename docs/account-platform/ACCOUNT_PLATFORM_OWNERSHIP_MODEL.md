# Account Platform — Ownership Model

**Program:** Account Platform Phase 0A — Reality Assessment & Domain Discovery  
**Date:** 2026-06-19  
**Status:** Discovery only — **proposed ownership** for Phase 0B charter; not enacted

---

## Ownership summary

Today, account-adjacent capabilities have **de facto owners** but **no constitutional ownership model**. The table below proposes **target ownership** under the Hybrid Account Platform program (Option C).

| Concern | Current owner (de facto) | Target owner | SoR | Notes |
|---------|--------------------------|--------------|-----|-------|
| **Personal identity** | Auth inline (`index.ts`) | **Account Platform — Identity slice** | `User` | Extract `profileService` |
| **Profile photos** | `profilePhotoController` | **Account Platform — Identity slice** | `UserProfilePhoto` + User FKs | Register Global Trash handler (gap) |
| **Member connections** | `memberController` | **Account Platform — Identity slice** | `Relationship` | Add PE on mutations (gap) |
| **Vssyl ID / location** | `locationService` | **Account Platform — Identity slice** | User location FKs | Admin-gated updates by design |
| **Generic user prefs** | `userPreferenceService` | **Account Platform — Preferences slice** | `UserPreference` | Requires key registry |
| **Privacy / consent / GDPR** | `privacyController` | **Account Platform — Security/Privacy slice** | Privacy models | Unify IA with settings hub |
| **Notification prefs** | Notification routes (3 backends) | **Account Platform — Settings slice** (delivery stays Notifications L2) | `UserPreference` + `PushSubscription` | Unify IA; delivery owned by Notifications platform |
| **Appearance / theme** | Frontend only | **Account Platform — Settings slice** | **TBD** — migrate from localStorage | Server-backed preference |
| **User auth / sessions** | `auth.ts` + `index.ts` | **Platform kernel** (Account Security slice) | JWT + `RefreshToken` | Extract from `index.ts` |
| **MFA** | **None** | **Account Platform — Security slice** | TBD schema | L0 today |
| **Business profile** | `businessProfileService` | **Business Administration (L3)** — **not Account Platform** | `Business` | Do not re-home |
| **Business workspace settings** | Business routes + workspace UI | **Business Administration + workspace shell** | `Business` + webhooks | Resolve triplication via portfolio Settings audit |
| **AI persona / autonomy** | AI route modules | **AI Platform** — **not Account Platform** | AI models | Cross-link from account settings IA only |
| **Dashboard layout** | `dashboard` routes | **Dashboard module (Wave 3)** | `Dashboard` JSON | Out of account scope |
| **Module configured JSON** | Per-module routes | **Each module owner** | `ModuleInstallation` | Account reads; modules write |
| **Core subscriptions** | `billingController` / services | **Account Platform — Billing slice** | `Subscription` | Thin controller target |
| **Module subscriptions** | `moduleSubscriptionService` | **Account Platform — Billing slice** | `ModuleSubscription` | App Store model |
| **Entitlements / feature gating** | `featureGatingService` | **Account Platform — Billing slice** | **Canonical tier SoR TBD** | Resolve `Business.tier` vs `Subscription` |
| **Stripe / payments** | `stripeService` | **Account Platform — Billing slice** | Stripe + DB mirror | Retire `/api/payment` |
| **AI query balance** | `aiQueryService` | **Billing slice** (metering) + **AI Platform** (consumption) | `AIQueryBalance` | Split read/write ownership |
| **Admin billing ops** | `adminBillingService` | **Admin Portal (L3)** | Admin views | Operator plane — not end-user account |
| **Admin security ops** | Admin Portal security | **Admin Portal (L3)** | `SecurityEvent` | User-facing security separate |

---

## Source-of-truth hierarchy (proposed)

### Identity

```
User (canonical personal identity)
  ├── UserProfilePhoto (avatar library)
  │     └── personalPhotoId / businessPhotoId (slot assignments)
  ├── Relationship (connections graph)
  └── UserPreference (non-identity KV only — not identity SoR)
```

**Anti-pattern today:** Legacy `personalPhoto`/`businessPhoto` URL strings parallel photo IDs.

### Preferences

```
UserPreference (generic KV — requires key registry)
  ├── notification_* keys (in-app)
  ├── email_* keys
  ├── ai_preferred_* keys (should migrate or cross-reference AI models)
  └── ad hoc keys (calendar, dashboard context, etc.)

Dedicated tables (not KV):
  ├── AIPersonalityProfile (AI Platform owned)
  ├── AIAutonomySettings (AI Platform owned)
  ├── PushSubscription (Settings/Billing adjacent)
  └── Dashboard.layout (Dashboard module owned)
```

### Settings

**No platform SoR today.** Settings are **projections** of underlying stores:

| Settings category | Underlying SoR | Hub today |
|-------------------|----------------|-----------|
| Account | `User` | `/profile/settings` |
| Photos | `UserProfilePhoto` | `/profile/settings` |
| Privacy | `UserPrivacySettings` | `/profile/analytics` ❌ split |
| Notifications | `UserPreference` / `PushSubscription` | `/notifications/settings` |
| AI | AI models | `/ai` |
| Billing | `Subscription` | `BillingModal` |
| Business | `Business` | workspace settings + profile overlap |

**Target:** Settings Platform owns **IA + API contract**; sub-domains own **domain SoR**.

### Billing & entitlements

**Dual SoR problem (must resolve in Phase 0B):**

| Source | Field | Used by |
|--------|-------|---------|
| `Subscription.tier` | `free`, `pro`, `business_basic`, ... | Stripe sync, billing UI |
| `Business.tier` | `free`, `standard`, `enterprise` | `subscriptionMiddleware`, HR gating |
| `FeatureGatingService` | Static catalog + tier checks | AI, modules, features API |
| `admin-override` | Manual tier set | Admin bypass |

**Proposed canonical SoR:** `Subscription` (+ `ModuleSubscription` for module entitlements) with `Business.tier` as **derived cache** or deprecated — **decision deferred to Phase 0B billing audit**.

### Security

```
Auth kernel (platform):
  ├── Password hash on User
  ├── RefreshToken rotation
  └── JWT claims

Privacy (account):
  ├── UserPrivacySettings
  ├── UserConsent
  └── DataDeletionRequest

Admin security (Admin Portal — separate):
  └── SecurityEvent, impersonation audit
```

---

## Write path ownership (constitutional target)

Per platform standards, account mutations should follow:

`authorize → execute → emit normalized activity → notify/realtime`

| Sub-domain | Current write pattern | Gap |
|------------|----------------------|-----|
| Profile name update | Inline Prisma in `index.ts` | No service; no activity event |
| Profile photos | Controller + storage | No Global Trash handler; partial activity |
| User preferences | `userPreferenceService` upsert | No key validation; no activity |
| Privacy | `privacyController` | No PE; limited activity |
| Billing subscriptions | Fat `billingController` | No PE; no normalized activity |
| Member connections | `memberController` | No PE on mutations |
| Auth password reset | `auth.ts` | Security event logging partial |

---

## Boundary rules (proposed)

1. **Business profile** mutations remain under **Business Administration** authorization patterns — Account Platform may **link** but not **own**.
2. **AI persona** data is **read-linked** from account settings IA; writes stay on **AI Platform** routes.
3. **Dashboard layout** reads/writes stay on **Dashboard module** — Account Platform does not absorb widget registry.
4. **Notification delivery** stays **Notifications platform** — Account Platform owns **preference keys and IA** only.
5. **Admin billing/security ops** stay **Admin Portal** — end-user account is separate surface.
6. **Entitlement checks** are **Billing slice** responsibility — modules call gating APIs; modules do not embed tier logic.

---

## Duplication register

| Duplication | Owners involved | Resolution owner |
|-------------|-----------------|------------------|
| Business settings triplication (profile / workspace / branding) | BA + workspace | Settings Platform audit (PP-2) |
| AI settings vs profile settings | AI Platform + Account | Settings IA charter |
| `/api/payment` vs `/api/billing` | Billing | Billing audit (PP-3) |
| `Business.tier` vs `Subscription.tier` | Billing + HR | Billing audit (PP-3) |
| `featureGatingService` + simplified variant | Billing | Billing audit |
| `useUserSettings` `/settings` vs per-key API | Account + shared UI | Identity/Settings audit |
| Theme localStorage vs settings placeholder | Account + frontend | Settings slice |
| Personal photo URL + photo ID | Identity | Identity audit (PP-1) |

---

## Related

- [ACCOUNT_PLATFORM_DOMAIN_MAP.md](./ACCOUNT_PLATFORM_DOMAIN_MAP.md)
- [ACCOUNT_PLATFORM_ARCHITECTURAL_RISK_MATRIX.md](./ACCOUNT_PLATFORM_ARCHITECTURAL_RISK_MATRIX.md)
- [PLATFORM_PORTFOLIO_REALITY_ASSESSMENT.md](../platform-portfolio/PLATFORM_PORTFOLIO_REALITY_ASSESSMENT.md) §A–C

**Last updated:** 2026-06-19 (Phase 0A)
