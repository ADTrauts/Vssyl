# AI External Capability Model

**Program:** External Capabilities — Design Phase  
**Date:** 2026-08-25  
**Status:** Active — canonical design (not shipped)  
**Owner:** AI Platform / Architecture council  
**Source of Truth for:** External read capabilities available to the Digital Life Twin (Google Places, Routes, geocoding, web search, future specialized providers)

**Companion (do not duplicate):** [`AI_SYSTEM_MENTAL_MODEL.md`](./AI_SYSTEM_MENTAL_MODEL.md) · [`AI_TWIN_PROMPT_PIPELINE.md`](./AI_TWIN_PROMPT_PIPELINE.md) · [`AI_PIPELINE_ADMIN_TOOLS.md`](./AI_PIPELINE_ADMIN_TOOLS.md) · [`AI_CONTEXT_ASSEMBLY.md`](./AI_CONTEXT_ASSEMBLY.md) · [`AI_EXECUTION_ARCHITECTURE.md`](./AI_EXECUTION_ARCHITECTURE.md) · [`PLACE_DOMAIN_MODEL.md`](./PLACE_DOMAIN_MODEL.md) · [`V_LINK.md`](./V_LINK.md)

---

## Purpose

Define the **smallest shared external-read capability contract** required for Vssyl to safely support:

1. **Google Places** (first implementation slice)
2. **Routes / geocoding** (second wave)
3. **General `web_search`** (third wave)
4. **Future specialized providers** (flights, weather, market data, etc.)

This document does **not** introduce a new Twin architecture, routing brain, or domain-specific AI engine.

---

## Scope

### In scope

- External **read** capability boundaries and naming
- Execution lifecycle through existing pipeline + tool governance
- Evidence / provenance contract
- Egress / privacy / credential boundaries
- Relationship to Vssyl Place, V_Link, Context Graph, learning
- Honest failure when live external truth is required but unavailable
- Google Places first-ACT scope and operational prerequisites (checklist only)

### Out of scope

- Product code, schema migrations, env changes, GCP enablement
- ContextProvider redesign, C3 changes, Twin routing changes
- Domain intent taxonomies (MortgageIntent, WeatherIntent, etc.)
- Admin UI for business/personal external controls
- Legal interpretation of Google Maps Platform terms

---

## Problem

The Digital Life Twin architecture is complete, but **live outside-world retrieval is not shipped**. The repo already has:

- Pipeline catalog, grounding rules, tool policies, enforcement, evidence bundles
- Vssyl Place read tools and module context (`vssyl_place`, `place_search`, `search_places`)
- A disabled `web_search` stub

It lacks:

- Google Places / Routes / geocoding clients
- A shared external-read contract preventing naming collisions with Vssyl Place
- Hard egress/privacy gates before outbound calls
- Normalized external evidence provenance in user-facing answers

Without a canonical design, the first implementation would overload `place_search`, leak tenant context to providers, or invent parallel “SearchBrain” architectures.

---

## Core invariant

> **External capabilities are authorized sources/tools available to the shared Digital Life Twin. They do not create separate intelligence engines.**

| Layer | Owns |
|-------|------|
| **Digital Life Twin** | Interpretation, reasoning, synthesis, response shaping, source need at turn level |
| **Pipeline catalog / grounding** | Source/tool policy, required vs optional sources, enforcement, diagnostics |
| **External read adapters** | Provider HTTP, normalized evidence, availability/failure, provider-specific compliance |
| **Domain services / A2** | Governed mutations (add to Place, book, purchase, share) |

**Anti-patterns (forbidden):** ShoppingAI, TravelAI, MapsAI, WeatherAI, SearchBrain, UniversalExternalEngine, SourceRequirementEngine.

---

## Layer model

```
Digital Life Twin
    ↓
source / capability decision (existing pipeline + Twin routing)
    ├── model knowledge (stable/general)
    ├── personal memory / history
    ├── Vssyl platform / module truth (ContextProviders, C3-gated)
    ├── Vssyl Place (curated relationship layer)
    ├── connected / private external source (future: authorized accounts)
    ├── live public web (`web_search` — future)
    ├── Google Places (`google_places_*` — future)
    ├── Routes / geocoding (`google_routes`, `google_geocoding` — future)
    └── future specialized external provider
```

External retrieval **must not** become a ContextProvider responsibility. ContextProviders remain **module/platform senses**. C3 may skip module ContextProvider orchestration; it **must not** block external read tools.

---

## READ vs ACTION

External capabilities split cleanly into **read tools** and **mutations/actions**.

### External READ (not A2 mutations)

| Example | Capability class |
|---------|------------------|
| Search public web | `web_search` |
| Search Google Places | `google_places_search` |
| Place Details | `google_place_details` |
| Route / ETA / distance | `google_routes` |
| Geocode / reverse geocode | `google_geocoding` |
| Live market / weather / flight data | future specialized read adapters |

These use the existing tool risk model: **`READ_ONLY`** — no approval required unless policy explicitly elevates risk.

### External ACTION (domain mutations — separate path)

| Example | Owner |
|---------|-------|
| Book reservation, purchase, external booking | Domain action / future governed executor |
| Send message | Module / comms services |
| Add / follow in Vssyl Place | Place domain service |

**Invariant:** `READ TOOL ≠ MUTATION/ACTION`. Running an external read must not create an `AIActionExecution` mutation record unless the user explicitly requested a governed write.

Reuse: [`AI_TOOL_RISK_AND_APPROVAL_POLICY.md`](./AI_TOOL_RISK_AND_APPROVAL_POLICY.md), `aiToolRiskRegistry.ts`, `governedToolExecutor.ts`.

---

## Canonical capability naming

### Naming collision (current repo — preserve in production)

| ID | Meaning today | Action |
|----|---------------|--------|
| `vssyl_place` | Pipeline **context source** — Vssyl Place module providers | **Keep** |
| `place_search` | Pipeline **tool policy** label for Vssyl Place grounding telemetry | **Keep** (document; do not repurpose) |
| `search_places` | Twin **LLM tool** — Prisma search of published `BusinessPlaceListing` | **Keep** |
| `get_place_recommendations`, `get_place_purchase_help` | Twin read tools on Vssyl Place | **Keep** |

**Do not** repurpose any of the above for Google Places.

### Vssyl internal (stable)

| Source ID | Tool ID(s) | Description |
|-----------|------------|-------------|
| `vssyl_place` | `place_search` (pipeline), `search_places` (Twin) | Curated Main Street / listings the user can access |

Optional future alias (non-breaking): document `vssyl_place_search` as a **synonym concept** for `place_search` in new docs only — **no rename in this phase**.

### Google external (new — use in catalog, adapters, observability)

| Source ID | Tool ID | Primary use |
|-----------|---------|-------------|
| `google_places` | `google_places_search` | Text Search / discovery |
| `google_places` | `google_place_details` | Details for a known place resource id |
| `google_routes` | `google_routes` | Distance, duration, route legs |
| `google_geocoding` | `google_geocoding` | Address ↔ coordinates |

Provider backend id (observability): `google_maps_platform`.

### General external

| Source ID | Tool ID | Description |
|-----------|---------|-------------|
| `web_search` | `web_search` | Public web / current information (existing stub id) |

### Convention

- **Source IDs** — pipeline catalog, grounding rules, `requiredSources` / `optionalSources`
- **Tool IDs** — tool policies, trace `toolsUsed`, risk registry, Twin tool loop where applicable
- **Adapter module names** — `server/src/ai/external/` (future implementation path; not created in design phase)

---

## Vssyl Place vs Google Places boundary

| Concept | Role | Durable? |
|---------|------|----------|
| **Vssyl Place** | User-curated relationship / personal Main Street; published business listings; preferences and follows | **Yes** (governed domain SoR) |
| **Google Places** | External discovery database of real-world physical places | **No** by default (ephemeral evidence) |
| **Google Routes** | Distance / ETA / directions computation | **No** (ephemeral) |
| **Twin** | Reasoning, ranking, recommendation, honest disclosure | N/A |

**Invariants:**

1. Google Places results **must not** automatically become `BusinessPlaceListing`, Place nodes, V_Link entities, graph nodes, or memory facts.
2. `InteractionLinkType.GOOGLE_MAPS` on a listing is a **user-supplied outbound URL**, not Google Places API integration.
3. Persistence requires an **explicit governed action** (e.g. future “Add to my Place”).
4. Vssyl Place is **not** a geographic map with real distances; Google supplies geo discovery — Vssyl supplies relationship context.

Authority: [`PLACE_DOMAIN_MODEL.md`](./PLACE_DOMAIN_MODEL.md), `memory-bank/vssylPlaceProductContext.md`.

---

## External read adapter contract

### Decision: **SMALL SHARED ADAPTER CONTRACT REQUIRED**

The existing Twin tool interface and pipeline grounding hooks are **almost sufficient**, but a **thin shared adapter contract** is justified to prevent each provider from inventing its own lifecycle, egress, and evidence mapping.

This is **not** a new runtime or brain. It is a **typed convention + small interface** that both pipeline prepass executors and Twin read tools call.

### Conceptual shape (implementation future)

```typescript
// Conceptual only — not implemented in design phase

interface ExternalReadRequest {
  capabilityId: string;           // e.g. google_places_search
  providerId: string;             // e.g. google_maps_platform
  egressQuery: string;            // intentionally constructed; NOT full Twin prompt
  egressContext?: {
    coarseLocation?: { city: string; region: string; countryCode: string };
    locale?: string;
    maxResults?: number;
  };
  fieldMask?: string[];           // provider-specific
}

interface ExternalReadResult {
  capabilityId: string;
  providerId: string;
  success: boolean;
  retrievedAt: string;            // ISO timestamp
  failureCode?: 'disabled' | 'unauthorized' | 'rate_limited' | 'provider_error' | 'no_results';
  evidence: ExternalEvidenceItem[];
  usage?: { latencyMs?: number; billedUnits?: number; estimatedCostUsd?: number };
  rawProviderPayloadRef?: string; // optional internal trace ref — not prompt-eligible by default
}

interface ExternalEvidenceItem {
  title: string;
  detail?: string;
  externalId?: string;
  url?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  publishedAt?: string;
  provider: string;
  capabilityId: string;
  sourceKind: 'web' | 'place' | 'route' | 'geocode' | 'market' | 'other';
}
```

**Avoid:** UniversalExternalEngine, ExternalIntelligenceService, SearchBrain.

**Reuse:** `runPipelineGroundingRetrieval`, `buildPipelineEvidenceBundle`, `governedToolExecutor`, observation events.

---

## External evidence contract (minimum normalized fields)

Prompt-eligible evidence should carry **only** what is useful across providers:

| Field | Required | Notes |
|-------|----------|-------|
| `capabilityId` / source kind | Yes | Which read ran |
| `provider` | Yes | e.g. `google_maps_platform`, future `brave_search` |
| `title` / name | Yes | Human-readable label |
| `detail` / snippet | When available | Factual excerpt for grounding |
| `externalId` | When available | Google place resource name, URL id, etc. |
| `url` | When applicable | Web sources; optional for Places |
| `address` / coordinates | Place/route context | As returned |
| `retrievedAt` | Yes | Server-side fetch time |
| `publishedAt` | When known | Web/news only |
| `confidence` / quality | Optional | Only if provider supplies meaningful signal |

Provider-specific payloads stay **outside** the canonical prompt shape (trace / debug / compliance storage only).

### Evidence type extension (bounded — future ACT)

Existing types:

- `PipelineEvidenceItem` — flexible `sourceType`, `sourceId`, `detail`
- `AIEvidenceItem` — closed enum: module, file, chat, calendar, drive, business, personal, system, unknown

**Recommended smallest extension:** add source kinds **`external`** and **`place_external`** (or `external` + `detail.sourceKind`) to structured response and pipeline evidence mappers. Do **not** implement in design phase.

Map external reads into **`PipelineEvidenceItem`** immediately; structured user-facing citations follow in implementation.

---

## Provenance requirements

Provenance must support honest answers without forcing URL semantics on every source.

### Web / general `web_search`

- Source title + **URL** (when applicable)
- **retrievedAt**
- **publishedAt** when provider returns it
- Provider id

### Google Places

- **provider** (`google_maps_platform`)
- **externalId** (Places API place resource name)
- **name**, **formatted address**, **types**, **rating** (field-mask dependent)
- **retrievedAt**
- **Attribution** per Google Maps Platform display/storage rules (implementation checklist)
- URL optional (`googleMapsUri` if requested in field mask)

### Routes / geocoding

- Origin/destination summary (not full tenant context)
- **retrievedAt**
- Duration / distance summary
- Provider id

---

## Execution lifecycle (existing pipeline)

```
User message
  → Twin routing (outcome / contract — unchanged)
  → inferPipelineIntents + grounding rules (requiredSources / optionalSources)
  → policy: source enabled? tool enabled? business allow? egress approved?
  → external read adapter.execute(ExternalReadRequest)
  → ExternalReadResult → PipelineEvidenceItem[]
  → grounding trace (toolsUsed, contextRetrieved)
  → pipeline enforcement (block / disclose if required source missing)
  → AIContextAssembler → provider prompt
  → LLM response (must not invent live facts when required source failed)
```

**Owners:**

| Stage | Owner |
|-------|-------|
| Source need (coarse) | Pipeline intents + grounding rules + Mental Model source families |
| Capability execution | External read adapter (new) invoked from pipeline prepass and/or Twin tool loop |
| Evidence | `buildPipelineEvidenceBundle`, `AIContextAssembler` |
| Honest failure | `pipelineEnforcement` + required-source semantics |

External reads are **not** ContextProvider fetches.

---

## Honest failure contract

When a source is **REQUIRED** and unavailable (disabled, unauthorized, rate limited, provider error, no trustworthy results):

> The Twin **must not** silently substitute model priors as current truth.

Expected semantic behavior (natural language):

> “I can't verify the current information right now.”

Plus actionable guidance when appropriate (enable capability, share location, try again).

### Required vs optional

| Grounding rule | Failure behavior |
|----------------|------------------|
| **Required source** failed (e.g. `research` → `web_search`) | Treat as grounding violation; reuse `pipelineEnforcement` **block** or **disclose**; never present stale model output as live fact |
| **Optional source** failed (e.g. `local_discovery` optional `web_search`) | Proceed with available sources; disclose limitation if answer implies live data |

Reuse: `pipelineEnforcement.ts`, `buildPipelineTrace`, `GROUNDING_ISSUE`, tool policy `fallbackBehavior` strings.

**Current gap (documented):** enforcement defaults off in many environments — implementation must enable required-source paths for live external intents.

---

## Source requirement representation

**Do not** introduce formal `SourceRequirement[]` in this phase.

### Existing structures — sufficient with bounded extension

| Mechanism | Use for external |
|-----------|------------------|
| `inferPipelineIntents` | Coarse live-vs-stable signal (`research`, `local_discovery`, `recommendation`) — not domain-specific |
| `DEFAULT_PIPELINE_GROUNDING_RULES.requiredSources` | Mark `web_search` required for `research`; `location` for `local_discovery` |
| `optionalSources` | `google_places`, `vssyl_place`, `web_search` combinations |
| `PipelineToolPolicy` | Per-tool enable, fallback text, future rate limits |
| `SOURCE_TO_TOOLS` | Map new sources → tool ids |

### Bounded extension needed (future ACT)

1. Register new catalog sources: `google_places`, `google_routes`, `google_geocoding`
2. Hard **business capability gate** at executor (not prompt-only)
3. Evidence `sourceType` extension for external provenance

No new routing brain.

---

## Fresh / current data behavior

**The subject does not determine external retrieval.**

| Question type | Source family |
|---------------|---------------|
| “What is a mortgage?” | Model knowledge |
| “What are mortgage rates today?” | Live external (`web_search` or specialized rates adapter) |
| “What rate did I tell you?” | Personal recall / memory |
| “Here is my mortgage quote.” | Provided attachment / turn assertion |
| “Is 6.5% competitive today?” | Personal fact + **live external** comparison |

Architecture determines **source need** via existing coarse signals + grounding rules — **not** MortgageIntent or domain taxonomies. Do not add freshness regexes in implementation docs beyond existing pipeline heuristics.

---

## Egress / privacy boundary

> **External tools receive the minimum information required to perform the external request.**

### Forbidden outbound payloads

- Full assembled prompt / system blocks
- Entire conversation history
- Tenant name, employee rosters, HR records
- Attached document contents
- Personal financial / health data
- Business confidential metrics unless explicitly part of an egress-approved query construction step

### Query construction boundary

Adapters receive an **`egressQuery`** built intentionally for the provider.

**Example**

User: “Is my lender's 6.5% quote competitive today?”

| Send to provider | Do not send |
|------------------|-------------|
| `average 30 year fixed mortgage rates United States August 2026` | User income, lender name, uploaded docs, full chat |

Implementation may use a **small query-shaping step** (LLM or template) bounded by egress policy — still server-side, logged, redacted in observation.

### Risk classes (future policy)

| Class | Examples | Default |
|-------|----------|---------|
| **PUBLIC / LOW-RISK QUERY** | Public rates, public place search in city | Allowed when capability enabled |
| **PRIVATE / SENSITIVE CONTEXT** | Employee list, internal metrics | **Never** sent to public web providers |

**Current gap:** no hard egress enforcer — design requires executor-level check before HTTP.

---

## Business governance boundary

Existing: `BusinessAIDigitalTwin.restrictions.externalAPIAccess` → **prompt lines only** today.

**Required future behavior (design):**

| Control | Semantics |
|---------|-----------|
| `externalAPIAccess: false` | **Hard deny** all external read adapters for business-scoped Twin turns |
| Per-capability deny (future) | Scoped by source/tool id |

Check order (future): **AuthZ → business external gate → personal consent → catalog enabled → adapter execute**.

No admin UI design in this document.

---

## Personal governance boundary

**Missing today** — document future controls:

| Control | Notes |
|---------|-------|
| Precise location consent | Distinct from coarse IP city |
| External web retrieval opt-in | If product policy requires |
| External egress acknowledgment | Optional UX |

### Google Places first slice — location honesty

| Location tier | Source today | Use in Places ACT |
|---------------|--------------|-------------------|
| **Coarse** | IP city/region/country (`geolocationService`) | **Primary** — Text Search bias |
| **Registered** | User Country/Region/Town directory | Supplement / disambiguation |
| **Precise** | Browser GPS | **Not available** — do not imply precision |

Assistant must not claim precise “near you” when only city-level inference exists. Prefer phrasing like “in your area (approx. {city})” with uncertainty.

---

## Credential model

| Rule | Detail |
|------|--------|
| AI external API credentials | **Server-side only** |
| Primary auth (Google Places Wave 1) | **Application Default Credentials** — `@googlemaps/places` `PlacesClient()` on Cloud Run attached service identity; local dev via `gcloud auth application-default login` |
| API key fallback | **Not used for Wave 1.** Restricted server API key via Secret Manager remains documented only if ADC is not viable for a future capability |
| Browser | No unrestricted Places/Routes/web keys in client bundles |
| Maps JavaScript (future display) | Separate **restricted browser key** if map UI ships later — not used for Twin retrieval |

**Wave 1 production identity:** Cloud Run `vssyl-server` uses the project compute service account (`235369681725-compute@developer.gserviceaccount.com`). No service-account JSON keys; no Places API key in Secret Manager for this slice.

Optional env names (display-only future):

- `GOOGLE_MAPS_BROWSER_API_KEY` (display only — not used in Wave 1)

---

## GCP operational prerequisites (Google Places — Wave 1 complete)

### APIs enabled (Google Maps Platform — Places API New)

- [x] **Places API (New)** — service: `places.googleapis.com` (project `vssyl-472202`)
- [x] Billing account linked
- [ ] **Defer** until Routes ACT: Routes API (`routes.googleapis.com`)
- [ ] **Defer** until geocoding ACT: Geocoding API (`geocoding-backend.googleapis.com`) or address through Places Text Search

### Credentials (Wave 1 — ADC)

- [x] Server adapter uses ADC via `@googlemaps/places` — no long-lived API key
- [x] Cloud Run service identity attached to `vssyl-server`
- [x] No service-account private key files
- [ ] Optional restricted API key path documented only for capabilities where ADC is unsupported

### Verification

- [x] `places.googleapis.com` enabled
- [x] Smoke Text Search (New) + Place Details from server adapter (dev/staging)
- [ ] Quota / billing alert configured (ops follow-up)
- [x] Observation logs include capability id + latency + success (no secret leakage)

**Current state (2026-08-25 Wave 1):** Places API (New) **enabled**; server auth via **ADC / Cloud Run service identity**; adapter at `server/src/ai/external/googlePlacesAdapter.ts`.

---

## Google Places first ACT — scope

### End-to-end scenario

User: “Find a good Italian restaurant near me.”

1. Twin interprets `local_discovery` / recommendation need
2. Coarse location from IP (+ registered location if useful)
3. **Parallel:** Vssyl Place context (`vssyl_place`) + **Google Places** (`google_places_search`)
4. Server-side Text Search (New) with egress-safe query, e.g. `Italian restaurants in {city}, {region}`
5. Normalize candidates → evidence
6. Twin combines Google candidates + Vssyl Place preferences / existing follows
7. Natural recommendation with provenance and location honesty
8. **No automatic persistence**

### In scope (first ACT)

| API (Places API New) | Endpoint | Use |
|----------------------|----------|-----|
| **Text Search (New)** | `POST places.googleapis.com/v1/places:searchText` | Primary discovery without precise GPS |
| **Place Details (New)** | `GET places.googleapis.com/v1/places/{place_id}` | Enrich top candidates (hours, rating, types) |

### Deferred (later ACTs)

| Capability | Reason |
|------------|--------|
| **Nearby Search (New)** | Requires reliable lat/lng origin — wait for geocoding or city-center strategy |
| Place Photos | Compliance + display requirements |
| Autocomplete | UI concern; not Twin-first slice |
| Maps JavaScript display | Separate browser credential |
| Routes API | Separate `google_routes` slice |
| Geocoding API | Separate `google_geocoding` slice |

### Field mask discipline

Use minimal field masks (Basic tier where possible): `displayName`, `formattedAddress`, `id`, `location`, `primaryType`, `rating`, `businessStatus` — expand only when product requires.

---

## “Near me” strategy (first ACT)

**Chosen: A — Text Search with coarse city/region (smallest honest option)**

| Strategy | Verdict |
|----------|---------|
| A. Text Search + `{city}, {region}` | **Selected** — matches current IP geo; honest uncertainty |
| B. Nearby Search + inferred coordinates | **Deferred** — no trustworthy lat/lng today |
| C. Require explicit user location | Fallback when IP geo fails |

**Assistant phrasing:** disclose approximate area; do not claim meter-level proximity.

---

## Vssyl Place + Google Places search policy (first ACT)

**Policy: search both independently, present together.**

1. Fetch Vssyl Place listings / recommendations / discoveries (existing)
2. Fetch Google Places candidates (new adapter)
3. Twin ranks/synthesizes — boost listings user already follows; surface new external options clearly labeled

**Not** “Google fallback only when Vssyl empty” — curated context and external discovery both add value.

**No dedup / identity bridge** in first ACT.

---

## Persistence rule

| Data | Default persistence |
|------|---------------------|
| Google search / details results | **Ephemeral** (turn evidence + optional diagnostic retention) |
| Routes / geocode results | **Ephemeral** |
| Web search snippets | **Ephemeral** |
| User preference (“I loved that restaurant”) | Governed memory / Place follow — **separate explicit path** |

**Must not auto-create:** `BusinessPlaceListing`, Place nodes, V_Link, Context Graph nodes, `UserMemoryFact` from live retrieval alone.

Future: “Add this to my Place” → governed Place mutation with provider attribution.

---

## V_Link / Context Graph rule

- External evidence participates in **current-turn reasoning** only
- Durable V_Link / graph edges require a **Vssyl-owned entity** first (`PLACE_LISTING`, etc.)
- **No** raw Google place nodes in graph automatically

---

## Learning boundary

| Retrieved live fact | Memory? |
|---------------------|---------|
| “Restaurant X open until 10 tonight” | **No** auto-teach |
| “Mortgage rates are 6.4% today” | **No** auto-teach |
| User: “I prefer the second restaurant” | May enter preference pathways via governed teaching |

Live external retrieval ≠ learning ingress.

---

## Specialized source precedence (target principle)

Not one universal global hierarchy — apply by question semantics:

1. Explicitly provided source (attachment, quoted text)
2. Authoritative Vssyl / private source (module SoR, connected account)
3. Authorized **specialized structured** external (Google Places for nearby businesses; future flight API for availability)
4. Generic **`web_search`** fallback
5. Model knowledge for stable/general facts

For place discovery: **Vssyl Place context + Google Places** are complementary, not mutually exclusive.

---

## Provider portability

Vssyl owns capability contracts:

- `web_search`, `google_places_search`, `google_place_details`, …

LLM providers **consume normalized evidence**; they do not own whether Vssyl can search the world.

Provider-native browsing (OpenAI / Anthropic tools) may exist **behind adapters** only if they satisfy Vssyl egress, evidence, and governance contracts.

---

## Cost / quota observability (minimum future)

Reuse observation platform where possible. Each external execute should emit:

| Field | Purpose |
|-------|---------|
| `capabilityId` / `providerId` | Attribution |
| `latencyMs` | SLO |
| `success` / `failureCode` | Reliability |
| `billedUnits` / `estimatedCostUsd` | When provider exposes |
| Rate-limit handling | Backoff + honest failure |

Tool policy `rateLimitPerMinute` exists in catalog — future executor should enforce.

---

## Caching boundary

Caching is **adapter-owned**, freshness-dependent:

| Data | Cache posture |
|------|---------------|
| Place static metadata | Moderate TTL |
| Open-now / businessStatus | Short TTL |
| Routes / ETA | Short / request-specific |
| Rates / news | Freshness-sensitive; minimal cache |

Respect Google Maps Platform storage/caching terms (compliance checklist).

---

## Compliance checklist (Google — not legal advice)

Implementation must review current Google Maps Platform terms for:

- [ ] Attribution in AI/UI surfaces
- [ ] Permitted caching / retention of place fields
- [ ] Photos usage and display
- [ ] Place content redistribution in generated answers
- [ ] `googleMapsUri` / link requirements

Flag during Places ACT code review; no legal conclusions in this doc.

---

## Future `web_search` fit

Same lifecycle as Places:

```
research intent → web_search required
  → egress-safe query construction
  → server-side adapter (Brave / SerpAPI / etc. — TBD)
  → normalized web evidence (URL, title, snippet, publishedAt, retrievedAt)
  → grounding + citations
  → answer
```

**No second Internet architecture.**

---

## Future Routes fit

“How far is the second place?”

```
structured place ids / addresses from prior evidence
  → google_routes adapter
  → ephemeral route evidence
  → Twin answer
```

Requires geocoding or place `location` from Details — **wave 2**.

---

## Future specialized providers

Flights, weather, market data, commerce feeds → **same adapter contract**, new `capabilityId` + provider module. No new Twin runtime.

---

## Architecture impact on Twin

**SMALL EXTENSION**

- New catalog sources/tools
- Thin external adapter module
- Evidence type extension
- Hard governance gates

**NONE** of: new routing brain, C3 change, ContextProvider expansion to web, new domain intents.

---

## Implementation readiness gate

| Gate | Status |
|------|--------|
| Architecture design | **COMPLETE** (this document) |
| Google Places Wave 1 | **SHIPPED** — Text Search + Place Details via ADC adapter |

**Operational follow-up:** billing/quota alerts; production smoke via authenticated Twin sessions.

---

## Reference implementation (Wave 1)

| Path | Role |
|------|------|
| `server/src/ai/external/googlePlacesAdapter.ts` | Places API (New) Text Search + Details adapter (ADC) |
| `server/src/ai/external/externalReadTypes.ts` | Thin `ExternalReadRequest` / `ExternalReadResult` contract |
| `server/src/ai/external/googlePlacesPipelineService.ts` | Pipeline orchestration + details tool runner |
| `server/src/ai/pipeline/pipelineGroundingRetrieval.ts` | Invoke external adapters from prepass |
| `server/src/ai/pipeline/pipelineCatalogDefaults.ts` | Register sources/tools |
| `server/src/ai/tools/toolExecutor.ts` | Optional Twin-loop read tools |
| `server/src/ai/governance/aiToolRiskRegistry.ts` | READ_ONLY registration |
| `server/src/ai/pipeline/buildPipelineEvidenceBundle.ts` | Evidence mapping |
| `server/src/ai/enterprise/businessWorkspaceBoundaries.ts` | Hard gate extension point |
| `server/src/services/geolocationService.ts` | Coarse location for Text Search |

---

## Certification status

**Google Places Wave 1:** **SHIPPED / READY** — external read adapter, pipeline registration, governance gates, tests. Routes, geocoding, and `web_search` remain future.

---

## Related documents updated

- [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./ARCHITECTURE_SOURCE_OF_TRUTH.md) — ownership row
- [`VSSYL_ARCHITECTURE_INDEX.md`](./VSSYL_ARCHITECTURE_INDEX.md) — index entry
- [`AI_PLATFORM_SUBSYSTEM_INVENTORY.md`](./AI_PLATFORM_SUBSYSTEM_INVENTORY.md) — status rows
- [`AI_DOCUMENT_STATUS_MATRIX.md`](./AI_DOCUMENT_STATUS_MATRIX.md) — terminology row
- [`AI_SYSTEM_MENTAL_MODEL.md`](./AI_SYSTEM_MENTAL_MODEL.md) — pointer to this doc for external capabilities

---

**Last updated:** 2026-08-25
