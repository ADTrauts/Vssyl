# AI Retrieval — Search Alignment

**Program:** AI Retrieval Adapter — Phase 0A  
**Date:** 2026-06-23  
**Status:** Alignment analysis — discovery only

**Search authority:** [SEARCH_CONSTITUTION.md](../../search/SEARCH_CONSTITUTION.md) (RD-US-001)

---

## 1. Central question

> Can Unified Search become the **authoritative discovery layer** for AI?

**Answer: Yes — for Category B entity discovery. No — as the only retrieval path.**

---

## 2. Retrieval category assignment

| Category | Owner | Examples | Search role |
|----------|-------|----------|-------------|
| **A — Independent** | AI Platform / Runtime | preferences, memory facts, diagnostics, location, activity signals | **None** |
| **B — Search discovery** | Unified Search | files, tasks, messages, events, notes, places, vlinks, users | **Primary** |
| **C — Provider summaries** | Module context providers | upcoming tasks, recent files, today calendar, HR overview | **Complementary** |
| **D — Hybrid** | Adapter coordinates | "find my tax files" vs "what's due this week" | **Search on query intent; provider on summary intent** |

---

## 3. Shared visibility primitives

| Entity | Visibility delegate | Used by Search | Used by AI |
|--------|---------------------|:--------------:|:----------:|
| Files | `searchAccessibleDriveFiles` | ✅ | ❌ (uses `listAccessibleRecent*`) |
| Folders | `searchAccessibleDriveFolders` | ✅ | ❌ |
| Tasks | `searchAccessibleTasks` | ✅ | ❌ (lists; orphan `searchTasksForAI`) |
| Events | `searchEvents` | ✅ | ❌ (window lists) |
| Notes | `searchAccessiblePages` | ✅ | ❌ (`listRecentPagesForAi`) |
| Chat | `searchAccessibleChat` | ✅ | ❌ |
| Places | `searchListingsForUser` | ✅ | ⚠️ parallel tool path |
| V_Link | `searchVLinksForUser` | ✅ | ⚠️ pipeline path |

**Alignment opportunity:** AI Retrieval Adapter calls **same delegates** as Search providers — single trust path.

---

## 4. What must remain outside Search

| Capability | Rationale |
|------------|-----------|
| **User memory facts** | Subjective user knowledge — not platform entities |
| **Preferences / settings** | Behavioral tuning — not discovery |
| **Curated summaries** | "3 overdue tasks" is aggregation, not search |
| **Storage quotas / stats** | drive `storage_overview` — metrics |
| **HR headcount / scheduling coverage** | Domain rollups |
| **Graph relationship edges** | Context Graph read adapters |
| **V_Link pipeline signals** | Intent detection + membership — precedes search |
| **Activity feed** | Temporal audit stream |
| **Pipeline diagnostics** | Operator observability |
| **Web search** | External — platform tool |
| **Write actions** | ActionExecutor — not retrieval |

---

## 5. Search integration requirements (Phase 1)

| # | Requirement | Search artifact |
|---|-------------|-----------------|
| 1 | Adapter calls `executeGlobalSearch` internally — not HTTP | `searchCapabilityService` |
| 2 | Map `SearchResult` → AI context blocks | new mapper |
| 3 | Normalize tenant scope | `filters.context` |
| 4 | Respect `search:read` PE | `searchPolicyDual` |
| 5 | Provider PE still on hydrate | visibility unchanged |
| 6 | Intent gate: discovery vs summary | query intent classifier |
| 7 | Do not replace context providers | hybrid model |

---

## 6. Permission alignment

| Layer | Search | AI (target) |
|-------|--------|-------------|
| Orchestrator | `search:read` | adapter calls same PE |
| Entity | provider `requiredPermission` | re-validate on hydrate optional |
| Tool | action-specific | may call adapter |

**Rule:** Search permission does **not** replace module read PE on entity detail hydration.

---

## 7. Output shape alignment

| Search `SearchResult` | AI assembly use |
|-----------------------|-----------------|
| `title`, `type`, `moduleId` | evidence block label |
| `url` | action deep link |
| `metadata` | scoped hints |
| `relevanceScore` | ranking in adapter |
| `permissions` | trust indicator |

Target: `AIRetrievalEvidence` derived from `SearchResult` — **implemented** in Phase 1A (`aiRetrievalEvidenceMapper.ts`).

---

## 8. Gaps before Search can serve AI

| ID | Gap | Blocks |
|----|-----|--------|
| **SA-01** | No AI → Search call path | **Partial** — 5 consumers including local_discovery |
| **SA-02** | No result → context mapper | **Closed** — `aiRetrievalEvidenceMapper` |
| **SA-03** | Intent routing undefined | **Partial** — two consumers + priority |
| **SA-04** | No unified audit trail | **Partial** — expanded diagnostics |
| **SA-05** | Place triple path | Trust drift |
| **SA-06** | No token budget on search hits | Prompt bloat |

---

## 9. Context Graph / tag index

| Mechanism | Search relationship |
|-----------|---------------------|
| Tag index (`tagIndexService`) | Optional Search **facet** per SEARCH_CONSTITUTION |
| Graph bundle | **Not** Search — relationship adapter |
| AI graph_bundle pipeline | Composes with Search hits — not replacement |

Phase 2+: wire tag facet to Search; adapter consumes facet-filtered entity keys.

---

## 10. Alignment verdict

| Question | Verdict |
|----------|---------|
| Search as authoritative **discovery**? | **Yes** — recommended |
| Search as only retrieval path? | **No** — providers + memory required |
| Ready today? | **Partial** — five wired consumers; Tier B paths remain |
| Constitutional conflict? | **None** — Option C Hybrid supports both |

---

## 11. SC-M4 reassessment (Phase 2B-3 update)

| Assessment | Phase 2B-2 | Phase 2B-3 |
|------------|------------|------------|
| Wired consumers | 4 | **5** |
| External-leaning discovery | No | **Yes** (`local_discovery` + Place via Search) |
| Place triple path closed? | No | **No** (documented) |
| SC-M4 closed? | No | **No** |

**Recommendation:** Local Discovery adds Place-through-Search evidence to adapter path — meaningful SC-M4 progress. Place tool consolidation remains open. Council review recommended; **do not self-certify Search.**

See [Phase 2B-3 closeout](./AI_RETRIEVAL_PHASE_2B3_CLOSEOUT.md).

---

**Last updated:** 2026-06-23 (Phase 2B-3)
