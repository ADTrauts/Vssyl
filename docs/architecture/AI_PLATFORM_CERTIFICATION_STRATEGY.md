# AI Platform Certification Strategy

**Version:** 1.0.0  
**Status:** Active  
**Last updated:** 2026-06-04  
**Parent:** [AI_PLATFORM_CONSTITUTION.md](./AI_PLATFORM_CONSTITUTION.md)  
**Ledger row:** [CERTIFICATION_LEDGER.md](./CERTIFICATION_LEDGER.md) — Platform systems → AI Platform

---

## 1. Objective

Define **platform-level** certification for the AI layer independently of module Level 3 (Chat, Calendar, Todo, etc.). A module can be Level 3 while AI Platform remains Level 0–1 until platform executors and routes are compliant.

**Not a product module:** AI Platform will never use `moduleId: ai` in the module certification matrix. Use this strategy and [AI_PLATFORM_OPERATION_MATRIX.md](./AI_PLATFORM_OPERATION_MATRIX.md) instead.

---

## 2. Certification levels

| Level | Name | Summary |
|-------|------|---------|
| **0** | Legacy | Constitutional violations on live paths (mock controllers, Prisma in platform tools, route collisions) |
| **1** | Stabilizing | Twin pipeline canonical; known P/N rows documented; no new violations |
| **2** | Platform Compliant | Zero blocking N rows; tools/actions on services; routes fenced |
| **3** | Certified Platform | Full operation matrix C/P acceptable; tests + admin truth aligned |
| **4** | Reference Architecture | Approved model for marketplace AI + module AI integration docs |

**Current (G0):** **Level 0 — audited** (Wave 0 complete; constitution G0 complete).

**Promotion policy:**

- Increase one level at a time unless Architecture council approves skip.  
- Level **4** requires Platform Standards appendix / council vote (analogous to File Hub Level 4).  
- Module certification must not claim “AI compliant platform” until AI Platform ≥ **Level 2**.

---

## 3. Level 0 — Legacy

### Entry criteria

- Default for pre-G0 AI Platform or after regression introducing blocking violations.

### Characteristics

- `ActionExecutor` mock req/res for any built-in write path.  
- Direct Prisma in `toolExecutor` or platform actions for domain data.  
- Route shadowing on `/api/ai/context`.  
- `AutonomousActionExecutor` on production write path without approval parity.  
- Twin path diverges from [AI_PLATFORM_OVERVIEW.md](./AI_PLATFORM_OVERVIEW.md) without approved doc.

### Exit criteria (promote to Level 1)

| # | Requirement |
|---|-------------|
| 1 | [AI_PLATFORM_CONSTITUTION.md](./AI_PLATFORM_CONSTITUTION.md) and boundary model published (G0) |
| 2 | [AI_PLATFORM_OPERATION_MATRIX.md](./AI_PLATFORM_OPERATION_MATRIX.md) baseline with all domains inventoried |
| 3 | Wave 0 audits linked in ledger |
| 4 | Remediation waves 1A–1E **planned** with owners |
| 5 | No **new** V1/V2/V8 violations merged after G0 sign-off |

---

## 4. Level 1 — Stabilizing

### Entry criteria

- G0 complete + explicit ACT for Wave 1A (plan) or 1B (execution).

### Characteristics

- `DigitalLifeTwinCore` path stable and documented.  
- L3 modules (chat, calendar, todo, notebook, place) unchanged and passing module matrices.  
- P/N rows tracked in operation matrix; no silent stub writes added.  
- `centralized-ai` fenced from user twin UI (documented).

### Exit criteria (promote to Level 2)

| # | Requirement |
|---|-------------|
| 1 | **Wave 1A complete** — route retirement plan executed or mounted fixes shipped |
| 2 | **Wave 1B complete** — zero mock req/res in `ActionExecutor`; `share_file` without direct Prisma |
| 3 | **Wave 1C complete** — Drive (and agreed HR/scheduling/dashboard) context via visibility services |
| 4 | Operation matrix: **zero N** on blocking rows (see matrix § Blocking) |
| 5 | Deprecated `/api/ai/autonomous` sunset or hard-disabled with migration note |
| 6 | `pnpm type-check` + AI executor/tool tests green |

### Blocking violations (must be zero for Level 2)

From [AI_PLATFORM_CONSTITUTION.md](./AI_PLATFORM_CONSTITUTION.md):

- **V1** — Direct Prisma domain writes in `server/src/ai/**`  
- **V2** — Mock controller invocation for writes  
- **V5** — Unapproved V_Link grounding (regression guard)  
- **V8** — Admin diagnostics exposed without `requireAdmin`  

Plus matrix **N** on: context route collision, drive actions, drive context provider.

---

## 5. Level 2 — Platform Compliant

### Entry criteria

- All Level 1 exit criteria met.  
- Formal review package: updated matrix, tool/action matrix, diff summary.

### Characteristics

- Single canonical twin path for user conversational AI.  
- All shipped tools use module services.  
- Built-in modules with AI writes use `*AIActionService` (including drive).  
- Admin pipeline APIs admin-gated; analytics module not a default context source.  
- Ledger row: **Level 2**.

### Exit criteria (promote to Level 3)

| # | Requirement |
|---|-------------|
| 1 | **Wave 1D** — Admin UI fields match `pipelineTrace` / `conversationReasoning` schema |
| 2 | **Wave 1E** — Provider capability matrix documented; fallback policy tested |
| 3 | Operation matrix: ≥ **90%** rows **C**; remaining **P** documented with sunset |
| 4 | No **stub** action executors returning fake success for production modules |
| 5 | Integration tests: twin + tool round + trace persistence smoke |
| 6 | [AI_LEGACY_DUPLICATION_REGISTER.md](./audits/AI_LEGACY_DUPLICATION_REGISTER.md) — all P0/P1 items **Keep/Consolidate/Deprecate** resolved |
| 7 | Architecture review sign-off (AI Platform Certification Review doc — create at 2→3 gate) |

---

## 6. Level 3 — Certified Platform

### Entry criteria

- Level 2 + review doc `AI_PLATFORM_LEVEL3_CERTIFICATION_REVIEW.md` (to be created at gate).

### Characteristics

- Operation matrix certified snapshot (versioned).  
- Partner `ActionExecutorRegistry` path documented for third-party modules.  
- Ambient + twin + admin observability boundaries tested.  
- Memory Bank + roadmap state “AI Platform L3”.

### Exit criteria (promote to Level 4)

| # | Requirement |
|---|-------------|
| 1 | Council approval for Reference Architecture designation |
| 2 | Published partner guide cross-linking this strategy |
| 3 | ≥ 12 months Level 3 with no P0 AI platform incidents |
| 4 | Textbook + overview + constitution kept in sync (doc drift check quarterly) |

---

## 7. Level 4 — Reference Architecture

### Entry criteria

- Council vote; comparable to File Hub Level 4 for **platform** (not module).

### Characteristics

- Third-party modules certify against AI Platform patterns using File Hub + Chat references.  
- `docs/guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md` cites AI Platform constitution.  
- Operation matrix exported as certification template for partners.

### Responsibilities

- Breaking changes to twin contract require migration guide + version bump in constitution.  
- Platform team owns regression suite for orchestrator + grounding + tools.

---

## 8. Review requirements

| Transition | Review type | Approvers |
|------------|-------------|-----------|
| 0 → 1 | Self — G0 docs complete | Platform engineering |
| 1 → 2 | PR gate + matrix diff | Tech lead + one module owner |
| 2 → 3 | Formal certification review doc | Architecture governance |
| 3 → 4 | Council | Platform standards appendix |

**Artifacts per review:**

- [AI_PLATFORM_OPERATION_MATRIX.md](./AI_PLATFORM_OPERATION_MATRIX.md) (updated counts)  
- [AI_TOOL_ACTION_COMPLIANCE_MATRIX.md](./audits/AI_TOOL_ACTION_COMPLIANCE_MATRIX.md)  
- [AI_CONTEXT_PROVIDER_MATRIX.md](./audits/AI_CONTEXT_PROVIDER_MATRIX.md)  
- Test run output (`pnpm type-check`, AI-related vitest subset)  
- No open **P0** items in [AI_LEGACY_DUPLICATION_REGISTER.md](./audits/AI_LEGACY_DUPLICATION_REGISTER.md)

---

## 9. Relationship to module certification

| Module state | AI Platform minimum for “safe to ship AI feature” |
|--------------|---------------------------------------------------|
| Module L3 + Platform L0 | Module features OK; platform debt acknowledged in release notes |
| Module L3 + Platform L2 | **Recommended** production bar |
| Module L2 + Platform L2 | Allowed with documented module gaps |
| New module AI | Must not add mock executor paths; must use service pattern from day one |

**Do not** re-certify Chat/Calendar/Todo/Notebook/Place for platform waves — only extend platform matrices.

---

## 10. Implementation wave map

| Wave | Certification impact |
|------|----------------------|
| 0 | Audit → Level 0 labeled |
| G0 | Constitution → enables 0→1 |
| 1A | Route plan → required for 1→2 |
| 1B | Tools/actions → required for 1→2 |
| 1C | Context → required for 1→2 |
| 1D | Admin truth → required for 2→3 |
| 1E | Provider matrix → required for 2→3 |
| 2 | Level 2 readiness review |

---

## 11. Sign-off (G0)

| Item | Status |
|------|--------|
| Levels 0–4 defined | ✅ |
| Entry/exit criteria | ✅ |
| Blocking violations listed | ✅ |
| Review requirements | ✅ |
| Ledger integration | ✅ (pending update in same PR batch) |

---

*Governance Wave G0 — 2026-06-04.*
