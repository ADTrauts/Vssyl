# AI Attachment & Vision Architecture

How file attachments flow from the client to the AI provider in the Digital Life Twin pipeline. Single source of truth for developers and AI editors.

**Platform hub:** [`docs/architecture/AI_PLATFORM_OVERVIEW.md`](../architecture/AI_PLATFORM_OVERVIEW.md)

---

## Attachment flow (end-to-end)

```
Client (ai-chat, AIChatDropdown, etc.)
  → POST /api/ai/twin with context.fileIds: string[]
  → Backend: DigitalLifeTwinCore.processAsDigitalTwin(query)
```

```mermaid
flowchart TD
  Req["AI request context.fileIds"] --> Load["DigitalLifeTwinCore prisma.file.findMany"]
  Load --> Scope["Scope check userId + permission + trashedAt null"]
  Scope --> Meta["File records path / url / name / size / type"]
  Meta --> Resolve["fileAnalysisService.resolveStoragePath"]
  Resolve --> Buffer["storageService.getFileBuffer"]
  Buffer --> Store["GCS / configured storage"]

  Meta --> Summaries["getFileSummaries"]
  Summaries --> Extract["extractTextFromBuffer PDF / Office / OCR"]
  Extract --> SumResult["FileAnalysisResult summary + fileIssueCode"]
  SumResult --> PromptSec["Attached-files prompt section"]

  Meta --> Vision["getVisionImageParts max 5 images 5MB cap"]
  Vision --> PDF{"Image-only PDF?"}
  PDF -->|"Yes"| PdfVision["getPdfVisionParts renderPdfPagesToVisionParts"]
  PDF -->|"No"| SkipPdf["Skip PDF vision"]
  PdfVision --> Parts["visionImageParts"]
  SkipPdf --> Parts
  Vision --> Parts

  PromptSec --> ProviderData["providerData"]
  Parts --> ProviderData
  ProviderData --> Gen["generateLifeTwinResponse → callAIProvider"]
  Gen --> Resp["response + structured + fileIssues + metadata"]
  Resp --> UI["UI renders answer and fileIssues"]
```

### Step summary

1. **Resolve files**  
   `context.fileIds` load **File** records (`trashedAt: null`, user/permission scope).

2. **Storage resolution**  
   Production uses **GCS** via `resolveStoragePath` + `storageService.getFileBuffer`.

3. **Two pipelines in parallel**
   - **Text/summaries**: `getFileSummaries` → attached-files prompt section.
   - **Vision**: `getVisionImageParts`; image-only PDFs via `getPdfVisionParts` → **visionImageParts**.

4. **Prompt + vision to provider**  
   `generateLifeTwinResponse` → `callAIProvider` with summaries + vision parts. See [PROVIDERS.md](./PROVIDERS.md).

5. **Response**  
   Twin returns `fileIssues` when analysis failed; UI surfaces attachment issues.

---

## Client-facing attachment pipeline

Higher-level view from the chat UI through provider formatting.

```mermaid
flowchart TB
  Client["AI request with context.fileIds"] --> Records["Load file records"]
  Records --> Perm["Permission + trashedAt scope check"]
  Perm --> Path["resolveStoragePath"]
  Path --> Buf["storageService.getFileBuffer"]
  Buf --> GCS["GCS / configured storage"]

  subgraph text [Text summary pipeline]
    T1["Extract text / OCR / metadata"]
    T2["File summaries"]
    T3["Attached files section in prompt"]
    T1 --> T2 --> T3
  end

  subgraph vision [Vision pipeline]
    V1["Image type + size filtering"]
    V2{"Image-based PDF?"}
    V3["getPdfVisionParts / render pages"]
    V4["getVisionImageParts"]
    V5{"Provider supports vision?"}
    V6["Vision-capable model"]
    V7["Text-only fallback summaries"]
    V1 --> V2
    V2 -->|"Yes"| V3 --> V4
    V2 -->|"No"| V4
    V4 --> V5
    V5 -->|"Yes"| V6
    V5 -->|"No"| V7
  end

  Buf --> text
  Buf --> vision
  T3 --> Builder["Provider request builder"]
  V6 --> Builder
  V7 --> Builder
  Builder --> OAI["OpenAI text + image_url blocks"]
  Builder --> Ant["Anthropic text + image blocks"]
  Builder --> Loc["Local summaries only"]
  OAI --> Out["AI response + fileIssues metadata"]
  Ant --> Out
  Loc --> Out
  Out --> Render["UI renders attachment issues"]
```

---

## Cloud Run constraints

- **No local uploads directory.** All file content via **storageService** (GCS in production).
- **Path/URL must resolve.** `File.path` or `File.url` must work with `resolveStoragePath`.
- **Vision/PDF rendering.** In-memory buffers or **/tmp** (Poppler for PDF pages).

---

## Key files

| Layer        | File / area |
|-------------|-------------|
| Entry       | `server/src/routes/ai.ts` (POST /twin), `server/src/ai/core/DigitalLifeTwinCore.ts` |
| File load   | `DigitalLifeTwinCore`: prisma.file.findMany by context.fileIds |
| Summaries   | `server/src/services/fileAnalysisService.ts`: getFileSummaries, resolveStoragePath, extractTextFromBuffer |
| Vision      | fileAnalysisService: getVisionImageParts, getPdfVisionParts, renderPdfPagesToVisionParts |
| Provider    | DigitalLifeTwinCore.generateLifeTwinResponse → callAIProvider |
| Capabilities| `server/src/ai/providers/capabilities.ts`: getProviderCapabilities |
| File issues | `server/src/ai/types/fileIssues.ts` |

---

## See also

- **PROVIDERS.md** — Request shapes, capability matrix, model selection.
- **RUNBOOK.md** — Logging, debugging, prod troubleshooting flowchart.
- **GOLDEN_RULES.md** — Rules for editors and Cursor.
