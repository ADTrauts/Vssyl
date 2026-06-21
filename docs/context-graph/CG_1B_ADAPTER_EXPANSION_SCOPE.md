# CG-1B — Adapter Expansion Scope

**Program:** Vssyl Context Graph  
**Phase:** 1B — P1 Adapter Expansion (authorized, not started)  
**Date:** 2026-06-18  
**Authority:** [CG_1B_AUTHORIZATION_RECOMMENDATION.md](./CG_1B_AUTHORIZATION_RECOMMENDATION.md)  
**Status:** Scope definition — **no implementation**

---

## 1. Purpose

Define the read-only adapter expansion authorized for CG-1B. This phase extends the federation registry — it does **not** add graph persistence, write APIs, UI, or business-domain modules.

**Baseline (CG-1A):** 4 adapters, 5 entity types, 17 tests.

**Target (CG-1B):** 7–8 adapters, 9–11 entity types, ≥25 cumulative tests.

---

## 2. Approved adapter scope

### 2.1 P1 — Required

#### Notes (`notes`)

| Field | Value |
|-------|-------|
| **moduleId** | `notes` |
| **entityTypes** | `page` |
| **Upstream (to create/use)** | `notesVlinkAccessService` (**CG-F-004 prerequisite**) |
| **V_Link mapping** | `VLinkEntityType.NOTE` → `notes:page` |
| **Edge types** | `vlink.attachment` |
| **Writes** | None |
| **Blockers** | Inline resolver debt — must close before adapter cert |

**Deliverables:**

1. `notesVlinkAccessService` with PE parity to drive/calendar pattern
2. `server/src/context-graph/adapters/notesAdapter.ts`
3. Registry registration + V_Link map entry
4. Unit + cross-adapter tests (vlink → notes page)

---

#### Notebook (`notebook`)

| Field | Value |
|-------|-------|
| **moduleId** | `notebook` |
| **entityTypes** | `page` |
| **Upstream** | `notebookLinkService` + target module hydrate |
| **Edge types** | `notebook.link`, `vlink.attachment` |
| **Writes** | None |
| **Blockers** | Shares NOTE type alias — descriptor must disambiguate `moduleId` |

**Deliverables:**

1. `notebookAdapter.ts` — `getNode`, `getNeighbors` (NotebookLink read)
2. Registry registration
3. Tests — notebook page in vlink bundle; notebook.link neighbor edges

**Note:** `moduleId` disambiguation prevents collision with `notes:page`.

---

#### Chat (`chat`)

| Field | Value |
|-------|-------|
| **moduleId** | `chat` |
| **entityTypes** | `conversation` |
| **Upstream** | `chatVlinkAccessService`, socket membership patterns (read only) |
| **V_Link mapping** | Conversation attachments; **`CHAT_THREAD` deferred** (CG-F-009) |
| **Edge types** | `vlink.attachment`, `chat.membership` |
| **Writes** | None |

**Deliverables:**

1. `chatAdapter.ts`
2. Registry registration + V_Link map for supported chat attachment types
3. Tests — vlink → conversation hydrate; denied membership omitted

**Explicitly deferred within Chat:** `CHAT_THREAD` enum registration until product decision (CG-F-009).

---

### 2.2 P1 — Conditional

#### Place (`place`)

| Field | Value |
|-------|-------|
| **moduleId** | `place` |
| **entityTypes** | `listing`, `meeting` |
| **Upstream** | `placeVlinkAccessService` (ready) |
| **Readiness** | ✅ Ready per adapter inventory |
| **Condition** | Ship after Notes adapter validates partial-readiness remediation pattern |

**Deliverables (if approved at kickoff):**

1. `placeAdapter.ts` — listing + meeting
2. V_Link map for place attachment types
3. Tests — place entity in bundle resolve

---

## 3. Deferred adapters (explicit exclusion)

| Module | Reason for deferral | Target phase |
|--------|---------------------|--------------|
| **HR** | Business-domain; L3 BA boundary; not user P1 vlink coverage | CG-2+ / separate charter |
| **Scheduling** | Business-domain; shift dependency graph out of scope | CG-2+ |
| **Workforce Communications** | Business-domain; audience edges not graph-ready | CG-2+ |
| **Business Administration** | L3 certified subdomain; org/approval not Tier 0 | CG-2+ |
| **Admin Portal** | Config/control plane — not entity graph | Not planned as graph adapter |
| **AI Memory** | Adjacent SoR — consumer only (RD-CG-005) | CG-1C (bundle consumer, not adapter) |
| **Tag Index** | Derived store — Phase 2A | NOT AUTHORIZED |
| **Graph UI** | Visualization — Phase 2B | NOT AUTHORIZED |

Council **rejects** expanding CG-1B to business-domain modules — prevents Tier 0 capability from absorbing L3 subdomain ownership.

---

## 4. V_Link entity type map extensions (1B)

Extend `VLINK_ENTITY_TYPE_MAP` in `vlinkAdapter.ts`:

| VLinkEntityType | Federation ref | 1B |
|-----------------|----------------|-----|
| `NOTE` | `notes:page` | ✅ Required |
| `CHAT` / conversation types | `chat:conversation` | ✅ Required |
| Notebook-linked types | `notebook:page` | ✅ Required |
| `LISTING` / `MEETING` (place) | `place:listing`, `place:meeting` | Conditional |

Unmapped types continue to **skip hydration** — no stub adapters.

---

## 5. Non-goals (1B)

| Non-goal | Rationale |
|----------|-----------|
| New Prisma models | Constitutional prohibition |
| Write APIs | Read federation only |
| `GET /projection` | CG-1B-prime |
| Entity neighborhood convenience routes | CG-1B-prime (optional DX) |
| AI pipeline bundle migration | CG-1C |
| Operational link depth >1 hop | N-hop deferred |
| Module neighbor graphs (todo.dependency, etc.) | Partial metadata OK; full edge surfacing deferred |

---

## 6. Test plan (1B)

| Suite | Focus | Min tests |
|-------|-------|-----------|
| Notes adapter | PE deny/allow, getNode | 2 |
| Notebook adapter | NotebookLink neighbors | 2 |
| Chat adapter | Membership deny omit | 2 |
| Place adapter (if in scope) | listing/meeting hydrate | 2 |
| Cross-adapter | vlink → notes/chat/notebook | 2 |
| Registry | Entity type count ≥8 | 1 |

**Cumulative target:** ≥25 tests (17 baseline + ≥8 new).

CG-F-007 full matrix (≥10 integration traversal tests) may **partially** close in 1B; full closure assigned to CG-1B-prime.

---

## 7. Registry projection (post-1B)

| Adapter | moduleId | entityTypes | Phase |
|---------|----------|-------------|-------|
| V_Link | `vlink` | `container` | 1A ✅ |
| Drive | `drive` | `file`, `folder` | 1A ✅ |
| Calendar | `calendar` | `event` | 1A ✅ |
| Todo | `todo` | `task` | 1A ✅ |
| Notes | `notes` | `page` | **1B** |
| Notebook | `notebook` | `page` | **1B** |
| Chat | `chat` | `conversation` | **1B** |
| Place | `place` | `listing`, `meeting` | **1B** (conditional) |

**Projected entity types:** 9–11 (from 5 at 1A).

---

## 8. Dependencies

```
CG-1A (complete)
    │
    ├── notesVlinkAccessService (CG-F-004) ──► notesAdapter
    │
    ├── notebookAdapter (NotebookLink service exists)
    │
    ├── chatAdapter (chatVlinkAccessService exists)
    │
    └── placeAdapter (optional, after Notes pattern)
```

**Parallel forbidden:** Notes adapter without access service.

---

## 9. Stop condition

Scope definition complete. **No adapter implementation** until separate ACT mode charter with `Mode: ACT` and CG-1B implementation package.

---

**Last updated:** 2026-06-18
