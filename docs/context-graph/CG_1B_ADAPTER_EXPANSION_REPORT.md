# CG-1B — Adapter Expansion Report

**Program:** Vssyl Context Graph  
**Phase:** 1B  
**Date:** 2026-06-19

---

## Registry summary

| Tier | Adapters | Entity types |
|------|----------|-------------:|
| P0 (1A) | 4 | 5 |
| P1 (1B) | 4 | 6 |
| **Total** | **8** | **11** |

---

## Full adapter inventory

| Adapter | moduleId | entityTypes | Upstream services |
|---------|----------|-------------|-------------------|
| V_Link | `vlink` | `container` | `vlinkService`, `vlinkPermissionService` |
| Drive | `drive` | `file`, `folder` | `driveVlinkAccessService` |
| Calendar | `calendar` | `event` | `calendarVlinkAccessService` |
| Todo | `todo` | `task` | `todoVlinkAccessService` |
| **Notes** | `notes` | `note` | `notesVlinkAccessService`, `listPageLinks` |
| **Notebook** | `notebook` | `notebook`, `notebook_page` | `notesVlinkAccessService`, `listPageLinks`, `NoteFolder` |
| **Chat** | `chat` | `conversation` | `chatVlinkAccessService` |
| **Place** | `place` | `place`, `place_list` | `placeVlinkAccessService` |

---

## P1 adapter detail

### Notes (`notesAdapter.ts`)

- **Entity:** `notes:note`
- **V_Link map:** `VLinkEntityType.NOTE` → `notes:note`
- **Neighbors:** inbound `vlink.attachment`; outbound `notebook.link` (via `listPageLinks`)
- **Access:** `resolveNoteForVLink` — owner/share + `NOTES_PAGE_READ` PE

### Notebook (`notebookAdapter.ts`)

- **Entities:**
  - `notebook:notebook_page` — Note page (same SoR as notes, notebook module descriptor)
  - `notebook:notebook` — NoteFolder container (creator read)
- **Neighbors:**
  - `notebook_page` → outbound `notebook.link` to drive/calendar/todo/chat/place/notes targets
  - `notebook` → outbound `notebook.containment` to pages in folder
- **Mapping:** `notebookLinkRef.ts` converts `NotebookLinkEntityType` → federation refs

### Chat (`chatAdapter.ts`)

- **Entity:** `chat:conversation` only (no `message` — avoids graph explosion)
- **V_Link map:** `CHAT_CONVERSATION` → `chat:conversation`
- **Access:** participant membership + `CHAT_CONVERSATION_READ` PE
- **Deferred:** `CHAT_THREAD` (CG-F-009)

### Place (`placeAdapter.ts`)

- **Entities:**
  - `place:place_list` ← `PLACE_LISTING`
  - `place:place` ← `PLACE_MEETING` (meeting place)
- **Deferred:** `place_review` — no platform SoR entity; adapter returns null
- **Access:** `placeVlinkAccessService` with Place PE

---

## V_Link entity type map (post-1B)

| VLinkEntityType | Federation ref |
|-----------------|----------------|
| FILE | `drive:file` |
| FOLDER | `drive:folder` |
| CALENDAR_EVENT | `calendar:event` |
| TASK / TODO | `todo:task` |
| NOTE | `notes:note` |
| CHAT_CONVERSATION | `chat:conversation` |
| PLACE_LISTING | `place:place_list` |
| PLACE_MEETING | `place:place` |

---

## CG-F-004 closure

`notesVlinkAccessService.ts` provides canonical NOTE access:

- Replaces inline Prisma in `vlinkEntityResolverService`
- `userCanLinkNote` registered in `userCanLinkEntity`
- Pattern matches drive/todo/chat access services

**Residual (non-blocking):** NOTE lifecycle unlink; manifest `vlink` declaration.

---

## Deferred adapters (unchanged)

HR, Scheduling, Workforce Communications, Business Administration, Admin Portal, AI Memory, Tag Index.

**Last updated:** 2026-06-19
