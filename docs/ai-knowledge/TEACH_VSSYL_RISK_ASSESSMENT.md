# Teach Vssyl Phase 1 — Risk Assessment

**Program:** Teach Vssyl Phase 1A  
**Date:** 2026-07-05

---

## Risk summary

| Level | Count | Meaning |
|-------|-------|---------|
| 🔴 Blocker | 0 | No architectural blockers for personal Phase 1 |
| 🟠 High | 3 | Must address in Phase 1A before UI |
| 🟡 Medium | 5 | Manage in Phase 1B or Phase 2 |
| 🟢 Low | 4 | Monitor post-ship |

---

## Journey risk register

### 1. Personal fact / preference — "I prefer concise responses."

| Dimension | Assessment |
|-----------|------------|
| APIs | ✅ `POST /api/ai/user-context` or memory facts |
| Services | ✅ Existing |
| Stores | ✅ Existing |
| UI | ❌ Missing chat modal |
| Backend glue | 🟢 None for explicit path |
| Evaluation | 🟠 Missing G1 retrieval test |
| Permissions | ✅ JWT user scope |
| **Risk** | 🟡 **Medium** — dual path confusion (context vs memory fact for preferences) |

**Mitigation:** Product rule — preferences → `UserAIContext`; declarative facts → `UserMemoryFact`. Document in modal copy.

---

### 2. Business policy — "Managers approve overtime."

| Dimension | Assessment |
|-----------|------------|
| APIs | ⚠️ Admin: `PUT business-ai/config`; employee: learning review |
| Apply on approve | ❌ No `learningApplicationService` for business |
| UI | ⚠️ Business AI CC exists; not chat teach |
| **Risk** | 🟠 **High if in Phase 1** — defer to Phase 2 |

**Mitigation:** Hide business chip in Phase 1 personal chat; admin uses Business AI Control Center.

---

### 3. Vocabulary — "Board Meeting means Executive Meeting."

| Dimension | Assessment |
|-----------|------------|
| APIs | ✅ Memory fact or instruction context |
| Schema | ✅ No `vocabulary` category — use `other` / instruction |
| **Risk** | 🟢 **Low** |

---

### 4. Hallucination correction — "This isn't true."

| Dimension | Assessment |
|-----------|------------|
| Explicit fix | ✅ Memory fact POST |
| Review queue | ❌ No API to create `correction` event from client |
| **Risk** | 🟠 **High** — core Improve Answer path incomplete without glue |

**Mitigation:** Phase 1A: add correction create on existing router; ambiguous → review; explicit → direct fact POST.

---

### 5. Document / SOP — "This SOP is now our standard."

| Dimension | Assessment |
|-----------|------------|
| Live read | ✅ Attach + `fileAnalysisService` |
| Full doc in memory | ❌ Constitution forbids |
| Summary fact | ✅ Optional memory fact |
| **Risk** | 🟡 **Medium** — user expectation mismatch |

**Mitigation:** UX copy explains Drive + attach; optional summary teach only.

---

### 6. Module entity — "This task has higher priority."

| Dimension | Assessment |
|-----------|------------|
| Memory write | ❌ Must not |
| Redirect | ✅ Todo module deep link |
| **Risk** | 🟢 **Low** — UX only |

---

### 7. Thumbs-down → review → apply → retrieve

| Dimension | Assessment |
|-----------|------------|
| Signal today | ❌ `behavioral_signal` — not reviewable |
| Review API | ✅ Works for `correction` type |
| Apply | ✅ `learningApplicationService` |
| Retrieve | ✅ After apply |
| `interactionId` | ❌ Twin doesn't return history id |
| **Risk** | 🟠 **High** — thumbs loop broken without glue |

**Mitigation:** Phase 1A: thumbs + required text → create `correction` event; defer star-rating `/feedback` until `conversationHistoryId` in twin metadata.

---

## Cross-cutting risks

| Risk | Severity | Description | Mitigation |
|------|----------|-------------|------------|
| Dual memory SoR | 🟡 | Fact in both `UserMemoryFact` and `UserAIContext` | Router picks one; conflict warning in Knowledge Health (Phase 2) |
| No teach eval CI | 🟠 | Ship UI without proof | Block Phase 1B on G1–G4 |
| `/api/ai/teach` bypass | 🟡 | Creates event + context without review | Prefer typed APIs in modal; teach for legacy |
| Behavioral signals in prompts | 🟢 | Today not prompt-eligible | Keep thumbs on correction path only |
| Business learning apply gap | 🟠 | Admin approve doesn't write stores | Phase 2; don't expose employee business teach in Phase 1 |
| Permission escalation | 🟢 | Memory facts respect businessId membership | Existing `userMemoryFactService` tenancy checks |
| Operator/user boundary | 🟢 | Users might expect to edit grounding | Constitution P14 — redirect to support |
| Stale module vs memory | 🟡 | Memory says 3pm; calendar says 4pm | Module redirect + SoR wins (Constitution) |

---

## What should NOT be built (risk if built)

| Item | Risk if built |
|------|---------------|
| Knowledge Graph service | Architecture drift, duplicate SoR |
| Unified knowledge table | Schema churn, violates Constitution |
| LLM auto-classifier v1 | Non-deterministic routing, governance bypass |
| Auto-apply thumbs without text | Silent learning violation (P4) |
| User pipeline policy editor | Platform misconfiguration |
| Full document embedding in memory | Staleness, privacy, SoR violation |

---

## Residual risk acceptance (Phase 1)

Accept for v1:

- Business teach deferred  
- Thread-scoped corrections deferred  
- No LLM quality eval  
- Dual store UX confusion partially mitigated by chips  

Do **not** accept:

- Shipping UI without retrieval integration tests  
- Thumbs-down that creates only behavioral signals  
- Module entity writes to memory  

---

## Related documents

- [TEACH_VSSYL_PHASE_1_IMPLEMENTATION_PLAN.md](./TEACH_VSSYL_PHASE_1_IMPLEMENTATION_PLAN.md)
- [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md)
