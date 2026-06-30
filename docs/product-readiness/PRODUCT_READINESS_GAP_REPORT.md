# Product Readiness Gap Report

**Program:** Vssyl Product Readiness Program  
**Date:** 2026-06-30  
**Purpose:** Ranked gaps preventing commercial launch — favor fixing existing work over rebuilding

---

## Gap ranking methodology

| Rank | Business impact | Definition |
|------|-----------------|------------|
| **P0** | Launch blocker | Prevents core persona from completing adoption without engineering escort |
| **P1** | High friction | Causes abandonment, support burden, or trust loss |
| **P2** | Growth limiter | Slows scale, conversion, or partner ecosystem |
| **P3** | Polish | Improves perception; not blocking pilot |

**Impact dimensions:** Revenue, adoption, trust, support cost, partner growth.

---

## P0 — Launch blockers

| # | Gap | Area | Impact | Existing work to extend |
|---|-----|------|--------|-------------------------|
| 1 | **Missing `/auth/accept-invitation` page** | Onboarding | Business team adoption **broken** — email links 404 | Invite API + email in `emailService.ts` |
| 2 | **No `/billing` hub** — deep links 404 | Commercial | Upgrade, trial, module purchase flows fail | `BillingModal.tsx` — add route shell |
| 3 | **Support ticket API path mismatch** | Trust | Customer support form posts to `/api/support/tickets/customer`; backend is `/api/admin-portal/support/tickets/customer` with `requireAdmin` | `support/page.tsx` + admin routes |
| 4 | **"Start Free Trial" without Stripe trials** | Commercial | Commercial misrepresentation; chargeback/trust risk | `landingContent.ts` copy OR `stripeSyncService` |
| 5 | **Public `/help` and `/docs` stubs** | Education | Footer promises help → dead end | Curate from `docs/guides/` |

---

## P1 — High friction

| # | Gap | Area | Impact | Extend |
|---|-----|------|--------|--------|
| 6 | No signup intent capture (personal/business/join team) | Onboarding | Wrong-first-path for business admins | `DashboardBuildOutModal` branches |
| 7 | Employee marketplace install buttons visible → API 403 | Application | Employees think product is broken | `web/src/app/modules/page.tsx` role gate |
| 8 | Contact form non-functional | Public | Prospect inquiries lost | `contact/page.tsx` — wire to email/API |
| 9 | Missing `/status` page | Trust | Uptime claim unsupported; support link 404 | Placeholder or Statuspage |
| 10 | Business paid module billing E2E incomplete | Commercial | Partner revenue blocked for business scope | `businessModuleSubscriptionService` |
| 11 | Email verification not enforced; resend bug | Auth | Security/commercial ambiguity | `verify-email` + resend body |
| 12 | Marketplace not public (login wall) | Application | Pre-signup discovery impossible | `getMarketplaceModules` read-only mode |
| 13 | No signup-from-invitation for new users | Onboarding | Employees must pre-register | Extend accept-invitation page |
| 14 | Business create undiscoverable post-signup | Onboarding | Admins stay in personal funnel | Build-out modal + checklist |
| 15 | `/business/[id]/modules` omits `canManage` in UI gate | Application | Capable admins blocked in UI | Match `policyEngine.ts` |

---

## P2 — Growth limiters

| # | Gap | Area | Impact | Extend |
|---|-----|------|--------|--------|
| 16 | Module version upload sets `PENDING` — delists approved module | Marketplace | Partner updates break customers | `moduleArtifactController.ts` workflow |
| 17 | Developer payouts ledger-only (no Stripe Connect) | Commercial | Manual partner payouts | `developerPortalService.ts` |
| 18 | No public developer/partner program page | Public | Partner pipeline operator-only | `docs/guides/` abridged |
| 19 | Landing overstated HIPAA/uptime/analytics claims | Public | Credibility risk with informed buyers | `landingContent.ts` |
| 20 | Lazy default dashboard — empty first paint | Onboarding | "Broken" first impression | `registerWithSession` or dashboard context |
| 21 | No product screenshots on landing | Public | Signup anxiety | Capture from reference workspace |
| 22 | No social proof (logos, testimonials) | Public | Enterprise hesitation | Placeholder section |
| 23 | Tier vocabulary drift (`standard` vs `pro`) | Commercial | Operator confusion | `billing.ts` deprecation |
| 24 | Employees cannot list installed business modules | Application | Discovery gap for employees | New read-only API + UI |
| 25 | Seat management UI weak | Commercial | Business billing incomplete | Existing employee-count API |
| 26 | Register bypasses Next.js API proxy | Auth | Env inconsistency in dev/prod | Align with `proxy-login` pattern |
| 27 | Footer stub pages (blog, careers, integrations) | Public | Trust erosion on click | Honest labels or content |
| 28 | No public security page | Public | Enterprise security review blocked | Internal security docs abridged |
| 29 | No logo asset — text wordmark only | Visual | Brand polish | Add SVG to `web/public/` |
| 30 | SMTP not configured = auto-verify email | Operations | Security tradeoff at register | Operator checklist |

---

## P3 — Polish

| # | Gap | Area | Impact |
|---|-----|------|--------|
| 31 | No product tour / tooltip library | Onboarding | Slower learnability |
| 32 | No coupon infrastructure | Commercial | Marketing flexibility |
| 33 | No invoice PDF in UI | Commercial | Accounting friction |
| 34 | Limited landing animations (CSS only) | Visual | Marketing dynamism |
| 35 | No dedicated `/pricing` route | Public | SEO minor |
| 36 | No sample/demo data for prospects | Onboarding | Sandbox demos |
| 37 | OAuth social login missing | Auth | Signup friction |
| 38 | Household template underpromoted | Onboarding | Niche use case |

---

## Gap summary by area

| Area | P0 | P1 | P2 | P3 | Highest-impact gap |
|------|----|----|----|----|-------------------|
| Landing / marketing | 1 | 1 | 4 | 2 | Trial CTA mismatch |
| Onboarding | 1 | 4 | 1 | 2 | Accept invitation missing |
| Authentication | 0 | 1 | 1 | 1 | Verification enforcement |
| Application / marketplace | 0 | 3 | 2 | 1 | Employee install UI |
| Commercial / billing | 1 | 1 | 2 | 2 | `/billing` 404 |
| Education / docs | 1 | 0 | 1 | 0 | Help/docs stubs |
| Trust / support | 1 | 1 | 1 | 0 | Support API broken |
| Visual polish | 0 | 0 | 2 | 2 | No screenshots |

---

## What is NOT a gap (do not rebuild)

| Capability | Maturity | Note |
|------------|----------|------|
| Platform kernel / controller | L2–L3 | Invisible to customers — reference only |
| Reference workspace shells | WS-L2 certified | Onboarding/commercial last mile separate |
| PP-3 billing backend | L2+ | Fix UX routing, not billing architecture |
| Marketplace certification pipeline | L2.5 | Fix customer/update UX, not rebuild |
| Core auth (login/register/reset) | L3 | Extend invite + verification |
| Module UX (Drive, Chat, Calendar, etc.) | L2–L3 | Marketing should showcase, not rebuild |
| Design token system | Wave 0 complete | Extend to marketing imagery |
| Cloud Run / GCS deployment | Production path exists | Operator configuration |

---

## Business impact ranking (top 10)

| Rank | Gap | Revenue impact | Adoption impact |
|------|-----|----------------|-----------------|
| 1 | Accept invitation missing | High — business seats | **Critical** |
| 2 | `/billing` 404 | **Critical** — conversion | High |
| 3 | Trial CTA mismatch | High — trust/chargebacks | Medium |
| 4 | Help/docs stubs | Medium | **Critical** — self-serve |
| 5 | Support API broken | Medium | High — retention |
| 6 | Employee install UI mismatch | Low direct | High — NPS |
| 7 | No signup intent | Medium | High — business path |
| 8 | Public marketplace browse | Medium | Medium — discovery |
| 9 | Business paid module E2E | High — partner revenue | Medium |
| 10 | Contact form stub | Medium — pipeline | Low |

---

## Pilot readiness verdict

| Question | Answer |
|----------|--------|
| Can launch to broad public marketing? | **No** — close P0 first |
| Can run controlled pilot with white-glove? | **Yes** — after P0 #1–3 and SMTP/Stripe verified |
| Architecture blocking product? | **No** |
| Primary investment area? | **Customer last mile** — routes, copy, docs, role UI |

---

## Evidence index

| Artifact | Path |
|----------|------|
| GTM executive summary | `docs/go-to-market/GO_TO_MARKET_PHASE_0A_EXECUTIVE_SUMMARY.md` |
| Product inventory | [EXISTING_PRODUCT_INVENTORY.md](./EXISTING_PRODUCT_INVENTORY.md) |
| User journey | [PUBLIC_USER_JOURNEY.md](./PUBLIC_USER_JOURNEY.md) |

---

*Gap report only — no implementation authorized.*
