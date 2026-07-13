# AI Audit Recommendation Dispositions

**Program:** AI Architecture Phase 0  
**Date:** 2026-07-12  
**Status:** Active — dispositions for System Audit recommendations  
**Source:** [`../ai-system-audit/AI_SIMPLIFICATION_RECOMMENDATIONS.md`](../ai-system-audit/AI_SIMPLIFICATION_RECOMMENDATIONS.md) · Findings Register  
**Rule:** No recommendation is silently accepted for implementation. Phase 0 accepts **documentation** outcomes only.

Disposition: **Accepted** · **Deferred** · **Needs Discussion** · **Rejected**

---

## Retain (necessary complexity)

| Recommendation | Disposition | Reasoning |
|----------------|-------------|-----------|
| Keep Service / Core split | **Accepted** | Embodied and sound (ADR-AI-002) |
| Keep ContextProviderOrchestrator + registry | **Accepted** | ADR-AI-004 |
| Keep pipeline catalog / grounding / enforcement | **Accepted** | Safety; constitution |
| Keep conversation reasoning | **Accepted** | Understanding layer |
| Keep PreferenceResolver + memory facts | **Accepted** | Governed influence |
| Keep provider adapters + capability matrix | **Accepted** | ADR-AI-007 |
| Keep toolExecutor via domain services | **Accepted** | ADR-AI-008 |
| Keep knowledge composition (`server/src/knowledge`) | **Accepted** | Knowledge Engine location clarified |
| Keep ambient suggestions parallel path | **Accepted** | Distinct from Twin chat |
| Keep Admin AI Pipeline hub | **Accepted** | Operator plane |

---

## Clarify / Document / Rename

| Recommendation | Disposition | Reasoning |
|----------------|-------------|-----------|
| Clarify CrossModule as facade (optional rename later) | **Accepted** (clarify now) / **Deferred** (rename) | Docs only in Phase 0; no class rename |
| Document Knowledge Engine location | **Accepted** | Status matrix + Mental Model |
| Clarify Autonomy UI ≠ autopilot | **Accepted** (docs) | ADR-AI-010; product copy may still Need Discussion |
| Document Decision Model vs engines | **Accepted** | Intelligence + Knowledge docs |
| Document Notebook SPECIALIZED exemption | **Accepted** | Mental Model + status matrix |
| Document deep-dive supersession | **Accepted** | Historical banners |

---

## Consolidate (later)

| Recommendation | Disposition | Reasoning |
|----------------|-------------|-----------|
| Vision helpers into matrix | **Deferred** | Code change; Phase 2+ |
| Admin debug → pipeline only | **Deferred** | Phase 2 |
| Learning API surface consolidation | **Needs Discussion** | Product + eng ownership |
| ActionExecutor onto same services as tools | **Deferred** | Wave E-01; Phase 2 |

---

## Deprecate / Remove later

| Recommendation | Disposition | Reasoning |
|----------------|-------------|-----------|
| Remove `POST /api/ai/chat` later | **Deferred** | Phase 1; confirm zero clients |
| Remove autonomous residue | **Deferred** | Phase 1 |
| Remove analytics/AutoML/workflow orphans | **Deferred** | Phase 1 + schema review (CONFIRM-04) |
| Remove or replace inert DecisionEngine | **Needs Discussion** | Wire vs delete |
| Remove frontend orphans | **Deferred** | Phase 1 product confirm |
| Deprecate personality/autonomy shims | **Deferred** | Phase 1 |
| Remove ContinuousLearning scaffolds | **Deferred** | With parent orphans |

---

## Refactor / Replace (not Phase 0)

| Recommendation | Disposition | Reasoning |
|----------------|-------------|-----------|
| Split DigitalLifeTwinCore | **Deferred** | High risk; needs E2E tests |
| ModelTier routing | **Deferred** | CONFIRM-05; Phase 3 + ADR |
| Unified AiExecutionRecord | **Deferred** | Phase 4 |

---

## Guardrails / tests / observability

| Recommendation | Disposition | Reasoning |
|----------------|-------------|-----------|
| Tool side-effect approval policy | **Needs Discussion** | CONFIRM-01 — product policy |
| Twin E2E + fallback + reasoning tests | **Accepted** as plan / **Deferred** implementation | Testing phase, not Phase 0 docs-only beyond recording |
| Hardcoded model lint | **Deferred** | Phase 3 tooling |
| Execution record twin+notebook | **Deferred** | Phase 4 |

---

## Do not touch

| Recommendation | Disposition | Reasoning |
|----------------|-------------|-----------|
| Module context provider HTTP contract | **Accepted** | Interop |
| Pipeline enforcement semantics | **Accepted** | Safety |
| Tenant scoping rules | **Accepted** | Trust |
| Provider adapter isolation | **Accepted** | Portability |
| Knowledge review gates | **Accepted** | Constitution |

---

## Open confirmations (from audit)

| ID | Topic | Disposition |
|----|-------|-------------|
| CONFIRM-01 | Tools always need approval UX? | **Needs Discussion** |
| CONFIRM-02 | Notebook permanent exemption? | **Needs Discussion** |
| CONFIRM-03 | Intelligence dashboards fate? | **Needs Discussion** |
| CONFIRM-04 | Delete orphan engines Phase 1? | **Needs Discussion** (lean Deferred-yes with gates) |
| CONFIRM-05 | Introduce ModelTier Phase 3? | **Needs Discussion** (design Accepted as future) |
| CONFIRM-06 | Keyword→local sensitive routing? | **Needs Discussion** |

---

## Rejected

| Recommendation | Disposition | Reasoning |
|----------------|-------------|-----------|
| Delete historical documentation | **Rejected** | Phase 0 preserves history with banners |
| Rewrite runtime to match ideal tiers now | **Rejected** | Explicitly out of Phase 0 |
| Revive Centralized AI as Global Intelligence | **Rejected** | Conflicts with ADR-AI-005 / Intelligence Model |

---

## Phase 0 outcome summary

| Category | Count (approx) |
|----------|----------------|
| Accepted (docs / retain) | Majority of retain + clarify-doc items |
| Deferred (implementation later) | Removals, consolidations, routing, observability |
| Needs Discussion | Tool approval, Notebook fate, dashboards, orphan delete timing, ModelTier go/no-go |
| Rejected | History deletion; runtime rewrite now; centralized harvest |
