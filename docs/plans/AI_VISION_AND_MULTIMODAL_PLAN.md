# AI Vision & Multimodal Pipeline — Alignment Plan

**Mode: PLAN**

This plan aligns the Vssyl AI chat with a **capabilities-driven, provider-agnostic multimodal pipeline** that works in both local dev and Cloud Run, and that can grow to support vision, PDF page vision, spreadsheets, and image generation.

---

## 1. Current State Summary

### What’s Already in Place
- **Vision helper**: `getVisionImageParts()` in `fileAnalysisService.ts` — fetches image buffers from storage, converts to base64, returns `VisionImagePart[]` (max 5 images, 5 MB each). Uses `resolveStoragePath()` + `storageService.getFileBuffer()` (GCS and local supported).
- **Providers**: OpenAI and Anthropic build multimodal user content when `data.visionImageParts` is non-empty (image_url / image blocks).
- **Core**: Declares `visionImageParts`, passes it into `generateLifeTwinResponse` and `callAIProvider`; provider receives `options.visionImageParts`.

### Root Cause of “Fragmented Text” Replies (Prove via Instrumentation)
- **Vision parts are not reaching the provider in production.** Either (A) the `visionImageParts` array is empty (files not resolved / not fetched from storage), or (B) the provider request is still text-only on that path, or (C) the Core never calls `getVisionImageParts` in this codebase (variable stays `[]`). We do not assume which — we **log and trace** to confirm.
- **Phase 0** (below) adds instrumentation at three points so we know exactly where it fails. **Phase 1** ensures the Core calls `getVisionImageParts` when it has a file list and assigns the result to `visionImageParts` (if that call is missing in the deployed branch).

### Other Known Issues
- **Image-based PDFs**: Only text extraction + OCR fallback (canvas + Tesseract). OCR often fails in Cloud Run (canvas native deps). No “PDF page → image → vision” path yet.
- **Prompt**: No instruction telling the model to “describe image contents concretely” when vision parts are present, so even when vision is used, replies can stay vague.
- **Model selection**: No explicit “use vision-capable model when images exist”; currently fixed models (gpt-4o, claude-3-5-sonnet) are vision-capable but not explicitly chosen by capability.
- **User-facing errors**: Messages say “too large” / “processing capabilities” even when the real cause is extraction/OCR failure or vision not used; no deterministic error taxonomy.
- **Editor/ops knowledge**: No single place (e.g. docs/ai/ARCHITECTURE.md, PROVIDERS.md, RUNBOOK.md) that describes attachment flow, provider shapes, and Cloud Run constraints for AI.

---

## 2. Goals

1. **Vision actually used for image attachments** — Ensure the Core produces non-empty `visionImageParts` for eligible attachments and providers send multimodal requests (confirm via Phase 0 logs).
2. **Storage-backed image fetch in production** — Ensure file path/url resolution and GCS fetch work in Cloud Run (no assumption that files live on local disk).
3. **Concrete image descriptions** — When vision parts exist, add a prompt instruction so the model describes what it sees (people, objects, text, layout), not generic phrasing.
4. **PDF “vision” path** — Allow the model to “see” image-based PDFs by rendering first 1–2 pages to images and adding them to `visionImageParts` (without relying on node-canvas in prod).
5. **Capability-aware routing** — Provider abstraction declares capabilities (e.g. supportsVisionInput); when images exist, ensure a vision-capable model is used and log it.
6. **Deterministic error taxonomy** — Classify failure reasons (NO_TEXT_EXTRACTED, OCR_UNAVAILABLE, VISION_NOT_ENABLED, FILE_NOT_FETCHABLE, etc.) and show accurate user-facing messages.
7. **Documentation and editor knowledge** — docs/ai/ (ARCHITECTURE, PROVIDERS, RUNBOOK) and .cursor/rules (or AGENTS.md) so setup and debugging are consistent.

---

## 3. Implementation Plan (Phased)

### Phase 0 — Instrumentation (Do First — No Guesswork)
**Goal**: Prove where vision fails in prod. Add debug-level logs at six points so “it’s vague” becomes “we know exactly where it died.”

**Guardrails (mandatory)**  
- **Do not log base64** (ever).  
- Log only: **counts**, **filenames**, **mime types**, **sizes**, and **skip-reason strings**.  
- Provider log must **explicitly show request content shape**: `typeof messages[?].content` and `Array.isArray(...)` so we never “thought it was multimodal” by mistake.

**Request correlation (Cloud Run is noisy)**  
Include a **requestId** (or reuse `conversationId` / `messageId`) in **every** `[VISION_PIPELINE]` log line so you can filter one request end-to-end. Example fields: `requestId`, `conversationId`, `provider`, `userId` (optional; or hash it).

| Step | Action | Files |
|------|--------|--------|
| 0.05 | **Correlate logs to a single request**: Generate or reuse a `requestId`; include `requestId`, `conversationId` (if available), `provider`, and optionally `userId` (or hashed) in every Phase 0 log. Use prefix `[VISION_PIPELINE]`. Lets you filter one request end-to-end in Cloud Run. | Core + providers (pass requestId or attach from context) |
| 0.1 | **After fetching files (Core)**: Log `files.length` and for each file: `{ id, name, type, size, hasPath: !!path, hasUrl: !!url }`. No base64. | `DigitalLifeTwinCore.ts` (right after `this.prisma.file.findMany`) |
| 0.2 | **After getVisionImageParts (Core or service)**: Log `visionImageParts.length`, filenames included, mime types, and sizes (bytes). In `getVisionImageParts`, log **why each file was skipped** (string only): e.g. `no_path`, `too_large`, `unsupported_mime`, `getFileBuffer_failed`. No base64. | `fileAnalysisService.ts` (inside loop), `DigitalLifeTwinCore.ts` (after call) |
| 0.15 | **ProviderData trace (Core)**: Right before `callAIProvider(provider, prompt, data)`, log the exact keys in `data`: `Object.keys(data)` and `data.visionImageParts?.length`. Catches options object being re-shaped or dropped. | `DigitalLifeTwinCore.ts` (immediately before callAIProvider) |
| 0.3 | **In each provider, right before API request**: Log `hasVision`, `visionParts.length`, `model`, and **request content shape**: e.g. `contentType: typeof userContent`, `isMultimodal: Array.isArray(userContent)` (OpenAI: `messages[].content`; Anthropic: same for `messages[].content`). Ensures we see “multimodal” vs “string” explicitly. | `OpenAIProvider.ts`, `AnthropicProvider.ts` |
| 0.25 | **Provider "final payload" sanity (shape only)**: Right before the **actual HTTP call** to the API, log: **total message count**, **which message index** contains user multimodal content, **count of image blocks/parts** included. No base64. Catches images in the wrong message slot or overwritten by later prompt assembly. Include requestId. | `OpenAIProvider.ts`, `AnthropicProvider.ts` |

**Deliverable**: Deploy to Cloud Run, attach one image, then confirm in logs: `files.length > 0`, `visionImageParts.length > 0`, providerData has `visionImageParts`, provider `hasVision === true`, and content is **array** (multimodal). If any fail, we know the exact failure point.

---

### Phase 1 — Ensure Vision Parts Are Produced (if missing or empty)
**Goal**: Image attachments (e.g. profile-pic.jpg, screenshots) are sent to the model so it can describe them. Phase 0 may reveal the Core call already exists; this phase ensures vision parts are produced when eligible (call present and wired correctly, or add/fix if missing).

| Step | Action | Files |
|------|--------|--------|
| 1.1 | In DigitalLifeTwinCore, inside the same block where `getFileSummaries(files)` is called (after the summaries try/catch), call `getVisionImageParts(files, 5, 5*1024*1024)` and assign the result to `visionImageParts`. Use the same `files` array (with id, name, path, url, size, type). | `server/src/ai/core/DigitalLifeTwinCore.ts` |
| 1.2 | Add a single log line before `callAIProvider` (or in generateLifeTwinResponse when building providerData): log `visionImageParts.length`, provider name, and whether content is multimodal (for debugging “vision not used” in prod). | `server/src/ai/core/DigitalLifeTwinCore.ts` |
| 1.3 | Verify in local run: attach an image, ask “what’s in this image?” and confirm the reply references the image. Check logs for “Vision image part added” and vision count. | — |

**Deliverable**: Image attachments result in vision parts being sent; logs confirm it.

---

### Phase 2 — Prompt + Production Readiness
**Goal**: Better answers when vision is used; ensure GCS path resolution works in prod.

| Step | Action | Files |
|------|--------|--------|
| 2.1 | **Vision-specific prompt (in provider, not Core)**: When `hasVision` is true, inject a **short** (1–3 sentences) instruction into the **same user message** that contains the images. Keep it consistent across providers so it doesn’t fight the system prompt. Example: “Describe exactly what you see in the attached image(s). If text is visible, transcribe it. Be concrete (people, objects, layout); avoid generic phrasing.” | `server/src/ai/providers/OpenAIProvider.ts`, `server/src/ai/providers/AnthropicProvider.ts` |
| 2.2 | **Storage path in prod**: Confirm that when files are uploaded (chat or Drive), `File.path` or `File.url` is set so that `resolveStoragePath(file)` returns a path that `storageService.getFileBuffer()` can use. For GCS, path should be the object path inside the bucket (or a URL that `extractPathFromUrl` can parse). Add a log in `getVisionImageParts` when `resolveStoragePath(file)` returns null (so prod logs show “vision skipped: no path” when applicable). | `server/src/services/fileAnalysisService.ts`, upload/Drive code paths |
| 2.3 | **Runbook note**: Document in RUNBOOK (see Phase 5) that “if images work locally but not in prod, check: (1) visionImageParts.length in logs, (2) resolveStoragePath returning null, (3) GCS bucket and credentials.” | `docs/ai/RUNBOOK.md` (new) |

**Deliverable**: Concrete image descriptions when user asks; logging to diagnose prod vision; RUNBOOK started.

---

### Phase 3 — PDF Vision (Image-Based PDFs)
**Goal**: Model can “see” first 1–2 pages of image-based PDFs (e.g. “Catered Affairs Signed.pdf”) without relying on OCR/canvas in production.

**Explicit caps (Cloud Run–friendly)**  
- **Max pages**: 2  
- **Max DPI**: 150–200  
- **Max render time**: 5–10 s (timeout)  
- **Max output image bytes**: same 5 MB cap per image as vision parts  
- **Prefer**: If user already attached 5 photos (at total cap), skip PDF page rendering; respect total vision-part cap.

| Step | Action | Files |
|------|--------|--------|
| 3.1 | **PDF → image rendering (production-safe)** Use Poppler (`pdftoppm`) in Docker: render to **`/tmp`**, **max 2 pages**, **150–200 DPI**, **5–10 s timeout**, **5 MB per image**. Feed through existing `visionImageParts` path. | `server/src/services/fileAnalysisService.ts`, `server/Dockerfile.production` |
| 3.2 | **Pipeline**: For attached PDFs: (1) try text extraction as today; (2) if extracted text length < threshold (e.g. 500 chars), treat as image-based; (3) render first 1–2 pages under `/tmp` via pdftoppm (with timeout and DPI/size caps); (4) append to `visionImageParts` (same 5-part total cap). **If user already has 5 image parts (e.g. photos), skip PDF pages.** | `server/src/services/fileAnalysisService.ts`, `server/src/ai/core/DigitalLifeTwinCore.ts` |
| 3.3 | **Cap total vision parts**: e.g. max 5 image parts total (photos + PDF pages combined); prefer attached standalone images first, then PDF page images. | `fileAnalysisService.ts` or Core |

**Status (implemented)**: Poppler in `Dockerfile.production`. `renderPdfPagesToVisionParts()` and `getPdfVisionParts()` in fileAnalysisService; Core appends PDF page parts after image parts (cap 5 total).

**Deliverable**: Image-based PDFs contribute up to 2 page images to vision within caps (timeouts, /tmp, 5 MB); Cloud Run–safe; model can answer “what does this PDF say?” for signed/scanned PDFs. Explicit caps: max 2 pages, 150–200 DPI, 5–10 s render timeout, 5 MB per image; if 5 photos already attached, skip PDF pages.

---

### Phase 4 — Capability Matrix & Model Selection
**Goal**: Explicit capabilities and correct model when images are present.

| Step | Action | Files |
|------|--------|--------|
| 4.1 | **Provider capability declaration**: Define a small interface or config per provider: e.g. `supportsVisionInput`, `supportsImageGeneration`, `maxImageCount`, `maxImageBytes`, `supportedImageTypes`, and optionally `visionModel` (model id to use when vision is used). | New: `server/src/ai/providers/capabilities.ts` or inside each provider |
| 4.2 | **Model selection**: When building the request, if `visionImageParts.length > 0`: (1) resolve provider (openai/anthropic); (2) if provider supports vision, ensure the model used is vision-capable (e.g. gpt-4o for OpenAI, claude-3-5-sonnet for Anthropic — or read from capability config); (3) log the model name so “vision request → model X” is visible in logs. | `DigitalLifeTwinCore.ts`, provider `process()` or router |
| 4.3 | **LocalProvider**: Mark as not supporting vision (or no-op vision); do not pass vision parts to it, or pass and let it ignore. | `server/src/ai/providers/LocalProvider.ts` |
| 4.4 | **Provider fallback when vision not used**: If the provider does not support vision, or all images were filtered out (e.g. unsupported type like BMP for Anthropic): (1) fall back to OCR/text extraction if available and include in prompt; (2) otherwise return a deterministic file issue (see Phase 5). Keep Anthropic’s allowed media type filter (png, jpeg, gif, webp). | `OpenAIProvider.ts`, `AnthropicProvider.ts`, Core |

**Deliverable**: When images exist, a vision-capable model is used and logged; when vision can’t be used, fallback to text or structured file issue; future providers declare capabilities.

---

### Phase 5 — Error Taxonomy & User-Facing Messages
**Goal**: Users see accurate reasons when file content can’t be used (no “too large” when the issue is extraction or vision).

**Decision: UI owns file-access messaging (Option A — recommended).** The API returns a structured list; the UI renders messages. The model does not own faithfully repeating file errors.

| Step | Action | Files |
|------|--------|--------|
| 5.1 | **Error codes**: Introduce an internal taxonomy, e.g. `NO_TEXT_EXTRACTED`, `OCR_UNAVAILABLE_IN_PROD`, `VISION_NOT_ENABLED`, `FILE_NOT_FETCHABLE_FROM_STORAGE`, `FILE_TOO_LARGE_POLICY`, `PROVIDER_REJECTED_MEDIA_TYPE`. Set these in fileAnalysisService and/or Core when a failure occurs. | `fileAnalysisService.ts`, `DigitalLifeTwinCore.ts` |
| 5.2 | **API shape**: Twin response includes `fileIssues?: Array<{ fileId, code, message, details?, developerDetails? }>`. Backend maps each code to a short user-facing `message`. **Optional `developerDetails`** (behind a feature flag): skip reasons, stack snippet, or internal codes — surfaced only when flag is on, never to end users. UI reads `fileIssues` and renders `message` (and optionally `developerDetails` in dev tools or admin view when flag set). | API response type, `DigitalLifeTwinCore` or route, `AIResponseRenderer` or ai-chat page |
| 5.3 | **Remove misleading wording**: Ensure prompts and fallbacks do not say “file too large” or “exceeds processing capabilities” when the real cause is extraction/OCR/vision. | `DigitalLifeTwinCore.ts`, fileAnalysisService fallback text |

**Deliverable**: Deterministic, honest user messages rendered by the UI from structured `fileIssues`; easier debugging from logs.

---

### Phase 6 — Documentation & Editor Knowledge
**Goal**: Single source of truth for attachment flow, providers, and Cloud Run so humans and AI editors set things up correctly.

| Step | Action | Files |
|------|--------|--------|
| 6.1 | **docs/ai/ARCHITECTURE.md**: Describe how attachments flow: context.fileIds → File records (path/url) → getFileSummaries + getVisionImageParts → prompt + visionImageParts → provider. Note Cloud Run: no assumption that files are on local disk; GCS is source of truth; path/url must resolve via storageService. | `docs/ai/ARCHITECTURE.md` (new) |
| 6.2 | **docs/ai/PROVIDERS.md**: Document OpenAI and Anthropic request shapes (text-only vs multimodal content), capability matrix (vision, image gen, tools), and model selection rules (e.g. when vision parts present → use gpt-4o / claude-3-5-sonnet). | `docs/ai/PROVIDERS.md` (new) |
| 6.3 | **docs/ai/RUNBOOK.md**: Include: **log level required** (e.g. debug for Phase 0); **where Cloud Run logs are viewed** (e.g. Google Cloud Console → Logging → filter by service); **exact log prefix to search** (e.g. `[VISION_PIPELINE]` or the prefix used in Phase 0) so instrumentation is repeatable. Plus: “If images work locally but not in prod, check (1) visionImageParts.length and provider in logs, (2) resolveStoragePath and getFileBuffer (GCS), (3) env vars and bucket.” List required env vars. | `docs/ai/RUNBOOK.md` (new) |
| 6.4 | **.cursor/rules or memory-bank**: Add bullets: “When attachments exist, ensure getVisionImageParts is called and visionImageParts passed to the provider”; “Do not assume /uploads exists in Cloud Run — use GCS and storageService”; “Prefer GCS fetch + /tmp or in-memory processing for vision”; “When adding a new provider, declare vision/image capabilities and use vision model when images exist.” | `.cursor/rules/` or `memory-bank/activeContext.md` / `systemPatterns.md` |
| 6.5 | **docs/ai/GOLDEN_RULES.md**: Add a short “Golden Rules” file that editors (and Cursor) follow: “Cloud Run cannot rely on local uploads”; “Any attachment feature must work with GCS fetch”; “Vision requires: (a) parts exist, (b) provider supports, (c) model supports, (d) request is multimodal”; “Always log: files.length, visionParts.length, model chosen, request shape (multimodal vs text-only).” | `docs/ai/GOLDEN_RULES.md` (new) |

**Deliverable**: New and existing devs (and Cursor) can follow docs and rules for consistent behavior.

---

## 4. Optional / Later — Implemented

**Status (implemented)**: Image resize (sharp, 1600px, JPEG 85); CSV table parsing (markdown table); DALL·E via POST /api/ai/generate-image; "Image used in this reply" badge in ai-chat and AIChatDropdown when usedVisionParts.

- **Image resize before sending**: Downscale to max dimension (e.g. 1600–2000px) and/or convert to JPEG/WebP to reduce tokens and cost.
- **Excel/CSV**: Parse to tables and send as structured context (separate from this vision plan).
- **Image generation**: Expose capability when using a provider that supports it (e.g. DALL·E); route in provider layer.
- **UI**: “Image used in this reply” or similar when the model used vision parts (optional UX).

---

## 5. Success Criteria

- Attaching profile-pic.jpg (or any image) and asking “what’s in this image?” yields a **concrete description** (people, objects, text, layout), not “various visual elements / fragmented text.”
- Logs in production show `visionImageParts.length >= 1` and “Vision image part added” for that file when vision is used.
- Image-based PDF (e.g. “Catered Affairs Signed.pdf”) can be answered by the model after Phase 3 (model “sees” first 1–2 pages).
- User-facing messages reflect the real failure reason (storage, extraction, OCR, size), not generic “processing capabilities.”
- docs/ai/ and cursor rules document the flow and constraints so future changes don’t regress vision or assume local disk in prod.

---

## 6. Dependency Order

1. **Phase 0** (instrumentation) must be done first — proves where vision fails in prod before changing behavior.
2. **Phase 1** next (wire `getVisionImageParts` in Core if missing) — unblocks real vision for images.
3. **Phase 2** can follow (provider-side “describe concretely” prompt + path logging + RUNBOOK).
4. **Phase 3** (PDF vision) can be done in parallel with Phase 4 after Phase 2.
5. **Phase 4** (capabilities + fallback) can be done after Phase 1 or in parallel with Phase 2.
6. **Phase 5** (error taxonomy + UI-owned fileIssues) can be done after Phase 2.
7. **Phase 6** (docs + GOLDEN_RULES) can be started after Phase 1 and updated as each phase lands.

---

## 7. Full Updated Plan (Summary)

| Phase | Focus | Key deliverable |
|-------|--------|------------------|
| 0 | Instrumentation | 6-point logging (no base64): **request correlation** (requestId/conversationId in every line); after files; after vision parts (counts, filenames, mime, sizes, skip reasons); providerData trace; before provider request (hasVision, model, content shape); **final payload shape** (message count, user message index, image block count). Prefix [VISION_PIPELINE]. Deploy and confirm where it fails. |
| 1 | Ensure vision parts produced | Call `getVisionImageParts(files)` and assign to `visionImageParts` (if missing or empty); debug log |
| 2 | Prompt + prod | Short (1–3 sentence) “describe concretely” **in provider** (same user message as images); path/null logging; RUNBOOK |
| 3 | PDF vision | Poppler in container; `/tmp`, max 2 pages, 150–200 DPI, 5–10 s timeout, 5 MB/image; if 5 photos already, skip PDF pages; feed through existing visionImageParts |
| 4 | Capabilities | Provider capability matrix; vision model selection; **fallback** to OCR/text or file issue when vision not used |
| 5 | Error taxonomy | Deterministic codes; **UI owns messaging** via API `fileIssues[]`, UI renders |
| 6 | Docs & rules | docs/ai/ ARCHITECTURE, PROVIDERS, RUNBOOK, **GOLDEN_RULES.md**; .cursor/rules / memory-bank |

This plan aligns the build with the described “future-proof” architecture and gets image reading (and then PDF “sight”) fully functioning in both local and production.

---

## 8. Concrete Next Step (No Guesswork)

**Execute order (implement in this sequence):**  
1. Add `[VISION_PIPELINE]` logs in Core after `findMany` (0.05 correlation + 0.1 files).  
2. Add skip-reason logs inside `getVisionImageParts` (0.2).  
3. Add Core providerData trace (0.15) before `callAIProvider`.  
4. Add provider logs (0.3 content shape + 0.25 final payload shape) right before the HTTP call.  
Then deploy and test with one image.

Do this first:

1. Add the **Phase 0** logs: **request correlation** (requestId/conversationId in every log line); Core after files; Core after vision parts + skip reasons; Core providerData trace before `callAIProvider`; Provider before request (hasVision, model, content shape); **Provider final payload shape** (message count, user message index, image block count) right before HTTP call. Use prefix `[VISION_PIPELINE]`. **Do not log base64.**
2. Deploy to Cloud Run.
3. Test **one image attachment** (e.g. profile-pic.jpg) and ask “what’s in this image?”
4. In production logs, confirm:
   - `files.length > 0`
   - `visionImageParts.length > 0` (or see skip reasons if 0)
   - providerData includes `visionImageParts` (from keys trace)
   - Provider: `hasVision === true` and request content is **multimodal** (array), not string.

**What the plan will reveal:**
- `files.length === 0` → attachment linking / DB query issue
- `files.length > 0` but `resolveStoragePath === null` → bad path/url storage
- path ok but `getFileBuffer` fails → GCS auth/bucket/permissions or wrong object key
- `visionImageParts.length > 0` but provider logs show text-only → provider request builder bug
- `hasVision` true but model still vague → prompt injection or model selection issue

Then fix that point (e.g. path/url resolution, GCS fetch, or add the Core call if it's missing in the deployed branch).

**Copy/paste log statements**: For each of the Phase 0 points, you can get ready-to-paste log lines that match your code style (TypeScript, logger API). Specify which logger the server uses (e.g. `server/src/lib/logger` — `logger.info` / `logger.debug`).
