# Partner Capability Participation — Assessment

**Program:** Marketplace & Module Ecosystem — Phase 1A  
**Date:** 2026-06-23  
**Status:** Architecture & readiness assessment only — **no implementation authorized**  
**Authority:** Phase 0A findings, [`PLATFORM_CAPABILITY_CATALOG.md`](../architecture/PLATFORM_CAPABILITY_CATALOG.md), [`SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md`](../search/SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md)

---

## 1. Executive summary

Partner modules **can run today** but **cannot participate as first-class citizens** in Vssyl's certified intelligence ecosystem. Platform capabilities were certified with **first-party, compile-time registration**. Partner participation requires **HTTP delegate contracts** loaded from published marketplace manifests — not a marketplace rebuild.

**Highest-leverage unlock:** Search delegate registration (M-02) — it unblocks Unified Search, AI Retrieval query discovery, and Context Graph retrieval-bridge enrichment.

**Partner-ready today (no new platform code):** AI context providers, webhook action executors, notification metadata, domain-event webhooks (outbound), personal module billing.

---

## 2. Capability participation readiness

| Capability | Level | Score | Today | Blocker |
|------------|-------|-------|-------|---------|
| **Unified Search** | **2** — Architecturally Ready | 2/4 | First-party only (9 providers) | M-02 manifest loader not runtime |
| **AI Retrieval (discovery)** | **2** — Architecturally Ready | 2/4 | Wired for platform consumers | Depends on Search M-02; RC-M1–M-4 deferred |
| **AI Retrieval (context)** | **3** — Partner Ready | 3/4 | `ModuleAIContextService` fetches partner HTTPS | G1–G7 certification; no retrieval evidence from search |
| **Context Graph** | **1** — First Party Only | 1/4 | 8 static adapters | No partner adapter delegate; L5-B03 |
| **V_Link** | **1** — First Party Only | 1/4 | 6 modules with in-process resolvers | Requires platform code per entity type |
| **Activity (publish)** | **2** — Architecturally Ready | 2/4 | Contract in `moduleSpecs.md` | No partner ingest API |
| **Activity (consume)** | **2** — Architecturally Ready | 2/4 | Webhooks for `module.installed`, `file.shared` | Limited event types; no feed API |
| **Notifications** | **2** — Architecturally Ready | 2/4 | Manifest metadata validated | No platform delivery API for partners |
| **Workspace Runtime** | **2** — Architecturally Ready | 2/4 | `/modules/run` iframe works | No business hub embed; static switch |
| **Billing (personal)** | **3** — Partner Ready | 3/4 | Stripe + `ModuleSubscription` | —O |
| **Billing (business)** | **1** — First Party Only | 1/4 | Model + install gate exist | **`BusinessModuleSubscription` never created** |
| **Realtime** | **1** — First Party Only | 1/4 | `chatSocketService` | No iframe bridge |

**Readiness legend:** 0 Unsupported · 1 First Party Only · 2 Architecturally Ready · 3 Partner Ready · 4 Certified Ecosystem

**Composite ecosystem participation readiness: 1.9 / 4** (between First Party Only and Architecturally Ready)

---

## 3. Participation by vertical (strategic question)

If a partner built **Inventory, CRM, Healthcare, Manufacturing, or Property Management** today:

| Capability | Inventory | CRM | Healthcare | Manufacturing | Property Mgmt |
|------------|-----------|-----|------------|---------------|---------------|
| Sandboxed UI runtime | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI context providers | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI webhook executors | ✅ | ✅ | ⚠️ compliance | ✅ | ✅ |
| Personal billing | ✅ | ✅ | ✅ | ✅ | ✅ |
| Business billing | ❌ | ❌ | ❌ | ❌ | ❌ |
| Unified Search | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI retrieval discovery | ❌ | ❌ | ❌ | ❌ | ❌ |
| Context Graph bundles | ❌ | ❌ | ❌ | ❌ | ❌ |
| V_Link linking | ❌ | ❌ | ❌ | ❌ | ❌ |
| Activity timeline | ❌ | ❌ | ❌ | ❌ | ❌ |
| Business workspace tab | ❌ | ❌ | ❌ | ❌ | ❌ |
| Platform notifications | 🟡 metadata | 🟡 | 🟡 | 🟡 | 🟡 |
| Domain event webhooks | 🟡 limited | 🟡 | 🟡 | 🟡 | 🟡 |

**Realistic today:** Partner-hosted SoR + iframe UI + AI twin read/write via context providers and webhooks.

**Missing for intelligence ecosystem:** Search delegate, activity ingest, workspace embed, business billing, graph/V_Link federation.

---

## 4. Capability registration model analysis

### Option A — Static Registration (current first-party)

Compile-time arrays: `searchProviderRegistry`, `adapterRegistry`, `BusinessWorkspaceContent` switch, V_Link resolvers.

| Pros | Cons |
|------|------|
| Maximum control and performance | Requires platform deploy per partner |
| Full PE + visibility integration | Does not scale to marketplace |
| Reference implementation quality | Blocks ecosystem vision |

**Verdict:** **Keep for first-party / Integrated Partner tier only.**

---

### Option B — Manifest Registration

Published `ModuleVersion.manifestSnapshot` declares `capabilities.search`, `contextGraph`, `entities`, etc. Platform loads at sync/approval.

| Pros | Cons |
|------|------|
| Single source of truth with marketplace | Manifest alone does not enforce runtime behavior |
| Aligns with existing `ModuleRegistrySyncService` | Needs validation + delegate URLs |
| Developer-friendly declaration | Risk of over-claiming capabilities |

**Verdict:** **Required as declaration layer** — not sufficient alone.

---

### Option C — Capability Contracts (certified provider model)

Each capability defines an HTTP delegate contract. Platform orchestrator calls partner boundary; certification validates contract conformance.

| Pros | Cons |
|------|------|
| Matches "no in-process partner code" rule | More moving parts (timeouts, auth, caching) |
| Security boundary at platform edge | Partner SLA requirements |
| Testable with contract tests | Initial engineering investment |

**Verdict:** **Required execution layer for partners.**

---

### Option D — Hybrid (recommended)

| Tier | Registration | Execution |
|------|--------------|-----------|
| **First-party** | Code registry + manifest reconcile | In-process visibility services |
| **Certified Partner** | Manifest declaration | HTTP delegates for declared capabilities |
| **Integrated Partner** | Manifest + platform co-review | Delegates + optional co-built resolver shims |

**Formal recommendation: Option D (Hybrid).**

Implementation sequence:
1. Extend `ModuleRegistrySyncService` to materialize **capability delegate registry** from published manifests
2. Keep static registries for built-ins (no regression)
3. Orchestrators (`searchCapabilityService`, future graph delegate loader) merge static + dynamic providers
4. Certification validator blocks manifest claims without delegate endpoints

---

## 5. Cross-capability dependency graph

```
                    ┌─────────────────┐
                    │ Manifest + Cert │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │   Search    │───►│  Retrieval  │───►│ Context Graph│
  │  delegate   │    │  discover() │    │ inference   │
  └─────────────┘    └─────────────┘    └─────────────┘
         │                   │
         │            ┌──────┴──────┐
         │            ▼             ▼
         │     Context providers  Webhook executors
         │      (parallel path)    (already ✅)
         ▼
   Global search bar
         │
         ▼
   Workspace deep links ◄── Workspace embed (Phase 1B)
```

**Search delegate is the critical path** for intelligence ecosystem participation.

---

## 6. Security summary (cross-capability)

| Attack | Primary defense | Partner gap |
|--------|-----------------|-------------|
| Inject search results | Platform calls partner delegate with user JWT; PE `search:read` | Partner must not return cross-tenant hits |
| Pollute graph bundles | Inference-only provenance; min confidence 0.2; no writes | Partner search evidence quality |
| Invalid V_Links | Resolver + membership checks (first-party) | Partners cannot create platform V_Links today |
| Fake activities | No ingest API yet | Future: HMAC-signed activity ingest + schema validation |
| Permission bypass | Install/runtime gates; PE on platform actions | Partner API auth is partner responsibility |

Full analysis: capability-specific architecture docs + Phase 0A [MARKETPLACE_SECURITY_REVIEW.md](./MARKETPLACE_SECURITY_REVIEW.md).

---

## 7. Certification requirements (cross-cutting)

All partner capability participation **must** satisfy:

| # | Requirement | Enforced today |
|---|-------------|----------------|
| **CP-01** | Module APPROVED + current PUBLISHED version | ✅ |
| **CP-02** | Structural certification pass (or WARNING only) | ✅ |
| **CP-03** | Artifact scan PASSED | ✅ |
| **CP-04** | `moduleSpecs.md` interoperability checklist (human) | ✅ Manual |
| **CP-05** | Capability claim ⊆ certified delegate endpoints | ❌ Phase 1B+ |
| **CP-06** | Tenant scoping on all delegate calls | ❌ Contract only |
| **CP-07** | No in-process capability claims | ✅ Validator |
| **CP-08** | Operation matrix row per capability | ❌ Pending |
| **CP-09** | Contract tests in CI (platform + partner sample) | ❌ Pending |
| **CP-10** | Admin Test Lab spot-check for delegates | 🟡 Partial (AI providers) |

---

## 9. Activity participation

### Readiness: **Level 2 — Architecturally Ready** (publish) / **Level 2** (consume)

### Current state

| Path | Implementation | Partner |
|------|----------------|---------|
| **Publish to platform feed** | `emitModuleActivityEvent` → `prisma.log` + socket refresh | ❌ In-process only |
| **Query activity feed** | `activityFeedController` | N/A for partners |
| **Consume platform events** | Webhook subscriptions (`module.installed`, `file.shared`) | 🟡 Outbound only |
| **Notifications from activity** | `notificationDomainEventSubscriber` (partial) | ❌ No partner create API |

Contract: `moduleSpecs.md` normalized envelope — partners must emit compatible events **on their infrastructure** today.

### Recommended model: Activity Ingest API (Phase 1C)

Manifest declares participation intent:

```json
{
  "capabilities": { "activity": true },
  "activity": {
    "publishToPlatformFeed": true,
    "declaredEventTypes": ["create", "update", "delete", "share"]
  }
}
```

**Partner → platform:** Partner POSTs to **`POST /api/modules/:id/activity`** (proposed platform endpoint):

- HMAC-signed payload matching `NormalizedActivityEvent`
- Platform validates moduleId, tenant scope, actor userId
- Inserts via `emitModuleActivityEvent` or dedicated partner path

**Direction inbound (platform → partner):** Extend webhook types — `activity.created` with filtered visibility.

### Certification (proposed AP-01–AP-06)

| # | Requirement |
|---|-------------|
| AP-01 | Events match normalized envelope |
| AP-02 | Emit only on authorized success |
| AP-03 | Tenant fields required |
| AP-04 | No analytics masquerading as activity |
| AP-05 | Rate limits per module |
| AP-06 | Admin spot-check in Test Lab |

### Security

| Threat | Control |
|--------|---------|
| Fake activities | HMAC + moduleId binding + actor must match session |
| Cross-tenant feed pollution | Validate businessId/dashboardId on ingest |
| Feed spam | Rate limit per module per tenant |

---

## 10. Billing participation

### Readiness: Personal **Level 3** | Business **Level 1**

### Current state

| Component | Path | Status |
|-----------|------|--------|
| Personal subs | `ModuleSubscriptionService.createModuleSubscription` | ✅ Creates `ModuleSubscription` + Stripe |
| Business subs model | `BusinessModuleSubscription` Prisma model | ✅ Schema exists |
| Business subs writes | — | ❌ **No `.create` anywhere in codebase** |
| Install gate (business) | `moduleProvisionController` | Checks `businessModuleSubscription.findFirst` → 402 |
| Install gate (personal) | Same controller | ✅ Works via `ModuleSubscription` |
| Runtime gate | `moduleRuntimeController` | Checks both subscription types |
| Billing API | `POST /api/billing/modules/:moduleId/subscribe` | ✅ Personal path |

### Blocker

`ModuleSubscriptionService.createModuleSubscription` accepts optional `businessId` but writes to **`ModuleSubscription`** table only — not `BusinessModuleSubscription`. Install/runtime checks query **`BusinessModuleSubscription`** for business scope paid modules.

**Result:** Business paid partner modules **always fail install** with 402 unless `isProprietary` tier bypass.

### Required architecture (Phase 1B — no migration if model exists)

1. **`createBusinessModuleSubscription(businessId, moduleId, tier)`** — writes `BusinessModuleSubscription`
2. **Billing route** — `POST /api/billing/modules/:moduleId/subscribe?scope=business&businessId=...`
3. **Stripe metadata** — `businessId`, `moduleId`, subscription scope
4. **Webhook handler** — sync `BusinessModuleSubscription` status from Stripe events
5. **Install flow** — link subscribe CTA in marketplace UI for business scope
6. **Revenue split** — extend `RevenueSplitService` for business subs (mirror personal)

### Certification requirements

| # | Requirement |
|---|-------------|
| BL-P01 | Free tier modules install without subscription row |
| BL-P02 | Paid business modules require active `BusinessModuleSubscription` |
| BL-P03 | Cancel/downgrade revokes runtime within period rules |
| BL-P04 | Developer revenue attribution correct per business sub |
| BL-P05 | Admin portal shows business subscription status |

**No new Prisma model required** — fix write path only.

---

## 11. Document index

| Document | Scope |
|----------|-------|
| [SEARCH_PARTICIPATION_ARCHITECTURE.md](./SEARCH_PARTICIPATION_ARCHITECTURE.md) | Search delegate model |
| [RETRIEVAL_PARTICIPATION_ARCHITECTURE.md](./RETRIEVAL_PARTICIPATION_ARCHITECTURE.md) | Retrieval evidence + consumers |
| [CONTEXT_GRAPH_PARTICIPATION_ARCHITECTURE.md](./CONTEXT_GRAPH_PARTICIPATION_ARCHITECTURE.md) | Graph federation for partners |
| [VLINK_PARTICIPATION_ARCHITECTURE.md](./VLINK_PARTICIPATION_ARCHITECTURE.md) | V_Link standards for partners |
| [WORKSPACE_PARTICIPATION_ARCHITECTURE.md](./WORKSPACE_PARTICIPATION_ARCHITECTURE.md) | Business/personal/dashboard embed |
| [MARKETPLACE_PHASE_1A_EXECUTIVE_SUMMARY.md](./MARKETPLACE_PHASE_1A_EXECUTIVE_SUMMARY.md) | Rollup + Phase 1B roadmap |

---

**Last updated:** 2026-06-23
