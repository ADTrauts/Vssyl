# AI Phase 8 Closeout — Skills Framework

**Program:** AI Architecture Phase 8  
**Date:** 2026-07-13  
**Status:** Active (awaiting review)  
**Certification posture:** Code-first Skills shipped — three pilots ACTIVE; legacy routes unchanged

---

## Delivered

- **Contract:** `shared/src/types/ai-skills.ts` (`AISkillDefinition`, execution DTOs, policy version `phase8-2026-07-13`)
- **Runtime:** `server/src/ai/skills/**` — registry, selection, planner, runner, metrics, observation, lifecycle, implementations, instruction assets
- **Pilots:** `notebook_page_summary`, `notebook_action_extraction`, `structured_document_extraction` (all v1.0.0 ACTIVE)
- **Customer API:** `/api/ai/skills` (list, read, execute, versions, quality)
- **Operator API:** `/api/admin/ai/operations/skills/overview`, `/skills/:key`
- **Pipeline UI:** `/admin-portal/ai-pipeline/skills` (observe-only)
- **Observation:** Skill event types on `surface: SKILL` via `emitSkillObservation`
- **Execution records:** `createAIExecutionRecord` with `surface: 'SKILL'`
- **Shadow routing:** Phase 7 `shadowRouteForSpecializedPath` on Skill completion (non-blocking)
- **Tests:** `skillsPhase8.test.ts` (lifecycle, registry, selection, planner, runner, validation)
- **Docs:** candidate audit, architecture, contract, lifecycle, registry, execution model, certification, security, pilot catalog, certification matrix

---

## Architectural decisions (locked)

| Decision | Choice |
|----------|--------|
| Registry | Code-first; in-process maps |
| Executable storage | TypeScript implementations — **no** Prisma skill tables |
| Execution path | Dedicated Skill runner — **not** second Twin |
| Selection | Explicit `skillKey` authoritative; intent selection conservative |
| Capability vs provider | Skills declare `capabilityRequest`; providers remain adapter/env |
| Model Router | Shadow-only (Phase 7); `productionRoutingUnchanged: true` |
| Legacy routes | Dual-path; **no** auto-migration |
| Customer-created Skills | Disabled |
| AI Studio | Not implemented |
| Industry Packs | `INDUSTRY_FUTURE` scope inactive |

---

## Explicitly not done (by design)

- Cutting production provider selection to Model Router decisions  
- Customer Skill authoring / marketplace Skills  
- DB-backed Skill version management UI  
- Intent-only public execute API (no `:key` in path)  
- Tool mutation rounds in pilots  
- Notebook meeting recap / suggest-links as Skills  
- Todo prioritization Skill promotion  
- Drive "Ask AI" as bounded Skill  
- Auto-redirecting module routes to Skill API  

---

## Validation

| Check | Status |
|-------|--------|
| Skill framework unit tests (`skillsPhase8.test.ts`) | PASS (18) |
| Model Router Phase 7 tests | PASS |
| Admin ops + skills overview | PASS |
| Twin Phase 1B E2E | PASS |
| Observation / governance / notebook service tests | PASS |
| Shared build | PASS |
| Server `tsc --noEmit` | PASS |
| Web `tsc --noEmit` | PASS |
| ESLint on modified Skill/server/web files | PASS |
| Prisma migrate for Skills | N/A (no schema change) |
| Real provider network in unit tests | Not used |

---

## Remaining limitations

1. Skill metrics are in-process ring buffers (process-local).
2. Model Router on Skills is shadow-only; production provider selection unchanged.
3. Context/knowledge for pilots comes from existing Notebook/document adapters, not a new generic orchestrator path in the Skill runner.
4. Module UIs still call legacy endpoints; Skill API is parallel (dual-path).
5. No operator lifecycle mutation API (status changes via code deploy).
6. Tool mutation rounds reserved; all pilots mutations-off.
7. Customer-created Skills / Industry Packs / AI Studio not enabled.

---

## Recommended next phase

**Phase 9 candidates (pick one):**

1. **Skill productization** — wire Notebook/Drive UI to Skill API; retire dual-path for pilots.
2. **Model Router controlled cutover** — live routing behind flag after shadow agreement gates.
3. **Skill evaluation fixtures** — regression packs per Skill version into Pipeline workflows.
4. **Durable Skill quality metrics** — derive from `AIExecutionRecord` / observation, not ring buffer.

---

## Commit status

**No commit. No push.** Awaiting review.

---

## Additional delivery notes

| Item | Value |
|------|-------|
| `skillsPhase8.test.ts` | Passes (lifecycle, registry, selection, execution, validation) |
| Startup registration | `registerBuiltInSkills()` in `server/src/index.ts` |
| Customer API auth | JWT required |
| Operator API RBAC | `operations:read` |
| Pilot count | 3 ACTIVE |

---

## Operator feature flags (API response)

| Flag | Phase 8 value |
|------|---------------|
| `productionRoutingUnchanged` | `true` |
| `customerCreatedSkillsEnabled` | `false` |
| `industryPacksEnabled` | `false` |

---

## Next candidates (manual promotion only)

Per [`AI_SKILL_CANDIDATE_AUDIT.md`](./AI_SKILL_CANDIDATE_AUDIT.md):

1. `notebook` meeting recap — distinct Skill contract  
2. Todo prioritization — analyze/suggest Skills before execute path  
3. Additional document types in structured extraction  
4. Intent-based internal selection hardening (still no silent multi-match)  
5. Optional: consumer migration guides per module (explicit opt-in, not auto)

---

## Reading order (Phase 8)

1. [`AI_SKILLS_ARCHITECTURE.md`](./AI_SKILLS_ARCHITECTURE.md)  
2. [`AI_SKILL_CONTRACT.md`](./AI_SKILL_CONTRACT.md)  
3. [`AI_SKILL_EXECUTION_MODEL.md`](./AI_SKILL_EXECUTION_MODEL.md)  
4. [`AI_SKILL_PILOT_CATALOG.md`](./AI_SKILL_PILOT_CATALOG.md)  
5. [`AI_PHASE8_SKILLS_CERTIFICATION_MATRIX.md`](./AI_PHASE8_SKILLS_CERTIFICATION_MATRIX.md)  

---

## Related phases

- **Phase 7:** Model Router shadow — [`AI_PHASE7_CLOSEOUT.md`](./AI_PHASE7_CLOSEOUT.md)  
- **Phase 5:** Observation layer — Skill events extend `AIObservationEventType`  
- **Phase 3:** Execution records — Skill surface added  
