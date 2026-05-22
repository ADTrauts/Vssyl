# Module AI SDK boundaries (Phase 4D)

**Status:** Canonical partner contract (May 2026)  
**Audience:** Marketplace module developers, admin reviewers, platform engineers  
**Related:** [`AI_CONTEXT_PROVIDER_API.md`](./AI_CONTEXT_PROVIDER_API.md), [`WEBHOOK_SUBSCRIPTIONS.md`](../architecture/WEBHOOK_SUBSCRIPTIONS.md), [`DOMAIN_EVENTS.md`](../architecture/DOMAIN_EVENTS.md), [`memory-bank/aiContextSystem.md`](../../memory-bank/aiContextSystem.md)

---

## Purpose

This document defines **what third-party modules may and may not do** in the Vssyl AI platform after Phase 4 (Memory → Learning → Cross-module → Extensibility). Partners integrate through **manifest-declared contracts** — not by modifying twin core code.

**Anchor principle:** [Visible Intelligence > Hidden Intelligence](../plans/AI_PLATFORM_EXECUTION_PRINCIPLES.md) — users see influence and diagnostics; partners do not inject opaque “magic.”

---

## Runtime model (locked)

| Layer | Partner access |
|-------|----------------|
| **UI** | Sandboxed iframe or approved GCS bundle only |
| **Backend** | Partner-hosted HTTPS APIs only — **no in-process code** on Vssyl servers |
| **AI twin** | Read-only context fetch + optional webhook action executor |
| **Memory / learning** | Platform-owned; partners do not write `UserMemoryFact` directly |
| **Autonomy** | **No autonomous execution** — action executors require explicit approval flows when enabled |

See also: [`THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](./THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md).

---

## What partners CAN do

### 1. Register AI context (`manifest.aiContext`)

Required for any AI-exposed module:

- `purpose`, `category`, `keywords`, `patterns`, `concepts`
- `entities`, `actions` (with permission names)
- **`contextProviders`** — at least one valid endpoint (see [`AI_CONTEXT_PROVIDER_API.md`](./AI_CONTEXT_PROVIDER_API.md))
- Optional: `relationships`, `queryableData`

On approval, `ModuleRegistrySyncService` registers the module in `ModuleAIContextRegistry`. The twin discovers the module via keyword/pattern matching — **no twin code changes**.

### 2. Implement context provider endpoints (partner-hosted or platform-proxied)

- **GET** endpoints returning `{ success, context, metadata }`
- Tenant-scoped reads (`userId`, `dashboardId`, `businessId` when required)
- Response under **32 KB** recommended; **5 s** platform timeout
- Cache TTL declared per provider (`cacheDuration` 1 min – 24 h)

Platform internal fetch uses short-lived JWT; partners verify auth on their side.

### 3. Register webhook action executors (`manifest.aiActionExecutor`)

For write operations the AI may suggest (when actions UI is enabled):

```json
"aiActionExecutor": {
  "executorUrl": "https://partner.example.com/v1/ai/execute",
  "signingSecret": "<shared-secret>",
  "supportedOperations": ["create_item", "update_item"],
  "timeout": 30000
}
```

- **Webhook only** — registered in `ActionExecutorRegistry` at module sync
- Requests include **HMAC signature** (`X-Vssyl-Signature`) when `signingSecret` is set
- Partner returns `ActionExecutionResult` JSON
- Partner must enforce authorization and tenant scope before mutating data

### 4. Declare notifications (`manifest.notifications`)

When the module sends notifications, metadata is **required** for discovery:

- Types: `[moduleId]_[event]` convention
- See [`NOTIFICATION_METADATA_GUIDE.md`](./NOTIFICATION_METADATA_GUIDE.md)

### 5. Emit normalized module activity (partner backend)

Important user-visible actions should emit compatible activity events (partner documents envelope alignment with `memory-bank/moduleSpecs.md`). Platform activity log ≠ partner analytics.

### 6. Subscribe to outbound webhooks (business admins)

Business workspace admins (not manifest-level) may register HTTPS endpoints for signed platform events (`module.installed`, `file.shared`, …). See [`WEBHOOK_SUBSCRIPTIONS.md`](../architecture/WEBHOOK_SUBSCRIPTIONS.md).

---

## What partners CANNOT do

| Forbidden | Why |
|-----------|-----|
| **In-process server modules** | Security and tenancy — iframe/artifact + webhooks only |
| **Modify `DigitalLifeTwinCore` / pipeline registry** | Platform-owned orchestration |
| **Direct memory or learning writes** | `UserMemoryFact`, learning promotion are platform paths |
| **Synthetic cross-module insights in provider payloads** | Gated by `AI_SYNTHETIC_CONTEXT_ENABLED`; partners supply **live data only** |
| **Autonomous / silent execution** | No bypass of approval; autonomy settings bound prompts only |
| **Cross-tenant data in context or webhooks** | Instant certification failure + security incident |
| **Secrets in manifest beyond signingSecret** | No API keys for platform infra; use executor webhook auth |
| **Substitute analytics for activity events** | Activity vs analytics separation is mandatory |
| **Raw PII in domain event metadata** | Use ids; see `DOMAIN_EVENTS.md` disallowed fields |

---

## AI maturity gates (certification)

Automated checks (`moduleCertificationValidator` **v1.1.0+**) and human review must confirm:

| Gate | Requirement |
|------|-------------|
| **G1 — AI context** | AI-exposed modules have valid `aiContext` + ≥1 `contextProvider` passing structural validation |
| **G2 — Provider API** | Endpoints match `/api/{module}/ai/context/{name}` or `/api/{module}/ai/query/{name}`; cache in range |
| **G3 — Executor** | If writes exposed to AI: webhook executor only, `supportedOperations` declared, HMAC recommended |
| **G4 — No in-process** | Manifest capabilities must not include in-process / server-side execution |
| **G5 — Notifications** | If declared, `notifications[]` metadata complete |
| **G6 — Tenancy** | Partner docs describe scoping; reviewer spot-checks provider/executor auth |
| **G7 — Diagnostics** | Admin can run provider health check (AI Pipeline → Test Lab) before publish |

**Reference manifest:** [`docs/test-modules/full-ai-contract-module.json`](../test-modules/full-ai-contract-module.json)  
**Cert test:** `server/src/services/__tests__/fullAiContractModule.certification.test.ts`

---

## Domain events and AI consumption

Partners **do not publish** platform domain events directly. The platform emits typed events (`module.installed`, `file.shared`, …) after authorized mutations. The **AI layer** consumes a subset for learning stubs (`AIEventConsumer`) — read-only, no auto-exec.

Partners may:
- Document which platform events correlate with their module lifecycle
- Rely on business webhook subscriptions for outbound integration

See [`DOMAIN_EVENTS.md`](../architecture/DOMAIN_EVENTS.md).

---

## End-to-end partner checklist

1. [ ] Manifest includes complete `aiContext` + valid `contextProviders`
2. [ ] Partner HTTPS endpoints implement [`AI_CONTEXT_PROVIDER_API.md`](./AI_CONTEXT_PROVIDER_API.md) response shape
3. [ ] Webhook executor (if any) verifies HMAC and returns `ActionExecutionResult`
4. [ ] Notification metadata (if applicable)
5. [ ] No in-process / dangerous capabilities
6. [ ] Passes structural certification at artifact finalize
7. [ ] Admin provider health check passes for test user
8. [ ] Semantic interoperability checklist (`moduleSpecs.md`) signed off in review

---

## First-party vs third-party

| Concern | First-party (monorepo) | Third-party (marketplace) |
|---------|------------------------|---------------------------|
| Context providers | Express controllers in `server/src/controllers/*AIContextController.ts` | Partner HTTPS (or future proxy) |
| Action executors | In-process or webhook | **Webhook only** |
| Registration | `registerBuiltInModules.ts` | Manifest → sync on approve |
| Certification | PR review + same checklist | Automated validator + admin gate |

---

## Version history

| Date | Change |
|------|--------|
| 2026-05-21 | Phase 4D — canonical SDK boundaries; maturity gates G1–G7 |
