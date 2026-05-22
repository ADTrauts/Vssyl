# AI Platform Execution Principles

**Date:** May 2026  
**Status:** Canonical — governs how we execute the AI maturity roadmap  
**Companion to:** [`AI_PLATFORM_MATURITY_PLAN.md`](./AI_PLATFORM_MATURITY_PLAN.md) (what to build, in what order)

This document defines **how** Vssyl implements AI platform work. Every phase — Memory, Learning, Cross-Module Intelligence, Extensibility — must align with these principles before code ships.

---

## The anchor principle

### Visible Intelligence > Hidden Intelligence

Vssyl prioritizes:

| We optimize for | We deprioritize |
|-----------------|-----------------|
| User-perceived intelligence | Hidden complexity |
| Explainability | Silent personalization |
| Reliability | Fake autonomy |
| Adaptation users can see and control | Synthetic intelligence theater |
| Transparency | Black-box “magic” |

**A feature is not real unless:**

1. **The user can feel it** — behavior change is perceptible in normal use, not only in admin tools or dev fixtures.
2. **The system can explain it** — influence, memory, learning, and context use are surfaced where appropriate (explain drawer, Memory/Learning tabs, structured metadata).
3. **Diagnostics can prove it** — pipeline trace, context density, memory influence, and logs corroborate what the product claims.

We are building **trustworthy, observable, contextually intelligent, adaptive, explainable, infrastructure-grade AI** — not marketing-driven agent hype.

---

## 1. Core philosophy

### AI as infrastructure, not feature

The Digital Life Twin is a **platform layer**: providers, context assembly, memory, learning, diagnostics, and module contracts. Individual UI surfaces are consumers of that layer. New intelligence must land in the **twin path first** (Service → Core → Assembler → Provider), then in Control Center UX — not the reverse.

### Context honesty

The system must never pretend it knows more than it retrieved. Placeholder insights, synthetic cross-module blocks, and concatenated JSON dumps are **not intelligence** until they are data-backed and labeled honestly in diagnostics.

### Trust through explainability

Users should understand *why* a reply feels personalized: which memories, preferences, or module contexts contributed — and which did not. Explainability is a product requirement, not a debug luxury.

### Incremental intelligence

Ship the smallest slice that changes measurable behavior. One well-scoped memory fact with provenance beats a broad “learning engine” that writes events nothing reads. Climb the intelligence hierarchy (§2) one rung at a time.

### Operational reliability over magic

Prefer deterministic assembly, explicit budgets, tenant scoping, and fallback paths over clever prompt tricks. When the model fails, users get clear codes (`RATE_LIMITED`, `TEMP_UNAVAILABLE`, file issues) — not silent degradation or hallucinated confidence.

### Diagnostics before intelligence

Before adding a new context source or learning loop, ask: *How will we know it ran, what it returned, and whether it affected the reply?* If the answer is unclear, build observability first.

---

## 2. Intelligence hierarchy

Vssyl’s maturity ladder defines **what we build now** vs **what we defer**. Higher rungs depend on lower rungs being honest and observable.

| Rung | Description | Current posture |
|------|-------------|-----------------|
| **1. Retrieval** | Fetch relevant data (messages, files, module providers, recall index) | **Live** — refine fetch policy and density reporting |
| **2. Memory** | Persist and reuse user-specific facts across sessions | **In progress** — Phase 1 of maturity plan |
| **3. Personalization** | Apply preferences, personality, and memory to prompt assembly | **Live (partial)** — unify retrieval, fix tenancy |
| **4. Learning** | Adapt from signals with user-visible promotion | **Thin** — promote loop exists; event pipeline noisy |
| **5. Cross-module synthesis** | Join entities across modules into coherent context | **Early** — mostly concatenation today |
| **6. Prediction** | Anticipate needs from patterns (not auto-act) | **Limited** — analytics only; no silent injection |
| **7. Recommendations** | Suggest next actions; user accepts or dismisses | **Live (partial)** — suggestions, structured actions |
| **8. Assisted workflows** | Multi-step flows with explicit user approval | **Live (partial)** — tools + approval-required actions |
| **9. Autonomy** | Proactive execution without user initiation | **Intentionally not shipped** |

**Explicit stop line:** Vssyl is **intentionally stopping before autonomous execution**. Autonomous agents, proactive auto-execution, and “AI acts on your behalf” are **future infrastructure only** — kept dormant unless safely implemented *and* clearly user-initiated. Current focus: rungs 1–8 with honesty at each step.

---

## 3. Product trust principles

Every AI surface must reinforce trust, not erode it.

| Principle | Requirement |
|-----------|-------------|
| **Explain why** | Replies that used memory, learning, or module context should expose influence via metadata + explain drawer (no raw prompt dump to users). |
| **Show memory influence** | When memory facts affect assembly, list them by subject/id/confidence — not full predicate text in logs or UI if sensitive. |
| **Explicit vs inferred** | Label user-authored facts separately from system-inferred memory and pending learning proposals. |
| **Edit and forget** | Users can correct or remove what the system remembers; no irreversible silent accumulation. |
| **No creepy hidden personalization** | Nothing flows into prompts without a path to Control Center visibility or explicit user promotion. |
| **Capability honesty** | UI and copy must not imply autonomy, proactive agents, or cross-module “insights” that are synthetic or unwired. |
| **Tenant honesty** | Personal, business, and (future) household memory must never leak across scopes. |

**Red flag:** If marketing copy describes a capability that diagnostics cannot prove on a real request, the copy is wrong — fix the copy or build the capability properly.

---

## 4. Context integrity principles

Context is the fuel of the twin. Treat it like production data with contracts and audits.

### Available vs used

- **Available:** Data fetched, registered, or eligible for assembly (module provider returned payload, memory fact matched query).
- **Used:** Block survived ranking, profile gating, and token budget and was included in `assembledContext` or equivalent provider payload.

Diagnostics must report both. “We had Drive context” is not the same as “Drive context shaped the reply.”

### Synthetic insights

Hardcoded or placeholder cross-module insights (`synthetic: true`, demo `dataPoints`, empty joins) **must never appear as real intelligence** in user-facing prompts. Gate behind dev flags or remove until data-backed. Admin traces should flag synthetic blocks explicitly.

### Module context observability

Every module provider fetch must be traceable: module id, provider id, latency, cache hit/miss, success/failure, payload size estimate. Failures are logged; they are not silently dropped without a trace entry.

### Low-density acknowledgment

When context is thin (no modules matched, zero memory facts, recall miss), internal diagnostics and optional admin views should record **missingContext** / **risks** — already started in `AIContextAssembler`; extend, do not bypass.

### Token budget transparency

Conversation vs enterprise profiles use different budgets. Traces should record budget ceiling, estimated tokens used, and dropped blocks with reason (over budget, profile excluded, low relevance).

### No prompt stuffing

More context is not better context. Rank, compress, and budget before injection. Prefer one high-signal block over ten low-signal JSON dumps.

---

## 5. Observability standards

AI systems must be **debuggable like infrastructure** — searchable logs, request correlation, structured diagnostics, no secrets in output.

### Required on every twin request

| Signal | Content | Must not include |
|--------|---------|------------------|
| **Request ID** | Propagated Service → Core → provider → response metadata | — |
| **Pipeline trace** | Intents, grounding, tools, memory counts, module ids | Raw user message body in admin export without policy |
| **Provider routing** | Provider chosen, model, vision vs text, fallback reason | API keys, full prompts in production logs |
| **Fallback visibility** | `RATE_LIMITED`, `TEMP_UNAVAILABLE`, provider switch | Silent fallback with no metadata |

### Domain-specific reports (build out per maturity plan)

| Report | Purpose |
|--------|---------|
| **Context density** | Providers attempted/succeeded, blocks available vs used, token budget |
| **Memory influence** | Fact ids, scores, source types, count injected |
| **Learning promotion** | Signal → pending → promoted → resolver applied (stage timings) |
| **Structured response** | Schema mode, validation warnings, quality guardrails |

### Logging rules

- Use `logger` from `server/src/lib/logger.ts` with `operation`, `requestId`, structured metadata.
- `catch (error: unknown)` — never log tokens, passwords, or full attachment content.
- Prefer counts and ids over verbatim user predicates in logs.
- Vision pipeline: follow `[VISION_PIPELINE]` prefix per `docs/ai/GOLDEN_RULES.md`.

### Admin vs user visibility

| Audience | Sees |
|----------|------|
| **Admin / support** | Full pipeline trace, evidence bundle, context density, provider errors, enforcement |
| **End user** | Explain drawer (influence summary), Memory/Learning tabs, file issues — not raw assembled dump |

### Sampling and persistence

Diagnostic persistence (`AIPipelineDiagnostic`) follows env gates (`AI_PIPELINE_DIAGNOSTICS_ENABLED`, sample rate). New intelligence features should add trace fields **before** widening sampling or marketing the feature.

---

## 6. UX intelligence principles

Intelligence in the product should feel **earned**, not performed.

### One remembered preference > 100 hidden embeddings

A single explicit memory fact the user recognizes beats opaque vector personalization. Optimize for legible state: facts, preferences, promoted learning — not unreadable model internals.

### Explain drawers and influence stacks

Chat surfaces expose **what shaped this reply** (memory, preferences, module focus) via `metadata.responseInfluence` and explain UI. Empty influence is honest; fake influence is forbidden.

### Memory transparency

Memory tab shows source (explicit, remember-that, inferred), confidence, scope, and **why I remembered this** when provenance exists. Edit and forget are first-class.

### What changed and why

Learning tab explains promotions: before/after preference or memory, signal that triggered review, user action (promote/dismiss). No silent profile mutation.

### Recommendation reasoning

Structured actions and suggestions include short, accurate rationale tied to real context — not generic “AI thinks you should…”

### Progressive trust building

First visit: minimal inference, clear controls. Over time: richer memory and learning **with increasing visibility**, not increasing secrecy. Tour and microcopy in AI Identity reinforce control.

### Intelligence should feel earned

Day-30 personalization should be noticeably better because **real accumulated state** exists — not because prompts got longer. Measure with fixtures and user-visible diff, not token count alone.

---

## 7. Anti-patterns to avoid

Explicitly forbidden without architecture review and maturity-plan alignment:

| Anti-pattern | Why it fails |
|--------------|--------------|
| **Fake autonomy** | UI or copy promises unsupervised action; backend is mock or prompt-only boundaries |
| **Invisible AI behavior changes** | Prompt or retrieval changes shipped without diagnostics and user-visible path |
| **Synthetic cross-module hallucinations** | Placeholder insights presented as live intelligence |
| **Prompt stuffing** | Unbounded context injection “to make answers smarter” |
| **Context dumping** | Raw module JSON in prompts without rank/budget/synthesis |
| **Over-personalization** | Inferred traits applied without confidence floor or user promotion |
| **Agent theater** | “Agents”, “swarms”, “autonomous assistant” language for non-operational code |
| **Silent learning loops** | Signals write to DB but never reach `PreferenceResolver` or memory |
| **Unobservable orchestration** | New registry entries or engines with no trace segment |
| **Dual truth** | Docs or UI claim LIVE; audit says THIN or DORMANT |
| **Tenant scope shortcuts** | Memory or context queries without `dashboardId` / `businessId` when required |
| **localhost / secret leakage** | Hardcoded dev URLs or logging sensitive content in AI paths |

When in doubt: **do not ship the anti-pattern “behind a flag” for end users** — use admin/dev flags only until the three-part “real feature” test passes (§ anchor).

---

## 8. Rollout philosophy

### Small, production-safe increments

Each subphase in the maturity plan is sized for reviewable PRs: schema + service + trace + test + UX slice. No multi-month big-bang AI rewrites.

### Feature gating

- **User-facing intelligence:** off until acceptance criteria pass (including explainability + diagnostics).
- **Synthetic or experimental context:** dev/admin env flags only.
- **Autonomy UI:** hidden or deprecated until execution path is unified and approval-safe (see maturity plan §6).

### Observability before automation

Do not automate promotion of learning to identity, auto-expiry of memory, or multi-module synthesis until humans can inspect decisions in trace and Control Center.

### Diagnostics before intelligence

New context sources register in pipeline catalog with `wiredInTwin` truth. Add trace mappers before enabling in production profiles.

### Measurable behavior changes

Every phase exits with **tests or fixtures** that prove differentiation (e.g. day-30 vs day-1 memory influence, multi-module trace on fixture query). “We added code” is not completion.

### No hidden major AI changes

Prompt block changes, retrieval strategy changes, and learning apply paths require: changelog note in Memory Bank, trace field updates, and regression tests on twin pipeline. Silent prompt surgery is prohibited.

### Rollback discipline

Prefer additive schema and feature flags. When disabling, system degrades to **less personalized but correct** — not broken chat or leaked context.

---

## 9. Architectural guardrails

Preserve these boundaries in all AI platform work. The maturity plan assumes them; do not bypass.

| Guardrail | Canonical reference |
|-----------|---------------------|
| **Twin prompt path** | Single path via `DigitalLifeTwinCore` + `assembleAIContext`; no parallel prompt builders |
| **Provider routing** | OpenAI / Anthropic / Local; vision model when parts exist; 429 fallback |
| **Multimodal pipeline** | GCS via `storageService`; no local upload assumption; `docs/ai/GOLDEN_RULES.md` |
| **Business tenancy** | `dashboardId` + `businessId` / `householdId` on persisted reads/writes |
| **Auth** | Cookie/session + JWT; Next.js API proxy for browser; no bypass for user calls |
| **Module architecture** | Registry, context providers, action executors per `memory-bank/moduleSpecs.md` |
| **Structured response v2** | Schema, sections, actions, quality guardrails — extend, don’t fork |
| **Context assembly layering** | Service loads → Core orchestrates → Assembler ranks/budgets → Provider formats |
| **Activity vs analytics** | Module activity events ≠ domain events ≠ AI diagnostic samples |
| **Autonomy** | Prompt boundaries via `PreferenceResolver` only; no new auto-exec paths |

**Reuse-first:** Extend `PreferenceResolver`, `AIContextAssembler`, `MemoryRetrievalService` (planned), pipeline trace — do not duplicate retrieval or prompt logic in routes or UI.

---

## 10. Success criteria

“What good looks like” for each maturity pillar — **user-perceived**, **explainable**, **trustworthy**, **measurably adaptive**, **operationally reliable**.

### Memory

- User states a preference once; later sessions reflect it without re-stating.
- Explain drawer lists influencing facts; Memory tab allows edit/forget.
- Trace shows fact ids and scores; zero cross-tenant leakage in tests.
- Day-30 fixture produces measurably richer memory influence than day-1.

### Learning

- Signals visible in Learning tab; promotion updates identity or memory user can see.
- “What changed and why” available after promotion.
- No event spam; validated learning reaches resolver or memory in integration tests.
- Collective/global learning never silently injected without opt-in.

### Cross-module intelligence

- Multi-module fixture loads ≥2 real module contexts in trace.
- Synthesis blocks (when shipped) cite linked entities, not synthetic placeholders.
- User-visible replies reference multiple modules only when trace proves context was **used**.
- Thin context recorded in `missingContext` / density report.

### Extensibility

- New module adds context provider via registry checklist — no twin fork.
- Domain events consumed by AI layer are typed and tenant-scoped.
- Webhook MVP verifiable with signature test; no in-process partner code.
- Developer docs match what certification checks enforce.

### Cross-cutting (structured responses, diagnostics, context)

- Structured responses validate; quality warnings in trace when weak.
- Every production AI regression has a named test or admin test-lab scenario.
- Provider fallback leaves metadata honest about which provider answered.
- Admin can answer: “What context did this request get?” in under one trace view.

---

## 11. Future positioning

Vssyl is building toward an **AI operating layer** for work and life context: modular, tenant-aware, observable, extensible by first- and third-party modules.

**Intentionally not now:**

- Fully autonomous assistants
- Proactive execution without user initiation
- Agent swarms or unsupervised multi-step workflows
- Marketing that outruns diagnostics

**Autonomous execution** remains **future infrastructure** — code may exist dormant (`AutonomyManager`, approval models, executor registry) but must not shape product promises or user expectations until:

1. Unified evaluation with `ActionExecutor`
2. Real module APIs, not mocks
3. Approval loop that executes on approve
4. Full trace and user-visible action history
5. Explicit product decision to lift the stop line

**Current focus:** Trustworthy contextual intelligence — memory that sticks, learning users control, cross-module context that is real, and a platform others can extend without breaking tenancy or observability.

---

## How this document is used

| When | Action |
|------|--------|
| **Starting a subphase** | Read relevant §§1–9; confirm feature passes anchor test before user-facing ship |
| **PR review** | Check anti-patterns (§7), guardrails (§9), observability (§5) |
| **Product/copy review** | Capability honesty (§3); hierarchy stop line (§2) |
| **Incident/debug** | Observability standards (§5); context integrity (§4) |
| **Planning new AI work** | Maturity plan for *what*; this doc for *how* |

**Updates:** When principles change, update this file and note in `memory-bank/activeContext.md`. Do not fork philosophy into scattered READMEs.

---

## Related documents

| Document | Role |
|----------|------|
| [`AI_PLATFORM_MATURITY_PLAN.md`](./AI_PLATFORM_MATURITY_PLAN.md) | Phased roadmap and acceptance criteria |
| `memory-bank/AI_CONTEXT_MEMORY_ARCHITECTURE.md` | Memory/recall implementation truth |
| `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md` | Twin prompt path |
| `docs/architecture/AI_PIPELINE_ADMIN_TOOLS.md` | Admin diagnostics |
| `docs/ai/GOLDEN_RULES.md` | Vision/attachment non-negotiables |
| `memory-bank/aiContextSystem.md` | Module AI context contract |
| `docs/architecture/DOMAIN_EVENTS.md` | Event bus boundaries |
