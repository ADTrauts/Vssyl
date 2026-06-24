# AI Retrieval Compliance Requirements

**Program:** AI Retrieval Adapter — Phase 2A  
**Version:** 1.0.0  
**Date:** 2026-06-23  
**Status:** Binding compliance standard for AI retrieval consumers  
**Authority:** [AI_RETRIEVAL_CONSTITUTION.md](./AI_RETRIEVAL_CONSTITUTION.md), [AI_RETRIEVAL_PLATFORM_STANDARD.md](./AI_RETRIEVAL_PLATFORM_STANDARD.md), [AI_RETRIEVAL_CONSUMER_STANDARD.md](./AI_RETRIEVAL_CONSUMER_STANDARD.md)

---

## 1. Compliance classes

| Class | Definition |
|-------|------------|
| **Retrieval Compliant** | Consumer meets all requirements; may be wired to adapter |
| **Retrieval Exempt** | Tier C path — memory, prefs, summaries, realtime; documented exemption |
| **Retrieval Planned** | Listed in Readiness Matrix; not yet wired |
| **Retrieval Non-Compliant** | Query-discovery without adapter when Tier A/B mandates wiring |

---

## 2. Requirements for retrieval consumers

A wired AI consumer **must** satisfy **all** items:

| # | Requirement | Verification |
|---|-------------|--------------|
| **RC-01** | Call `discover()` or `runPipelineRetrievalDiscovery` — no shadow search | Code review |
| **RC-02** | Pass `userId` and tenant scope (`dashboardId`, `businessId`, `householdId`) | Unit test |
| **RC-03** | Set `intent` matching consumer contract | Code review |
| **RC-04** | Respect per-intent and global feature flags | Unit test |
| **RC-05** | Attach evidence + diagnostics to context patch | Integration test |
| **RC-06** | Produce `AIRetrievalEvidence` conforming to mapper output | Type check |
| **RC-07** | Handle deny/error without throwing to user path | Unit test |
| **RC-08** | Do not replace existing context providers on wire | Architecture review |
| **RC-09** | Add consumer to `RETRIEVAL_ADAPTER_CONSUMER_INTENTS` with priority | Contract file |
| **RC-10** | Document in Readiness Matrix | Doc update |
| **RC-11** | Pass retrieval test suite in CI | CI green |

---

## 3. Consumer checklist (copy per consumer PR)

```markdown
### Retrieval compliance — [intentId]

- [ ] RC-01 Uses adapter (no shadow search)
- [ ] RC-02 Tenant scope passed
- [ ] RC-03 Intent declared
- [ ] RC-04 Feature flags honored
- [ ] RC-05 Context patch attached
- [ ] RC-06 Evidence shape validated
- [ ] RC-07 Deny/error graceful
- [ ] RC-08 Additive only (providers preserved)
- [ ] RC-09 Consumer contract updated
- [ ] RC-10 Readiness Matrix updated
- [ ] RC-11 Tests added
```

---

## 4. Per-consumer requirements (Phase 2A)

### 4.1 `planning` — Retrieval Compliant ✅

| Requirement | Status |
|-------------|:------:|
| RC-01 through RC-11 | ✅ Wired Phase 1A; standardized 1B |

### 4.2 `workflow_action` — Retrieval Compliant ✅

| Requirement | Status |
|-------------|:------:|
| RC-01 through RC-11 | ✅ Wired Phase 1B |

### 4.3 `business_operations` — Retrieval Compliant ✅

| Requirement | Status |
|-------------|:------:|
| RC-01 through RC-11 | ✅ Wired Phase 2B-1 |

### 4.4 `scheduling` — Retrieval Planned

| Requirement | Status |
|-------------|:------:|
| RC-01 through RC-11 | ❌ Tier B — time-window vs query routing |

### 4.5 `local_discovery` — Retrieval Compliant ✅

| Requirement | Status |
|-------------|:------:|
| RC-01 through RC-11 | ✅ Wired Phase 2B-3 (opt-in: `AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED=true`) |

### 4.6 `project_assistant` — Retrieval Compliant ✅

| Requirement | Status |
|-------------|:------:|
| RC-01 through RC-11 | ✅ Wired Phase 2B-2 (opt-in: `AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED=true`) |

---

## 5. Exempt paths (Tier C — no adapter required)

| Path | Exemption rationale | Documentation |
|------|---------------------|---------------|
| `MemoryRetrievalService` | User memory — not platform entities | Readiness Matrix Tier C |
| `PreferenceResolver` | Behavioral tuning | Constitution P-R5 |
| Context provider summaries | Curated rollups | Option B Hybrid |
| V_Link pipeline signals | Relationship grounding | AI_RELATIONSHIP_RETRIEVAL_MODEL |
| Graph bundle pipeline | Context Graph domain | AR-A2 |
| Web search tool | External knowledge | Out of platform scope |
| Activity feed reads | Audit stream | Constitution P-R6 |

Exemptions **must** be documented in Readiness Matrix — not assumed.

---

## 6. Marketplace module requirements (deferred AR-M5)

When marketplace AI modules perform query-discovery:

| # | Requirement |
|---|-------------|
| **RC-M1** | Cannot call visibility services directly for discovery |
| **RC-M2** | Must use platform adapter contract (future iframe bridge or server-side proxy) |
| **RC-M3** | Must produce evidence + diagnostics equivalent |
| **RC-M4** | Must pass marketplace certification gate |

Enforcement gate not implemented — documented for Phase 3.

---

## 7. Testing requirements

| Test type | Minimum |
|-----------|---------|
| Consumer wiring | Intent triggers `discover()` with correct scope |
| Feature flag | Disabled flag skips adapter |
| Permission deny | Empty evidence + `denied` status |
| Tenant isolation | `businessId` / `householdId` in filters |
| Evidence mapping | Field conformance |
| Diagnostics | Pathway + counts populated |
| Failure handling | Adapter error does not break pipeline |

---

## 8. Non-compliance remediation

| Severity | Example | Action |
|----------|---------|--------|
| **Major** | New query-discovery in twin without adapter | Block PR; wire adapter |
| **Major** | Fabricated evidence | Block PR; security review |
| **Advisory** | Missing Readiness Matrix update | Fix before merge |
| **Exempt** | Memory path without adapter | Document Tier C exemption |

---

**Last updated:** 2026-06-23
