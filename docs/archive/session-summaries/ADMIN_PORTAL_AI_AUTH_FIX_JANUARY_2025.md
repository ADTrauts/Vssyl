# Admin Portal AI Auth Fix & API Consolidation — January 2025

**Date**: January 2025  
**Status**: ✅ **COMPLETE**  
**Follows**: [AI_SYSTEM_ENHANCEMENTS_JANUARY_2025.md](./AI_SYSTEM_ENHANCEMENTS_JANUARY_2025.md)

---

## Summary

Admin portal AI System and AI Learning pages were returning **401 Unauthorized** when loading data from `/api/admin/business-ai/*` and `/api/centralized-ai/*` because those calls used raw `fetch` without authentication headers. This session fixed the 401s by routing all admin AI data through `adminApiService`, which attaches the NextAuth session token.

---

## What Was Fixed

### 1. 401 Errors

- **Symptom**: `GET /api/admin/business-ai/global`, `GET /api/admin/business-ai/patterns`, and `/api/centralized-ai/health`, `/api/centralized-ai/patterns`, `/api/centralized-ai/insights`, `/api/centralized-ai/privacy/settings` returned 401.
- **Cause**: Pages called these endpoints via `fetch(...)` with only `credentials: 'include'` and no `Authorization: Bearer <token>`.
- **Fix**: All such requests now use `adminApiService` methods, which call `getAuthHeaders()` and send the session token.

### 2. adminApiService AI Methods

New methods in `web/src/lib/adminApiService.ts`:

| Method | Backend endpoint |
|--------|-------------------|
| `getBusinessAIGlobal()` | `GET /api/admin/business-ai/global` |
| `getBusinessAIPatterns()` | `GET /api/admin/business-ai/patterns` |
| `getCentralizedAIHealth()` | `GET /api/centralized-ai/health` |
| `getCentralizedAIPatterns()` | `GET /api/centralized-ai/patterns` |
| `getCentralizedAIInsights()` | `GET /api/centralized-ai/insights` |
| `getCentralizedAIPrivacySettings()` | `GET /api/centralized-ai/privacy/settings` |

Each uses `getAuthHeaders()`, handles `{ success, data }`-style responses, and returns `{ data }` or `{ error }`.

### 3. Page Updates

- **`/admin-portal/ai-system`**: Overview data loads via `adminApiService.getBusinessAIGlobal()` and `getBusinessAIPatterns()` instead of direct fetch.
- **`/admin-portal/ai-learning`**: Health, patterns, insights, and privacy settings load via the new centralized-AI methods. Additional UX: “Run Pattern Analysis” and “Generate Insights” actions, empty states, and loading states.

---

## Files Touched

- `web/src/lib/adminApiService.ts` — New AI methods.
- `web/src/app/admin-portal/ai-system/page.tsx` — Use adminApiService for business-ai.
- `web/src/app/admin-portal/ai-learning/page.tsx` — Use adminApiService for centralized-ai; pattern/insight triggers and empty states.

---

## Documentation Updates

- `memory-bank/activeContext.md` — New “Admin Portal AI Auth Fix & API Consolidation” completion block.
- `memory-bank/adminProductContext.md` — AI System Overview updated with auth, endpoints, and Provider Usage / AI Learning details.
- `docs/archive/guides-merged-2026/AI_CONTEXT_SYSTEM_ARCHITECTURE.md` (formerly `docs/guides/AI_CONTEXT_SYSTEM_ARCHITECTURE.md`) — “Admin Portal AI Integration” section.
- `memory-bank/aiContextSystem.md` — Note on admin AI endpoints and `adminApiService`. Expanded "Automatic Fact Extraction" section with details on how facts are loaded and used in future conversations, including prompt integration and conversation history usage.
- Same archived file — “Conversation Memory & Fact Extraction System” section.

---

## Rules Going Forward

1. **Never** call `/api/admin/business-ai/*` or `/api/centralized-ai/*` from admin UI via raw `fetch` without auth. Use `adminApiService` only.
2. New admin AI endpoints should get a corresponding `adminApiService` method and be used from admin pages through that layer.

---

## Related

- [AI_SYSTEM_ENHANCEMENTS_JANUARY_2025.md](./AI_SYSTEM_ENHANCEMENTS_JANUARY_2025.md) — Broader AI system work.
- [AI Context System Architecture](../../archive/guides-merged-2026/AI_CONTEXT_SYSTEM_ARCHITECTURE.md) — Admin Portal AI Integration section.
- `memory-bank/adminProductContext.md` — AI System Overview.
