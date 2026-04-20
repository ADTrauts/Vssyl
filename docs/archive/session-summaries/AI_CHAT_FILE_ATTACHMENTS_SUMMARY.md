# AI Chat File Attachments - Implementation Summary

## Session Overview
**Date**: February 2025  
**Focus**: AI chat attachment support — upload, persist, analyze, integrate with Drive

## Summary

Implemented full attachment flow for AI chat: users can attach Drive files (from local upload or existing Drive files), have content extracted for AI context, persist attachments with messages, and use "Ask AI about this file" from the File Hub.

## Phases Completed

### Phase 1: Basic Attachment Support ✅
- **AIFileUpload** component wrapping ChatFileUpload for Drive uploads
- Attachment chips with remove in AI chat input area
- `fileIds` passed in `context.fileIds` to `/api/ai/twin` (all AI chat entry points use twin endpoint)
- **Files**: `web/src/components/ai/AIFileUpload.tsx`, `AIChatModule.tsx`, `ai-chat/page.tsx`

### Phase 2: Persist Attachments in AI Messages ✅
- **Schema**: `AIMessage.attachments Json?` stores `{ fileIds: string[] }`
- **Migration**: `20260211111406_add_ai_message_attachments`
- **Backend**: `addMessage` accepts `fileIds`, validates user access (owner or canRead), persists attachments
- **API**: `AddMessageData.fileIds`, `AIMessage.attachments`
- **Files**: `prisma/modules/ai/conversations.prisma`, `aiConversationController.ts`, `web/src/api/aiConversations.ts`

### Phase 3: File Analysis Service & AI Prompt ✅
- **fileAnalysisService.ts**: Extracts text from .txt, .md, .json, .csv, .html, PDF (pdf-parse + unpdf), Office docs (officeparser), images (tesseract OCR)
- **Limits**: 5 files, 2MB per file (5MB for images), 4000 chars per summary
- **DigitalLifeTwinCore**: Fetches files with user access check, calls `getFileSummaries()`, injects summaries into ATTACHED FILES CONTEXT prompt
- **Dependencies**: `pdf-parse`, `unpdf`, `officeparser`, `tesseract.js`
- **Files**: `server/src/services/fileAnalysisService.ts`, `DigitalLifeTwinCore.ts`

### Phase 4: "Ask AI about this file" from Drive ✅
- **AI chat**: Reads `fileIds` and `fileNames` from URL (`?fileIds=...&fileNames=...`), pre-attaches on load
- **DriveModule**: "Ask AI about this file" in context menu (files only)
- **DriveDetailsPanel**: "Ask AI about this file" button in Actions section
- **Starred page**: Same in context menu and details panel
- **Files**: `ai-chat/page.tsx`, `DriveModule.tsx`, `DriveDetailsPanel.tsx`, `drive/starred/page.tsx`

### Phase 5: Limits & UX Polish ✅
- **Max 10 attachments** (matches backend); cap on add, toast when exceeded
- **File count badge**: "X/10 files"
- **Help text**: "Up to 10 files. Large files (500KB+) may be summarized only"
- **AIFileUpload**: `maxFiles`, `currentCount` props; disabled when at limit
- **Files**: `ai-chat/page.tsx`, `AIChatModule.tsx`, `AIFileUpload.tsx`

## Key Paths

| Purpose | Path |
|---------|------|
| Upload component | `web/src/components/ai/AIFileUpload.tsx` |
| File analysis | `server/src/services/fileAnalysisService.ts` |
| AI prompt integration | `server/src/ai/core/DigitalLifeTwinCore.ts` |
| Message persistence | `server/src/controllers/aiConversationController.ts` |
| Schema | `prisma/modules/ai/conversations.prisma` |

### Phase 6: Production Fixes (Google Cloud) ✅
- **Issue**: Worked in local dev but not on Cloud Run (GCS, serverless).
- **AIChatModule endpoint**: Was calling non-existent `/api/ai/query`; fixed to `/api/ai/twin`.
- **PDF extraction in production**: pdf-parse (native modules) can fail on Cloud Run. Use **unpdf** as primary when `NODE_ENV=production`; pdf-parse first in dev. Added `unpdf@^1.4.0`.
- **GCS path resolution**: `resolveStoragePath` handles path-as-URL; `extractPathFromUrl` supports `storage.cloud.google.com` and `storage.googleapis.com`.
- **Error differentiation**: Separate storage fetch vs path resolution vs parse errors; distinct messages for Cloud Logging diagnosis.
- **Files**: `fileAnalysisService.ts`, `storageService.ts`, `AIChatModule.tsx`, `DigitalLifeTwinCore.ts`

## Technical Notes

- **File access validation**: DigitalLifeTwinCore and addMessage both validate user owns file or has FilePermission with canRead
- **Storage path resolution**: Uses `file.path` (or extractPathFromUrl if path is URL) or `storageService.extractPathFromUrl(file.url)` for getFileBuffer
- **Production**: unpdf-first for PDFs; GCS path handling; Cloud Logging via `file_analysis_*`, `digital_life_twin_*` operations
- **Logger**: `logger.warn` error metadata expects `{ message: string }` object, not plain string

## Future Enhancements (Not Implemented)

- "Attach from File Hub" picker (modal for selecting existing Drive files)
- Image/vision support for analysis
- Caching of file summaries
