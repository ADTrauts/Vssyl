# AI Model Routing Target Architecture

**Date:** 2026-07-12  
**Status:** Recommendation only — **do not implement in this audit**  

---

## Goals

1. Provider-independent routing policy.  
2. Map FAST / BALANCED / DEEP / SPECIALIZED / LOCAL_OR_PRIVATE → concrete models **only in configuration**.  
3. Preserve Vssyl ownership of AuthZ, knowledge durability, grounding, and SoR.  
4. Allow new model families (fast / balanced / high-reasoning / effort settings) without rewriting DigitalLifeTwinCore.

---

## Provider-neutral tiers

| Tier | Intent | Example workloads |
|------|--------|-------------------|
| **FAST** | Cheap, low latency, high volume | tagging, titles, short extract, classification, notification summaries |
| **BALANCED** | Default quality | normal chat, routine assistance, doc summary, moderate tools |
| **DEEP** | Hard reasoning / high consequence | complex planning, cross-module reconciliation, contradictory evidence, policy interpretation |
| **SPECIALIZED** | Modality or domain models | vision, embeddings, transcription, TTS, image gen, coding-specific |
| **LOCAL_OR_PRIVATE** | Privacy / offline / sensitive | sensitive keyword path, air-gapped, deterministic support |

---

## Decision attributes

Evaluate (weighted policy, not all required):

- task type, complexity, consequence, reversibility, user-visible importance  
- tools needed / tool count  
- vision / multimodal  
- context window need  
- latency / budget targets  
- privacy sensitivity  
- provider availability  
- understanding confidence (from conversation reasoning)  
- grounding requirements / structured output  
- volume  
- whether deterministic code suffices  
- whether human approval required  

---

## Decision table (abbreviated)

| Situation | Tier | Escalate if |
|-----------|------|-------------|
| Title / tag / classify | FAST | Low confidence or contradiction → BALANCED |
| Normal twin chat | BALANCED | High complexity or low grounding → DEEP |
| Cross-module hard analysis | DEEP | Still weak grounding → clarify/refuse |
| Image understanding | SPECIALIZED(vision) | Provider down → fallback SPECIALIZED other provider or text summaries |
| Whisper / TTS / DALL·E | SPECIALIZED(media) | — |
| Password/SSN-like content | LOCAL_OR_PRIVATE | If local insufficient → refuse or human |
| High-consequence action proposal | BALANCED/DEEP + **approval** | Never auto-escalate to silent execute |
| Provider A 429 | Same tier on provider B | If none → deterministic fallback / error |

---

## Escalation rules

```
FAST → BALANCED: confidence low, user corrects, structured parse fail
BALANCED → DEEP: complexity high, grounding fail, multi-hop tools, consequence high
Provider A → B: RATE_LIMITED, TEMP_UNAVAILABLE, capability gap
Model fail → deterministic: templates, search-only answers, or safe error
Low confidence → clarification (conversation reasoning owns posture)
High consequence → ApprovalManager / twin requiresApproval
Insufficient grounding → enforce qualify/refuse (pipelineEnforcement)
```

---

## Pseudocode

```text
function route(request, signals):
  if deterministicHandler.canSatisfy(request):
    return DeterministicPlan(handler)

  tier = classifyTier(request.taskType, signals.complexity, signals.consequence)
  if signals.needsVision: require capability vision; tier = max(tier, SPECIALIZED_VISION)
  if signals.privacySensitive: tier = LOCAL_OR_PRIVATE
  if signals.approvalRequired: attach GovernanceGate(approval)

  candidates = catalog.modelsWhere(tier=tier, capabilities⊇needed, tenantAllows)
  pick = policy.pick(candidates, optimize=[latency, cost, quality])
  record routingExplanation(tier, pick, reasons)

  result = adapters[pick.provider].complete(pick.model, request, effort=pick.effort)
  if retryableFailure(result):
    return route(request, signals with exclude=pick)  // one fallback
  if groundingInsufficient(result):
    return escalateOrQualify(result)
  return result
```

**Important:** Domain code calls `route(...)`, never `openai.chat.gpt-…` string literals outside adapters/catalog.

---

## Mapping principle (config only)

```yaml
# illustrative — not shipped
tiers:
  FAST:
    openai: [future-fast-id]
    anthropic: [future-haiku-class-id]
  BALANCED:
    openai: [gpt-4o-mini or successor]
    anthropic: [sonnet-class]
  DEEP:
    openai: [high-reasoning-id]
    anthropic: [highest-reasoning-id]
  SPECIALIZED:
    vision: ...
    asr: whisper-1
    tts: tts-1
  LOCAL_OR_PRIVATE:
    local: [local]
```

Do not assume availability of newly announced models until catalog entries exist.

---

## New model features — ownership boundaries

| Capability | Layer owner | Never delegate to model | Risk | Type |
|------------|-------------|-------------------------|------|------|
| Programmatic tool coordination | Execution + Governance | Permission checks | Over-calling tools | Capability expansion |
| Parallel / multi-agent | Planning (orchestrator) | Domain ownership of entities | Cost, race writes | Expansion — optional |
| Higher reasoning effort | Model Routing (effort param) | Final AuthZ | Cost | Optimization |
| Persisted provider reasoning | Observability (ephemeral) | Durable knowledge store | Leak / false memory | Optimization |
| Prompt cache breakpoints | Model Routing adapter | SoT for facts | Stale cache | Optimization |
| Larger context windows | Context budget + Retrieval still required | Skip retrieval forever | Noise, cost | Expansion |
| Better structured outputs | Response layer schemas | Skip validation | Parse drift | Expansion |
| Improved multimodal | SPECIALIZED + vision pipeline | Skip file AuthZ | Prompt injection via images | Expansion |

Boundaries (non-negotiable):

- Persisted provider reasoning ≠ durable Vssyl knowledge  
- Provider tool coordination ≠ Vssyl authorization  
- Multi-agent ≠ replacement for module domain ownership  
- Larger context ≠ replacement for retrieval  
- Prompt caching ≠ source of truth  
- Model confidence ≠ permission  
- Model output ≠ executed business action  
- Model memory ≠ governed user memory  
- Provider features stay behind adapters + capability declarations  

---

## Migration principles

1. Phase 0: document current routing (done in Provider Audit).  
2. Introduce `ModelTier` enum + config map without changing defaults.  
3. Route Notebook/extraction/media through SPECIALIZED entries.  
4. Replace `complexity === 'high' → anthropic` with DEEP tier policy.  
5. Keep user model picker as optional override within allowed tier set.  
6. ADR required before enabling multi-agent or persisted reasoning in production.
