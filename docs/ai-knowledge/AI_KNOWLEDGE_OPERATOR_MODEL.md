# AI Knowledge Operator Model

**Program:** AI Knowledge Reference Program — Phase 0A  
**Date:** 2026-07-05  
**Scope:** How the **Operations Platform** should evolve for AI/knowledge — without new subsystems

---

## 1. Canonical entry point

**AI Pipeline** (`/admin-portal/ai-pipeline`) is the **current canonical operational entry** for AI administration.  
Legacy routes redirect here (`/admin-portal/ai-system`, `/admin-portal/ai-learning`).

**Do not replace it.** Formalize it as the **AI section** of the Operations Platform.

---

## 2. Current state audit

### Sidebar today (`platformControllerNavigation.ts`)

| Nav item | Path |
|----------|------|
| AI Pipeline | `/admin-portal/ai-pipeline` |
| Diagnostics | `/admin-portal/ai-pipeline/diagnostics` |
| Provider Governance | `/admin-portal/ai-pipeline#provider-governance` |

### Hub subpages (`PipelineHubToolSections.tsx`)

| Section | Pages |
|---------|-------|
| **Observe** | Diagnostics, Test Lab |
| **Configure** | Intents, Grounding, Context Sources, Tool Policies |
| **Govern** | Quality & Enforcement, Policy Audit, Compliance & Export, Provider Governance (anchor) |

### Additional routes (reachable from hub, not separate nav)

- `/admin-portal/ai-pipeline/intents`
- `/admin-portal/ai-pipeline/grounding`
- `/admin-portal/ai-pipeline/sources`
- `/admin-portal/ai-pipeline/tools`
- `/admin-portal/ai-pipeline/quality`
- `/admin-portal/ai-pipeline/audit`
- `/admin-portal/ai-pipeline/compliance`
- `/admin-portal/ai-pipeline/test-lab`

**Verdict:** Already a **structured AI section** implemented as hub + satellites. Not a single overloaded page.

---

## 3. Recommended evolution (navigation only — Phase 2A)

Reorganize sidebar **labels**, not routes:

```
Operations Platform
└── AI  ▼
    ├── Overview              /admin-portal/ai-pipeline
    ├── Diagnostics           /admin-portal/ai-pipeline/diagnostics
    ├── Test Lab              /admin-portal/ai-pipeline/test-lab
    ├── Pipeline Config       (group — expand or hub section)
    │   ├── Intents
    │   ├── Grounding
    │   ├── Context Sources
    │   └── Tool Policies
    ├── Quality & Compliance  (group)
    │   ├── Quality & Enforcement
    │   ├── Policy Audit
    │   └── Compliance & Export
    └── Providers             #provider-governance
```

**Alternative (minimal change):** Keep two sidebar items (AI Pipeline + Diagnostics) and improve hub section headers only — **acceptable if nav budget is tight**.

---

## 4. Recommended sections — mapped to existing architecture

Only recommend sections **existing architecture supports**:

| Proposed section | Supported today? | Implementation |
|------------------|------------------|----------------|
| **AI Overview** | ✅ | Current hub — health, activity, tool cards |
| **Knowledge** | 🔄 Partial | **Phase 2B:** read-only aggregate panel — NOT new store |
| **Pipeline** | ✅ | Intents, grounding, sources, tools |
| **Providers** | ✅ | ProviderGovernancePanel |
| **Diagnostics** | ✅ | Diagnostics page + trace detail |
| **Grounding** | ✅ | Grounding subpage |
| **Context Sources** | ✅ | Sources subpage + registry API |
| **Memory** | ❌ User data | Operator should NOT browse user memory by default — support workflow only |
| **Prompt Lab** | ✅ | Test Lab (dry-run) — rename label only |
| **Knowledge Explorer** | 🔄 Phase 2B | Support-only: lookup user taught knowledge via existing APIs + audit |
| **Explainability** | ✅ | Diagnostics trace — operator-facing |
| **Knowledge Health** | 🔄 Phase 2B | Aggregate: provider health + at-risk trends + grounding failures |
| **Knowledge Lineage** | ❌ | No lineage store — **defer**; diagnostics evidence is sufficient for ops |

### Do NOT add (no architecture support)

- Separate embedding admin UI
- Vector DB browser
- Prompt editor for production system prompts (code-owned — correct)
- Parallel memory system

---

## 5. Relationship to other Operations Platform areas

| Area | Relationship to AI knowledge |
|------|---------------------------|
| **Platform Programs** | Links AI Retrieval + Context Graph programs → pipeline subpages |
| **Modules** (`?tab=ai-context`) | Module registry certification — complements Context Sources |
| **Businesses** | Business AI context in support sidebar — not knowledge admin |
| **Support** | Customer context sidebar — link to diagnostics for ticket |
| **Analytics** | AI usage/cost — separate from knowledge governance |

---

## 6. Audience alignment

| Capability | Intended audience | Currently exposed to |
|------------|-------------------|----------------------|
| Pipeline hub + policies | Platform operator, AI engineer | ✅ Platform ADMIN |
| Diagnostics traces | Platform operator, support engineer | ✅ Platform ADMIN |
| Test Lab | AI engineer, operator | ✅ Platform ADMIN |
| Provider governance | Platform operator, founder | ✅ Platform ADMIN |
| Module AI context tab | AI engineer, module owner | ✅ Platform ADMIN |
| User memory/facts | End user | ✅ `/ai` — not operator |
| Business twin config | Business administrator | ✅ Business AI CC |
| Global learning patterns | Platform (consent) | ⚠️ Partially buried in user Insights |

**Misalignment:** None critical for operator surfaces. User teach surfaces are fragmented — see [AI_KNOWLEDGE_USER_EXPERIENCE.md](./AI_KNOWLEDGE_USER_EXPERIENCE.md).

---

## 7. Operator workflows

### Investigate bad AI answer (support)

| Step | Path | Clicks |
|------|------|-------:|
| Get user from ticket | Support context sidebar | 1 |
| Open diagnostics filtered by user | Diagnostics (future: `?userId=`) | 2–3 |
| Read trace evidence | Trace detail | 3–4 |
| If policy issue | Grounding / sources | 4–5 |
| If user teach issue | Direct user to `/ai?tab=memory` | N/A (user action) |

### Tune grounding for intent

| Step | Path |
|------|------|
| Hub → Intents | Find intent |
| Grounding rules | Add required source |
| Test Lab | Dry-run |
| Diagnostics | Verify next production traces |

---

## 8. Single page vs structured section — final recommendation

| Option | Assessment |
|--------|------------|
| **Remain single page** | ❌ Already outgrown — hub is overview only |
| **Replace AI Pipeline** | ❌ Violates program constraint |
| **Evolve into AI section** | ✅ **Recommended** — rename nav, keep routes |
| **Split every subpage further** | ❌ Diminishing returns — Observe/Configure/Govern is sufficient |

---

## 9. Operator model maturity

| Dimension | Score |
|-----------|------:|
| Pipeline observability | 85% |
| Policy configurability | 88% |
| Knowledge inspection (user tenant) | 25% |
| Nav clarity | 65% |
| **Overall operator AI maturity** | **~58%** |

Phase 2A nav formalization + Phase 2B Knowledge Health aggregate → target **~72%**.
