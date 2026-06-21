# Account Platform — Unified Operation Matrix

**Program:** Account Platform — Umbrella Certification Planning  
**Date:** 2026-06-20  
**Status:** **AUTHORITATIVE** for umbrella evaluation — merged from trilogy re-audits  
**Type:** Governance matrix — no runtime validation in this session

**Sources:**

- [PP1_OPERATION_MATRIX_REAUDIT.md](./PP1_OPERATION_MATRIX_REAUDIT.md) (2026-06-20)
- [PP2_OPERATION_MATRIX_REAUDIT.md](./PP2_OPERATION_MATRIX_REAUDIT.md) (2026-06-20)
- [PP3_OPERATION_MATRIX_REAUDIT.md](./PP3_OPERATION_MATRIX_REAUDIT.md) (2026-06-20)

**Supersedes for umbrella lens:** Phase 0B discovery matrices as primary eval basis — re-audits remain authoritative per sub-domain.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — constitutional owner, PE/activity where required |
| **P** | Partial — functional; documented gap |
| **N** | Non-compliant or missing |
| **—** | Out of umbrella scope (excluded domain) |

**Owner codes:** `ID` Identity · `SET` Settings · `BILL` Billing · `ENT` Entitlements · `SEC` Security · `PREF` Preferences · `BA` Business Administration (excluded) · `AI` AI Platform (excluded) · `ADMIN` Admin Portal (excluded)

---

## Unified summary

| Slice | Rows | C | P | N | C% | Source |
|-------|-----:|--:|--:|--:|---:|--------|
| **Identity (PP-1)** | 37 | 7 | 27 | 3 | 19% | PP1 re-audit |
| **Settings (PP-2 core)** | 26 | 15 | 11 | 0 | 58% | PP2 re-audit |
| **Billing & Entitlements (PP-3)** | 47 | 19 | 23 | 2 | 40% | PP3 re-audit |
| **Shared platform (cross-cut)** | 12 | 8 | 4 | 0 | 67% | Umbrella synthesis |
| **Unified in-scope total** | **122** | **49** | **65** | **5** | **40%** | |

**Excluded rows (not counted):** PP-2 business/module reference rows (~10), PP-1 preference delegation rows (~6), Admin/BA/AI operations.

**Umbrella N-row budget:** 5 N rows — all dispositioned on certificate (MFA, session revoke, billing dashboard, trial UX).

---

## 1. Identity operations (PP-1)

**Sub-domain score at ratification:** 24/27 · **Matrix:** 7C / 27P / 3N

### Authentication & session

| Operation | Owner | Service / path | PE | Act | Status | Finding |
|-----------|-------|----------------|-----|-----|--------|---------|
| Register / login / refresh | ID | `authService`, `/api/auth` | — | N† | **P** | Auth security logging |
| Forgot / reset / verify email | ID | `authService` | — | N† | **P** | |
| JWT authenticate | ID | `authenticateJWT` | — | — | **C** | |
| MFA challenge | SEC | **None** | — | — | **N** | AP-UMB-M01 |
| Logout (client) | ID | NextAuth clear | — | — | **P** | AP-UMB-ADV-01 |
| List/revoke sessions | SEC | **None** | — | — | **N** | AP-UMB-ADV-01 |
| Change password (logged-in) | SEC | **None** | — | — | **N** | AP-UMB-ADV-01 |

† Security logging by design — not module activity.

### Profile & photos

| Operation | Owner | Service / path | PE | Act | Status | Finding |
|-----------|-------|----------------|-----|-----|--------|---------|
| Get/update profile | ID | `profileService` | ✅ | ✅ | **P** | |
| Location read | ID | `locationService` | — | — | **C** | |
| Photo library CRUD | ID | `profilePhotoService` | ✅ | ✅ | **P** | AP-UMB-M06 (multer) |
| Serve photo | ID | Authenticated proxy | — | — | **C** | |

### Connections & privacy

| Operation | Owner | Service / path | PE | Act | Status | Finding |
|-----------|-------|----------------|-----|-----|--------|---------|
| Connection mutations | ID | `connectionService` | ✅ | ✅ | **P** | |
| Privacy settings | ID | `privacyService` | ✅ | ✅ | **P** | |
| Member reads | ID | `memberController` | — | — | **P** | AP-UMB-ADV-07 |

**PP-1 detail:** [PP1_OPERATION_MATRIX_REAUDIT.md](./PP1_OPERATION_MATRIX_REAUDIT.md)

---

## 2. Settings operations (PP-2 core)

**Sub-domain score at ratification:** 26/27 · **Matrix:** 15C / 11P / 0N (core)

### Platform API & orchestration

| Operation | Owner | Service / path | PE | Act | Status | Finding |
|-----------|-------|----------------|-----|-----|--------|---------|
| Bulk GET/PUT settings | SET | `settingsService`, `/api/settings` | ✅ | ✅ | **C** | |
| Preference by key | SET | `settingsService` + registry | ✅ | ✅ | **C** | |
| Hub inventory / sections | SET | `settingsHubInventory` | ✅ | — | **C** | |
| Legacy preference delegate | SET | Transitional path | ✅ | ✅ | **P** | AP-UMB-ADV-11 |

### Personal hub & notifications

| Operation | Owner | Service / path | PE | Act | Status | Finding |
|-----------|-------|----------------|-----|-----|--------|---------|
| Profile settings hub IA | SET | `/profile/settings` | — | — | **C** | |
| Notification prefs (in-app) | SET/NOTIF | `notificationSettingsAdapter` | ✅ | ✅ | **C** | |
| Email notification prefs | NOTIF | email routes | — | N | **P** | AP-UMB-ADV-09/10 |
| Theme server-backed | SET | `settingsService` | ✅ | ✅ | **C** | PP2-F07 closed |
| Privacy in hub | SET/ID | Privacy tab | ✅ | ✅ | **P** | |

### Business settings (reference — BA SoR, excluded from core count)

| Operation | Owner | Status | Finding |
|-----------|-------|--------|---------|
| Workspace settings triplication | BA/SET | **P** (ref) | AP-UMB-M03 |
| Business 2FA UI (no backend) | SET/ID | **N** (ref) | AP-UMB-ADV-02 |
| Business billing tab embed | PP3 | **—** | Modal — AP-UMB-M02 |

**PP-2 detail:** [PP2_OPERATION_MATRIX_REAUDIT.md](./PP2_OPERATION_MATRIX_REAUDIT.md)

---

## 3. Billing operations (PP-3)

**Sub-domain score at ratification:** 23/27 · **Matrix:** 19C / 23P / 2N

### Core subscription lifecycle

| Operation | Owner | Service / path | PE | Act | Status | Finding |
|-----------|-------|----------------|-----|-----|--------|---------|
| Create/update/cancel/resume sub | BILL | `billingService` | ✅ | ✅ | **C** | |
| Get user subscription | BILL | `subscriptionService` | — | — | **C** | |
| Checkout session | BILL/STR | `stripeService` → `billingService` | ✅ | ✅ | **P** | |
| Customer portal | BILL/STR | Stripe portal | — | — | **C** | |

### Legacy payment API

| Operation | Owner | Status | Notes |
|-----------|-------|--------|-------|
| JWT `/api/payment/*` | BILL | **C** | 410 Gone — not dual API |
| Webhook `/api/payment/webhook` | BILL/STR | **C** | Documented ops exception |

### Module commerce & entitlements

| Operation | Owner | Service / path | PE | Act | Status | Finding |
|-----------|-------|----------------|-----|-----|--------|---------|
| Module subscribe/cancel | BILL | `moduleSubscriptionService` | ❌ | ❌ | **P** | AP-UMB-M07 |
| Resolve tier / entitlement read | ENT | `entitlementService` | — | — | **C** | |
| Admin tier override | ENT | `setBusinessTierAuthority` | ✅ | ✅ | **C** | PP3-F04 closed |
| Feature gating check | ENT | `FeatureGatingService` | — | — | **P** | AP-UMB-ADV-12 |

### Invoices, usage, UX

| Operation | Owner | Status | Finding |
|-----------|-------|--------|---------|
| Payment methods CRUD | BILL | **P** | |
| Invoice list/get | BILL | **P** | AP-UMB-M05 |
| Invoice webhook activity | BILL | **P** | AP-UMB-M05 |
| Usage / AI query balance | BILL/AI | **P** | AP-UMB-ADV-16 |
| Billing dashboard page | BILL/SET | **N** | AP-UMB-M02 |
| Product trial UX | BILL | **N** | AP-UMB-ADV-14 |

**PP-3 detail:** [PP3_OPERATION_MATRIX_REAUDIT.md](./PP3_OPERATION_MATRIX_REAUDIT.md)

---

## 4. Entitlement operations (PP-3 sub-slice)

| Operation | Owner | Service | Status | Finding |
|-----------|-------|---------|--------|---------|
| Read user/business tier | ENT | `entitlementService.resolveTier` | **C** | |
| Set tier (admin) | ENT | `setBusinessTierAuthority` | **C** | |
| Tier enum normalization | ENT | `normalizeTier()` | **P** | AP-UMB-M04 |
| Module access gate | ENT/MOD | `FeatureGatingService` | **P** | |
| HR tier matrix | ENT/HR | Separate matrix | **P** | AP-UMB-ADV-12 |
| Cache sync post-checkout | ENT | `upsertSubscriptionFromCheckout` | **C** | |

---

## 5. Shared platform operations (cross-cut)

| Operation | Domains | Path | PE | Act | Status | Finding |
|-----------|---------|------|-----|-----|--------|---------|
| Identity → Settings projection | PP-1 → PP-2 | Settings hub reads User | — | — | **C** | |
| Settings → Billing navigation | PP-2 → PP-3 | Modal embed only | — | — | **P** | AP-UMB-M02 |
| Billing → Entitlement sync | PP-3 | Checkout webhook chain | ✅ | ✅ | **C** | |
| Entitlement → AI/HR/module reads | PP-3 → consumers | `resolveTier()` | — | — | **C** | |
| Preference registry write | PP-2 | `settingsService` + registry | ✅ | ✅ | **C** | |
| Notification adapter chain | PP-1/PP-2 | `notificationSettingsAdapter` | ✅ | ✅ | **C** | |
| Cross-tenant isolation | All | dashboardId + context scoping | ✅ | — | **C** | |
| Auth context propagation | PP-1 → all | JWT middleware | — | — | **C** | |
| Account security (MFA) | PP-1/SEC | **None** | — | — | **N** | AP-UMB-M01 |
| Identity domain events | PP-1 | Registry gap | — | — | **P** | AP-UMB-ADV-05 |
| Unified settings API contract | PP-2 | `/api/settings` | ✅ | ✅ | **C** | |
| Unified billing API contract | PP-3 | `/api/billing` + `/api/account/*` | ✅ | ✅ | **C** | |

---

## Cross-domain integration matrix

| From → To | Integration | Status | Umbrella finding |
|-----------|-------------|--------|------------------|
| Identity → Settings | Hub projection, adapter | ✅ **C** | — |
| Settings → Billing | Modal-only UX | ⚠️ **P** | AP-UMB-M02 |
| Billing → Entitlement | Service chain | ✅ **C** | — |
| Entitlement → Platform | Read convergence | ✅ **C** | AP-UMB-M04 partial |
| Security → All | JWT + MFA gap | ⚠️ **P** | AP-UMB-M01 |

---

## N-row disposition (umbrella)

| Row | Slice | Disposition on certificate |
|-----|-------|---------------------------|
| MFA challenge | Identity/SEC | AP-UMB-M01 — WITH FINDINGS |
| Session revoke / password change | Identity/SEC | AP-UMB-ADV-01 — advisory |
| Billing dashboard | Billing/UX | AP-UMB-M02 — WITH FINDINGS |
| Product trial UX | Billing | AP-UMB-ADV-14 — advisory |
| Business 2FA UI | Settings/BA ref | AP-UMB-ADV-02 — advisory |

---

## Matrix maintenance

| Event | Action |
|-------|--------|
| Sub-domain remediation | Update sub-domain re-audit; re-merge unified matrix |
| Umbrella eval | Evaluator validates sample rows; no full re-audit unless regression |
| Post-umbrella cert | Matrix frozen on certificate date |

---

**Last updated:** 2026-06-20 (Umbrella Certification Planning)
