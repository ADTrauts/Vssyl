# Digital Life Twin — prompt pipeline (canonical)

**Last updated:** 2026-05-19 (Phase 5)

## Single live path (chat / twin)

User messages on `/api/ai/twin` (and streaming) follow this pipeline:

1. **`DigitalLifeTwinService.processAsDigitalLifeTwin`** — recall, memory facts, conversation history.
2. **`DigitalLifeTwinCore.processAsDigitalTwin`** — smart context, files, **`PreferenceResolver.resolve`**.
3. **`generateLifeTwinResponse`**
   - **`assembleAIContext`** — bounded context blocks (files, memory, user context, **preference settings**, modules, thread).
   - **`applyResolvedPreferencesToProviderOptions`** — `personalityForProvider`, `autonomyBoundariesForProvider`, `resolvedEffectivePreferences`.
   - **`options.userQuery = query.query`** — **this is what the model sees as the user message** (via `buildProviderUserPrompt`).
4. **`callAIProvider`** — passes assembled context + preference payloads to OpenAI/Anthropic **`buildSystemPrompt`** / **`buildProviderUserPrompt`**.

```mermaid
flowchart LR
  Query[User query] --> Assembler[assembleAIContext]
  Prefs[PreferenceResolver] --> Assembler
  Prefs --> ProviderOpts[provider options]
  Assembler --> ProviderOpts
  Query --> UserPrompt[buildProviderUserPrompt userQuery]
  ProviderOpts --> Providers[OpenAI / Anthropic]
  UserPrompt --> Providers
```

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

New UI and integrations should use **canonical** routes only.

## Business workspace context (`businessId`)

When `context.businessId` is present on `/api/ai/twin`, the personal pipeline still runs, but **`assembleAIContext`** also injects policies from **`BusinessAIDigitalTwin`** (admin Business AI Control Center). See **[AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md](./AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md)**.

- Personal: `PreferenceResolver` + “User communication and AI preference settings” block  
- Business: “Business workspace AI policies” block (`sourceType: business`)

## Personal Intelligence hub (Control Center)

Learning review lives under **`/ai` → Learning**; optional analytics live under **More → Insights** (`?tab=more&section=insights`). See **[AI_INTELLIGENCE_HUB.md](./AI_INTELLIGENCE_HUB.md)** (Insights).

## Related code

- [`PreferenceResolver`](../../server/src/ai/preferences/PreferenceResolver.ts)
- [`AIContextAssembler`](../../server/src/ai/context/AIContextAssembler.ts)
- [`businessWorkspaceBoundaries.ts`](../../server/src/ai/enterprise/businessWorkspaceBoundaries.ts)
- [`buildProviderUserPrompt`](../../server/src/ai/prompts/providerUserPrompt.ts)
