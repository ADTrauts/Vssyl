# Notebook Healthcare & Operations Use Cases

**Phase:** 0.5  
**Parent:** [NOTEBOOK_WORKSPACE_ARCHITECTURE.md](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md)  
**Date:** 2026-06-01  

**Target market:** Long-term care, healthcare support services, dietary, EVS, plant operations, hospitality operations within Vssyl business workspaces.

---

## How to read these scenarios

Each scenario lists:

- **Page type** and template
- **Notebook role** (narrative + links)
- **Todo role** (committed work)
- **Other modules** (Calendar, Drive, Chat, Place)
- **Phase** when deliverable (1 = MLVP, 2 = links + AI)

---

## 1. Weekly leadership meeting

**Facility:** 120-bed skilled nursing — dietary, EVS, maintenance, nursing leadership.

| Element | Detail |
|---------|--------|
| **Page type** | `meeting` — “Weekly Leadership — [Date]” |
| **Template** | Agenda (Dietary, EVS, Clinical, Plant), Notes, Action items |
| **Calendar** | Recurring Tuesday 9:00 event → link to Page (Phase 2) |
| **Notebook** | Capture discussion: survey findings, staffing, vendor issues |
| **Todo** | Action items: “Dietary — update texture-modified menu by Friday” → assign Food Service Director |
| **Drive** | Link CMS survey letter, kitchen temp logs |
| **Chat** | Optional link #leadership thread for pre-read |
| **Place** | Not primary — unless discussing external food supplier (link listing) |
| **AI** | Phase 2: recap + extract tasks with assignee suggestions |

**Outcome:** One Page per week; leadership sees open actions in **Tasks** nav without losing meeting context.

---

## 2. Department improvement project

**Facility:** EVS — reduce C. diff transmission initiative (90-day project).

| Element | Detail |
|---------|--------|
| **Page type** | `project` — “EVS C. diff Reduction Q2” |
| **Template** | Project brief: goals, baseline metrics, interventions |
| **Notebook** | Status narrative updated biweekly; links to policy SOPs |
| **Todo** | Project `projectId`; tasks: training sessions, audit rounds, supply orders |
| **Drive** | CDC checklist PDF, EPA-approved product spec sheets |
| **Calendar** | Milestone: audit dates, training classes |
| **Analytics** | Phase 3 — infection rate trends via activity (not in Notebook) |
| **Place** | — |

**Outcome:** Project Page is the **story**; Todo board is the **work board**.

---

## 3. New employee onboarding

**Facility:** Dietary department — new dietary aide.

| Element | Detail |
|---------|--------|
| **Page type** | `sop` (Phase 2) or `general` + tags `onboarding`, `dietary` (Phase 1) |
| **Notebook** | Trainer shares read-only SOP pack: hand washing, meal service, allergy protocol |
| **Todo** | HR/Todo onboarding checklist (if HR integration) or manager-created tasks: “Shadow tray line — Day 1” |
| **Drive** | Signed competency forms, ID badge scan |
| **HR module** | Reference HR onboarding journey — Notebook does not replace HR |
| **Chat** | Buddy chat thread link on onboarding Page |
| **Place** | — |

**Outcome:** New hire opens **one shared Page** + task list; not scattered PDFs in email.

---

## 4. Survey readiness

**Facility:** LTC — state survey prep (dietary + EVS + records).

| Element | Detail |
|---------|--------|
| **Page type** | `project` — “Survey Readiness 2026” |
| **Notebook** | Master checklist narrative; tag `survey`; pin on Home |
| **Daily pages** | Shift supervisors use `daily` for floor walks during survey week |
| **Todo** | Tasks per deficiency domain: “Verify food temp logs 30 days”, “EVS closet labeling” |
| **Drive** | Mock survey tools, prior 2567 letters |
| **Calendar** | Mock survey dates, leadership war room blocks |
| **AI** | Phase 2: extract tasks from mock survey notes Page |

**Outcome:** Survey command center Page + task burn-down; not a replacement for compliance software.

---

## 5. Kitchen renovation

**Facility:** Continuing care retirement community — kitchen remodel.

| Element | Detail |
|---------|--------|
| **Page type** | `project` — “Kitchen Renovation 2026” |
| **Notebook** | Scope, contractor contacts, resident meal relocation plan |
| **Todo** | Tasks: temp kitchen setup, vendor RFP, resident communication |
| **Drive** | Floor plans, permits, equipment specs |
| **Calendar** | Construction milestones, service disruption windows |
| **Place** | Link **equipment supplier** or **contractor** Place listing (external) |
| **Plant ops** | Coordination notes with maintenance on HVAC, grease trap |

**Boundary:** Vendor discovery on **Place**; internal execution on **Notebook + Todo**.

---

## 6. Unit action plan

**Facility:** Nursing unit — fall reduction Q1.

| Element | Detail |
|---------|--------|
| **Page type** | `daily` + `project` combo |
| **Daily** | Charge nurse end-of-shift: checklist (rounds, high-risk residents, equipment) |
| **Project** | Unit action plan Page: aim statement, PDSA cycles |
| **Todo** | Individual interventions assigned to CNAs, RN, PT |
| **Drive** | Fall tree, mobility assessments |
| **Calendar** | QAPI meeting links |
| **Chat** | Unit channel link for shift handoff |

**Promote to task:** Daily checklist line “Replace bed alarm batteries 2A” → Task with due today.

---

## Cross-scenario module map

| Need | Module |
|------|--------|
| Write procedures / meeting notes | **Notebook** (Page) |
| Assign and track work | **Todo** |
| Schedule meetings / audits | **Calendar** |
| Store PDFs / forms | **File Hub** |
| Shift communication | **Chat** |
| Find local vendor | **Place** |
| Workforce onboarding records | **HR** |
| Infection / quality metrics | **Analytics** (read-only) |

---

## Phase 1 MLVP coverage by scenario

| Scenario | MLVP usable? | Gap |
|----------|--------------|-----|
| Weekly leadership | ✅ templates + manual tasks | AI extract, event link |
| Dept improvement | ✅ project template + Todo | Project sidebar filter |
| Onboarding | 🟡 general + tags | SOP type, HR deep link |
| Survey readiness | ✅ project + daily templates | Federated search |
| Kitchen renovation | ✅ project template | Place embed |
| Unit action plan | ✅ daily + promote-to-task | Auto daily page |

---

*Navigation: [NOTEBOOK_NAVIGATION_MODEL.md](./NOTEBOOK_NAVIGATION_MODEL.md). Relationships: [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md).*
