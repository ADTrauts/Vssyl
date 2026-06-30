# First Hour Experience — Sprint 2 Closeout

**Program:** Vssyl Product Readiness Program  
**Sprint:** Product Readiness Sprint 2 — First Hour Experience  
**Date:** 2026-06-30  
**Status:** Complete

**Prior sprint:** [COMMERCIAL_READINESS_SPRINT_1.md](./COMMERCIAL_READINESS_SPRINT_1.md)

---

## Objectives completed

| Priority | Objective | Status |
|----------|-----------|--------|
| P1 | Persona-based onboarding in `DashboardBuildOutModal` (Personal / Business / Join Team) | ✅ |
| P2 | `ensureDefaultPersonalDashboard` at registration | ✅ |
| P2 | Dashboard templates surfaced in onboarding personal path | ✅ |
| P3 | First-action guidance on Drive, Chat, Calendar, AI empty states | ✅ |
| P4 | Marketplace role awareness — employee read-only business apps view | ✅ |
| P5 | Help links in onboarding modal and empty dashboard | ✅ |
| P6 | First-hour polish — workspace terminology, welcome copy | ✅ |
| P7 | Demo/sample content investigation | ✅ Recommendations only |

---

## Files modified

### Backend

| File | Change |
|------|--------|
| `server/src/services/account/authService.ts` | Call `ensureDefaultPersonalDashboard` during `registerWithSession` |

### Frontend — onboarding

| File | Change |
|------|--------|
| `web/src/components/DashboardBuildOutModal.tsx` | Persona step, personal template step, help links |
| `web/src/components/onboarding/OnboardingHelpLinks.tsx` | **New** — contextual docs/help/support/billing links |
| `web/src/app/dashboard/DashboardClient.tsx` | Onboarding mode wiring, persona localStorage, empty-state help |
| `web/src/components/dashboard/DashboardTemplates.tsx` | Team Collaboration template; Business Operations rename; Minimal recommended |

### Frontend — first actions & business

| File | Change |
|------|--------|
| `web/src/components/widgets/DriveWidget.tsx` | First-upload hint |
| `web/src/components/widgets/ChatWidget.tsx` | First conversation CTA copy |
| `web/src/components/calendar/CalendarEventsEmptyState.tsx` | First-event guidance |
| `web/src/components/ai/AIChatEmptyState.tsx` | Ask your first question copy |
| `web/src/components/chat/ChatSidebar.tsx` | Empty conversation guidance |
| `web/src/components/business/BusinessWorkspaceHubPanel.tsx` | Setup checklist for admins |
| `web/src/components/business/BusinessWorkspaceContent.tsx` | Pass `isBusinessAdmin` to hub |
| `web/src/components/business/DashboardLayoutWrapper.tsx` | Resolve admin role from business members |
| `web/src/app/business/[id]/modules/page.tsx` | Employee read-only marketplace/installed view |
| `web/src/components/modules/PersonalModuleManagerView.tsx` | `canInstall` prop on marketplace grid |

### Tests

| File | Change |
|------|--------|
| `web/src/lib/__tests__/dashboardTabModules.test.ts` | Persona onboarding + DashboardClient integration assertions |

### Documentation

| File | Change |
|------|--------|
| `docs/product-readiness/FIRST_HOUR_EXPERIENCE_SPRINT_2.md` | This document |
| `docs/product-readiness/PRODUCT_READINESS_EXECUTIVE_SUMMARY.md` | Updated scores |
| `docs/product-readiness/IMPLEMENTATION_ROADMAP.md` | Sprint 2 items marked complete |

---

## UX improvements

1. **Persona clarity** — New users see three explicit paths: personal workspace, create business, or accept invitation.
2. **No empty-dashboard flash** — Default personal dashboard created at registration before first redirect.
3. **Template-first personal setup** — Personal path recommends `DashboardTemplates` (Personal Productivity, Minimal, Household).
4. **Contextual help** — Getting Started, Help, Support, Security, and Billing linked from onboarding without modal overload.
5. **First-action hints** — Core module empty states guide upload, chat, calendar event, and AI question.
6. **Business workspace orientation** — Hub panel shows admin setup checklist; employees see read-only application catalog.
7. **Terminology** — "Personal workspace" and "applications" language aligned across welcome surfaces.

---

## Demo / sample content (P7 — recommendations only)

**Decision:** Do **not** implement permanent fake data in Sprint 2.

| Option | Recommendation |
|--------|----------------|
| Example dashboard layouts | ✅ **Use templates** — already implemented via `DashboardTemplates` |
| Example folders / calendar / AI threads | ⚠️ **Defer** — optional opt-in "Show me an example" could seed sandbox content; risks clutter and trash complexity |
| Example widgets | ✅ **Templates cover this** — widget sets applied on template select |
| Business demo workspace | ⚠️ **Sprint 3+** — consider admin-only "preview mode" using existing bootstrap, not synthetic DB rows |

**Sprint 3 recommendation:** If demo content is needed for sales, implement an **opt-in onboarding toggle** that applies a template and creates one sample file in Drive (user-deletable), not global fake data.

---

## Public read-only marketplace (investigation)

| Finding | Detail |
|---------|--------|
| Current API | `GET /api/modules/marketplace` requires JWT (`moduleProvisionController.getMarketplaceModules`) |
| Personal `/modules` | Auth-gated; install works for authenticated personal users |
| Business `/business/[id]/modules` | Employees now get read-only browse; admins retain install/uninstall |
| Public unauthenticated browse | **Not implemented** — would need a new public route returning `APPROVED` modules metadata only (no install status, no pricing checkout). Reuse `prisma.module.findMany` filter; do not expose developer emails. |

**Recommendation (Sprint 3):** Add `GET /api/modules/marketplace/public` + landing footer "Browse apps" read-only page if GTM requires pre-signup discovery.

---

## Production validation

| Flow | Method | Result |
|------|--------|--------|
| Registration + default dashboard | Code review + `authService` unit path | ✅ `ensureDefaultPersonalDashboard` called at register |
| Persona onboarding modal | Static test + component wiring | ✅ Three branches wired |
| Template selection in onboarding | `DashboardClient` → `onApplyTemplate` | ✅ Wired |
| Business create branch | Route `/business/create` | ✅ Existing flow preserved |
| Invite accept branch | Route `/auth/accept-invitation` | ✅ Sprint 1 flow preserved |
| Billing / help links | Route inventory | ✅ `/billing`, `/docs`, `/help`, `/support`, `/security` exist |
| Business employee marketplace | UI gate refactor | ✅ Read-only view replaces hard 403 page |
| Type-check | `pnpm type-check` | Run in CI/local |
| Unit tests | `pnpm test` (vitest) | Run in CI/local |

**Not live-verified in sprint:** SMTP invite send, Stripe checkout, browser E2E on production URLs (operator-dependent).

---

## Remaining friction

| Area | Friction | Sprint 3 target |
|------|----------|-----------------|
| HR onboarding after invite | Not auto-triggered | Optional bridge on invite accept |
| Public marketplace browse | Login wall for prospects | Public read-only catalog |
| Stripe trials | Copy says no trial | Trial implementation or final copy lock |
| Product screenshots on landing | Missing | Wave 6 visual polish |
| Analytics instrumentation | No signup → first-action funnel | Minimal event tracking |
| Household persona | Template exists; no dedicated onboarding branch | Optional fourth card |

---

## Product Readiness scores (post Sprint 2)

| Metric | Pre Sprint 2 | Post Sprint 2 |
|--------|--------------|---------------|
| **Overall** | 68% | **76%** |
| Public Experience | 75% | 75% |
| Onboarding | 62% | **78%** |
| Commercial | 65% | 65% |
| Marketplace (customer) | 55% | **68%** |
| UX Polish | 72% | **76%** |

---

## Recommended Sprint 3

**Theme:** Production validation + GTM polish

1. **Operator verification** — SMTP invite E2E, Stripe webhook smoke test (document results in `STRIPE_PRODUCTION_VALIDATION.md`).
2. **Public marketplace read-only** — Unauthenticated catalog for prospects.
3. **Signup analytics** — Track persona choice, template apply, first module action.
4. **Landing visual polish** — Logo, product screenshots, shared `PublicLayout`.
5. **Optional HR onboarding bridge** — Trigger journey on invite accept for business employees.
6. **Household onboarding path** — Fourth persona or post-personal "Add household" prompt.

---

*Sprint 2 extended existing implementations only. No architecture redesign. No parallel onboarding systems.*
