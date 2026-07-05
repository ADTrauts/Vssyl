# AI Knowledge Governance

**Program:** AI Knowledge Reference Program — Phase 0A  
**Date:** 2026-07-05  
**Scope:** Rules for ownership, editing, conflicts, staleness, and explainability — **descriptive + recommended policy**

---

## 1. Governance principles

1. **Users own personal taught knowledge** — platform may infer; user must approve inferred entries before prompt use (`learningStatus`).
2. **Business admins own business-scoped knowledge** — employees consume; admins configure twin and approve business learning events.
3. **Platform operators own pipeline governance** — intents, grounding, tools, quality — not user facts.
4. **Module data owners edit in modules** — Drive, Calendar, HR, etc. are SoR; AI reads, does not fork.
5. **Activity vs analytics** — diagnostics and `AIConversationHistory` are audit/analytics; not user-editable knowledge.

---

## 2. Ownership matrix

| Knowledge type | Owner | Editor roles | Viewer roles |
|----------------|-------|--------------|--------------|
| Personal memory facts | User | User | User; operator via diagnostics (metadata only) |
| User AI context | User | User | User |
| Personal learning events | User | User (review); system (create) | User |
| Personality / autonomy | User | User | User |
| Chat threads | User | User | User; operator diagnostics (if logged) |
| Module workspace data | Workspace member per module PE | Per module permissions | AI via authorized providers |
| V_Link relationships | User / business member | V_Link permissions | AI via graph services |
| Business twin config | Business | Business ADMIN (+ policy) | Business members (effects only) |
| Business learning events | Business | Business admin (approve) | Business admin |
| Pipeline policies | Platform | Platform ADMIN | Platform ADMIN |
| Module registry | Platform / module author | Platform ADMIN | Platform ADMIN |
| Global patterns | Platform | System (consent-gated) | Opt-in users (Insights) |

---

## 3. Edit model (existing)

| Store | Create | Update | Delete | Review gate |
|-------|--------|--------|--------|-------------|
| `UserMemoryFact` | API + "remember that" | API | Soft trash | None |
| `UserAIContext` | Control Center + inference | API | API | `learningStatus: pending` → promote/dismiss |
| `AILearningEvent` | System/modules | — | — | User approve/reject in Learning tab |
| `BusinessAILearningEvent` | System | — | — | Business admin approve |
| `AIPipeline*Policy` | Admin UI | Admin UI | Admin UI | `AIPipelinePolicyAuditLog` |
| Module entities | Module UIs | Module UIs | Module trash rules | Module PE |

**Gap:** No unified **edit history** visible to users for memory facts (only `updatedAt`).

---

## 4. Conflict resolution

### 4.1 Current behavior (implicit)

| Conflict | Resolution today | Transparent to user? |
|----------|------------------|-------------------|
| Duplicate fact in `UserAIContext` and `UserMemoryFact` | Both may appear in prompt; assembler caps count | No |
| Inferred context vs user instruction | Instructions prioritized in prompt ordering | Partial |
| Personality vs session override | Session wins ephemeral; profile wins persisted | No |
| Business policy vs personal preference in business chat | Business policy overlay in twin | Partial (business chat only) |
| Pipeline grounding vs missing provider | Diagnostic flags; may weaken answer | Operator only |
| Stale fact vs new module data | Both may appear — no merge | No |

### 4.2 Recommended policy (Phase 1B+)

| Rule | Description |
|------|-------------|
| **Explicit beats inferred** | Promoted user entries override matching inferred entries |
| **Newer explicit beats older** | `updatedAt` on same subject/predicate |
| **Business policy beats personal in business context** | When `businessId` set |
| **Module SoR beats memory for entity attributes** | "Meeting at 3pm" → calendar wins over remembered time |
| **Surface conflicts in Teach UI** | "You also taught X elsewhere" — read-only warning |
| **Never auto-delete** on conflict — user resolves |

**Do not implement auto-merge in Phase 1** — visibility first.

---

## 5. Stale knowledge

### Existing signals

| Signal | Where |
|--------|-------|
| `UserMemoryFact.expiresAt` | Memory facts |
| `UserAIContext` inactive / learningStatus | Context entries |
| `AILearningEvent` age + validation state | Learning |
| Module entity `updatedAt` | Live providers |
| `AIPipelineDiagnostic` retention | Diagnostics |

### Recommended staleness UX

| Audience | Surface |
|----------|---------|
| User | "Not updated in 90 days" on Memory entries; optional expiry editor |
| Business admin | Business learning events pending too long |
| Operator | Knowledge Health panel: % diagnostics with stale evidence (Phase 2B) |

---

## 6. Explainability

### Today

| Audience | Mechanism | Jargon level |
|----------|-----------|--------------|
| Operator | `AIPipelineDiagnostic` — intents, sources, evidence, trace JSON | High — appropriate |
| User | None systematic | — |
| Developer | Test Lab dry-run | High |

### Recommended user explainability (non-technical)

After each answer (optional expand):

> **What influenced this answer**
> - 2 things you taught Vssyl  
> - Your calendar today  
> - A file you attached  

**Do not show:** provider names, embedding scores, RAG chunks, prompt text.

**Implementation path:** Summarize `assembledContext` metadata already in diagnostics — client-side on `/ai-chat` (Phase 3A).

---

## 7. Operator inspection model

| Question | Operator path today | Recommended label |
|----------|---------------------|-------------------|
| Why did user X get answer Y? | Diagnostics → trace | Explainability (operator) |
| Is grounding failing? | Quality dashboard, at-risk trends | Knowledge Health |
| Are providers healthy? | Test Lab, provider health panel | Context Sources health |
| What policies apply? | Intents, grounding, tools pages | Pipeline Config |
| What did user teach? | **No direct view** | Knowledge Explorer (read-only aggregate — Phase 2B) |

**Constraint:** Knowledge Explorer must **query existing APIs** (`/api/ai/memory/facts`, user context admin if added) — not new store.

---

## 8. Consent and privacy

| Mechanism | Status |
|-----------|--------|
| Inferred context promotion | `learningStatus: pending` — implemented |
| Global/collective learning | Consent-gated — implemented |
| Business employee AI | Business policy + membership |
| Operator access to user taught knowledge | **Not exposed** in admin UI today — correct default; support workflow may need scoped impersonation + audit |

---

## 9. Audit trail

| Action | Logged |
|--------|--------|
| Pipeline policy edit | `AIPipelinePolicyAuditLog` |
| Admin impersonation | `AuditLog`, `AdminImpersonation` |
| User memory CRUD | Standard timestamps; no dedicated audit table |
| Learning event review | Event state change |
| Twin turn | `AIPipelineDiagnostic`, `AIConversationHistory` |

**Gap:** User-facing "who changed this memory?" — not available.

---

## 10. Governance maturity

| Dimension | Score |
|-----------|------:|
| Ownership rules in code | 80% |
| Consent gates | 75% |
| Conflict handling | 40% (implicit only) |
| Staleness | 30% (fields exist, no UX) |
| Explainability | 45% (operator strong, user none) |
| **Overall governance maturity** | **~52%** |
