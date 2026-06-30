# Public Experience Assessment

**Program:** Vssyl Product Readiness Program  
**Date:** 2026-06-30  
**Question:** How ready is Vssyl's public-facing experience for real customer discovery and conversion?

---

## Executive answer

Vssyl presents a **professionally designed public landing experience** that communicates category and value within 30 seconds. Conversion trust is **undermined** by stub footer pages, non-functional contact form, overstated enterprise claims without evidence, and commercial CTAs ("Start Free Trial") that do not match billing implementation.

**Public readiness score: 63%** — strong foundation; credibility and completeness gaps prevent confident self-serve conversion.

---

## Strengths

1. **Complete landing page** — Hero, audience toggle (personal/business), six feature cards, core modules, live pricing, multiple CTAs (`web/src/app/landing/page.tsx`)
2. **Audience-aware messaging** — `landingContent.ts` separates personal and business copy, features, and pricing tiers; persisted in `localStorage`
3. **Live pricing integration** — `landingPricing.ts` fetches `GET /api/pricing` — marketing prices stay aligned with `PricingConfig`
4. **Auth-aware home routing** — `/` shows landing for visitors, redirects authenticated users to dashboard
5. **Legal baseline** — Substantive Privacy (`/privacy`) and Terms (`/terms`) linked from footer
6. **Visual consistency** — Vssyl blue (`#278BEE`), Inter typography, dark mode, responsive layout across public pages
7. **About and Contact pages** — Company narrative and contact layout exist (contact submission incomplete)
8. **No 404 on primary paths** — Footer links resolve to pages (even stubs use consistent shell)

---

## Weaknesses

1. **Stub pages linked from footer** — `/help`, `/docs`, `/blog`, `/careers`, `/integrations` show "Coming Soon" — damages trust when clicked post-interest
2. **"Start Free Trial" without Stripe trials** — Paid tier CTAs misrepresent commercial reality
3. **Overstated claims** — HIPAA, 99.9% uptime, Advanced Analytics on landing exceed demonstrated public evidence
4. **No public security/trust page** — Security claims in copy only; admin security at `/admin-portal/security` (gated)
5. **Contact form non-functional** — `TODO` in `contact/page.tsx` — console.log + alert only
6. **Modules footer expectation mismatch** — Footer "Modules" implies browse-before-signup; `/modules` requires authentication
7. **No social proof** — No customer logos, testimonials, case studies, or review badges
8. **No product screenshots on landing** — Visitor cannot see the actual product UI before signup
9. **Support page orphaned** — `/support` exists with ticket form but not linked from landing footer; API path likely broken
10. **Missing `/status`** — Support page may link to non-existent status URL
11. **Text-only brand mark** — No logo SVG in public assets; wordmark only
12. **Developer/partner invisible** — No public entry for marketplace partners or module developers
13. **SEO/content marketing** — Blog stub; no organic content program evidenced

---

## Missing experiences

| Experience | Priority | Notes |
|------------|----------|-------|
| Public help / getting started | P0 | Replace `/help` stub |
| Public documentation hub | P0 | Curate from `docs/guides/` |
| Public security overview | P1 | Support enterprise claims or soften copy |
| Public module catalog (read-only) | P1 | Discovery without account |
| Developer / partner landing | P1 | Link to certification checklist |
| Status / uptime page | P1 | Back uptime claims or remove |
| Working contact form | P1 | Prospect inquiries |
| Product screenshot / demo section | P2 | Reduce signup anxiety |
| Social proof section | P2 | Placeholders acceptable initially |
| Dedicated `/pricing` route | P3 | Optional — landing section sufficient |

---

## Scores

| Metric | Score | Rationale |
|--------|-------|-----------|
| **Product readiness (public slice)** | 63% | Landing strong; stubs and trust gaps |
| **Public readiness** | 63% | Same — primary deliverable of this doc |
| First-impression clarity (30s) | 75% | Category understood quickly |
| Audience fit clarity (60s) | 45% | Personal vs business toggle helps; employee/developer paths absent |
| Trust to register | 55% | Legal OK; stubs and claims hurt |
| Trust to pay | 35% | Trial mismatch; no support/status |

---

## Production readiness

| Question | Answer |
|----------|--------|
| Deployable to production URL? | **Yes** — `vssyl.com` per deployment docs |
| Safe for broad marketing spend? | **No** — fix P0 gaps first |
| Safe for controlled pilot traffic? | **Yes** — with copy alignment on trials |
| Requires architecture change? | **No** — content, routing, and wiring only |

---

## Modernize vs replace

| Asset | Verdict |
|-------|---------|
| `landing/page.tsx` + `landingContent.ts` | **Modernize** — extend audience model, fix copy |
| Stub public pages | **Modernize** — publish content or honest "launching soon" labels |
| Per-page nav duplication | **Merge** — extract shared `PublicHeader` / `PublicFooter` (later wave) |
| Landing pricing section | **Keep** — live API integration is correct pattern |

---

## Evidence index

| Artifact | Path |
|----------|------|
| Landing page | `web/src/app/landing/page.tsx` |
| Content trees | `web/src/app/landing/landingContent.ts` |
| Pricing helper | `web/src/app/landing/landingPricing.ts` |
| Home routing | `web/src/app/page.tsx` |
| Website audit (Phase 0A) | `docs/go-to-market/WEBSITE_AND_BRAND_AUDIT.md` |
| Design tokens | `docs/ux/DESIGN_TOKENS.md` |

---

*Assessment only — no page rewrites authorized.*
