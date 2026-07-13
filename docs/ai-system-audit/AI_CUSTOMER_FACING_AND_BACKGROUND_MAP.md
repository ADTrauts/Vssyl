# AI Customer-Facing and Background Map

**Date:** 2026-07-12  

---

## Customer-facing surfaces

| Surface | Path | Audience | Thin over shared stack? |
|---------|------|----------|-------------------------|
| Full-page AI chat | `/ai-chat` → `AIChatWorkspace` | Personal | **Yes** — twin |
| Header AI dropdown | `AIChatDropdown` | Personal | **Yes** — twin |
| Dashboard AI widget | `AIWidget` → `AIChatModule` | Personal | **Yes** — twin |
| Business workspace AI hub | `AIWorkspaceLanding` | Business | **Yes** — twin embedded |
| AI Identity control center | `/ai` | Personal | Mixed — twin prefs + learning + memory APIs |
| Ambient suggestions | Identity + dropdown badges | Personal | Background correlation → UI |
| Employee AI assistant | `EmployeeAIAssistant` | Business member | Wrapper → twin |
| Workspace AI policy drawer | `WorkspaceAIDrawer` | Business | Policy read |
| Business AI control center | `/business/[id]/ai` | Biz admin | Business AI APIs |
| Notebook AI panel | `NotebookAIPanel` | Personal/biz | **No** — parallel OpenAI completion |
| Drive “Ask AI” | Drive → `/ai-chat?fileIds=` | Personal | Twin |
| Place discover | Place explore | Personal | **Not twin** — discover suggestions |
| VLink AI suggested filter | VLink module | Personal | VLink suggestions API |
| Workforce AI context panel | Workforce Comms | Business | Context endpoints only |
| Notifications AI approve | Notifications page | Personal | Twin approvals API |
| Billing AI query packs | Billing modal | Personal | `/api/ai/queries/*` |
| Intelligence dashboards | Identity More → insights | Personal | Separate intelligence APIs |
| Autonomous actions UI | Feature-flagged | Personal | **Retired backend** — inconsistent |

---

## Background infrastructure

| System | Role | Used by |
|--------|------|---------|
| DigitalLifeTwinService/Core | Orchestration | Twin surfaces, business interact, admin test-lab |
| Context orchestrator + registry | Module context | Twin |
| Pipeline catalog / grounding / enforcement | Policy | Twin |
| Conversation reasoning | Understanding | Twin |
| PreferenceResolver / memory | Influence | Twin + Identity |
| Provider routing + adapters | LLM | Twin (+ not Notebook) |
| Tools / action executors | Side effects | Twin |
| AdvancedLearningEngine | Signals | Twin post-turn |
| AIEventConsumer + suggestion rules | Ambient | Suggestions UI |
| Knowledge composition | Eligible knowledge | Grounding / assembly |
| AI retrieval pilot | Search discovery | Pipeline when flagged |
| Query balance / usage | Cost gate | Twin, Notebook, media |
| Pipeline diagnostics | Ops | Admin hub |
| File analysis / vision / GCS | Attachments | Twin |
| Domain event subscribers | Suggestion triggers | Background |

---

## Surface → stack matrix

| Customer surface | API entry | Orchestration | Context sources | Model route | Governance | Output |
|------------------|-----------|---------------|-----------------|-------------|------------|--------|
| AIChatWorkspace | `POST /api/ai/twin` | Service→Core | Orchestrator + memory + files | providerRouting | JWT, balance, enforcement, tools AuthZ | Chat + influence + fileIssues |
| AIChatDropdown | same | same | same | same | same | Compact chat |
| EmployeeAIAssistant | `POST /api/business-ai/:id/interact` | Business wrapper→twin | + business policy | same | membership + policy | Chat |
| NotebookAIPanel | `/api/notebook/.../ai/*` | `notebookAICompletion` | Page text only | Hardcoded OpenAI / env model | JWT + query balance | Summary / actions draft |
| Ambient suggestions | `/api/ai/suggestions*` | Ranking services | Event signals | N/A (rules) | Accept/dismiss only | Cards |
| Identity learning | `/api/ai/learning/*` | Review services | Pending events | N/A | User review | Promote/dismiss |
| Intelligence dashboards | `/api/ai/intelligence/*` | Engines | Patterns / context engine | May call LLM internally | JWT | Charts/lists |
| Admin diagnostics | admin-portal ai-pipeline | Twin dry-run / catalog | Full | Twin routing | Admin role | Traces |
| Place discover | `/api/place/discover/*` | Place services | Place graph | Not twin routing | Place AuthZ | Discover cards |
| AutonomousActions UI | `/api/ai/autonomous/*` | Retired | — | — | 410 | Error/retired |

---

## Consistency verdicts

| Surface | Verdict |
|---------|---------|
| Chat page / dropdown / widget / business hub | **Thin interfaces** over shared twin — consistent |
| Employee AI | Thin wrapper — consistent with twin + policy |
| Notebook AI | **Independent mini-stack** — bypasses grounding, conversation reasoning, multi-provider |
| Place / VLink discover | Domain suggestion systems — **not** twin; OK if labeled |
| Intelligence hub | Parallel analytics-adjacent — risk of looking like “another AI” |
| AutonomousActions | **Inconsistently wired** — UI can exist while backend retired |
| ApprovalManager.tsx | **Disconnected** from mount graph |
| SchedulingAIAssistant / Todo AI components | **Disconnected** (logic may still be callable from dropdown helpers) |
| Deprecated `POST /api/ai/chat` | No frontend caller found — backend shim only |

---

## Flags (bypass / duplicate)

| Flag | Evidence | Severity |
|------|----------|----------|
| Notebook bypasses twin governance layers | `notebookAICompletion.ts` direct OpenAI | Medium — still has query balance |
| Document extraction hardcodes `gpt-4o` | `documentExtractionService.ts` | Medium |
| Fact extraction hardcodes `gpt-4o` | `factExtractionService.ts` | Medium |
| Intelligence engines separate from Core | `ai-intelligence.ts` | Low–Medium product confusion |
| Autonomy evaluate not on twin | AutonomyManager comment A7 | Intentional — document as such |
| Centralized-ai fenced | 410 middleware | OK |

---

## Recommendation (no code this audit)

Keep twin as the **only** full conversational brain. Treat Notebook/media/extraction as **SPECIALIZED adapters** that must eventually share model catalog + logging schema, or be explicitly certified as exempt mini-paths.
