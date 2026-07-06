# Application Intelligence Model

**Program:** Indexed Knowledge & Retrieval Audit  
**Date:** 2026-07-06  
**Status:** Verified from implementation  
**Authority:** [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md) — Article II §1 (Applications are SoR)

---

## Principle

**Applications produce truth. The Knowledge Engine retrieves and assembles.**

Each Application contributes intelligence through **authorized read paths** — not by copying entities into AI memory tables. Teaching Vssyl records **user intent about AI behavior**; it does not replace editing the Application.

---

## Contribution matrix

| Application | SoR tables | AI context providers | Unified search | Pipeline sources | Teach surface | Primary category |
|-------------|------------|---------------------|----------------|------------------|---------------|------------------|
| **Drive** | `File`, `Folder` | `recent_files`, `storage_overview`, `file_count` | file, folder names | `drive_files` | No — edit in Drive | Live + attach analysis |
| **Chat** | `Conversation`, `Message` | `recent_conversations`, `unread_messages`, `conversation_history` | message, conversation | `module_context` | No | Live |
| **Calendar** | `Event`, `Calendar` | `upcoming_events`, `today_events`, `availability` | calendar_event | `calendar` | No | Live |
| **Todo** | `Task` | `task_overview`, `upcoming`, `overdue`, `priority` | task | — | No | Live |
| **Notes** | `Note` / pages | `recent_notes`, `pinned_notes` (metadata) | note (title+body) | — | No | Live + search index |
| **Notebook** | Delegates to Notes/Todo | `recent_pages`, `pinned_pages`, `task_overview` | page | — | No | Live |
| **V_Link** | `VLink`, `VLinkEntity` | `recent_vlinks` | vlink | `vlink`, `graph_bundle` | No — edit in V_Link | Indexed relationships + live hydrate |
| **Place** | Listings, connections | `place_overview`, `connections`, `discoveries`, `activity`, `analytics` | place_listing | `vssyl_place` | No | Live |
| **HR** | Employee, PTO, etc. | `hr_overview`, `employee_count`, `time_off_summary` | hr entities | `module_context`, `business_context` | No | Live (business) |
| **Scheduling** | Schedules, shifts | `overview`, `coverage`, `conflicts` | scheduling entities | `module_context` | No | Live (business) |
| **Workforce Comms** | Communications | `overview`, `reach` | comms entities | `module_context` | No | Live (business) |
| **Dashboard** | Dashboard, widgets | `overview`, `quick_stats`, `widgets` | dashboard, widgets | — | No | Live |
| **AI Chat (twin)** | `AIConversation`, `AIMessage` | Platform `recent_conversations` | — | `recent_conversations`, `user_memory` | Teach Vssyl | Indexed + Durable |
| **Business workspace** | `Business`, `BusinessAIDigitalTwin` | `business_context` platform source | — | `business_context` | Admin policy | Durable (policy) |

---

## How each major Application contributes

### Drive

**Intelligence contribution:**

- **Skim:** Recent files, storage overview, file counts via providers (`driveVisibilityService`).
- **Deep:** User **attaches** files in AI chat → `fileAnalysisService` extracts text (PDF, Office, CSV), OCR fallback (tesseract), vision for images — **ephemeral**, max 5 files, chunked to ~20k chars.
- **Search:** Global search matches **filename** only.

**What Drive does not do for AI:**

- No persistent document index or embeddings.
- No automatic “remember this file” — user must Teach Vssyl or attach per turn.

**Files:** `server/src/services/fileAnalysisService.ts`, `server/src/services/driveVisibilityService.ts`, `server/src/routes/drive/aiContext.ts`.

---

### Calendar

**Intelligence contribution:**

- Live schedule: today’s events, upcoming week, availability conflicts.
- Recurrence expanded at read time (`calendarVisibilityService`).
- Grounding source `calendar` for planning intents.

**User expectation:** “What’s on my calendar?” → **provider path**, not memory.

**Files:** `server/src/services/calendar/calendarVisibilityService.ts`, calendar AI context routes.

---

### Chat (module)

**Intelligence contribution:**

- Recent threads, unread previews, per-conversation history (with `conversationId`).
- Unified search over message content.

**Distinct from AI twin chat:** User-to-user `Message` table ≠ `AIMessage`. Twin recall uses `AIMessageRecallIndex`.

**Files:** `server/src/services/chat/chatVisibilityService.ts`.

---

### Tasks / Projects

**Todo module** supplies task intelligence (overdue, priority, overview). There is **no separate “Projects” module** in the provider registry — project-like work flows through Todo tasks and Notes/V_Link containers.

**Gap:** `searchTasksForAI` in `todoVisibilityService` is defined but **not called** by any retrieval path.

---

### Notes

**Intelligence contribution:**

- Providers return **metadata** (title, tags, pinned) — fast skim.
- Unified search searches **title + body** — full-text discovery when AI retrieval discovery runs.
- Notebook module reuses Notes/Todo backends.

**Asymmetry:** AI may **search** note content but default provider path does not inject full page body.

---

### Business records

**No single “business” module provider.** Intelligence splits:

1. **Policy overlay** — `BusinessAIDigitalTwin` → `business_context` (Durable Knowledge: restrictions, voice, compliance).
2. **Operational data** — HR, Scheduling, Workforce Comms providers (require `businessId` + membership).

Employees’ **personal** taught knowledge remains separate (Constitution P5).

---

### V_Link

**Intelligence contribution:**

- Curated **cross-module relationships** (confirmed `VLinkEntity` rows).
- Pipeline surfaces containers + linked entity refs with permission-aware hydration.
- Context Graph traverses attachments for bounded multi-hop context.

**Not a substitute for Applications** — links **point to** SoR entities; resolver fetches live snapshots.

---

### Search (platform)

**Not an Application** — orchestration layer over Applications.

`POST /api/search` → 13+ providers → relevance scoring → optional AI patch.

Contributes **Indexed Knowledge** discovery without owning data.

---

## AI-owned layers (not Applications)

| Layer | Role | Category |
|-------|------|----------|
| `UserMemoryFact` | Taught facts, vocabulary | Durable Knowledge |
| `UserAIContext` | Preferences, instructions | Durable Knowledge |
| `AIMessageRecallIndex` | Twin message recall | Indexed Knowledge |
| `AIConversation.threadSummary` | Cross-session continuity | Indexed Knowledge |
| `AILearningEvent` | Correction proposals | Governed → Durable when applied |

---

## Lifecycle: Application data vs taught knowledge

```
User creates calendar event
  → Stored in Calendar SoR (Live Context forever)
  → AI reads via calendar.upcoming_events when relevant
  → NOT copied to UserMemoryFact unless user teaches "I prefer morning meetings"

User teaches "My favorite dashboard is Operations"
  → Stored in UserMemoryFact (Durable Knowledge)
  → Retrieved by MemoryRetrievalService on related queries
  → Calendar/Drive unchanged
```

---

## Why Applications remain Systems of Record

| Constitutional rule | Implementation evidence |
|----------------------|-------------------------|
| P1 Applications are SoR | Module providers query module tables via visibility services |
| P11 Assemble, don't duplicate | No `File.extractedText` column; attach analysis is ephemeral |
| P10 Apps teach; Engine composes | `registerBuiltInModules.ts` registers read providers; writes stay in modules |
| D2 Redirect entity fixes | Correction routing spec sends calendar/time fixes to Calendar app |

**Incorrect framing:** “The Knowledge Engine owns knowledge.”

**Correct framing:** “The Knowledge Engine owns **retrieval orchestration, assembly, governance, and explainability** while Applications own **entity truth**.”

---

## Related documents

- [RETRIEVAL_ARCHITECTURE.md](./RETRIEVAL_ARCHITECTURE.md)  
- [INDEXED_KNOWLEDGE_REFERENCE_AUDIT.md](./INDEXED_KNOWLEDGE_REFERENCE_AUDIT.md)  
- [KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md](./KNOWLEDGE_ENGINE_RETRIEVAL_VALIDATION.md)  
- [AI_KNOWLEDGE_ENGINE_SPEC.md](./AI_KNOWLEDGE_ENGINE_SPEC.md) §3.1
