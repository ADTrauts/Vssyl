# Marketplace & Module Ecosystem — Phase 1A Executive Summary

**Program:** Marketplace & Module Ecosystem  
**Phase:** 1A — Partner Capability Participation Architecture  
**Date:** 2026-06-23  
**Status:** Architecture assessment complete — **no implementation authorized**

**Prior phase:** [MARKETPLACE_PHASE_0A_EXECUTIVE_SUMMARY.md](./MARKETPLACE_PHASE_0A_EXECUTIVE_SUMMARY.md)

---

## 1. Bottom line

Partner modules **run in production today** but participate in Vssyl's **intelligence ecosystem** only through **AI context providers and webhook executors**. Unified Search, AI Retrieval discovery, Context Graph federation, V_Link, Activity timelines, and native workspace embedding remain **first-party only**.

**The critical path to first-class citizenship is not a marketplace rebuild** — it is **HTTP capability delegate contracts** loaded from published manifests, starting with **Search M-02**.

**Formal recommendation:** **Hybrid capability registration (Option D)** — static registries for built-ins; manifest + certified delegates for partners.

---

## 2. Capability readiness scorecard

| Capability | Level | Score | Partner today |
|------------|-------|-------|---------------|
| **Search** | 2 — Architecturally Ready | 2/4 | ❌ |
| **AI Retrieval (discovery)** | 2 — Architecturally Ready | 2/4 | ❌ (blocked by search) |
| **AI Retrieval (context)** | 3 — Partner Ready | 3/4 | ✅ |
| **Context Graph (federation)** | 1 — First Party Only | 1/4 | ❌ |
| **Context Graph (inference)** | 2 — Architecturally Ready | 2/4 | ❌ (blocked by search) |
| **V_Link** | 1 — First Party Only | 1/4 | ❌ |
| **Activity (publish)** | 2 — Architecturally Ready | 2/4 | ❌ |
| **Activity (consume)** | 2 — Architecturally Ready | 2/4 | 🟡 webhooks only |
| **Notifications** | 2 — Architecturally Ready | 2/4 | 🟡 metadata only |
| **Workspace** | 2 — Pilot Ready | 2/4 | 🟡 Business embed (Phase 1B-C); personal still `/modules/run` |
| **Billing (personal)** | 3 — Partner Ready | 3/4 | ✅ |
| **Billing (business)** | 1 — First Party Only | 1/4 | ❌ write path missing |
| **Realtime** | 1 — First Party Only | 1/4 | ❌ |

**Composite ecosystem participation readiness: 1.9 / 4**

---

## 3. Participation model recommendation

### Hybrid (Option D)

| Tier | Registration | Execution |
|------|--------------|-----------|
| **First-party** | Code registry + manifest reconcile | In-process services |
| **Certified Partner** | Published manifest declares capabilities | HTTPS delegates |
| **Integrated Partner** | Manifest + co-review | Delegates + optional shims |

**Manifest** declares intent (`capabilities.search`, `searchDelegate`, entities).  
**Certification** validates delegate endpoints exist and pass Test Lab probes.  
**Runtime** materializes dynamic registries at `ModuleRegistrySyncService.syncModule`.

**Do not:** Rebuild marketplace, search orchestrator, or Context Graph. **Extend** merge logic in existing orchestrators.

---

## 4. Security blockers & controls

| Risk | Severity | Phase 1A mitigation design |
|------|----------|----------------------------|
| Malicious search result injection | High | Platform JWT + APPROVED-only registry + result normalization |
| Cross-tenant delegate leakage | Critical | Scoped JWT claims; partner attestation + QA sampling |
| Graph bundle pollution | Medium | Inference provenance; confidence floor; read-only |
| Invalid V_Links | High | Defer partner create until proxy delegate (Phase 2) |
| Fake activity events | High | HMAC ingest + schema validation (Phase 1C) |
| Permission bypass | High | PE before delegates; partner entity auth external |
| Business billing bypass | ~~Medium~~ | ✅ Fixed Phase 1B-D (`businessModuleSubscriptionService`) |

**Adequate for curated Partner program after delegates ship. Insufficient for open ecosystem without automated runtime audit.**

---

## 5. Certification requirements (rollup)

### Cross-cutting (all capabilities)

CP-01 through CP-10 in [PARTNER_CAPABILITY_PARTICIPATION_ASSESSMENT.md](./PARTNER_CAPABILITY_PARTICIPATION_ASSESSMENT.md).

### By capability (implementation phase)

| Capability | Key cert IDs | Gate |
|------------|--------------|------|
| Search | PS-01–PS-10, M-01–M-05 | Block `capabilities.search` without delegate |
| Retrieval | RC-M1–M-4 + search cert | After M-02 |
| Context Graph | CG-P01–P-08 | Phase 2 federation; inference after M-02 |
| V_Link | VL-P01–P-06 | Phase 2+ proxy |
| Workspace | WS-P01–P-06 | Embed in Test Lab |
| Activity | AP-01–AP-06 | Phase 1C ingest API |
| Billing | BL-P01–P-05 | Phase 1B business sub writes |

Extend `moduleCertificationValidator` incrementally — **do not** new certification system.

---

## 6. Strategic question — vertical participation

| Vertical | Today | After Phase 1B–1C |
|----------|-------|-------------------|
| **Inventory** | UI + AI context + webhooks | + search + workspace embed + business billing |
| **CRM** | Same | + search + activity (1C) |
| **Healthcare** | AI context (compliance review) | Deferred search until BAA framework |
| **Manufacturing** | UI + AI context | + search + inference graph nodes |
| **Property Management** | UI + AI context | + search + workspace; V_Link Phase 2 |

**Always available without new platform code:** sandboxed UI, AI context providers, webhook executors, notification metadata, personal Stripe billing, outbound domain webhooks.

**Always missing until delegates ship:** global search, retrieval discovery, graph federation, V_Link create, platform activity feed, business workspace native tab, business paid subs.

---

## 7. Dependency-ordered critical path

```
1. ~~BusinessModuleSubscription fix~~          (✅ Phase 1B-D)
2. PartnerModuleWorkspaceEmbed           (workspace — UX parity)
3. Search HTTP delegate (M-02)             (unlocks search + retrieval + graph inference)
4. Activity ingest API                     (timeline visibility)
5. Context Graph HTTP delegate             (full federation)
6. V_Link entity proxy                     (cross-module linking)
```

---

## 8. Phase 1B roadmap (recommended — not authorized)

### Phase 1B-A — Business parity & workspace (4–6 weeks)

| # | Deliverable | Outcome |
|---|-------------|---------|
| 1 | ~~`BusinessModuleSubscription` write path~~ | ✅ Phase 1B-D |
| 2 | `PartnerModuleWorkspaceEmbed` + business switch | Partner modules in workspace hub |
| 3 | postMessage `host:init` auth bridge spec + MVP | Partner auth friction reduced |
| 4 | Sidebar installed-module links to workspace embed | Navigation parity |
| 5 | Marketplace business subscribe UI | End-to-end business billing |

### Phase 1B-B — Search delegate (4–6 weeks, parallel design)

| # | Deliverable | Outcome |
|---|-------------|---------|
| 6 | Council review: Search delegate RFC | M-02 approved |
| 7 | `PartnerSearchDelegateRegistry` + proxy | Dynamic search providers |
| 8 | Certification validator: searchDelegate required | No false search claims |
| 9 | Admin Test Lab search probe | Pre-approval validation |
| 10 | CI contract tests for delegate shape | Regression safety |

### Phase 1B-C — Retrieval & graph inference (2–4 weeks, after 1B-B)

| # | Deliverable | Outcome |
|---|-------------|---------|
| 11 | Partner evidence in `discover()` via search | Retrieval participation |
| 12 | Inference bridge eligibility for partner moduleIds | Graph inference nodes |
| 13 | Extend RC-M4 certification gate | Marketplace retrieval compliance |

### Phase 1C preview (following 1B)

| # | Deliverable |
|---|-------------|
| 14 | Activity ingest API (`POST /api/modules/:id/activity`) |
| 15 | Extended webhook event types |
| 16 | Context Graph HTTP delegate design (Mode B) |
| 17 | V_Link proxy RFC (Model A) |
| 18 | Partner pilot: one vertical end-to-end (CRM or Inventory) |

---

## 9. Explicit non-goals (Phase 1B)

- ❌ SDK npm package GA
- ❌ Marketplace UI redesign
- ❌ Open community tier / self-publish without review
- ❌ In-process partner code
- ❌ Context Graph write path for partners
- ❌ New Prisma models (unless council approves — billing model exists)
- ❌ Dashboard widget registry (Phase 2)

---

## 10. Document index

| Document | Scope |
|----------|-------|
| [PARTNER_CAPABILITY_PARTICIPATION_ASSESSMENT.md](./PARTNER_CAPABILITY_PARTICIPATION_ASSESSMENT.md) | Cross-capability assessment + activity/billing |
| [SEARCH_PARTICIPATION_ARCHITECTURE.md](./SEARCH_PARTICIPATION_ARCHITECTURE.md) | Search delegate M-02 |
| [RETRIEVAL_PARTICIPATION_ARCHITECTURE.md](./RETRIEVAL_PARTICIPATION_ARCHITECTURE.md) | Retrieval evidence + context paths |
| [CONTEXT_GRAPH_PARTICIPATION_ARCHITECTURE.md](./CONTEXT_GRAPH_PARTICIPATION_ARCHITECTURE.md) | Graph federation + inference |
| [VLINK_PARTICIPATION_ARCHITECTURE.md](./VLINK_PARTICIPATION_ARCHITECTURE.md) | V_Link proxy model |
| [WORKSPACE_PARTICIPATION_ARCHITECTURE.md](./WORKSPACE_PARTICIPATION_ARCHITECTURE.md) | Business/personal embed |
| Phase 0A docs | Marketplace inventory baseline |

---

## 11. Decision requested

Approve Phase 1A architecture findings and authorize **Phase 1B-A + 1B-B planning** (business billing + workspace embed + search delegate RFC).

---

**Last updated:** 2026-06-23
