# Landing Site Information Architecture

**Program:** Vssyl Product Readiness Program  
**Date:** 2026-06-30  
**Purpose:** Define ideal public information architecture — **planning only**, preserving existing landing implementation

**Constraint:** Extend `web/src/app/landing/` and existing public routes; do not redesign platform architecture.

---

## Design principles

1. **One primary conversion path** — Register → workspace → first action
2. **Persona clarity at navigation layer** — Personal, Business, Developer, Join a Team
3. **Honest links** — No footer links to empty stubs without labeling
4. **Preserve live pricing** — Keep API-driven pricing on landing (or `/pricing` alias)
5. **Auth entry points visible** — Sign In + Get Started on every public page

---

## Site map (ideal)

```
vssyl.com/
├── /                          Home (landing — personal/business toggle)
├── /pricing                   Optional alias → landing#pricing (SEO)
├── /features                  Optional anchor or lightweight page (future)
│
├── Product
│   ├── /modules               Public read-only catalog (future) OR "Sign in to browse"
│   ├── /integrations          Partner/integration list (when ready)
│   └── /ai                    Public AI overview (future — or anchor on landing)
│
├── Solutions (audience)
│   ├── /for-individuals       Anchor or section — maps to landing personal toggle
│   ├── /for-teams             Anchor or section — maps to landing business toggle
│   ├── /for-developers        Developer program + docs entry
│   └── /join-your-team        Invite/login instructions (post invite-fix)
│
├── Trust
│   ├── /security              Security & privacy overview
│   ├── /privacy               ✅ Exists
│   ├── /terms                 ✅ Exists
│   └── /status                Uptime / incidents (or external Statuspage)
│
├── Resources
│   ├── /docs                  Getting started + guides (published subset)
│   ├── /help                  FAQ + support links
│   ├── /blog                  Content marketing (when ready)
│   └── /support               Customer tickets ✅ Exists — add to footer
│
├── Company
│   ├── /about                 ✅ Exists
│   ├── /careers               Stub until hiring
│   └── /contact               ✅ Exists — wire form
│
└── Auth
    ├── /auth/login            ✅ Exists
    ├── /auth/register         ✅ Exists
    ├── /auth/forgot-password  ✅ Exists
    ├── /auth/accept-invitation  **To add** — employee entry
    └── /developer-portal      Post-login — link from /for-developers
```

---

## Primary navigation (header)

### Current (preserve structure)

| Item | Behavior |
|------|----------|
| Logo / wordmark | Link to `/` |
| Sign In | `/auth/login` |
| Get Started | `/auth/register` |

### Recommended extension (Wave 1 — copy/links only)

| Item | Target | Notes |
|------|--------|-------|
| Product ▾ | Anchors on landing: Features, Modules, Pricing | Avoid new pages until content exists |
| Solutions ▾ | Personal / Business / Developers / Join Team | Toggle or dropdown |
| Docs | `/docs` when published; until then hide or label "Soon" |
| Sign In | `/auth/login` | Keep |
| Get Started | `/auth/register` | Keep |

**Mobile:** Hamburger with same hierarchy; audience toggle remains in hero (not buried in menu).

---

## Footer hierarchy

### Recommended columns

| Column | Links |
|--------|-------|
| **Product** | Features (#features), Modules, Integrations, Pricing (#pricing), AI Overview |
| **Solutions** | For Individuals, For Teams, For Developers, Join Your Team |
| **Resources** | Documentation, Help Center, Support, Status |
| **Company** | About, Contact, Careers, Blog |
| **Legal** | Privacy Policy, Terms of Service, Security |

### Footer CTA strip (optional)

Short tagline from `landingContent.footerTagline` + primary button → `/auth/register`

---

## Page hierarchy & priority

| Tier | Pages | Purpose |
|------|-------|---------|
| **T0 — Conversion** | `/`, `/auth/register`, `/auth/login` | Discover → sign up |
| **T1 — Trust** | `/privacy`, `/terms`, `/security`, `/status`, `/contact` | Legal + operational trust |
| **T1 — Education** | `/docs`, `/help`, `/join-your-team` | Post-click confidence |
| **T2 — Discovery** | Public `/modules` catalog, `/for-developers` | Pre-signup exploration |
| **T3 — Growth** | `/blog`, `/careers`, `/integrations` | SEO and recruiting |

---

## Calls to action (by page)

| Page | Primary CTA | Secondary CTA |
|------|-------------|---------------|
| Home (personal) | Get Started Free → `/auth/register` | Learn More → #features |
| Home (business) | Start Team Workspace → `/auth/register` | Contact Sales → `/contact` (enterprise tier) |
| Pricing section | Tier-specific → `/auth/register` | Compare features → #features |
| Developers | Read Docs → `/docs` | Submit Module → `/auth/register` then `/modules/submit` |
| Join Team | Accept Invitation → `/auth/accept-invitation` | Sign In → `/auth/login` |
| Docs / Help | Get Started → `/auth/register` | Contact Support → `/support` |

**Copy rule:** Until Stripe trials exist, paid tiers use **"Subscribe"** or **"Get Pro"** — not "Start Free Trial."

---

## Authentication entry points

| Entry | URL | When shown |
|-------|-----|------------|
| Header Sign In | `/auth/login` | All public pages |
| Header Get Started | `/auth/register` | All public pages |
| Pricing tier buttons | `/auth/register` | Landing pricing section |
| Footer / CTA blocks | `/auth/register` | Landing bottom |
| Invitation email | `/auth/accept-invitation?token=` | Business employees |
| Return URL | `?returnUrl=` on login | Deep links post-auth |

**Post-auth routing (preserve):**

- Default → `/dashboard` (personal)
- Business admin → discover `/business/create` or post-signup intent branch
- Employee → `/business/[id]/workspace` after invite accept

---

## Feature organization (landing sections)

Preserve existing section order in `landing/page.tsx`:

1. **Hero** — Headline, subtitle, audience toggle, primary/secondary CTA
2. **Features** — Six cards (AI, Modular, Collaboration, Analytics, Security, Global)
3. **Core Modules** — Chat, Drive, Calendar, AI Assistant
4. **Pricing** — Live tiers from API; monthly/yearly toggle
5. **Final CTA** — Conversion block
6. **Footer** — IA columns above

**Future addition (Wave 6):** Product screenshots section between Features and Modules — real UI captures from WS-L2 reference workspace.

---

## Relationship to authenticated app

Public IA ends at auth boundary. Post-login IA is governed by:

- Personal: `/dashboard`, module hubs
- Business: `/business/[id]/workspace/*`
- Marketplace: `/modules` (authenticated)
- Billing: `/billing` hub (to add) → existing `BillingModal`

**Do not** merge public marketing routes into workspace route trees.

---

## Implementation notes (when authorized)

| Change | Effort | Depends on |
|--------|--------|------------|
| Footer link honesty labels | S | — |
| Add `/support` to footer | S | — |
| `/auth/accept-invitation` | M | Invite API |
| `/security` page | M | Content from internal security docs |
| `/status` placeholder | S | — |
| Public `/modules` read-only | L | Marketplace API filter |
| Shared `PublicLayout` component | M | — |

*S = small (1–3 days), M = medium (3–7 days), L = large (1–2 weeks)*

---

*Planning artifact only — no implementation authorized.*
