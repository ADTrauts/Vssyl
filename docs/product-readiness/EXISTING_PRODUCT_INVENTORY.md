# Existing Product Inventory

**Program:** Vssyl Product Readiness Program  
**Date:** 2026-06-30  
**Purpose:** Prevent duplicate work — document what already exists before recommending changes

**Legend:** **Exists** · **Partial** · **Missing**  
**Recommendation:** Keep · Improve · Merge · Replace · Remove

---

## Summary

Vssyl has **substantial product infrastructure** built over 12+ months: a polished landing page, full auth stack, personal/business workspace shells, marketplace install path, PP-3 billing backend, dashboard templates, and module-level UX certification. **Customer last-mile gaps** are concentrated in broken deep links, stub public docs, invite acceptance, billing hub routing, and commercial copy misalignment — not missing core platform code.

---

## PUBLIC EXPERIENCE

### Landing page (home)

| Field | Detail |
|-------|--------|
| **Current implementation** | Full marketing landing with hero, features, modules, pricing, CTAs, footer |
| **Repository location** | `web/src/app/landing/page.tsx`, `landingContent.ts`, `landingPricing.ts` |
| **Completeness** | **~85%** — all major sections present |
| **Production readiness** | **Deployable** — live pricing from `GET /api/pricing` |
| **Actively used** | Yes — unauthenticated `/` renders landing via `web/src/app/page.tsx` |
| **Duplicated elsewhere** | No — single canonical landing |
| **Recommendation** | **Keep** — Improve copy alignment (trials, compliance claims); extend audience model |

### Marketing / feature pages

| Surface | Location | Status | Recommendation |
|---------|----------|--------|----------------|
| About | `web/src/app/about/page.tsx` | Exists | **Keep** |
| Contact | `web/src/app/contact/page.tsx` | Partial — form stub | **Improve** — wire submission |
| Privacy | `web/src/app/privacy/page.tsx` | Exists | **Keep** |
| Terms | `web/src/app/terms/page.tsx` | Exists | **Keep** |
| Help | `web/src/app/help/page.tsx` | Stub | **Improve** — publish content or relabel |
| Documentation | `web/src/app/docs/page.tsx` | Stub | **Improve** — curate from `docs/guides/` |
| Blog | `web/src/app/blog/page.tsx` | Stub | **Keep** stub or **Remove** from footer until content |
| Careers | `web/src/app/careers/page.tsx` | Stub | **Keep** stub |
| Integrations | `web/src/app/integrations/page.tsx` | Stub | **Improve** — or merge into features section |
| Support | `web/src/app/support/page.tsx` | Exists — not in landing footer | **Improve** — fix API path, add footer link |
| Security (public) | — | **Missing** | **Improve** — add page or soften landing claims |
| Pricing (dedicated) | — | **Missing** — pricing on landing only | **Keep** on landing; optional `/pricing` alias later |

### Navigation & branding

| Field | Detail |
|-------|--------|
| **Implementation** | Per-page nav on public pages; text wordmark "Vssyl" in `COLORS.infoBlue` |
| **Location** | Public pages; `shared/src/styles/theme.ts`, `docs/ux/DESIGN_TOKENS.md` |
| **Logo asset** | No dedicated logo SVG in `web/public/` — text wordmark only |
| **Completeness** | **~70%** — consistent color; no logo file, no public security page |
| **Recommendation** | **Improve** — add logo asset; unify public header component |

### Public assets

| Asset | Location | Notes |
|-------|----------|-------|
| Icons | Lucide throughout | Consistent |
| Product screenshots | Not on landing | **Improve** — add real product imagery |
| Illustrations | None evidenced | **Improve** — optional for trust |
| `web/public/` | `file.svg`, `sw.js`, sample module | Minimal marketing assets |

### Documentation entry points

| Entry | Status | Internal alternative |
|-------|--------|-------------------|
| `/docs` | Stub | `docs/guides/` (42+ files, internal) |
| `/help` | Stub | — |
| Developer portal | Post-login `/developer-portal` | `docs/guides/MODULE_DEVELOPMENT_GUIDE.md` |

**Recommendation:** **Improve** — publish curated subset; do not rebuild doc platform.

---

## AUTHENTICATION

| Capability | Location | Completeness | Production | Recommendation |
|------------|----------|--------------|------------|----------------|
| Login | `web/src/app/auth/login/page.tsx`, `/api/proxy-login` | Exists | Ready with secrets | **Keep** |
| Registration | `web/src/app/auth/register/page.tsx`, `authService.registerWithSession` | Exists | Ready | **Improve** — proxy consistency, intent capture |
| Forgot password | `web/src/app/auth/forgot-password/page.tsx` | Exists | SMTP-dependent | **Keep** |
| Reset password | `web/src/app/auth/reset-password/page.tsx` | Exists | Ready | **Keep** |
| Email verification | `web/src/app/auth/verify-email/page.tsx`, API routes | Exists | Not enforced on login | **Improve** |
| Accept invitation | Email links to `/auth/accept-invitation` | **Missing page** | Broken | **Improve** — add page (API exists) |
| NextAuth session | `web/src/lib/auth.ts`, `SessionReadyGate` | Exists | Ready | **Keep** |
| OAuth / SSO (user) | — | Missing | — | Defer |
| Business SSO | `server/src/services/ssoService.ts` | Partial | Enterprise path | **Keep** — separate from user auth |

**Duplication:** Login uses proxy; register hits backend directly — **Merge** to single proxy pattern.

---

## ONBOARDING

| Capability | Location | Completeness | Recommendation |
|------------|----------|--------------|----------------|
| Post-register redirect | `page.tsx` → `/dashboard` | Exists | **Keep** |
| Default personal dashboard | `DashboardContext.ensureDefaultPersonalDashboard` | Partial — lazy | **Improve** — create at register |
| Dashboard build-out modal | `web/src/components/DashboardBuildOutModal.tsx` | Exists — de facto first-run | **Improve** — persona branches |
| Dashboard templates | `web/src/components/dashboard/DashboardTemplates.tsx` | Exists — 4 templates | **Keep** — surface in first-run |
| Business creation | `web/src/app/business/create/page.tsx` | Exists | **Keep** |
| Business bootstrap | `server/src/services/business/businessBootstrapService.ts` | Exists — drive, chat, calendar | **Keep** |
| Setup checklist | Business hub `getBusinessSetupStatus` | Partial — passive | **Improve** |
| HR onboarding journeys | `hrOnboardingService`, admin/employee views | Exists — separate module | **Keep** — bridge from invite |
| AI onboarding | `web/src/components/ai/AIOnboardingFlow.tsx` | Exists — `/ai` only | **Improve** — optional first-run link |
| Product tours | — | **Missing** | Defer — use build-out modal first |
| Tooltips | Ad hoc (`title`, custom) | Partial | **Improve** — no platform tour library |
| Empty states | `shared/components/EmptyState`, module-specific | Exists — UX L2+ on certified modules | **Keep** — extend to dashboard welcome |
| Sample data | `scripts/create-centralized-ai-tables.ts` (dev script) | Dev-only | **Improve** — optional demo mode later |
| Household tab creation | Dashboard create modal | Exists | **Keep** |

**Duplication:** Business invite via `businessMemberService` and `memberController` — **Merge** documentation; APIs coexist.

---

## APPLICATION EXPERIENCE

| Capability | Location | Completeness | Recommendation |
|------------|----------|--------------|----------------|
| Marketplace browse | `web/src/app/modules/page.tsx` | Partial — auth required | **Improve** — public read-only catalog |
| Module details | `web/src/app/modules/[id]/page.tsx` | Exists | **Keep** |
| Personal install | `moduleProvisionController.installModule` | Exists | **Keep** |
| Business install | `/business/[id]/modules/page.tsx` | Exists — admin UI | **Improve** — `canManage` gate |
| Application Manager | Modules tab + workspace modules | Partial | **Keep** — consolidate UX copy |
| Module submission | `web/src/app/modules/submit/page.tsx` | Exists | **Keep** |
| Developer portal | `web/src/app/developer-portal/page.tsx` | Exists | **Improve** — link from landing |
| First-use (core modules) | Drive, Chat, Calendar, AI hubs | Exists — WS-L2 certified | **Keep** |
| Education / help in-app | Limited | Partial | **Improve** |
| Built-in module discovery | `DashboardBuildOutModal`, `WidgetPicker` | Exists | **Keep** |

**Duplication:** `/modules` (mixed scope) vs `/business/[id]/modules` — **Keep both**; align role gates.

---

## COMMERCIAL

| Capability | Location | Completeness | Recommendation |
|------------|----------|--------------|----------------|
| Stripe integration | `server/src/config/stripe.ts`, `stripeService.ts` | Exists | **Keep** |
| Checkout | `POST /api/billing/checkout/session` | Exists | **Keep** |
| Webhooks | `POST /api/payment/webhook` | Exists | **Keep** |
| Billing UI | `BillingModal.tsx`, `PaymentModal.tsx` | Exists — modal only | **Improve** — `/billing` route shell |
| Pricing config | `PricingConfig` model, `pricingService.ts` | Exists | **Keep** |
| Entitlements / gating | `entitlementService.ts`, `featureGatingService.ts` | Exists | **Keep** |
| Personal subscriptions | `Subscription` user-scoped | Exists | **Keep** |
| Business subscriptions | `Subscription.businessId` | Exists | **Keep** |
| Module subscriptions | `ModuleSubscription`, `BusinessModuleSubscription` | Exists | **Improve** — business paid E2E |
| Trials | Landing copy only | **Missing** in Stripe | **Improve** — implement or fix copy |
| Billing success/cancel | `web/src/app/billing/success`, `cancel` | Exists | **Keep** |
| `/billing` hub | — | **Missing** | **Improve** |
| Coupons | — | Missing | Defer |
| Developer payouts | Ledger in `developerPortalService` | Partial — no Connect | Defer |

---

## VISUAL EXPERIENCE

| Capability | Location | Completeness | Recommendation |
|------------|----------|--------------|----------------|
| Design tokens | `web/src/styles/tokens.css`, `docs/ux/DESIGN_TOKENS.md` | Exists — Wave 0 | **Keep** |
| UX Constitution | `docs/ux/UX_CONSTITUTION.md` | Exists | **Keep** — reference only |
| Typography | Inter via `next/font` | Exists | **Keep** |
| Color system | `--v-color-*`, `COLORS.infoBlue` (#278BEE) | Exists | **Keep** |
| Dark mode | Public + app surfaces | Exists | **Keep** |
| Shared components | `shared/components` — Button, Card, Spinner, EmptyState | Exists | **Keep** |
| Loading states | Spinner, `loading.tsx` on auth routes | Exists | **Keep** |
| Animations | CSS `transition-*` on landing; no framer-motion | Partial | **Improve** — light motion on landing only |
| Icons | Lucide — Drive module style preferred per user prefs | Exists | **Keep** |
| Module UX certification | `docs/ux/audits/*` — Chat, Calendar, Drive, etc. | L2–L3 on reference modules | **Keep** |
| Product screenshots | Not on marketing site | Missing | **Improve** |
| Landing visual polish | Professional layout | **~75%** | **Improve** — screenshots, social proof |

**Duplication:** Legacy `globals.css` + `tokens.css` — **Keep** both until migration waves complete (per UX constitution).

---

## OPERATIONS (product-adjacent)

| Capability | Status | Location | Recommendation |
|------------|--------|----------|----------------|
| Email (transactional) | Partial — SMTP required | `emailService.ts` | **Keep** — operator config |
| Support tickets | Partial — route mismatch | `support/page.tsx` vs `admin-portal/.../customer` | **Improve** |
| Status page | Missing | `/status` linked but absent | **Improve** |
| Cloud Run deploy | Exists | `cloudbuild.yaml`, `docs/deployment/` | **Keep** |
| GCS storage | Exists | `storageService.ts` | **Keep** |

---

## Inventory verdict by area

| Area | Exists substantially? | Primary action |
|------|----------------------|----------------|
| Public landing | Yes | Improve copy + stubs |
| Auth | Yes | Improve invite page + proxy |
| Onboarding | Yes | Improve routing, not rebuild |
| Marketplace | Yes (backend) | Improve customer UX + public browse |
| Billing | Yes (backend) | Improve `/billing` last mile |
| Visual / UX | Yes (in-app) | Improve marketing imagery |
| Public docs | No | Improve from internal corpus |

---

## Cross-reference

| Prior assessment | Path |
|------------------|------|
| GTM production inventory | `docs/go-to-market/PRODUCTION_READINESS_INVENTORY.md` |
| GTM reality | `docs/go-to-market/GO_TO_MARKET_REALITY_ASSESSMENT.md` |
| Landing memory bank | `memory-bank/landingPageContext.md` |
| Marketplace maturity | `docs/marketplace/MARKETPLACE_REALITY_ASSESSMENT.md` |
| Dashboard assessment | `docs/dashboard/DASHBOARD_REALITY_ASSESSMENT.md` |

---

*Inventory only — no implementation authorized.*
