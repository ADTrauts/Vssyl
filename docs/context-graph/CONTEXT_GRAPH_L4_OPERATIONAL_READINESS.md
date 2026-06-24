# Context Graph — Level 4 Operational Readiness

**Program:** Context Graph L4 Certification  
**Date:** 2026-06-23  
**Status:** Baseline runbook — production pilot gated by L4-F01

---

## Purpose

Document operational controls for the **first production pilot** (authorized only after L4-F01 staging soak).

---

## Feature flags

| Flag | Default | Pilot value |
|------|---------|-------------|
| `AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED` | off | `true` |
| `CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED` | off | `true` |
| `CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED` | off | `true` |

**Helper:** `server/src/context-graph/projectAssistantPilotEnv.ts`

---

## Expected behavior (pilot on)

```
project_assistant intent
  → AI Retrieval discovery
  → Retrieval → Bundle inference bridge
  → Grounding reconciliation
  → Deduped context to AI twin
```

---

## Diagnostics collection (controlled)

| Diagnostic | Location | Collect in pilot? |
|------------|----------|-------------------|
| `retrievalDiscovery` | Pipeline result / ctxRecord | ✅ Aggregates only |
| `projectProfile` | `_ai_retrieval_discovery` | ✅ |
| `groundingReconcileDiagnostics` | `_grounding_reconcile` | ✅ |
| Inference provenance | Bundle node `metadata.inference` | ✅ Counts only |
| `modulesContributingEvidence` | Retrieval diagnostics | ✅ |
| `retrievalSourceDiversity` | `projectProfile` | ✅ |
| Raw entity titles in logs | — | ❌ Do not export to external analytics |

---

## Rollback procedure

1. Set all three flags to `false` or unset
2. Restart server instances
3. Verify: no `retrieval_inference_bridge` in `sourcesUsed`
4. Verify: no `_grounding_reconcile` in module context patches
5. Document incident in ops log if rollback was emergency

**Rollback time target:** < 15 minutes (config-only).

---

## Staging soak checklist (L4-F01)

**L4-F01 closed 2026-06-23** — see [CONTEXT_GRAPH_L4_F01_CLOSEOUT.md](./CONTEXT_GRAPH_L4_F01_CLOSEOUT.md).

Before production pilot day 1:

- [x] Automated gate (37 tests)
- [x] Validation scenarios A–E documented
- [ ] Production rollback drill in pilot environment
- [ ] Operator sign-off
- [ ] 14-day monitored cohort (during pilot)

---

## Production safeguards

| Safeguard | Status |
|-----------|--------|
| Flags default off | ✅ |
| Single consumer scope | ✅ Ratified |
| No graph persistence | ✅ Constitutional |
| Inference never auto-promoted to V_Link | ✅ |
| Tenant scoping on bridge | ✅ Requires dashboardId |
| Production enablement in this phase | ❌ **Not authorized** |

---

## On-call playbook (summary)

| Symptom | Action |
|---------|--------|
| Duplicate context in responses | Verify reconcile flag; check `_grounding_reconcile` |
| Missing project context | Verify all three flags; check retrieval opt-in |
| Permission concern | Rollback flags; review `skippedUnsafeMergeCount` |
| Elevated latency | Check retrieval diagnostics duration fields |

---

## First production pilot scope (post L4-F01)

| Dimension | Scope |
|-----------|-------|
| Consumer | `project_assistant` only |
| Flags | All three enabled |
| Rollout | Staged cohort / internal users first |
| Diagnostics | Controlled collection per table above |
| Expansion | **Not authorized** without separate council review |

**Last updated:** 2026-06-23
