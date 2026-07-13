# AI Observability, Cost, and Quality Audit

**Date:** 2026-07-12  

---

## Telemetry checklist

| Field | Captured today? | Where |
|-------|-----------------|-------|
| request ID | Yes | Core `requestId` UUID |
| conversation ID | Yes | Context + messages |
| user ID | Yes | Auth / query |
| business ID | When provided | Context + membership |
| module | Partial | Context / providers |
| task type | Partial | Pipeline intent inference |
| selected provider | Yes | Routing record / metadata |
| selected model | Yes | Routing / provider |
| selection reason | Partial | Routing diagnostics phases |
| fallback reason | Yes when fallback | Routing diagnostics |
| prompt version | Limited | Not a first-class version id everywhere |
| orchestration version | Partial | Snapshot / matrix version |
| trace tags | Partial | pipelineTrace |
| context providers used | Yes | Orchestration audit / snapshot |
| retrieval sources | Yes when grounding | Evidence bundle |
| tool calls | Yes in loop / trace | Core + diagnostics |
| tool outcomes | Partial | Tool result strings |
| approval status | Partial | Approval tables / response flags |
| token usage | Partial | Provider metadata |
| estimated cost | Weak | queryCost units ≠ $ |
| latency | Yes | Core timing |
| error code | Partial | Logger + HTTP |
| retry count | Partial | Provider / fallback |
| grounding status | Yes | Enforcement + trace |
| confidence | Conversation reasoning | Understanding layer |
| user feedback | `/api/ai/feedback` | Route |
| regression markers | Admin quality / evals docs | Incomplete automation |
| file issues | Yes | `fileIssues` |
| vision usage | Yes | `usedVisionParts` / logs |

---

## Gaps vs architecture claims

| Claim | Reality |
|-------|---------|
| Full operator diagnostics | Strong for twin via pipeline hub when enabled |
| Unified cost across all AI | **Gap** — Notebook/Whisper/extraction not one ledger with twin |
| Selection reason always user-visible | Influence drawer ≠ full routing record |
| Eval loop | Specs exist in ai-knowledge; not fully automated CI gates |

---

## Proposed canonical AI execution record (documentation only)

```text
AiExecutionRecord {
  requestId, conversationId?, userId, businessId?, householdId?, dashboardId?,
  surface: 'twin' | 'notebook' | 'media' | 'extraction' | 'intelligence' | 'admin_lab',
  taskType, intentId?,
  routing: { tier?, requestedProvider, requestedModel, selectedProvider, selectedModel,
             fallbackApplied, fallbackReason, matrixVersion, effort? },
  context: { providers[], retrievalSources[], fileIds[], visionUsed },
  tools: [{ name, ok, ms }],
  governance: { approvalRequired, approvalId?, enforcementOutcome },
  knowledge: { rememberThat?, learningEventIds[] },
  usage: { inputTokens?, outputTokens?, queryCost, latencyMs },
  quality: { groundingStatus, confidenceBand?, userFeedback? },
  error?: { code, message, retryCount }
}
```

Persist for twin when diagnostics enabled; extend to SPECIALIZED paths in Phase 4.

---

## Cost controls

| Control | Status |
|---------|--------|
| AI query balance | Active |
| Per-model queryCost | Catalog |
| Admin provider spend snapshots | Active |
| Soft spending limit UI | Present |
| Hard $ budget per tier | Not found |

---

## Quality controls

| Control | Status |
|---------|--------|
| Pipeline enforcement | Active |
| Response quality validators | Utils present |
| Admin test-lab | Active |
| Structured response modes | Present |
| Automated regression suite | Partial — see test audit |
