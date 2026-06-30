# Landing Page Content Strategy

**Program:** Vssyl Product Readiness Program  
**Date:** 2026-06-30  
**Purpose:** Define messaging, audiences, and content structure — **extends** `landingContent.ts`, does not replace architecture

**Source of truth for current copy:** `web/src/app/landing/landingContent.ts`

---

## Strategic positioning (one line)

> **Vssyl is the modular workspace where your tools, team, and AI share one context** — start personal, grow into business, extend through the marketplace.

---

## Hero messaging

### Personal audience

| Element | Current | Recommended refinement |
|---------|---------|------------------------|
| Line 1 | "Your AI-Powered" | **Keep** |
| Accent | "Digital Workspace" | **Keep** |
| Subtitle | AI + modular productivity; learns and adapts | **Soften** "Digital Life Twin" → "AI that understands your workspace context" |
| Primary CTA | "Start Free Trial" | **Change** → "Get Started Free" (free tier) / "Get Pro" (paid) |
| Secondary CTA | "Learn More" | **Keep** → #features |

### Business audience

| Element | Current | Recommended refinement |
|---------|---------|------------------------|
| Hero emphasis | Team collaboration, security | **Keep** — add "invite your team in minutes" once invite flow fixed |
| Primary CTA | "Start Free Trial" | **Change** → "Create Team Workspace" |
| Secondary CTA | "Learn More" | **Keep** |

### Hero principles

- Lead with **outcome** (organized work, connected team), not internal terms ("Runtime Kernel")
- One hero message per audience toggle — preserve toggle UX
- Avoid unverifiable superlatives until status/compliance pages exist

---

## Value proposition

### Primary (both audiences)

**Modular workspace + connected AI** — install the applications you need; AI draws context across your dashboard without replacing your tools.

### Personal value pillars

1. **One home for your digital life** — dashboard tabs, files, chat, calendar, AI
2. **Grow at your pace** — free tier; add modules from marketplace
3. **AI that knows your context** — not a generic chatbot bolt-on

### Business value pillars

1. **Team workspace with admin control** — roles, modules, billing per business
2. **Install once, use everywhere** — business-scoped marketplace installs
3. **Bootstrap included** — core modules on business create (drive, chat, calendar)

### Developer value pillar (footer / future section)

**Build on the module contract** — submit, certify, publish to personal and business workspaces.

---

## Target audiences

| Audience | Primary message | Landing section | Post-signup path |
|----------|-----------------|-----------------|------------------|
| **Personal productivity user** | Organize life and work in one AI-aware dashboard | Personal toggle | `/dashboard` → build-out modal |
| **Business administrator** | Set up team workspace, modules, billing | Business toggle | `/business/create` |
| **Employee** | Join your team's workspace | Future: "Join Your Team" link | `/auth/accept-invitation` |
| **Developer / partner** | Build certified modules | Future: footer developer link | `/modules/submit` |
| **Enterprise buyer** | Custom tier, security, support | Enterprise pricing card | `/contact` — not fake trial link |

---

## Use cases (feature hierarchy)

### Tier 1 — Lead with these (accurate today)

| Use case | Modules / capability | Landing placement |
|----------|---------------------|-------------------|
| File organization | Drive / File Hub | Core modules section |
| Team messaging | Chat | Core modules + collaboration card |
| Scheduling | Calendar | Core modules section |
| AI assistance | AI Assistant | Hero + AI feature card |
| Modular extensions | Marketplace | Modular Platform card |

### Tier 2 — Support with nuance

| Use case | Caveat | Copy guidance |
|----------|--------|---------------|
| Business analytics | Hybrid L2 — not full BI suite | "Insights across your workspace" not "Advanced Analytics platform" |
| HR / scheduling | Business modules — install required | Business toggle only |
| Enterprise security | Terms/privacy exist; HIPAA not evidenced | "Enterprise-grade security practices" until compliance page |

### Tier 3 — Defer or footnote

| Use case | Why |
|----------|-----|
| 99.9% uptime SLA | No public status page |
| HIPAA compliance | No public compliance artifact |
| Global infrastructure | Vague — OK as scale signal only |

---

## AI messaging

### What to say

- AI is **context-aware** across installed modules and dashboard
- Personal AI and business AI have **separate boundaries** (admin controls in business)
- AI **augments** workflows — does not autonomously execute without user intent (align with `AIOnboardingFlow` softening)

### What to avoid

- "Digital Life Twin" without explanation
- Implying AI reads data outside authorized module context
- Autonomous agent claims not backed by product behavior

### Recommended AI FAQ entries

1. What data does Vssyl AI access?
2. How is business data separated from personal?
3. Can I turn AI features off?

*Source material:* `memory-bank/aiContextSystem.md`, `docs/ai/README.md` (abridged for public)

---

## Business messaging

- **Bootstrap story:** "Create a business → core tools ready immediately"
- **Admin story:** "You control which modules your team uses"
- **Seat story:** "Pay for your team as you grow" (when seat UI exists)
- **Invite story:** (after fix) "Invite by email — teammates join in one click"

**Avoid:** Implying employees can purchase modules (API correctly blocks — UI must match).

---

## Personal messaging

- **Free entry:** "Start free — upgrade when you need more"
- **Dashboard tabs:** "Separate work, home, and projects"
- **Marketplace:** "Add specialized apps to your dashboard"
- **Templates:** "Choose a layout — Personal Productivity, Minimal, and more" (surface `DashboardTemplates` in onboarding copy)

---

## Trust indicators

### Present today (keep)

- Privacy Policy and Terms links
- Professional visual design
- Live pricing (transparency)
- Contact page layout

### Placeholders (acceptable Wave 2–3)

| Element | Placeholder approach |
|---------|---------------------|
| Customer logos | "Trusted by teams" + 3–5 placeholder slots OR omit until real |
| Testimonials | 2–3 quoted placeholders marked "Beta user" OR omit |
| Security badges | Link to `/security` page — not badge graphics until certified |
| Uptime | Link to `/status` — remove % claim until live |

### Remove or soften until evidenced

- HIPAA in feature card bullets → move to enterprise contact-only
- 99.9% uptime → remove or link status
- "Advanced Analytics" as top feature → demote to secondary

---

## Social proof placeholders

**Section title:** "Teams use Vssyl to unify work and AI"

**Structure (when no customers yet):**

```
[Logo slot] [Logo slot] [Logo slot]
"Quote about modular workspace" — Role, Company (pilot participant)
```

**Alternative for pre-launch:** Module count + "Built-in modules + marketplace extensions" as proof of breadth.

---

## FAQ structure

### Recommended `/help` or landing FAQ accordion

**Getting started**
1. What is Vssyl?
2. Is Vssyl for me or my team?
3. What's free vs paid?
4. How do I create a business workspace?

**Account & access**
5. How do I join my company's workspace?
6. Do I need to verify my email?
7. Can I use Vssyl on mobile?

**Billing**
8. How does pricing work?
9. Is there a free trial? (honest answer per Stripe state)
10. How do I cancel or change plans?

**Modules & marketplace**
11. What's the difference between built-in modules and marketplace apps?
12. Who can install apps for a business?

**AI & privacy**
13. What does the AI see?
14. Where is my data stored?

**Support**
15. How do I contact support?

---

## Content maintenance

| Trigger | Action |
|---------|--------|
| Pricing tier change | Automatic via `/api/pricing` — update `landingContent` feature bullets manually |
| New certified module | Optional module card on landing |
| Trial implementation | Update CTAs to "Start 14-Day Trial" |
| Public docs publish | Link from footer + in-app help |

---

## Evidence index

| Artifact | Path |
|----------|------|
| Current copy | `web/src/app/landing/landingContent.ts` |
| Strategic positioning (0A) | `docs/go-to-market/GO_TO_MARKET_STRATEGIC_POSITIONING.md` |
| Website audit | `docs/go-to-market/WEBSITE_AND_BRAND_AUDIT.md` |

---

*Content strategy only — no copy changes authorized in this wave.*
