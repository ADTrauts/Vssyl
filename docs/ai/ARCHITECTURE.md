# AI Attachment & Vision Architecture

How file attachments flow from the client to the AI provider in the Digital Life Twin pipeline. Single source of truth for developers and AI editors.

---

## Attachment flow (end-to-end)

```
Client (ai-chat, AIChatDropdown, etc.)
  → POST /api/ai/twin with context.fileIds: string[]
  → Backend: DigitalLifeTwinCore.processAsDigitalTwin(query)
```

1. **Resolve files**  
   `context.fileIds` are used to load **File** records from the database (by id, with `trashedAt: null` and user/permission scope). Each record has `path`, `url`, `name`, `size`, `type`.

2. **Storage resolution**  
   Files are **not** assumed to be on local disk. In production (Cloud Run), **GCS is the source of truth**.  
   - `resolveStoragePath(file)` (in `fileAnalysisService`) derives a storage path from `file.path` or `file.url`.  
   - That path must be resolvable via **storageService** (e.g. `storageService.getFileBuffer(path)` for GCS or local).

3. **Two pipelines in parallel**
   - **Text/summaries**: `getFileSummaries(files)` → fetches each file via storageService, extracts text (PDF, Office, images with OCR when available), returns `FileAnalysisResult[]` (id, name, summary, optional fileIssueCode). Summaries are injected into the **prompt** (attached-files section).
   - **Vision**: `getVisionImageParts(files, 5, 5MB)` → for image-type files only, fetches via storageService, returns base64 + mime parts. For image-based PDFs (short/no text), `getPdfVisionParts` can render first 1–2 pages to images and append to vision parts (cap 5 total). These parts are passed as **visionImageParts** to the provider.

4. **Prompt + vision to provider**  
   - The built prompt (including attached-files text section) and **visionImageParts** (when non-empty) are passed into `generateLifeTwinResponse` and then **callAIProvider**.  
   - Provider (OpenAI/Anthropic) receives the same user message text plus image blocks; when vision parts exist, the provider uses a vision-capable model (see PROVIDERS.md).

5. **Response**  
   The twin response includes `response`, `structured`, `fileIssues` (when any file had a failure code), and metadata. The UI renders the reply and any attachment issues from `fileIssues`.

---

## Cloud Run constraints

- **No local uploads directory.** The server does not assume `/uploads` or any local path for user files. All file content is read via **storageService** (GCS in production).
- **Path/URL must resolve.** `File.path` or `File.url` must be in a form that `resolveStoragePath` / storageService can use (e.g. GCS object key or signed URL).
- **Vision/PDF rendering.** Image and PDF→image processing uses in-memory buffers or **/tmp** (e.g. Poppler for PDF pages). No reliance on a persistent local filesystem.

---

## Key files

| Layer        | File / area |
|-------------|-------------|
| Entry       | `server/src/routes/ai.ts` (POST /twin), `server/src/ai/core/DigitalLifeTwinCore.ts` (processAsDigitalTwin) |
| File load   | `DigitalLifeTwinCore`: prisma.file.findMany by context.fileIds |
| Summaries   | `server/src/services/fileAnalysisService.ts`: getFileSummaries, resolveStoragePath, extractTextFromBuffer |
| Vision      | fileAnalysisService: getVisionImageParts, getPdfVisionParts, renderPdfPagesToVisionParts |
| Provider    | DigitalLifeTwinCore.generateLifeTwinResponse → callAIProvider; providers use visionImageParts and vision model |
| Capabilities| `server/src/ai/providers/capabilities.ts`: getProviderCapabilities (vision model, supportsVisionInput) |
| File issues | `server/src/ai/types/fileIssues.ts`; Core builds fileIssues from file analysis results |

---

## See also

- **PROVIDERS.md** — Request shapes, capability matrix, model selection.
- **RUNBOOK.md** — Logging, debugging, env vars.
- **GOLDEN_RULES.md** — Rules for editors and Cursor.
