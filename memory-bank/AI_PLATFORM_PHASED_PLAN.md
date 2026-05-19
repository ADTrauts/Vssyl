# AI Platform Next-Level — Phase-by-Phase Plan

**Date:** February 2025  
**Status:** Living document — phases are built in order; next phase starts only after the previous phase is complete and the user confirms.

**Related:** [AI_PLATFORM_PLAN_VERIFICATION.md](./AI_PLATFORM_PLAN_VERIFICATION.md) (additive-only verification), [activeContext.md](./activeContext.md) (current AI state).

---

## How We Work

- Build **one phase at a time**.
- At the **end of each phase**, the assistant will:
  - Mark the phase complete in this file (or you update it).
  - Ask: **"Phase N is complete. Ready to start Phase N+1?"**
- Do **not** start the next phase until you say yes (e.g. "Yes, start Phase N+1" or "ACT" with that intent).
- Phases are **additive**; existing behavior is preserved (see verification doc).

---

## Phase Overview

| Phase | Name | Goal |
|-------|------|------|
| 1 | Image generation UI + Drive | Users can generate images from chat and save to Drive |
| 2 | Structured outputs (schema) | Guaranteed JSON schema for automation (e.g. invoice extraction) |
| 3 | Tool calling (native) | Model can request tools; backend executes and returns results |
| 4 | Streaming responses | Twin replies stream token-by-token for better UX |
| 5 | Document intelligence | Invoice/receipt (and optional doc types) extraction + workflows |
| 6 | Audio (STT/TTS) | Voice input and optional text-to-speech for replies |
| 7 | Proactive agents (optional) | "You uploaded X — should I do Y?" suggestions |
| 8 | Vision editing (optional) | Edit image (e.g. remove background) → new file in Drive |

Phases 1–6 are core; 7–8 are optional/follow-on.

---

## Phase 1: Image Generation UI + Drive

**Goal:** Users can ask the AI to generate an image (or use a dedicated control), see it in chat, and optionally save it to Drive.

### Scope

- **Backend (already done):** `POST /api/ai/generate-image`, `OpenAIProvider.generateImage`, capabilities. No backend changes unless we add "save to Drive" (persist URL → GCS + File record).
- **Frontend:**
  - In AI chat (full page and/or dropdown): way to request image generation (e.g. "Generate image" button or detect intent) and call `/api/ai/generate-image`.
  - Display generated image in the conversation (e.g. as assistant message with image + optional "Save to Drive").
  - Optional: persist generated image to GCS, create Drive `File` record, return `fileId`; "Save to Drive" uses it or uploads from URL.

### Deliverables

1. **UI to trigger generation:** At least one of: (a) "Generate image" button in AI chat that opens prompt/size/quality, or (b) intent detection (e.g. "create an image of…") that calls the generate endpoint.
2. **Show image in chat:** Generated image displayed in the AI reply (inline or attachment).
3. **Optional — Save to Drive:** Either: backend saves to GCS + creates File and returns `fileId`, or frontend uploads image to Drive; user can open in Drive from chat.

### Completion criteria

- [x] User can request an image from AI chat (button or natural language).
- [x] Generated image appears in the conversation.
- [x] Optional: user can save the image to Drive and open it from Drive.
- [x] No regressions to existing twin/structured response/vision behavior.

### When Phase 1 is done

Assistant will ask: **"Phase 1 is complete. Ready to start Phase 2?"**

---

## Phase 2: Structured Outputs (Schema-Guaranteed)

**Goal:** For specific use cases (e.g. "extract invoice from this file"), the model returns JSON that conforms to a defined schema so the system can reliably automate (e.g. create expense, fill form).

### Scope

- **Backend:** Define one or two schemas (e.g. invoice/receipt: vendor, amount, date, category, line items). Use provider structured-output API where available (e.g. OpenAI `response_format` with `json_schema`, or Anthropic equivalent). New endpoint or twin "mode" (e.g. `intent: 'extract_document'`) that requests structured extraction.
- **Frontend:** Optional: show extracted fields in chat or pass to a "Create expense" (or similar) action when we add it later.

### Deliverables

1. **Schema(s):** At least one document type (e.g. invoice/receipt) with Zod or JSON Schema.
2. **Structured extraction path:** Either a dedicated endpoint (e.g. `POST /api/ai/extract-document`) or twin request with a flag that uses the schema and returns typed JSON.
3. **Integration:** Extraction can be invoked from chat (e.g. user attaches file and asks "extract invoice" or "what’s on this receipt?").

### Completion criteria

- [x] One document schema (e.g. invoice) is defined and used in an extraction flow.
- [x] Model response conforms to that schema (validated).
- [x] Chat (or dedicated UI) can trigger extraction and display or use the result.
- [x] Existing twin structured response (sections, actions, table) unchanged.

### When Phase 2 is done

Assistant will ask: **"Phase 2 is complete. Ready to start Phase 3?"**

---

## Phase 3: Tool Calling (Native)

**Goal:** The model can request execution of tools (e.g. shareFile, createCalendarEvent, createTodo, listDriveFiles). Backend executes the tool and returns the result to the model; optionally the model summarizes for the user.

### Scope

- **Backend:** Define a small set of tools (names + JSON schemas for parameters). In the twin path (DigitalLifeTwinCore or provider call layer): pass `tools` to the provider, handle `tool_calls` in the response, execute each tool (using existing services/controllers), append tool results to the conversation, and call the provider again until no more tool_calls. Preserve existing LifeTwinAction and structured response; tool execution is an additional path.
- **Frontend:** No strict requirement for Phase 3; tool results can appear as part of the final assistant message. Optional: show "I ran: shareFile(…)" in the UI.

### Deliverables

1. **Tool definitions:** At least 2–3 tools (e.g. shareFile, createCalendarEvent, createTodo or listDriveFiles) with parameter schemas.
2. **Provider integration:** OpenAI and/or Anthropic tool-calling wired in the twin request/response loop (invoke tools, append results, re-call until done).
3. **Tool implementation:** Each tool implemented (calling existing APIs/services) with error handling and safe permissions (user/dashboard context).

### Completion criteria

- [x] User can ask (e.g. "Share this file with John") and the model requests the right tool; backend executes it.
- [x] Tool result is fed back to the model and the user gets a coherent reply.
- [x] Existing actions (LifeTwinAction, StructuredAIActionButton, ActionExecutor) and twin response shape preserved.

### When Phase 3 is done

Assistant will ask: **"Phase 3 is complete. Ready to start Phase 4?"**

---

## Phase 4: Streaming Responses

**Goal:** Twin replies stream token-by-token so the user sees text appearing in real time instead of waiting for the full response.

### Scope

- **Backend:** Support streaming from the provider (OpenAI/Anthropic). Add optional query parameter or header (e.g. `stream: true` or `Accept: text/event-stream`) to `POST /api/ai/twin`. When set, respond with SSE stream of chunks; when stream ends, optionally persist full message (and any structured summary) for history.
- **Frontend:** In ai-chat page, AIChatDropdown, and AIChatModule: when streaming is requested, consume SSE and append chunks to the current reply; when done, finalize the message (and save to conversation if applicable).

### Deliverables

1. **Streaming endpoint behavior:** Twin route can return SSE stream when requested; non-stream behavior unchanged.
2. **Provider streaming:** OpenAI and Anthropic clients used in streaming mode; chunks forwarded to the client.
3. **Frontend:** All three chat UIs can request streaming and display incremental text; final message is saved and displayed correctly.

### Completion criteria

- [x] User sees reply text appear incrementally when streaming is enabled.
- [x] Non-stream requests still work and return a single JSON response.
- [x] Conversation history still records the full reply after stream ends.
- [x] No regressions to structured response or file/vision behavior.

### May 2026 streaming UX refinement (full-page ai-chat)

Structured conversation mode often streams **v2 JSON** from the provider. **`web/src/lib/aiStreamHandler.ts`** (`1deb6d48`) buffers chunks client-side, shows **`AIThinkingIndicator`** while `isAILoading`, and appends **one** normalized message on `done` — users never see raw `{ "mode": "conversation", ... }`. Dropdown/embed still use non-stream JSON + `aiResponseHandler` prose normalization. See `memory-bank/aiContextSystem.md` (§ Streaming chat UX).

### When Phase 4 is done

Assistant will ask: **"Phase 4 is complete. Ready to start Phase 5?"**

---

## Phase 5: Document Intelligence

**Goal:** Dedicated extraction and workflows for documents (invoices, receipts, etc.) so the platform feels "ERP-ready" (e.g. extract → suggest expense or reminder).

### Scope

- **Backend:** Build on Phase 2 structured outputs. Add document-type detection or user hint ("this is an invoice"). Support at least invoice/receipt; optionally contracts, lab reports, tax/HR forms. Optionally: "Create expense from this invoice" workflow (create record, notify, link to file).
- **Frontend:** Show extracted data in chat; optional "Create expense" (or similar) button that uses the extracted payload.

### Deliverables

1. **Document types:** At least invoice/receipt end-to-end; optional second type (e.g. contract key dates).
2. **Extraction flow:** User attaches file and asks for extraction (or uses a dedicated action); structured result returned and displayed.
3. **Optional workflow:** One automated step (e.g. create expense from invoice) with user confirmation or approval.

### Completion criteria

- [x] User can upload an invoice/receipt and get structured extraction (vendor, amount, date, etc.) in chat.
- [x] Optional: one follow-up action (e.g. create expense) is wired and testable.
- [x] File/vision pipeline and Phase 2 structured output behavior preserved.

### When Phase 5 is done

Assistant will ask: **"Phase 5 is complete. Ready to start Phase 6?"**

---

## Phase 6: Audio (STT / TTS)

**Goal:** Voice input (speech-to-text) and optional text-to-speech for AI replies to support accessibility and voice-driven use.

### Scope

- **Backend:** STT: endpoint or step that accepts audio (upload or recording); call provider (e.g. OpenAI Whisper); return transcript; optionally attach transcript to the user message and send to twin. TTS: optional endpoint or step that takes reply text and returns audio URL or stream.
- **Frontend:** Record or upload audio in chat; send for transcription; show transcript and send as user message. Optional: play TTS for the AI reply.

### Deliverables

1. **STT:** At least one way to submit audio and get transcript; transcript can be used as the user message in the twin.
2. **Frontend:** Record or upload audio in AI chat; transcript appears and is sent to the twin.
3. **Optional TTS:** Reply text → audio; play in UI.

### Completion criteria

- [x] User can speak (or upload audio) and have it transcribed and sent to the AI as the message.
- [x] Optional: user can hear the AI reply as audio.
- [x] No change to existing text-based twin flow.

### When Phase 6 is done

Assistant will ask: **"Phase 6 is complete. Ready to start Phase 7 (proactive agents) or Phase 8 (vision editing), or pause here?"**

---

## Phase 7: Proactive Agents (Optional)

**Goal:** AI suggests actions based on events (e.g. "You uploaded a contract — should I extract key dates and add reminders?").

### Scope

- **Backend:** Hooks for events (e.g. file uploaded to Drive with a given type or tag). When triggered, run a lightweight check (e.g. document type); optionally call twin with context and get suggested action; create a suggestion or notification for the user (no auto-execution without approval).
- **Frontend:** Show suggestions (e.g. in notifications or in Drive); user can accept or dismiss.

### Deliverables

1. **Event hook:** At least one trigger (e.g. Drive upload) that starts a "suggestion" flow.
2. **Suggestion flow:** Twin or dedicated logic proposes an action; suggestion stored and surfaced to the user.
3. **UI:** User sees the suggestion and can accept or dismiss; accept may trigger Phase 3 tools or Phase 5 workflow.

### Completion criteria

- [x] One event (e.g. document upload to Drive) produces an AI suggestion (AISuggestion + notification).
- [x] User can see and accept/dismiss the suggestion (AI chat sidebar + notifications with "Open in AI"; GET/POST /api/ai/suggestions).
- [x] No automatic execution without user action (accept deep-links to ai-chat with file attached; user runs extract/reminder).

### When Phase 7 is done

Assistant will ask: **"Phase 7 is complete. Ready to start Phase 8 (vision editing), or pause here?"**

---

## Phase 8: Vision Editing (Optional)

**Goal:** User can ask for image edits (e.g. "Remove background", "Crop this") on an attached image; result is a new file in Drive and shown in chat.

### Scope

- **Backend:** Use provider image-edit API (e.g. OpenAI) when available; accept image + edit instruction; get result image; upload to GCS and create Drive File; return fileId and URL to client.
- **Frontend:** In chat, when user has attached an image and asks for an edit, show the new image and link to Drive.

### Deliverables

1. **Edit endpoint or twin path:** Accept image reference + edit prompt; call provider; persist result to storage and Drive.
2. **Integration:** Edits can be triggered from chat (attach image + "remove background" or similar).
3. **UI:** New image shown in chat; optional "Open in Drive" link.

### Completion criteria

- [x] At least one edit type (e.g. remove background) works end-to-end (OpenAI gpt-image-1 edit; prompt + background).
- [x] Result is stored in Drive and visible in chat (edit-image saves to Drive; shown like generated image with "Open in Drive").
- [x] Existing vision (read-only) and image generation unchanged.

---

## Summary

- **Phases 1–6:** Core roadmap; build in order; after each phase, assistant asks before starting the next.
- **Phases 7–8:** Optional; can be done after Phase 6 or later.
- **Workflow:** Complete phase → update this doc if desired → assistant asks "Ready to start Phase N+1?" → you confirm → we start the next phase.

When you want to begin, say **"Start Phase 1"** (or "ACT" with that intent). After Phase 1 is complete, the assistant will ask for confirmation before starting Phase 2.
