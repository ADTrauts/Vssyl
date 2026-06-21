# CG-1B — Traversal Validation Report

**Program:** Vssyl Context Graph  
**Phase:** 1B  
**Date:** 2026-06-19

---

## Validation scope

Cross-adapter bundle traversal validated via unit tests against `resolveBundle()` with mocked adapters and live adapter contract tests. No synthetic edges introduced.

---

## Validated paths

| Path | Edge type | Constitutional? | Test |
|------|-----------|-----------------|------|
| V_Link → Note | `vlink.attachment` | Yes — V_Link SoR | `crossAdapterTraversal.test.ts` |
| V_Link → Chat | `vlink.attachment` | Yes | `crossAdapterTraversal.test.ts` |
| V_Link → Notebook page | `vlink.attachment` (via NOTE map) | Yes | V_Link map + registry |
| Note → Drive file | `notebook.link` | Yes — NotebookLink SoR | `crossAdapterTraversal.test.ts` |
| Note → Calendar event | `notebook.link` | Yes — mapper supports CALENDAR_EVENT | `notebookLinkRef.ts` |
| Note → Todo task | `notebook.link` | Yes | `notebookLinkRef.ts` |
| Note → Chat conversation | `notebook.link` | Yes | `notebookLinkRef.ts` |
| Notebook page → * | `notebook.link` | Yes | `notebookAdapter.getNeighbors` |
| Drive → V_Link | `vlink.attachment` inbound | Yes (1A) | `driveAdapter.getNeighbors` |
| Place → V_Link | `vlink.attachment` inbound | Yes | `placeAdapter.getNeighbors` |

---

## Depth and budget enforcement

Unchanged from CG-1A:

- `MAX_DEPTH = 2`; default depth `1`
- Node budget `50`, edge budget `50`
- Truncation metadata in bundle descriptor
- **No N-hop social traversal**

---

## Denied node handling

| Scenario | Expected | Validated |
|----------|----------|-----------|
| Denied chat attachment on V_Link bundle | Omitted; `nodesOmitted: 1` | Yes |
| Restricted node | Included with `access: 'restricted'` | Yes (1A) |
| Unmapped V_Link entity type | Edge listed; node not hydrated | Yes — no stub adapter |

---

## Edge taxonomy (1B)

| edgeType | Source | Target | Synthetic? |
|----------|--------|--------|------------|
| `vlink.attachment` | V_Link container | module entity | No |
| `notebook.link` | notes/notebook page | module entity | No — NotebookLink |
| `notebook.containment` | notebook folder | notebook_page | No — Note.folderId |

**No universal relationship table. No inferred tag edges.**

---

## Test evidence

| Suite | Tests | Focus |
|-------|------:|-------|
| `crossAdapterTraversal.test.ts` | 4 | V_Link→Note/Chat; Note→Drive; deny omit |
| `p1Adapters.test.ts` | 5 | P1 adapter contracts |
| `bundleResolver.test.ts` | 3 | 1A regression |
| `adapterRegistry.test.ts` | 7 | 8 adapters, 11 types |
| `permissionResolver.test.ts` | 3 | Trimming |
| `context-graph.integration.test.ts` | 5 | API regression |

**Total context-graph tests:** 25 (+ 5 API = 30)

---

## Not validated (deferred)

- Live DB multi-module integration (mocked orchestration path)
- Message-level chat traversal (intentionally excluded)
- `place_review` traversal (no SoR)
- Projection API / neighborhood HTTP routes (CG-1B-prime)

**Last updated:** 2026-06-19
