# Scheduling UX Audit

**Module id:** `scheduling`  
**Phase:** Business Operations Phase 0A — Discovery only  
**Status:** Reality assessment (not certified)  
**Last updated:** 2026-06-14  
**Framework:** 11-category assessment (mapped to [`UX_CERTIFICATION_SCORECARD.md`](../ux/UX_CERTIFICATION_SCORECARD.md))  
**References:** Calendar UX Reference #5 (time-grid), Drive UX Reference #1 — comparison only  
**Related:** [SCHEDULING_ARCHITECTURE_AUDIT.md](./SCHEDULING_ARCHITECTURE_AUDIT.md)

---

## Scope

Business workspace scheduling surfaces:

- `/business/[id]/workspace/scheduling` (admin default)
- `/business/[id]/workspace/scheduling/me` (employee)
- `/business/[id]/workspace/scheduling/team` (manager)
- `SchedulingWidget` dashboard projection

**Not in scope:** HR attendance UI, calendar module interiors, todo smart scheduling.

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

## 11-category assessment

| # | Category (Phase 0A) | Scorecard mapping | Status | Evidence / findings |
|---|---------------------|-------------------|--------|---------------------|
| 1 | **Information architecture** | Navigation + Discoverability | PASS WITH FINDINGS | Clear admin/me/team views via `SchedulingLayout` + `SchedulingSidebar`; URL `?view=` routing; hub integrated in business workspace. Finding: uses `SchedulingLayout` not `SchedulingWorkspaceLanding` naming convention. |
| 2 | **Visual hierarchy** | Layout Consistency + tokens | FAIL | Widespread `bg-blue-*`, `text-gray-500` on light surfaces; drag overlay uses hardcoded blues. Files: `ScheduleBuilderVisual.tsx`, `SchedulingAdminContent.tsx`, `OpenShiftsList.tsx`. |
| 3 | **Layout consistency** | Layout Consistency | PASS WITH FINDINGS | Consistent sidebar + content split across views; schedule builder is custom dense grid (appropriate for domain). Does not use documented `WorkspaceSplitLayout` / `PageHeader`+`PageToolbar` archetype uniformly. |
| 4 | **Navigation** | Navigation | PASS WITH FINDINGS | Sidebar view switching; business workspace entry via module switch; admin redirect from `/admin/scheduling` to workspace. Deep links via `?view=`. |
| 5 | **Workflow clarity** | Workflow Completion | PASS WITH FINDINGS | Admin builder → publish path exists. Employee availability/swap/claim flows present. **FAIL risk:** manager workflows call 501 APIs (team publish, assign) — UI may expose dead ends. |
| 6 | **Feedback and loading states** | Loading States + Interaction Consistency | PASS WITH FINDINGS | `SchedulingLayout` loading state; hooks show loading in admin content. Inconsistent skeleton usage across all views. |
| 7 | **Error handling** | Error Handling | PASS WITH FINDINGS | API client throws on non-OK; components display error strings in several views. Silent failures possible when 501 endpoints return without UI guard. |
| 8 | **Accessibility** | Accessibility | UNKNOWN | No automated a11y audit run in Phase 0A. Drag-and-drop builder may lack full keyboard paths. Labels present on some form fields (`AvailabilityManagement.tsx`). |
| 9 | **Responsiveness** | Mobile | UNKNOWN | Schedule builder is desktop-oriented dense grid; no 375px verification in this discovery phase. Employee list views use responsive flex patterns. |
| 10 | **Data density / enterprise usability** | Custom (schedule grid) | PASS WITH FINDINGS | Strong enterprise density in `ScheduleCalendarGrid`, station/position modes, coverage view mode enum. Appropriate for workforce scheduling domain. Complexity may challenge mobile. |
| 11 | **Reference UX compliance** | Cross-Module Integration | FAIL | Native `confirm()` in 6+ files; `prompt()` in `SchedulingEmployeeContent.tsx` (swap notes). Violates UX-L1 blocker (no native confirm/prompt). No Global Trash integration. No scheduling notification UX. Token non-compliance vs `--v-*` standard. |

---

## Category summary

| Result | Count |
|--------|-------|
| PASS | 0 |
| PASS WITH FINDINGS | 7 |
| FAIL | 2 |
| UNKNOWN | 2 |

**Provisional UX posture:** Below UX-L1 bar due to FAIL in Reference UX compliance (native confirm/prompt) and Visual hierarchy (token drift). Not certified.

---

## Reference comparison

### vs Calendar UX Reference #5 (time-grid)

| Aspect | Calendar | Scheduling | Assessment |
|--------|----------|------------|------------|
| Time-grid interaction | Certified patterns | Custom DnD grid (`ScheduleBuilderVisual`, `DraggableShift`) | PASS WITH FINDINGS — domain-appropriate but not reference-aligned |
| Event/shift block rendering | Token-compliant target | `ShiftBlock.tsx` mixed tokens | FAIL on tokens |
| Workspace hub entry | `CalendarWorkspaceLanding` pattern | `SchedulingLayout` | PASS WITH FINDINGS |

### vs Drive UX Reference #1

| Aspect | Drive | Scheduling | Assessment |
|--------|-------|------------|------------|
| Destructive action pattern | Confirm via shared primitives / trash | `confirm()` in admin, builder, availability | FAIL |
| Empty states | Intentional CTAs | Present in sidebars (`EmployeeListSidebar`) | PASS WITH FINDINGS |
| Loading patterns | Shared `Spinner` | Mixed | PASS WITH FINDINGS |

---

## Interaction safety findings

| ID | Severity | Finding | File(s) |
|----|----------|---------|---------|
| UX-SCH-01 | High | Native `confirm()` for delete shift/schedule/template/availability | `SchedulingAdminContent.tsx`, `ScheduleBuilderVisual.tsx`, `ShiftBlock.tsx`, `TemplateBuilderVisual.tsx`, `AvailabilityManagement.tsx` |
| UX-SCH-02 | High | Native `prompt()` for swap request notes | `SchedulingEmployeeContent.tsx` |
| UX-SCH-03 | Medium | Legacy `bg-blue-600`, `bg-blue-500` vs `--v-*` tokens | Multiple scheduling components |
| UX-SCH-04 | Medium | `text-gray-500` on light backgrounds (contrast risk) | `SchedulingDashboard.tsx`, `OpenShiftsList.tsx`, others |
| UX-SCH-05 | Medium | Hub component naming drift (`SchedulingLayout` vs `SchedulingWorkspaceLanding`) | `SchedulingLayout.tsx` |
| UX-SCH-06 | Medium | Manager UI may expose workflows backed by 501 APIs | `SchedulingTeamContent.tsx` + `schedulingTeamController.ts` |

---

## Modernization findings (no waves)

Discovery-only UX improvement areas for future planning:

1. Replace native `confirm()` / `prompt()` with shared modal primitives.
2. Migrate hardcoded blues/grays to `--v-*` design tokens.
3. Align hub naming with `module-development.mdc` convention or document exception.
4. Add explicit error/empty states for 501-backed manager actions.
5. Run manual QA matrix for accessibility and 375px responsive behavior.
6. Integrate Global Trash UX when backend lifecycle exists.

---

## Confirmed facts vs recommendations

### Confirmed facts

- Scheduling has a functional multi-role UI with visual schedule builder.
- Native `confirm()` and `prompt()` are present in production component paths.
- Token drift (`bg-blue-*`, `text-gray-500`) is widespread in scheduling components.
- Business workspace hub integration works via `SchedulingLayout`.

### Recommendations (discovery only)

- Treat interaction safety (UX-SCH-01, UX-SCH-02) as high priority in any future UX program.
- Complete manager API stubs before assessing manager workflow UX as complete.
- Human QA required to resolve UNKNOWN accessibility and mobile categories.

---

## Evidence index

| Category | Path |
|----------|------|
| Hub / layout | `web/src/components/scheduling/SchedulingLayout.tsx` |
| Admin UI | `web/src/components/scheduling/SchedulingAdminContent.tsx` |
| Builder | `web/src/components/scheduling/ScheduleBuilderVisual.tsx` |
| Employee UI | `web/src/components/scheduling/SchedulingEmployeeContent.tsx` |
| Team UI | `web/src/components/scheduling/SchedulingTeamContent.tsx` |
| Availability | `web/src/components/scheduling/AvailabilityManagement.tsx` |
| Open shifts | `web/src/components/scheduling/OpenShiftsList.tsx` |
| UX standards | `docs/ux/UX_CONSTITUTION.md`, `docs/ux/UX_CERTIFICATION_SCORECARD.md` |
| Calendar UX ref | `docs/ux/audits/REFERENCE_MODULE_CALENDAR.md` |
