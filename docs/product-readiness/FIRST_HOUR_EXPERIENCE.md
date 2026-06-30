# First Hour Experience

**Program:** Vssyl Product Readiness Program  
**Date:** 2026-06-30  
**Purpose:** Define the ideal first hour after signup and success criteria for onboarding

**Constraint:** Build on existing surfaces (`DashboardBuildOutModal`, `DashboardTemplates`, `businessBootstrapService`, `AIOnboardingFlow`) — no new architecture.

---

## Success definition

A user has a **successful first hour** when they:

1. Understand which workspace type they are in (personal or business)
2. Have a non-empty dashboard or active business workspace
3. Complete **one meaningful action** in a core or installed module
4. Know where to get help and upgrade billing if needed
5. (Business admin) Have invited at least one teammate **or** installed one business module

---

## Ideal timeline

### Minute 0 — Account created

| Ideal | Current | Gap |
|-------|---------|-----|
| User lands authenticated on `/dashboard` | ✅ Same | — |
| Welcome moment explains "this is your personal workspace" | ❌ | Add copy to build-out modal header |
| Default dashboard tab exists immediately | ⚠️ Lazy create | Create at register |
| Intent captured: personal / business / joining team | ❌ | Branch in build-out modal |

**Success criteria:** User sees named dashboard tab ("My Dashboard") within 5 seconds of redirect.

---

### Minute 5 — Orientation

| Ideal | Current | Gap |
|-------|---------|-----|
| Build-out modal or template picker opens | ✅ Build-out modal if empty | Templates secondary |
| Three clear paths: Personal setup / Create business / I have an invite | ❌ | Extend `DashboardBuildOutModal` |
| Quick-setup presets (Basic Workspace, Collaboration Hub) | ✅ In build-out modal | — |
| Optional: 60-second product tour (3 tooltips) | ❌ | Defer — use modal copy first |
| Link to Getting Started doc | ❌ | `/docs` stub |

**Success criteria:** User selects at least one module/widget or template; dashboard is non-empty.

---

### Minute 15 — First module interaction

| Ideal | Current | Gap |
|-------|---------|-----|
| User opens Drive, Chat, or Calendar from dashboard | ✅ Widgets/hubs work | — |
| Guided first task suggestion | ❌ | e.g., "Upload a file" / "Send a message" |
| AI optional intro | ⚠️ Separate `/ai` flow | Link from build-out: "Meet your AI" |
| Empty states with CTAs in modules | ✅ UX L2 on certified modules | — |

**Success criteria:** User completes one core action:

- **Drive:** Upload or create folder
- **Chat:** Send message (self or existing thread)
- **Calendar:** Create event
- **AI:** Send first prompt

---

### Minute 30 — Expansion

| Ideal | Current | Gap |
|-------|---------|-----|
| Discover marketplace | ⚠️ `/modules` | Login wall already satisfied |
| Install one free module (personal) | ✅ | — |
| Business admin: create business if not done | ⚠️ Manual discovery | Post-signup branch |
| Business admin: bootstrap complete | ✅ On create | — |
| View pricing / upgrade if needed | ⚠️ `BillingModal` only | `/billing` 404 |

**Personal success criteria:** One marketplace module installed **or** user dismisses marketplace with clear "add later" path.

**Business admin success criteria:** Business created; lands on `/business/[id]/workspace`; sees setup checklist.

---

### Minute 60 — Team & habit formation

| Ideal | Current | Gap |
|-------|---------|-----|
| Business admin sends first invite | ❌ Accept page missing | P0 |
| Employee accepts and lands in workspace | ❌ | P0 |
| User bookmarks core module or sets dashboard layout | ✅ | — |
| User knows support path | ❌ | `/help` stub; support API broken |
| Optional: email verification completed | ⚠️ | Not enforced |

**Business success criteria:** One invited member active in workspace **or** admin completes checklist item (module install, billing setup).

**Personal success criteria:** User returns-ready — knows where Drive/Chat/Calendar live; optional Pro upgrade considered.

---

## Persona-specific first hour

### Personal user (happy path)

```
Register → Dashboard → Build-out modal → Select "Personal Productivity" template
→ Open Drive widget → Upload file → (optional) Browse /modules → Install free app
```

**Target time to first action:** < 10 minutes  
**Current:** Achievable but undirected — ~15–25 minutes median

### Business administrator (happy path)

```
Register → Build-out modal → "Create a business" → /business/create
→ Bootstrap (drive, chat, calendar) → Workspace hub → Setup checklist
→ Install HR or scheduling (optional) → Invite employee → Employee accepts
```

**Target time to team active:** < 60 minutes  
**Current:** **Blocked** at invite accept — requires manual member add or token paste in `WorkTab`

### Employee (happy path)

```
Receive email → /auth/accept-invitation → Login or register → Accept token
→ /business/[id]/workspace → Complete HR onboarding if assigned → First module use
```

**Target time to workspace:** < 15 minutes  
**Current:** **Blocked** — no accept page

### Developer (happy path)

```
Register → Footer/docs → Developer quickstart → /modules/submit → Metadata saved
→ (later) Artifact upload
```

**Target time to submission started:** < 45 minutes  
**Current:** Marginal — must discover submit path without public docs

---

## Onboarding success criteria (measurable)

| Metric | Target | Current estimate |
|--------|--------|------------------|
| Signup → non-empty dashboard | < 5 min, > 90% | ~60% (empty flash, skip modal) |
| Signup → first core module action | < 15 min median | ~40% without guidance |
| Business create → bootstrap complete | < 10 min, > 95% | ~90% |
| Invite sent → member active | < 24 hr, > 95% | **~0%** via email link |
| Signup → support doc viewed | > 30% when stuck | **~0%** (stub) |
| Paid conversion from landing CTA | Tracked | Not evidenced |

---

## Preserve vs add

| Existing asset | Role in first hour |
|----------------|-------------------|
| `DashboardBuildOutModal` | **Primary** first-run surface — extend, don't replace |
| `DashboardTemplates` | **Surface** in build-out — "Start from template" |
| `quickSetupOptions` in build-out | **Keep** — maps to personas |
| `AIOnboardingFlow` | **Optional** branch — not required minute 0 |
| `getBusinessSetupStatus` checklist | **Business** minute 30–60 guide |
| HR onboarding journeys | **Post** member onboarding — not first hour |

**Do not build:** Full product tour library until modal + docs branches prove insufficient.

---

## Failure modes to address (priority)

| Failure | User feeling | Fix wave |
|---------|--------------|----------|
| Empty dashboard | "Is something broken?" | Wave 3 / 7 |
| Invite 404 | "My company sent a broken link" | Wave 2 |
| `/billing` 404 | "I can't pay" | Wave 2 |
| No help | "I'm alone" | Wave 1 docs |
| Install button 403 (employee) | "This product is broken" | Wave 5 |

---

## Evidence index

| Artifact | Path |
|----------|------|
| Build-out modal | `web/src/components/DashboardBuildOutModal.tsx` |
| Templates | `web/src/components/dashboard/DashboardTemplates.tsx` |
| Onboarding review | `docs/go-to-market/ONBOARDING_EXPERIENCE_REVIEW.md` |
| Dashboard client | `web/src/app/dashboard/DashboardClient.tsx` |

---

*Planning artifact only — no implementation authorized.*
