# Digital Life Twin — prompt pipeline (canonical)

**Last updated:** 2026-05-23 (V_Link pipeline + full trace path)

**Hub diagram:** [AI_PLATFORM_OVERVIEW.md](./AI_PLATFORM_OVERVIEW.md)  
**Assembly detail:** [AI_CONTEXT_ASSEMBLY.md](./AI_CONTEXT_ASSEMBLY.md)

## Single live path (chat / twin)

User messages on `/api/ai/twin` (and streaming) follow this pipeline:

1. **`DigitalLifeTwinService.processAsDigitalLifeTwin`** — recall, memory facts, conversation history.
2. **`DigitalLifeTwinCore.processAsDigitalTwin`**
   - Module context fetch + **`fetchVLinkPipelineContext`** (when catalog source `vlink` enabled)
   - **`linkEntitiesAcrossModules`** + optional synthesis
   - **`PreferenceResolver.resolve`**
   - **`runPipelineGroundingRetrieval`** (location, Place, memory prepass)
3. **`generateLifeTwinResponse`**
   - **`assembleAIContext`** — bounded context blocks (files, memory, modules, V_Link, preferences, business policies, thread).
   - **`applyResolvedPreferencesToProviderOptions`** — `personalityForProvider`, `autonomyBoundariesForProvider`, `resolvedEffectivePreferences`.
   - **`options.userQuery = query.query`** — **this is what the model sees as the user message** (via `buildProviderUserPrompt`).
4. **`callAIProvider`** — passes assembled context + preference payloads to OpenAI/Anthropic **`buildSystemPrompt`** / **`buildProviderUserPrompt`**.
5. **`buildPipelineTrace`** + **`applyPipelineEnforcement`** — diagnostics, grounding gating, metadata on response.

```mermaid
flowchart TB
  Query["User query POST /api/ai/twin"] --> Svc["DigitalLifeTwinService"]
  Svc --> Core["DigitalLifeTwinCore"]

  Core --> Prefs["PreferenceResolver.resolve"]
  Core --> ModCtx["Module context fetch"]
  Core --> VLink["fetchVLinkPipelineContext"]
  Core --> Link["linkEntitiesAcrossModules"]
  ModCtx --> Link
  VLink --> Link
  Core --> Ground["runPipelineGroundingRetrieval"]

  Core --> Gen["generateLifeTwinResponse"]
  Link --> Asm["assembleAIContext"]
  Ground --> Asm
  Prefs --> Asm
  ModCtx --> Asm
  VLink --> Asm

  Gen --> Asm
  Asm --> PrefsApply["applyResolvedPreferencesToProviderOptions"]
  Prefs --> PrefsApply
  Query --> UserPrompt["buildProviderUserPrompt userQuery"]
  PrefsApply --> Providers["OpenAI / Anthropic"]
  UserPrompt --> Providers

  Core --> Trace["buildPipelineTrace"]
  Providers --> Trace
  Trace --> Enforce["applyPipelineEnforcement"]
  Enforce --> Response["Twin response + metadata.pipelineTrace"]
```

## Full request flow (with grounding gate)

Vertical view from UI to rendered response. Matches the detailed twin pipeline diagram used in onboarding.

```mermaid
flowchart TD
  Prompt["User prompt"] --> UI["AI Chat UI"]
  UI --> Route["POST /api/ai/twin"]
  Route --> Core["DigitalLifeTwinCore.processAsDigitalTwin"]

  Core --> Intent["inferPipelineIntents"]
  Intent --> Catalog["getEffectivePipelineCatalog"]
  Catalog --> Reconcile["reconcileSystemPipelineGroundingRules"]
  Reconcile --> Policy["Grounding rule policy"]

  Policy --> Sources{"Required context sources"}
  Sources --> Mod["Module context providers"]
  Sources --> Mem["MemoryRetrievalService"]
  Sources --> Prefs["PreferenceResolver"]
  Sources --> Files["Attached file context"]
  Sources --> VL["V_Link / semantic links confirmed only"]

  Mod --> Asm["Assembled AI context"]
  Mem --> Asm
  Prefs --> Asm
  Files --> Asm
  VL --> Asm

  Asm --> GroundOK{"Grounding sufficient?"}
  GroundOK -->|"No"| Fail["Pipeline diagnostics GROUNDING_FAILURE / generic risk"]
  Fail --> Safe["Safe clarification or grounded failure response"]
  GroundOK -->|"Yes"| Builder["Prompt builder + provider options"]

  Builder --> Router["Provider router"]
  Router --> OpenAI["OpenAI"]
  Router --> Anthropic["Anthropic"]
  Router --> Local["Local summaries only"]

  OpenAI --> Norm["Structured response normalization v2"]
  Anthropic --> Norm
  Local --> Norm

  Norm --> Guard["AI response quality guardrails"]
  Guard --> Render["Structured AI response renderer"]
  Render --> Answer["User sees response"]
```

**Provider errors:** `RATE_LIMITED` / `TEMP_UNAVAILABLE` trigger one OpenAI ↔ Anthropic fallback retry before normalization. See [../ai/PROVIDERS.md](../ai/PROVIDERS.md).

## Intentionally unused: monolithic legacy prompt

`buildDigitalTwinPrompt` was removed in Phase 0B. It duplicated content now covered by:

- `AIContextAssembler` (context blocks),
- `preferencePromptBlocks` + provider system prompts,
- `structuredResponseFormat` / conversation momentum blocks.

**Do not** reintroduce a second full-text prompt passed as `AIRequest.query` while `userQuery` is also set — providers prefer `data.userQuery` and would ignore the legacy string.

## API surfaces (canonical vs legacy)

| Concern | Canonical | Legacy (delegates, deprecated) |
|--------|-----------|-------------------------------|
| Autonomy settings | `GET/PUT /api/ai/autonomy/settings` | `GET/PUT /api/ai/autonomy` on `/api/ai` router |
| Personality profile | `GET/POST/DELETE /api/ai/personality/profile` | `GET/PUT /api/ai/personality` (GET = engine shape; PUT = interaction feedback only) |
| Effective preview | `GET /api/ai/effective-preferences` | — |
| Autonomous actions | — | `/api/ai/autonomous/*`, `AutonomyManager` (deprecated) |

New UI and integrations should use **canonical** routes only.

## Business workspace context (`businessId`)

When `context.businessId` is present on `/api/ai/twin`, the personal pipeline still runs, but **`assembleAIContext`** also injects policies from **`BusinessAIDigitalTwin`** (admin Business AI Control Center). See **[AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md](./AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md)**.

- Personal: `PreferenceResolver` + “User communication and AI preference settings” block  
- Business: “Business workspace AI policies” block (`sourceType: business`)

## Personal Intelligence hub (Control Center)

Learning review lives under **`/ai` → Learning**; optional analytics live under **More → Insights** (`?tab=more&section=insights`). See **[AI_INTELLIGENCE_HUB.md](./AI_INTELLIGENCE_HUB.md)** (Insights).

## Related code

- [`DigitalLifeTwinCore`](../../server/src/ai/core/DigitalLifeTwinCore.ts)
- [`PreferenceResolver`](../../server/src/ai/preferences/PreferenceResolver.ts)
- [`AIContextAssembler`](../../server/src/ai/context/AIContextAssembler.ts)
- [`vlinkPipelineContextService`](../../server/src/ai/context/vlinkPipelineContextService.ts)
- [`businessWorkspaceBoundaries.ts`](../../server/src/ai/enterprise/businessWorkspaceBoundaries.ts)
- [`buildProviderUserPrompt`](../../server/src/ai/prompts/providerUserPrompt.ts)
- [`buildPipelineTrace`](../../server/src/ai/pipeline/buildPipelineTrace.ts)
- [`pipelineEnforcement`](../../server/src/ai/pipeline/pipelineEnforcement.ts)
