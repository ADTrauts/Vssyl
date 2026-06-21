# Account Platform — Composite G1–G9 Evidence Binder

**Program:** Account Platform — Umbrella Certification Preparation  
**Date:** 2026-06-20  
**Type:** Composite evaluation packet — governance compiled  
**Status:** **COMPLETE** — ready for evaluation authorization review

**Scoring model:** [ACCOUNT_PLATFORM_COMPOSITE_G1_G9_MODEL.md](./ACCOUNT_PLATFORM_COMPOSITE_G1_G9_MODEL.md)  
**Sub-program binders:** PP1 · PP2 · PP3 G1–G9 evidence binders

---

## Composite scorecard summary

| Metric | Value |
|--------|-------|
| **Umbrella composite (authoritative)** | **22/27 (~81%)** |
| **Trilogy mean (informational)** | **24/27 (~89%)** |
| **Blocking findings** | **0** |
| **Target certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Plain L3** | **Not appropriate** |

| Gate | PP-1 | PP-2 | PP-3 | Umbrella | Status |
|------|-----:|-----:|-----:|---------:|--------|
| G1 Authorization | 3 | 3 | 2 | **2** | PARTIAL |
| G2 Auditability | 2 | 3 | 3 | **2** | PARTIAL |
| G3 Service boundaries | 3 | 3 | 3 | **3** | PASS |
| G4 API coherence | 3 | 3 | 3 | **3** | PASS |
| G5 Ownership | 3 | 2 | 3 | **2** | PARTIAL |
| G6 Test evidence | 2 | 3 | 2 | **2** | PARTIAL |
| G7 Documentation | 3 | 3 | 3 | **3** | PASS |
| G8 Production safety | 2 | 3 | 2 | **2** | PARTIAL |
| G9 UX consistency | 3 | 3 | 1 | **2** | PARTIAL |
| **Total** | 24 | 26 | 23 | **22** | **L3 WF target** |

---

## G1 — Authorization (2/3)

### Evidence

| Evidence | Location | Slice | Status |
|----------|----------|-------|--------|
| Identity PE actions | `policyActions.ts` — `user:profile.*`, `user:privacy.*`, `user:photo.write`, `connection:*` | PP-1 | ✅ |
| Identity PE enforcement | `identityPolicyDual.ts` — profile, privacy, photo, connection services | PP-1 | ✅ |
| Settings PE actions | `settings:read`, `settings:update` | PP-2 | ✅ |
| Settings PE enforcement | `settingsService` via `assertIdentitySelfPolicy` | PP-2 | ✅ |
| Billing PE actions | `billing:read`, `billing:write` | PP-3 | ✅ |
| Billing PE enforcement | `billingPolicyDual.ts` → `billingService` | PP-3 | ✅ |
| Entitlement PE | `entitlementPolicyDual.ts` → `entitlementService` | PP-3 | ✅ |
| Admin tier authority | ADMIN-only `setBusinessTierAuthority` | PP-3 | ✅ |
| MFA disposition | [PP1_MFA_DISPOSITION_REVIEW.md](./PP1_MFA_DISPOSITION_REVIEW.md) | Cross-cut | ⚠️ M01 |

### Gaps (WITH FINDINGS)

| Gap | Finding | Severity |
|-----|---------|----------|
| Module subscription routes — JWT only | AP-UMB-M07 | Major partial |
| Auth credential plane — no PE | By design | Advisory |
| MFA not implemented | AP-UMB-M01 | Major — dispositioned |

**Gate verdict:** **2/3 PARTIAL** — no P0 authorization bypass.

---

## G2 — Auditability (2/3)

### Evidence

| Evidence | Location | Slice | Status |
|----------|----------|-------|--------|
| Identity module activity | `identityActivityService.ts` | PP-1 | ✅ |
| Preference domain event | `user.preference.updated` | PP-1/PP-2 | ✅ |
| Settings module activity | `settingsActivityService.ts` | PP-2 | ✅ |
| Settings domain events | `settings.updated`, `settings.theme.changed`, `settings.preference.changed` | PP-2 | ✅ |
| Billing activity (5 actions) | `billingActivityService.ts` | PP-3 | ✅ |
| Billing domain events (5) | `billingDomainEventService.ts` + registry | PP-3 | ✅ |
| Entitlement activity/events | `entitlementActivityService.ts` | PP-3 | ✅ |
| Emit on success only | All services — post-commit pattern | All | ✅ |

### Emit site inventory (lifecycle mutations)

| Operation | Identity | Settings | Billing | Entitlement |
|-----------|:--------:|:--------:|:-------:|:-----------:|
| Profile/name update | ✅ | — | — | — |
| Privacy update | ✅ | — | — | — |
| Photo mutate | ✅ | — | — | — |
| Connection mutate | ✅ | — | — | — |
| Settings bulk/pref update | — | ✅ | — | — |
| Theme change | — | ✅ | — | — |
| Sub create/update/cancel/resume | — | — | ✅ | — |
| Checkout sync | — | — | ✅ | ✅ cache |
| Admin tier override | — | — | — | ✅ |

### Gaps (WITH FINDINGS)

| Gap | Finding |
|-----|---------|
| Identity domain events not in registry | AP-UMB-ADV-05 |
| Invoice webhook activity | AP-UMB-M05 |
| Email notification writes silent | AP-UMB-ADV-10 |
| Auth security logging vs module activity | AP-UMB-ADV-06 |

**Gate verdict:** **2/3 PARTIAL** — lifecycle audit complete; invoice slice deferred.

---

## G3 — Service Boundaries (3/3)

### Evidence

| Service | Role | Artifact | Slice |
|---------|------|----------|-------|
| `authService` | Credential lifecycle | `services/account/authService.ts` | PP-1 |
| `profileService` | Profile mutations | `services/account/profileService.ts` | PP-1 |
| `profilePhotoService` | Photo library | `services/account/profilePhotoService.ts` | PP-1 |
| `privacyService` | Privacy/consent | `services/account/privacyService.ts` | PP-1 |
| `connectionService` | Social graph | `services/account/connectionService.ts` | PP-1 |
| `settingsService` | Settings orchestration | `services/account/settingsService.ts` | PP-2 |
| `preferenceRegistry` | Key contract | `services/account/preferenceRegistry.ts` | PP-2 |
| `notificationSettingsAdapter` | Notification delegate | `services/account/notificationSettingsAdapter.ts` | PP-2 |
| `billingService` | Subscription lifecycle | `services/account/billingService.ts` | PP-3 |
| `entitlementService` | Tier SoR | `services/account/entitlementService.ts` | PP-3 |

### Boundary checks

| Check | Result |
|-------|--------|
| Auth routes not in `index.ts` | ✅ |
| Settings controller thin | ✅ |
| Billing lifecycle via facade | ✅ |
| No cross-slice unauthorized writes | ✅ |
| Excluded domains documented | ✅ |

### Gap (noted, does not fail gate)

| Gap | Finding |
|-----|---------|
| Multer in photo controller | AP-UMB-M06 — partial |

**Gate verdict:** **3/3 PASS**

---

## G4 — API Coherence (3/3)

### Canonical API inventory

| Namespace | Routes | Client | Slice | Status |
|-----------|--------|--------|-------|--------|
| `/api/auth` | auth routes | NextAuth + proxy | PP-1 | ✅ |
| `/api/profile` | profile routes | Profile UI | PP-1 | ✅ |
| `/api/privacy` | privacy routes | Settings hub | PP-1 | ✅ |
| `/api/profile-photos` | photo routes | PhotoManager | PP-1 | ✅ |
| `/api/member` | member routes | Member UI | PP-1 | ✅ |
| `/api/settings` | bulk, sections, prefs | `useUserSettings` | PP-2 | ✅ |
| `/api/billing` | lifecycle, PM, invoices | `web/src/api/billing.ts` | PP-3 | ✅ |
| `/api/account/*` | entitlement reads | Platform consumers | PP-3 | ✅ |
| `/api/payment` (JWT) | 410 Gone | Retired | PP-3 | ✅ |
| `/api/payment/webhook` | Stripe webhook | Ops exception | PP-3 | ✅ documented |

### Convergence evidence

| Migration | Evidence |
|-----------|----------|
| Payment client → billing | `web/src/api/payment.ts` deprecated wrapper |
| Stripe helpers → billing | `web/src/lib/stripe.ts` |
| Module subscribe path | `POST /api/billing/modules/:moduleId/subscribe` |
| Retirement test | `paymentRouteRetired.test.ts` |

**Gate verdict:** **3/3 PASS**

---

## G5 — Ownership (2/3)

### Evidence

| Concern | SoR | Owner doc | Status |
|---------|-----|-----------|--------|
| Personal identity | `User` | PP1 ownership model | ✅ |
| Privacy | `UserPrivacySettings` | PP1 ownership model | ✅ |
| Settings orchestration | `settingsService` + registry | PP2 ownership model | ✅ |
| Tier authoritative | `Subscription.tier` | PP3 entitlement model | ✅ |
| Tier cache | `Business.tier` | PP3 — cache only | ✅ |
| Business profile | `Business` | BA L3 — excluded | ✅ |
| AI persona | AI models | AI Platform — excluded | ✅ |
| Dashboard layout | `Dashboard` | Wave 3 — excluded | ✅ |

### Gaps (WITH FINDINGS)

| Gap | Finding | Owner |
|-----|---------|-------|
| Business settings triplication | AP-UMB-M03 | BA |
| Tier vocabulary drift | AP-UMB-ACC-01 | PP-3 |

**Gate verdict:** **2/3 PARTIAL** — SoR coherent; cross-domain dedup advisory.

---

## G6 — Test Evidence (2/3)

### Trilogy test inventory

| Test file | Tests | Slice |
|-----------|------:|-------|
| `profileService.test.ts` | 2 | PP-1 |
| `userPreferenceService.test.ts` | 4 | PP-1 |
| `account-identity.integration.test.ts` | 2 | PP-1 |
| `preferenceRegistry.test.ts` | 6 | PP-2 |
| `settingsService.test.ts` | 4 | PP-2 |
| `settings.integration.test.ts` | 4 | PP-2 |
| `notificationSettingsAdapter.test.ts` | 2 | PP-2 |
| `settingsNavigationContract.test.ts` | 5 | PP-2 |
| `settingsHubInventory.test.ts` | 3 | PP-2 |
| `entitlementService.test.ts` | 11 | PP-3 |
| `account-entitlements.integration.test.ts` | 3 | PP-3 |
| `billingService.test.ts` | 4 | PP-3 |
| `payment-api-convergence.test.ts` | 1 | PP-3 |
| `paymentRouteRetired.test.ts` | 1 | PP-3 |
| `billingClient.test.ts` (web) | 4 | PP-3 |
| `stripeWebhookBilling.test.ts` | 1+ | PP-3 |
| **Trilogy scoped total** | **~57** | |

### Coverage assessment

| Slice | Matrix rows | Tests | Adequacy |
|-------|------------:|------:|----------|
| PP-1 | 37 | 8 | Partial — G6=2 at sub-domain |
| PP-2 | 26 | 24 | Strong — G6=3 |
| PP-3 | 47 | 25+ | Adequate WF — G6=2 at eval |
| Cross-cut integration | 12 | 0 dedicated | Gap — no umbrella E2E |

### Gaps

| Gap | Finding |
|-----|---------|
| No privacy/connection/auth integration suite | PP-1 G6 partial |
| No checkout E2E | AP-UMB-ADV-17 |
| No umbrella cross-slice integration test | Eval advisory potential |

**Gate verdict:** **2/3 PARTIAL** — adequate for L3 WITH FINDINGS.

---

## G7 — Documentation (3/3)

### Document index (trilogy + umbrella)

| Category | Count | Key artifacts |
|----------|------:|---------------|
| Phase 0A discovery | 6 | Domain map, ownership model, reality assessment |
| PP-1 architecture + cert | 12+ | Phase 1 arch, re-audit, eval, ratification |
| PP-2 architecture + cert | 14+ | Registry spec, API contract, Package 2 IA |
| PP-3 architecture + cert | 18+ | Entitlement, billing, client migration, Stripe |
| Umbrella planning | 6 | Certification plan, unified matrix, G1–G9 model |
| Umbrella preparation | 5 | This binder cycle |
| **Total Account Platform docs** | **60+** | |

### Umbrella-specific documentation

| Document | Status |
|----------|--------|
| Unified operation matrix | ✅ |
| Composite G1–G9 model | ✅ |
| Umbrella findings strategy | ✅ |
| Matrix validation | ✅ |
| Composite evidence binder | ✅ (this doc) |

**Gate verdict:** **3/3 PASS**

---

## G8 — Production Safety (2/3)

### Evidence

| Control | Evidence | Slice |
|---------|----------|-------|
| JWT auth on protected routes | `authenticateJWT` middleware | PP-1 |
| Password hashing (bcrypt ≥10) | `authService` | PP-1 |
| Refresh token rotation | `tokenUtils` | PP-1 |
| Registry validation on settings writes | `preferenceRegistry` | PP-2 |
| Stripe webhook raw body + signature | `index.ts` + `paymentController` | PP-3 |
| Tier bypass via cache alone | Closed — F04 | PP-3 |
| Payment API retirement safe | 410 + deprecation headers | PP-3 |
| Multi-tenant scoping | dashboardId + businessId context | All |

### Gaps (WITH FINDINGS)

| Gap | Finding |
|-----|---------|
| MFA not implemented | AP-UMB-M01 — dispositioned |
| Tier vocabulary edge cases | AP-UMB-ACC-01 |
| Session revoke UX | AP-UMB-ADV-01 |

**Gate verdict:** **2/3 PARTIAL** — production-viable; MFA dispositioned.

---

## G9 — UX Consistency (2/3)

### Evidence

| Surface | Evidence | Slice | Status |
|---------|----------|-------|--------|
| Personal settings hub | `/profile/settings` — 8 sections | PP-2 | ✅ |
| Hub consolidation 6→2 | Package 2 IA | PP-2 | ✅ |
| Privacy in canonical hub | Settings tab | PP-2 | ✅ |
| Identity profile UX | `/profile` → settings redirect | PP-1/PP-2 | ✅ |
| Billing modal functional | `PaymentModal`, checkout flows | PP-3 | ✅ |
| Dedicated billing dashboard | **Missing** | PP-3 | ❌ M02 |
| Settings billing tab IA | Modal embed only | PP-2/PP-3 | ⚠️ P |
| Business settings triplication | BA duplicate surfaces | PP-2 ref | ⚠️ M03 |

### G9 compensation rule applied

PP-3 sub-domain G9=1 (FAIL) compensated to umbrella G9=2 because PP-1/PP-2 UX coherence is strong and billing is functional within modal scope.

**Gate verdict:** **2/3 PARTIAL** — plain L3 blocked by M02.

---

## Composite total

| Gates ≥2 | **9/9** |
| Gates at 3 | **3** (G3, G4, G7) |
| Gates at 2 | **6** (G1, G2, G5, G6, G8, G9) |
| Gates at 1 | **0** at umbrella (PP-3 G9 compensated) |
| **Composite score** | **22/27 (~81%)** |
| **Certification posture** | **READY FOR EVALUATION AUTHORIZATION** |

---

**Last updated:** 2026-06-20 (Umbrella Certification Preparation)
