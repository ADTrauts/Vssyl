# AI Phase 1 Test Strategy

**Program:** AI Architecture Phase 1 — Safety and Regression Foundation  
**Date:** 2026-07-12  
**Status:** Active  
**Owner:** AI Platform  

---

## Integration boundary

| Layer | Strategy |
|-------|----------|
| `POST /api/ai/twin` HTTP | Phase 1A route seam may mock Service; **Phase 1B** real stack: Service + Core + FakeAIProvider (see `ai-twin-phase1b-e2e`) |
| Twin Core provider call | **Inject** via `setAIProviderFactory` → `FakeAIProvider` (no network) |
| Context orchestrator | Unit/existing suites; Phase 1 does not spin full module HTTP for every case |
| Tools | Unit tests of `executeGovernedTool` + existing `toolExecutor` domain mocks |
| Conversation reasoning | Table-driven pure functions (no DB) |
| Knowledge ingress | Table-driven Decision Model fixtures (document intended outcomes) |
| Prisma | Real DB for auth fixtures; mocked Prisma for governance unit tests; new `AIActionExecution` table for ledger |

**Do not** create a second Twin implementation for tests.

---

## What is mocked

- OpenAI / Anthropic network (FakeAIProvider / factory override)
- `DigitalLifeTwinService` in twin HTTP route seam tests
- Domain services inside tool tests (`grantFileShareByEmail`, `aiCreateTask`, …)
- Feature gating / query balance in twin route seam (controllable)

## What remains real

- JWT auth helpers + real User rows for HTTP seam
- `authenticateJWT` middleware
- Risk registry + approval decision functions
- Idempotency hash helpers
- `providerRouting` fallback resolution
- Conversation reasoning heuristics

---

## Provider injection seam

`server/src/ai/providers/aiProviderFactory.ts`

- Production: constructs OpenAI / Anthropic / Local adapters
- Tests: `setAIProviderFactory(createFakeProviderFactory(...))`
- Cleared with `setAIProviderFactory(null)` in `afterEach`

Wired from `DigitalLifeTwinCore.callAIProvider`.

---

## Database strategy

- Vitest + existing `DATABASE_URL` Prisma (same as other integration tests)
- Migration: `prisma/migrations/20260712150000_ai_action_execution_phase1`
- Governance unit tests mock `aIActionExecution` / `aIApprovalRequest` to avoid DB flakiness

---

## Fixture strategy

- Auth: `server/src/__tests__/helpers/auth.ts`
- Fake providers: `server/src/ai/providers/FakeAIProvider.ts`
- Knowledge/reasoning: inline table cases in test files

---

## Authorization strategy

- Tool AuthZ remains in domain services (`listAccessibleDriveFiles`, share service, todo AI action)
- Phase 1 adds **risk + approval gate** before mutating domain calls for classified high-risk tools
- Tenant matrix documented in `AI_TENANT_AND_SCOPE_REGRESSION_MATRIX.md`

---

## CI / local commands

```bash
cd server
pnpm exec vitest run \
  src/ai/governance/__tests__ \
  src/ai/providers/__tests__/FakeAIProvider.test.ts \
  src/ai/providers/__tests__/providerFallbackPhase1.test.ts \
  src/ai/conversation/__tests__/conversationReasoningPhase1.test.ts \
  src/routes/__tests__/ai-twin-phase1.integration.test.ts \
  src/ai/tools/__tests__ \
  src/ai/context/__tests__ \
  src/ai/pipeline/__tests__
```

---

## Phase 1B commands

```bash
cd server
pnpm exec vitest run \
  src/routes/__tests__/ai-twin-phase1b-e2e.integration.test.ts \
  src/routes/__tests__/ai-twin-phase1b-business-auth.integration.test.ts \
  src/routes/__tests__/ai-twin-phase1b-approval.integration.test.ts \
  src/ai/governance/__tests__ \
  src/ai/providers/__tests__/visionAttachmentPhase1b.test.ts \
  src/ai/context/__tests__/contextProviderPhase1b.test.ts
```

Migration: `docs/deployment/AI_PHASE1_ACTION_EXECUTION_MIGRATION_RUNBOOK.md`  
Certification: `docs/architecture/AI_PHASE1B_SAFETY_CERTIFICATION_MATRIX.md`

## Known limitations

- Phase 1B Core E2E uses FakeAIProvider; live OpenAI/Anthropic not called
- Vision OCR / Poppler not required in CI; contract + Fake hasVision
- Query-balance exhaustion: admin bypass used in several E2E cases
- `/api/business-ai/:id/interact` remains mock Twin — membership proven on `/api/ai/twin` + businessId
- Drift in older migrations may block `migrate dev`; prefer `migrate deploy` + runbook
- See `AI_PHASE1B_OPEN_LIMITATIONS.md`
