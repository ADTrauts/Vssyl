# Workforce Communications UX Audit

**Phase:** Business Operations Phase 0C — Discovery only  
**Status:** Reality assessment (not certified)  
**Last updated:** 2026-06-14  
**Framework:** 11-category assessment (mapped to [`UX_CERTIFICATION_SCORECARD.md`](../ux/UX_CERTIFICATION_SCORECARD.md))  
**References:** Notifications UX Reference #2, Chat L3, Business Workspace WS-L1 — comparison only  
**Related:** [WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](./WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md)

---

## Scope

There is **no Workforce Communications module UX** to certify. This audit evaluates **surrogate surfaces** that stakeholders may mistake for workforce operational messaging:

- Business front-page announcements (`BusinessFrontPage.tsx`, `AnnouncementsWidget.tsx`, `FrontPageContentEditor.tsx`)
- Chat workspace (reference comparison — not re-certified)
- Notification Center (`web/src/app/notifications/page.tsx`)
- Scheduling realtime UX (sync indicators only — not a comms surface)

**Not in scope:** Full Chat/Notifications re-certification; Scheduling/HR module interiors.

---

## Status legend

| Status | Meaning |
|--------|---------|
| **PASS** | Meets UX Constitution / reference bar for category |
| **PASS WITH FINDINGS** | Meets bar with documented exceptions |
| **FAIL** | Material violation |
| **NOT PRESENT** | Surface or pattern missing |
| **UNKNOWN** | Requires manual QA not performed in this discovery phase |

---

## Surrogate surface summary

| Surface | UX maturity | Workforce comms fit |
|---------|-------------|---------------------|
| Front-page announcements | LOW–MEDIUM | Partial — static CMS, no audience/ack UX |
| Announcements widget | LOW–MEDIUM | Read-only list; no interaction beyond display |
| Chat | HIGH (collaboration) | Wrong model for operational broadcasts |
| Notification Center | MEDIUM (delivery) | Workflow alerts; not comms authoring |
| Workforce comms hub | NOT PRESENT | No dedicated UX |

---

## 11-category assessment — front-page announcements

| # | Category | Status | Evidence / findings |
|---|----------|--------|---------------------|
| 1 | **Information architecture** | PASS WITH FINDINGS | Announcements live in branding/front-page editor and render on business landing + widget. Finding: not integrated with workforce modules or org-chart audience picker on content. |
| 2 | **Visual hierarchy** | PASS WITH FINDINGS | Priority badges (`urgent`, `high`, `medium`, `low`) in `AnnouncementsWidget.tsx`. Hardcoded Tailwind colors — token drift vs `--v-*` standard. |
| 3 | **Layout consistency** | PASS WITH FINDINGS | Widget uses `WidgetRegistry` patterns. Editor embedded in broader front-page CMS — consistent with business branding UX, not workforce ops UX. |
| 4 | **Navigation** | PASS WITH FINDINGS | Accessible from business front page; widget on customizable layout. No deep link to "announcement detail" or ack flow. |
| 5 | **Workflow clarity** | FAIL | Admin can author and expire announcements. **No** employee acknowledgement workflow, **no** "required reading" state, **no** delivery confirmation. |
| 6 | **Feedback and loading states** | PASS WITH FINDINGS | `WidgetLoading`, `WidgetError`, `WidgetEmpty` in announcements widget. |
| 7 | **Error handling** | PASS WITH FINDINGS | Fetch errors surfaced in widget. |
| 8 | **Accessibility** | UNKNOWN | No automated a11y audit in Phase 0C. |
| 9 | **Responsiveness** | UNKNOWN | Not verified at 375px in this phase. |
| 10 | **Data density / enterprise usability** | PASS WITH FINDINGS | Simple list adequate for static announcements. Insufficient for operational comms (audience, ack status, audit). |
| 11 | **Reference UX compliance** | FAIL | No Global Trash, no notifications on publish, no workforce audience UX. Priority `urgent` label may imply emergency capability that **does not exist** architecturally. |

---

## 11-category assessment — Notification Center (workforce workflow subset)

| # | Category | Status | Evidence / findings |
|---|----------|--------|---------------------|
| 1 | **Information architecture** | PASS WITH FINDINGS | Reference #2 patterns; `hr_*` types grouped by prefix inference (`notifications/page.tsx` L179). |
| 2 | **Visual hierarchy** | PASS WITH FINDINGS | Module icons; priority display. |
| 3 | **Layout consistency** | PASS | Aligns with Notifications UX Reference. |
| 4 | **Navigation** | PASS WITH FINDINGS | `actionUrl` in HR notification data deep-links to HR workspace. |
| 5 | **Workflow clarity** | PASS WITH FINDINGS | Clear for **workflow alerts** (PTO approved, onboarding task). **FAIL risk:** users may expect schedule-change **campaigns** — `scheduling_*` types absent. |
| 6 | **Feedback and loading states** | PASS | Reference patterns. |
| 7 | **Error handling** | PASS WITH FINDINGS | Standard patterns. |
| 8 | **Accessibility** | UNKNOWN | — |
| 9 | **Responsiveness** | UNKNOWN | — |
| 10 | **Data density** | PASS WITH FINDINGS | Adequate for alert inbox. Not designed for broadcast campaign management. |
| 11 | **Reference compliance** | PASS WITH FINDINGS | Delivery UX meets reference. **Not** a workforce communications product surface. |

---

## 11-category assessment — Chat (boundary comparison only)

| # | Category | Status | Evidence / findings |
|---|----------|--------|---------------------|
| 1–11 | **Overall** | PASS (Chat L3) | Chat UX is mature for **collaboration**. CHANNEL filter exists in types but primary UI creates DIRECT/GROUP. **Not assessed for workforce comms certification** — wrong audience model. |

---

## Gap UX — missing workforce communications patterns

| Expected pattern | Status | User impact |
|------------------|--------|-------------|
| Compose workforce broadcast | NOT PRESENT | Admins use front-page CMS or ad-hoc Chat groups |
| Select department/role audience | NOT PRESENT on announcements | Business-wide only |
| Emergency alert banner | NOT PRESENT | `urgent` priority on CMS is cosmetic only |
| Required acknowledgement UI | NOT PRESENT | No compliance read-and-ack flow |
| Campaign inbox / sent history | NOT PRESENT | No audit UX |
| Schedule-change operational message | NOT PRESENT | Silent socket refresh only |
| Read receipt dashboard (workforce) | NOT PRESENT | Chat receipts only |

---

## False-positive UX risks

| Surface | Misleading UX signal | Reality |
|---------|---------------------|---------|
| Announcement `priority: urgent` | Implies emergency alert system | Static CMS field only |
| Chat CHANNEL type in API | Implies department channels | No distinct CHANNEL UX or dept binding |
| Notification Center | Implies all workforce messages arrive here | Scheduling changes do not create notifications |
| Scheduling grid refresh | Implies user was "notified" of change | Client-side sync only |

Detail: [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md) § FALSE POSITIVES.

---

## Category summary (front-page surrogate)

| Result | Count |
|--------|-------|
| PASS | 0 |
| PASS WITH FINDINGS | 7 |
| FAIL | 2 |
| NOT PRESENT | 0 |
| UNKNOWN | 2 |

---

## Certification statement

**No certification awarded.** No Workforce Communications module UX exists. Surrogate surfaces are **usable for their actual owners** (CMS, Chat, Notifications) but **do not meet** workforce operational messaging UX requirements.
