# AI Vision & Attachments — Golden Rules

Short, non-negotiable rules for developers and Cursor when working on attachment or vision behavior. Follow these so the pipeline stays consistent and production-safe.

---

1. **Cloud Run cannot rely on local uploads.**  
   The server must not assume files live on local disk (e.g. `/uploads`). In production, **GCS** (or the configured storage) is the source of truth. All file reads go through **storageService**.

2. **Any attachment feature must work with GCS fetch.**  
   Resolve file content via `resolveStoragePath` + `storageService.getFileBuffer(path)`. Path/URL must be in a form the storage layer understands (e.g. GCS object key).

3. **Vision requires all of:**  
   (a) **Parts exist** — `getVisionImageParts` (and optionally PDF vision) is called and returns at least one part.  
   (b) **Provider supports vision** — `getProviderCapabilities(provider).supportsVisionInput === true`.  
   (c) **Model supports vision** — when vision parts exist, the request uses the provider’s **vision model** (e.g. gpt-4o, claude-3-5-sonnet).  
   (d) **Request is multimodal** — the provider builds a user message with both text and image blocks (not text-only).

4. **Always log:**  
   For attachment/vision debugging and runbooks: **files.length**, **visionParts.length**, **model chosen**, and **request shape** (multimodal vs text-only). Use the **`[VISION_PIPELINE]`** prefix and structured fields (requestId, conversationId, operation) so logs are searchable.

5. **When adding a new provider:**  
   Declare **vision/image capabilities** in `capabilities.ts` and use the **vision model** when images exist. Do not send vision parts to providers that do not support them; rely on file summaries in the prompt instead.

6. **File issues are deterministic and UI-owned.**  
   Use the **fileIssues** taxonomy (codes + user-facing messages) from the backend; the UI renders `message`. Do not have the model repeat file error wording; keep it accurate (size limit, not found, could not load, text could not be extracted). Include **PDF_RENDER_UNAVAILABLE** when pdftoppm is missing for PDF vision.

7. **Rate limit and fallback.**  
   On 429 or temporary provider failure, set `metadata.code` (`RATE_LIMITED` or `TEMP_UNAVAILABLE`) so Core can auto-fallback to the other provider. Set **usedVisionParts** only when the provider call succeeds (not on fallback or error).

---

## Quick refs

- Flow: **ARCHITECTURE.md**
- Providers & models: **PROVIDERS.md**
- Logs & env: **RUNBOOK.md**
