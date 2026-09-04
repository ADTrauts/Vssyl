# Active Context

**Last verified:** 2026-09-03  
**Role:** Current workstream context only  
**Authority:** Status/navigation aid; code and canonical docs remain authoritative.

Completed wave/phase diaries were archived to [`docs/archive/session-summaries/active-context-archive-2026-09-pretrim.md`](../docs/archive/session-summaries/active-context-archive-2026-09-pretrim.md).

---

## Active Workstreams

### 1. Memory Bank / agent authority reconciliation

- **State:** ACTIVE (Batch 1B-1 in progress after Batch 0 / 0.5 / 1A)
- **Objective:** Keep Memory Bank as selective product/status context; remove diary noise from agent paths
- **Evidence:** Root `AGENTS.md`; `docs/VSSYL_SOURCE_OF_TRUTH.md`; Batch 1A archives under `docs/archive/`
- **Next:** After this batch — core compaction (`projectbrief` / `productContext` / `systemPatterns` / `techContext`) when approved

### 2. Go-to-Market commercial readiness (P0 gaps)

- **State:** ACTIVE (discovery complete; commercial readiness PARTIAL)
- **Objective:** Close customer-facing P0 gaps so a real customer path works without white-glove engineering
- **Evidence:** [`docs/go-to-market/GO_TO_MARKET_PHASE_0A_EXECUTIVE_SUMMARY.md`](../docs/go-to-market/GO_TO_MARKET_PHASE_0A_EXECUTIVE_SUMMARY.md) (~45% L1–L2; invite accept 404, billing deep links, support/trust stubs)
- **Next:** Prioritize P0 commercial fixes listed in that summary (product/eng sequencing decision)

### 3. Legacy cleanup / Policy Engine migration

- **State:** ACTIVE / MIGRATING
- **Objective:** Retire parallel auth and lifecycle debt without expanding legacy paths
- **Evidence:** [`docs/architecture/LEGACY_CLEANUP.md`](../docs/architecture/LEGACY_CLEANUP.md); [`docs/architecture/POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md) (v1 + dual enforcement; follow-ups open)
- **Next:** Execute planned cleanup batches (org-chart RBAC → PE adapter; Notes `deletedAt` → `trashedAt`; remaining polish items)

### 4. Business Operations Stage 1 shared-alignment engineering

- **State:** ACTIVE (plans ready; implementation not authorized by blueprint alone)
- **Objective:** Start Stage 1 engineering when product/eng signs off and CO-04 trash strategy is confirmed at kickoff
- **Evidence:** [`docs/business-operations/STAGE_1_EXECUTION_READINESS_REPORT.md`](../docs/business-operations/STAGE_1_EXECUTION_READINESS_REPORT.md)
- **Next:** Explicit implementation go-ahead + CO-04 decision at kickoff

### 5. AI platform follow-through (governed Twin)

- **State:** PARTIAL (L2 certified; later phases shipped in repo; L3 deferred; shadow routing)
- **Objective:** Keep Twin/runtime governed; decide optional Phase 7B live cutover; do not treat historical MB AI plans as SoT
- **Evidence:** [`CERTIFICATION_LEDGER.md`](../docs/architecture/CERTIFICATION_LEDGER.md) AI Platform L2; [`AI_DOCUMENT_STATUS_MATRIX.md`](../docs/architecture/AI_DOCUMENT_STATUS_MATRIX.md); Phase 6–8 closeouts; commits for shadow routing + Skills
- **Next:** Confirm product intent for 7B cutover vs stay-shadow; AI L3 remains deferred per ledger

### 6. Notes constitutional modernization

- **State:** DEFERRED / PARTIAL (Notes sub-domain L2; Notebook L3 depends on Notes storage)
- **Evidence:** [`CERTIFICATION_LEDGER.md`](../docs/architecture/CERTIFICATION_LEDGER.md) Notes row; `LEGACY_CLEANUP.md` Notes `deletedAt`
- **Next:** Schedule Notes modernization wave when product prioritizes (after or alongside PE/lifecycle cleanup)

### 7. Platform debt (bounded)

- **State:** PARTIAL
- **Items:** Platform Job Scheduler L1; manifest/capability reconcile L1; structured logging residual (~37 non-test server files still use `console.*`)
- **Evidence:** Certification ledger platform rows; logging residual verified 2026-09-03 via repo search
- **Next:** Continue iterative logging migration; scheduler/manifest when a feature requires them

---

## Open Decisions

| Decision | Why it matters | Notes |
|----------|----------------|-------|
| Product priority: GTM P0 vs BO Stage 1 vs PE/Notes cleanup | Sequencing of near-term eng capacity | Architecture largely certified; commercial readiness is the clearest customer gap |
| AI Phase 7B live cutover vs remain shadow | Changes production model selection behavior | Shadow mode is current; live cutover is optional per Phase 7 closeout |
| BO Stage 1 CO-04 (`ARCHIVED` vs `trashedAt`) | Required at implementation kickoff | Readiness report: not a planning blocker |
| Whether to refresh `docs/plans/PROJECT_NEXT_PHASE_OPEN_WORK.md` | Apr 2026 plan is stale vs Search/cert ledger | Prefer ledger + domain plans until refreshed |

---

## Current Blockers / Risks

- **Commercial path broken for unassisted customers** — invite accept / billing deep links / support stubs (GTM P0).
- **Partial authorization migration** — dual PE + legacy; org-chart parallel RBAC still planned cleanup (do not expand).
- **Stale open-work plan risk** — do not treat April `PROJECT_NEXT_PHASE_OPEN_WORK.md` as authoritative backlog without verification.
- **Sensitive ops doc** — `memory-bank/googleCloudMigration.md` flagged for separate security remediation (do not open/move in Memory Bank batches until scrubbed).

---

## Immediate Next Steps

1. Finish Batch 1B-1 (this rewrite) and verify no diary language remains in these two files.
2. Human choose near-term product bet (GTM P0 vs BO Stage 1 vs PE/Notes).
3. Continue Batch 1B core compaction only when approved (`projectbrief` / `productContext` / `systemPatterns` / `techContext`).
4. Keep AI discovery on Mental Model → Reading Guide → Status Matrix.

---

## Current Status References

- [`docs/architecture/CERTIFICATION_LEDGER.md`](../docs/architecture/CERTIFICATION_LEDGER.md)
- [`docs/architecture/VSSYL_ARCHITECTURE_INDEX.md`](../docs/architecture/VSSYL_ARCHITECTURE_INDEX.md)
- [`docs/architecture/LEGACY_CLEANUP.md`](../docs/architecture/LEGACY_CLEANUP.md)
- [`docs/architecture/POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md)
- [`docs/architecture/AI_SYSTEM_MENTAL_MODEL.md`](../docs/architecture/AI_SYSTEM_MENTAL_MODEL.md) · [`AI_READING_GUIDE.md`](../docs/architecture/AI_READING_GUIDE.md) · [`AI_DOCUMENT_STATUS_MATRIX.md`](../docs/architecture/AI_DOCUMENT_STATUS_MATRIX.md)
- [`docs/go-to-market/`](../docs/go-to-market/)
- [`docs/business-operations/STAGE_1_EXECUTION_READINESS_REPORT.md`](../docs/business-operations/STAGE_1_EXECUTION_READINESS_REPORT.md)
- Compact ledger: [`progress.md`](./progress.md)
- Historical diaries: [`active-context-archive-2026-09-pretrim.md`](../docs/archive/session-summaries/active-context-archive-2026-09-pretrim.md)
