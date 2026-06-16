# HR UX Audit

**Module id:** `hr`  
**Phase:** Business Operations Phase 0B — Discovery only  
**Status:** Reality assessment (not certified)  
**Last updated:** 2026-06-14  
**Framework:** 11-category assessment (mapped to [UX_CERTIFICATION_SCORECARD.md](../ux/UX_CERTIFICATION_SCORECARD.md))  
**Related:** [SCHEDULING_UX_AUDIT.md](./SCHEDULING_UX_AUDIT.md) (comparison baseline)

---

## Scope

- `/business/[id]/admin/hr/*`
- `/business/[id]/workspace/hr/me`, `/team`
- `HRWidget`, `HRLayout` hub

---

## 11-category assessment

| # | Category | Scorecard mapping | Status | Evidence / findings |
|---|----------|-------------------|--------|---------------------|
| 1 | **Information architecture** | Navigation + Discoverability | PASS WITH FINDINGS | Admin hub cards; workspace me/team/admin paths; `HRSidebar` view routing. Finding: some views redirect to "Coming Soon" (`HRContentView.tsx`). |
| 2 | **Visual hierarchy** | Layout + tokens | FAIL | `bg-blue-600`, `text-gray-500` in analytics dashboards (`AttendanceAnalyticsDashboard.tsx`, `OnboardingAnalyticsDashboard.tsx`, `TimeOffAnalyticsDashboard.tsx`). |
| 3 | **Layout consistency** | Layout Consistency | PASS WITH FINDINGS | `HRPageLayout`, sidebar + content pattern; onboarding uses dedicated task cards. Not uniform `WorkspaceSplitLayout` everywhere. |
| 4 | **Navigation** | Navigation | PASS WITH FINDINGS | Business workspace entry; admin vs workspace routes; onboarding deep pages. |
| 5 | **Workflow clarity** | Workflow Completion | PASS WITH FINDINGS | Employee directory, PTO, onboarding journeys functional. Enterprise sidebar targets stub/coming-soon. `HRLayout` stats use TODO placeholders. |
| 6 | **Feedback and loading states** | Loading + Interaction | PASS WITH FINDINGS | Loading in admin employees page; inconsistent skeletons across analytics. |
| 7 | **Error handling** | Error Handling | PASS WITH FINDINGS | API errors surfaced in several pages; stub endpoints may return success JSON with "pending" message — confusing UX. |
| 8 | **Accessibility** | Accessibility | UNKNOWN | No automated a11y audit in Phase 0B. Onboarding forms have some labels. |
| 9 | **Responsiveness** | Mobile | UNKNOWN | Not verified at 375px in discovery phase. |
| 10 | **Data density / enterprise** | Enterprise usability | PASS WITH FINDINGS | Employee directory and analytics dashboards are data-dense; appropriate for HR admin. |
| 11 | **Reference UX compliance** | Cross-Module Integration | PASS WITH FINDINGS | No widespread native `confirm()` in HR shell (better than Scheduling). **Finding:** `window.confirm` in `OnboardingModuleSettings.tsx` for template archive. No Global Trash. Token drift vs `--v-*`. Hub naming: `HRLayout` not `HRWorkspaceLanding`. |

---

## Category summary

| Result | Count |
|--------|-------|
| PASS | 0 |
| PASS WITH FINDINGS | 8 |
| FAIL | 1 |
| UNKNOWN | 2 |

**Provisional UX posture:** Likely below UX-L2 due to token FAIL; interaction safety better than Scheduling. Not certified.

---

## Reference comparison

| vs Scheduling (Phase 0A) | HR |
|--------------------------|-----|
| Native confirm/prompt | Rare (`OnboardingModuleSettings` only) vs widespread in scheduling |
| Token compliance | Similar `bg-blue-*` drift in analytics |
| Hub naming drift | Both use `*Layout` not `*WorkspaceLanding` |
| Global Trash | Neither integrated |

---

## UX findings (no waves)

| ID | Severity | Finding | File |
|----|----------|---------|------|
| UX-HR-01 | Medium | Token drift in analytics charts | `hr/analytics/*.tsx` |
| UX-HR-02 | Medium | "Coming Soon" dead ends in sidebar views | `HRContentView.tsx` |
| UX-HR-03 | Low | `window.confirm` for template archive | `OnboardingModuleSettings.tsx` |
| UX-HR-04 | Medium | Stub API returns 200 with "pending" — UI may show false completeness | Enterprise routes |
| UX-HR-05 | Low | `HRLayout` dashboard stat TODOs | `HRLayout.tsx` |

---

## Confirmed facts vs recommendations

### Confirmed facts

- HR has usable admin and self-service surfaces for core features.
- UX token drift exists primarily in analytics components.
- Interaction safety is stronger than Scheduling module.

### Recommendations (discovery only)

- Human QA needed for accessibility and mobile (UNKNOWN categories).
- Align stub surfaces with explicit empty/not-available UI states.

---

## Evidence index

| Path |
|------|
| `web/src/components/hr/HRLayout.tsx` |
| `web/src/components/hr/HRContentView.tsx` |
| `web/src/components/hr/analytics/*.tsx` |
| `web/src/app/business/[id]/admin/hr/employees/page.tsx` |
| `docs/ux/UX_CONSTITUTION.md` |
