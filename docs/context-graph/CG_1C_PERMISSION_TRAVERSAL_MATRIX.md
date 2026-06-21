# CG-1C — Permission Traversal Matrix

**Program:** Vssyl Context Graph  
**Phase:** 1C  
**Finding:** CG-F-007 — **CLOSED**  
**Date:** 2026-06-19

**Evidence file:** `server/src/context-graph/__tests__/traversalPermissionMatrix.test.ts`

---

## Matrix summary

| Metric | Value |
|--------|------:|
| Scenarios documented | 13 |
| Scenarios PASS | 13 |
| Permission leaks found | 0 |
| Denied-node leak cases | 0 |

---

## Explicit traversal matrix

| ID | Scenario | Adapters | Allowed visible | Denied handling | Result |
|----|----------|----------|-----------------|-----------------|--------|
| **M1** | V_Link → denied drive file | vlink → drive | Root only | Attachment omitted | ✅ PASS |
| **M2** | V_Link → denied note | vlink → notes | Root only | Attachment omitted | ✅ PASS |
| **M3** | V_Link → denied chat | vlink → chat | Root only | Chat not in nodes[] | ✅ PASS |
| **M4** | Note → drive via notebook.link (denied file) | notes → drive | Note only | Drive omitted | ✅ PASS |
| **M5** | Note → calendar via notebook.link | notes → calendar | Note + event | — | ✅ PASS |
| **M6** | Note → todo via notebook.link | notes → todo | Note + task | — | ✅ PASS |
| **M7** | Note → chat via notebook.link | notes → chat | Edge present | — | ✅ PASS |
| **M8** | Restricted drive attachment | vlink → drive | Included `access:restricted` | Not omitted | ✅ PASS |
| **M9** | Mixed allowed + denied attachments | vlink → drive, todo | Root + drive | Todo omitted; count=1 | ✅ PASS |
| **M10** | Depth 0 — no attachment hydrate | vlink | Root only | No adapter calls | ✅ PASS |
| **M11** | Node budget truncation | vlink → drive | Truncated flag set | Budget enforced | ✅ PASS |
| **M12** | Forbidden V_Link root | vlink | N/A | `ContextGraphForbiddenError` | ✅ PASS |
| **M13** | Duplicate attachment dedup | vlink → drive | Single drive node | Dedup by entity key | ✅ PASS |

---

## Per-adapter permission rules validated

| Adapter | Allowed node | Denied node | Restricted node |
|---------|--------------|-------------|-----------------|
| vlink | Container in bundle | N/A (forbidden → error) | N/A |
| drive | `access: full` | Omitted | `access: restricted` in bundle |
| calendar | Same pattern | Omitted | Restricted visible |
| todo | Same pattern | Omitted | Restricted visible |
| notes | Same pattern | Omitted | Restricted visible |
| notebook | Same pattern | Omitted | Restricted visible |
| chat | Same pattern | Omitted | Restricted visible |
| place | Same pattern | Omitted | Restricted visible |

**No permission inheritance** — each hop evaluated independently via adapter access services + `shouldOmitNode`.

---

## Cross-module paths validated

| Path | Constitutional edge | Validated |
|------|---------------------|-----------|
| V_Link → Note | `vlink.attachment` | M2 |
| V_Link → Notebook (via NOTE map) | `vlink.attachment` | Registry |
| V_Link → Chat | `vlink.attachment` | M3 |
| Drive ↔ Notes | `notebook.link` | M4–M5 |
| Calendar ↔ Notes | `notebook.link` | M5 |
| Todo ↔ Notes | `notebook.link` | M6 |
| Chat ↔ Notes | `notebook.link` | M7 |

---

## CG-F-007 closure

| Criterion | Met |
|-----------|-----|
| ≥10 integration scenarios | ✅ 13 |
| Multi-hop redaction | ✅ M1–M4, M9 |
| Denied omitted not leaked | ✅ M1–M4, M9 |
| Traversal stop on depth/budget | ✅ M10–M11 |

**Finding status:** **CLOSED** (2026-06-19)

**Last updated:** 2026-06-19
