# Notebook Page Types

**Phase:** 0.5  
**Parent:** [NOTEBOOK_WORKSPACE_ARCHITECTURE.md](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md)  
**Date:** 2026-06-01

---

## Design principle

Page types are **metadata + template + UI chrome** — not separate tables or modules. One `Note`/`Page` row; `pageType` discriminates behavior.

**Storage (phased):**

| Phase | Mechanism |
|-------|-----------|
| 1 | `tags` includes `type:meeting` **or** JSON metadata field on Note (design-only until migration approved) |
| 2 | Explicit `pageType` enum column + `pageMetadata` JSON |

---

## Type catalog

| Type | `pageType` | Icon (lucide) | Primary persona |
|------|------------|---------------|-----------------|
| **General** | `general` | `FileText` | Any user |
| **Meeting** | `meeting` | `Users` | Leaders, department heads |
| **Project** | `project` | `FolderKanban` | Project leads, maintenance, renovation |
| **Daily** | `daily` | `CalendarCheck` | Supervisors, shift leads |
| **SOP** | `sop` | `BookOpen` | Quality, dietary, EVS, clinical ops |
| **Template** | `template` | `LayoutTemplate` | Admin / power users (library entries) |

---

## General Page

| Attribute | Value |
|-----------|-------|
| **Purpose** | Default capture — ideas, scratch, misc documentation |
| **Template** | Blank or minimal heading |
| **Sidebar panels** | Linked tasks (optional), files (optional) |
| **Lifecycle** | Standard |
| **AI defaults** | Summarize, suggest tags |
| **First-class Phase** | 1 (default type) |

---

## Meeting Page

| Attribute | Value |
|-----------|-------|
| **Purpose** | Agenda, attendance, decisions, action items for a specific meeting |
| **Template** | Agenda / Notes / Action items (existing `NotesModule` meeting template) |
| **Sidebar panels** | Linked calendar event, attendees (read-only), extracted tasks, files |
| **Metadata** | `eventId?`, `meetingDate`, `attendeeIds?[]` |
| **Lifecycle** | Often archived after 90 days; pin while series active |
| **AI defaults** | Recap, extract tasks, suggest assignees (names → user pick) |
| **Behaviors** | Filter in **Meetings** nav view; sort by `meetingDate` desc |
| **First-class Phase** | 1 |

---

## Project Page

| Attribute | Value |
|-----------|-------|
| **Purpose** | Project brief, scope, status narrative — hub for related work |
| **Template** | Overview / Goals / Scope / Timeline / Risks |
| **Sidebar panels** | Todo `projectId` task list, linked files, linked events |
| **Metadata** | `todoProjectId?`, `status` (planning/active/complete), `ownerId?` |
| **Lifecycle** | Active until project closed; link to Todo project archive policy |
| **AI defaults** | Brief draft, action plan, status summary |
| **Behaviors** | **Projects** nav view; badge when open tasks > 0 |
| **First-class Phase** | 1 (metadata); project sidebar Phase 2 |

---

## Daily Page

| Attribute | Value |
|-----------|-------|
| **Purpose** | Shift/daily operational checklist + short log |
| **Template** | Checklist blocks + “Notes” section |
| **Sidebar panels** | Promoted tasks today, overdue count |
| **Metadata** | `operationalDate` (YYYY-MM-DD), `shift?` (day/evening/night) |
| **Lifecycle** | One page per day per user/department pattern; optional auto-create |
| **AI defaults** | Summarize day, suggest carry-forward tasks |
| **Behaviors** | **Daily** filter; duplicate-yesterday template |
| **First-class Phase** | 1 |

---

## SOP Page

| Attribute | Value |
|-----------|-------|
| **Purpose** | Standard operating procedure, training, compliance reference |
| **Template** | Purpose / Steps / Safety / References |
| **Sidebar panels** | Linked policy files (version pinned), related SOPs |
| **Metadata** | `department`, `reviewCycle`, `lastReviewedAt`, `approverId?` |
| **Lifecycle** | Long-lived; review reminders (future scheduler) |
| **AI defaults** | Draft from bullet outline, simplify language, generate quiz (future) |
| **Behaviors** | Read-heavy; default share viewer; tag `sop` |
| **First-class Phase** | 2 (healthcare KM — use General + tags in Phase 1) |

---

## Template Page

| Attribute | Value |
|-----------|-------|
| **Purpose** | Reusable blueprint — not operational content |
| **Template** | N/A — is the template |
| **Metadata** | `templateId`, `scope` (personal/business/global) |
| **Lifecycle** | Published / deprecated; not trashed casually |
| **Behaviors** | Listed under **Templates** nav; “Create from template” duplicates to General/Meeting/etc. |
| **First-class Phase** | 1 (static UI templates); persisted template library Phase 2 |

---

## Type vs hub metaphor

| User phrase | Maps to `pageType` |
|-------------|-------------------|
| “Project hub” | `project` |
| “Meeting hub” | `meeting` |
| “Operational workspace” | `daily` |
| “Knowledge article” | `sop` or `general` + tags |

**All are Pages** — not separate products.

---

## Icons and manifest

Register in `moduleIcons.ts` / Notebook manifest `entities[]` (Phase 1 implementation):

```json
{
  "pageTypes": [
    { "id": "general", "label": "Page", "icon": "file-text" },
    { "id": "meeting", "label": "Meeting", "icon": "users" },
    { "id": "project", "label": "Project", "icon": "folder-kanban" },
    { "id": "daily", "label": "Daily", "icon": "calendar-check" },
    { "id": "sop", "label": "SOP", "icon": "book-open" }
  ]
}
```

---

## Phase rollout

| Phase | Types shipped |
|-------|---------------|
| **1 MLVP** | `general`, `meeting`, `daily` (+ static templates including project brief as template-not-type) |
| **1.1** | `project` metadata + Projects view |
| **2** | `sop`, persisted `template`, AI per-type prompts |
| **3** | Block schemas per type (checklist block required on `daily`, etc.) |

---

*Cross-ref: workflows in [NOTEBOOK_WORKSPACE_ARCHITECTURE.md](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md) §2.*
