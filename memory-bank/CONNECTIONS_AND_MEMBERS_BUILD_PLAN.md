# Connections & Member Management Build Plan

**Status:** Complete (Phases 1–4)  
**Source of truth for:** Personal connections viewer, business “Members” experience, Colleagues/Household/Businesses categories  
**Created:** March 2026

---

## 1. Overview

### 1.1 Vision

- **Personal context:** One “connections” experience with clear categories: broad user-to-user connections, household members, and Vssyl Place businesses (follows). Colleagues appear only while they’re in a shared business; to stay in touch after they leave, users add a personal connection.
- **Business context:** “Members” (not “connections”): full roster, org chart/department view, hub for chat/files. Same concept, different name and UX.
- **Principle:** Interaction stays seamless but compartmentalized by context (personal vs work).

### 1.2 Out of Scope for This Build

- Changing core Relationship or BusinessMember schema unless a phase explicitly requires it.
- **Phase 4** adds: pinned colleagues, Place deep link, and colleague last-active (see §2 Phase 4).

---

## 2. Phased Plan

Work **phase by phase**. After each phase:

1. Run the app and relevant flows; fix any errors.
2. Confirm the phase is complete per the deliverables below.
3. **Ask:** “Phase N is complete. Ready to start Phase N+1?” and wait for user confirmation before starting the next phase.

---

### Phase 1: Personal Connections Viewer (Member Management)

**Goal:** Add Household and “Businesses I follow” to the Member Management page and make Colleagues mean “current colleagues only.”

#### 1.1 Add “Household” tab/section

- **Where:** `/member` page, same tab row as Connections / Pending / Sent / Analytics; within the Connections tab, add Household alongside All / Colleagues / Personal.
- **Behavior:** When “Household” is selected, list the current user’s households and their members (from Household + HouseholdMember). Read-only list or link to existing household management as needed.
- **Backend:** Reuse existing household APIs (e.g. list user’s households, list members). Add a small API or extend an existing one only if the current APIs don’t support “my households + their members” in one place.
- **Deliverables:**
  - [x] Household appears as a filter/tab in the connections viewer (e.g. under “Your Connections”: All | Colleagues | Personal | **Household**).
  - [x] Household members display correctly; no console or API errors.

#### 1.2 Add “Businesses” (or “Following”) tab/section

- **Where:** Same connections viewer; add “Businesses” or “Following” as a filter/tab.
- **Behavior:** List businesses the user follows (BusinessFollow). Show business name and optional link to Place/Explore.
- **Backend:** Use or add GET “my followed businesses” (e.g. from businessController or member module). BusinessFollow already exists.
- **Deliverables:**
  - [ ] “Businesses” or “Following” tab shows followed businesses.
  - [x] List loads and displays without errors.

#### 1.3 Colleagues = “current colleagues only”

- **Definition:** Colleagues = accepted Relationship (either direction) where the other user is **currently** an active member of at least one business the current user is in. If they leave the business, they disappear from Colleagues (but remain under Personal if a REGULAR connection exists).
- **Backend:** Adjust the Colleagues list (or the existing “connections” endpoint when `type=colleague`) to filter by “other user is active BusinessMember in a business I’m in.” Use Relationship type COLLEAGUE and/or shared active BusinessMember; do not show users who have left all shared businesses.
- **Frontend:** Colleagues tab uses this filtered list; no change to Personal tab logic beyond relying on the new backend behavior.
- **Deliverables:**
  - [x] Colleagues tab only shows people who are current members of a shared business.
  - [ ] After a test user “leaves” a business, they no longer appear under Colleagues (and still appear under Personal if a REGULAR connection exists).

**Phase 1 complete when:** All Phase 1 deliverables are checked, errors are fixed, and the product owner confirms. Then ask: **“Phase 1 is complete. Ready to start Phase 2?”**

---

### Phase 2: Business Context “Members”

**Goal:** In business context, show “Members” in the sidebar and route to the workspace members page; replace mock data with real API and add org chart/department view.

#### 2.1 Sidebar label and route in business context

- **Where:** Sidebar/navigation when the active context is a business (e.g. Work tab, business workspace).
- **Change:** The entry that currently shows “Connections” in business context should show **“Members”** (or “Team”) and route to the business workspace members page (e.g. `/business/[id]/workspace/members`).
- **Deliverables:**
  - [ ] In business context, sidebar shows “Members” (or “Team”) instead of “Connections” for this module.
  - [ ] Clicking it goes to the workspace members page for that business.

#### 2.2 Workspace members page: real API

- **Where:** `web/src/app/business/[id]/workspace/members/page.tsx`.
- **Change:** Remove mock data. Call the real business members API (e.g. `getBusinessMembers(businessId)` from `web/src/api/member.ts` or `businessAPI.getBusinessMembers` from `web/src/api/business.ts`). Choose one source of truth (member or business API) and use it consistently for this page and, if applicable, business profile MemberManagement.
- **Deliverables:**
  - [ ] Workspace members page loads real business members.
  - [ ] Loading and error states work; no mock data.

#### 2.3 Org chart / department view

- **Where:** Same workspace members page.
- **Change:** Add a view (tab or toggle) that groups members by department or org chart. Use existing org chart data (Department, Position, EmployeePosition, etc.); no new schema unless required. Can be a simple “By department” list or tree.
- **Deliverables:**
  - [ ] Members can be viewed grouped by department (or org structure).
  - [ ] No regressions on the default list view.

**Phase 2 complete when:** All Phase 2 deliverables are checked, errors are fixed, and the product owner confirms. Then ask: **“Phase 2 is complete. Ready to start Phase 3?”**

---

### Phase 3: Polish and Consistency

**Goal:** Optional avatar/UX tweaks, “add personal connection” affordance, and consistent use of one business-members API.

#### 3.1 Optional: Professional avatar in business context

- **Where:** Any place that shows user avatars in the business workspace (e.g. members list, chat, headers).
- **Change:** If desired, use a different avatar style or asset when rendering users in business context (e.g. more formal/default avatar). Document the rule (e.g. “business context → professional avatar”).
- **Deliverables:**
  - [ ] Decision recorded: same avatar vs “professional” avatar in business context.
  - [ ] If “professional” avatar is chosen, it’s applied in at least the workspace members list.

#### 3.2 Optional: “Add as personal connection” from Colleagues

- **Where:** Member Management, Colleagues list (and optionally workspace members list).
- **Change:** For users who are colleagues but not yet personal connections, show an action like “Add as personal connection” that sends a REGULAR connection request (or links to Search & Connect with that user pre-filled). Improves “maintain connection after they leave” flow.
- **Deliverables:**
  - [ ] Decision recorded: include or defer.
  - [ ] If included: action visible and functional from Colleagues (and optionally from business members).

#### 3.3 Single source of truth for business members API

- **Where:** Backend (business vs member routes) and frontend callers (business profile MemberManagement, workspace members page).
- **Change:** Standardize on one API for “business roster” (either `/api/business/:id/members` or `/api/member/business/:businessId/members`). Update all frontend callers to use that API; document which one is canonical. If both remain, document when to use which and ensure behavior (roles, permissions, invite) is consistent.
- **Deliverables:**
  - [ ] One canonical API for loading/updating business members in the app.
  - [ ] Business profile and workspace members page both use it; no duplicate or conflicting logic.

**Phase 3 complete when:** All Phase 3 deliverables are checked, errors are fixed, and the product owner confirms.

---

### Phase 4: Groups/Pinned Colleagues, Place Integration, Colleague Presence

**Goal:** Add “people I work with most” (pinned colleagues), deep link from “Businesses I follow” to Place, and show last active on workspace members.

#### 4.1 Groups / Pinned colleagues

- **Where:** Business workspace (e.g. workspace members page and/or a “Pinned” section on the business hub/landing).
- **Behavior:** User can pin colleagues per business; pinned list is shown first (e.g. “People I work with most” or “Pinned”). Pin/unpin via member row or context menu.
- **Backend:** New model or user-scoped storage for pinned colleague list (e.g. `PinnedColleague`: userId, businessId, pinnedUserId, order — or store in UserPreference/dashboard config as list of userIds per business).
- **Deliverables:**
  - [x] Data model `PinnedColleague` and API: GET/POST/DELETE `/api/member/business/:businessId/pinned` (list, pin, unpin).
  - [x] Workspace members page: “People I work with most” section at top when any pinned; pin/unpin (Pin/PinOff icon) on each row in list and department views.
  - [ ] Optional: business hub/landing widget showing pinned colleagues with quick actions (chat, etc.).

#### 4.2 Place integration (deep link)

- **Where:** Member Management “Following” tab (and any “View on Place” links).
- **Behavior:** “View on Place” / “Explore Place” opens Place with “My Place” tab and, when applicable, highlights or focuses the node for that business (so the followed business is easy to find on the graph).
- **Deliverables:**
  - [x] Place page reads `?tab=` and `?highlight=businessId`; PlaceGraph accepts `highlightBusinessId` and opens business profile panel when node exists.
  - [x] ConnectionList “Following” “View on Place” links use `/place?tab=my-place&highlight=<businessId>`.

#### 4.3 Colleague presence (last active)

- **Where:** Workspace members list (and optionally business profile members).
- **Behavior:** Show “Last active” per member (e.g. “2h ago”, “Never”). Data can be “last seen” from app activity, not necessarily real-time presence.
- **Backend:** Add `lastActiveAt` (or reuse existing if any) on User; update on authenticated requests or key actions (middleware or per-route). `getBusinessMembers` returns this for each member’s user.
- **Deliverables:**
  - [x] User model has `lastActiveAt`; auth middleware updates it on each authenticated request; migration applied.
  - [x] `getBusinessMembers` returns `lastActive` (ISO string) per member; frontend shows it in list view (department view can be extended later).

**Phase 4 complete when:** All Phase 4 deliverables are checked, errors fixed, and product owner confirms.

---

## 3. After All Phases

When Phases 1–3 are complete:

1. **Ask:** “All phases are complete. Are there any **additional features** you want for connections or member management in this build?”
2. **Then suggest** possible follow-ups, for example:
   - Groups / pinned colleagues (“people I work with most”) in the business hub.
   - Notifications when a colleague leaves a shared business (with prompt to add personal connection).
   - Export or sync of “my connections” (e.g. CSV or backup).
   - Richer Place integration (e.g. “Businesses I follow” deep link to Place graph).
   - Colleague presence or “last active” in workspace members list.
   - Bulk “add as personal connection” from business roster.

---

## 4. Key Files Reference

| Area | Files |
|------|--------|
| Member Management page | `web/src/app/member/page.tsx` |
| Connection list / filters | `web/src/components/member/ConnectionList.tsx` |
| Member API (connections, business members) | `web/src/api/member.ts` — **canonical** for business roster: `getBusinessMembers`, `updateEmployeeRole`, `removeEmployee` |
| Business API (members, invite) | `web/src/api/business.ts` — use for getBusiness (includes members for profile); update/remove use member API |
| Workspace members page | `web/src/app/business/[id]/workspace/members/page.tsx` |
| Sidebar / context routing | `web/src/contexts/DashboardContext.tsx`, `web/src/components/sidebar/LeftSidebarCustomizer.tsx`, business workspace layout/sidebar |
| Backend: personal connections | `server/src/controllers/memberController.ts`, `server/src/routes/member.ts` |
| Backend: business members | `server/src/controllers/businessController.ts`, `server/src/routes/business.ts` |
| Household | `server/src/routes/household.ts`, `server/src/controllers/householdController.ts`; `prisma/modules/business/household.prisma` |
| Business follow | `server/src/controllers/businessController.ts` (follow/unfollow); `BusinessFollow` in `prisma/modules/business/business.prisma` |
| Org chart | `prisma/modules/business/org-chart.prisma`; org chart services/components as needed |

---

## 5. Workflow Summary

- Work **one phase at a time**.
- After each phase: test, fix errors, confirm deliverables, then ask: **“Phase N is complete. Ready to start Phase N+1?”**
- After Phase 3: ask for **additional features**, then offer **possible follow-up features** as above.

This document is the **source of truth** for this build; update it if scope or deliverables change (with a short note and date).
