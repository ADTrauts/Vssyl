# External Partner — Documentation Audit

**Program:** Marketplace & Module Ecosystem — Phase 1C  
**Date:** 2026-06-24  
**Status:** Gap analysis — **no implementation**  
**Method:** Audit of `docs/guides/`, `docs/marketplace/`, `docs/test-modules/`, `memory-bank/`, and developer portal surfaces

---

## 1. Executive summary

Partner documentation is **split across two worlds**:

| Corpus | Audience | Phase 1B delegate coverage |
|--------|----------|----------------------------|
| **`docs/guides/`** | External developers | ❌ **Missing** search, workspace, activity, scope |
| **`docs/marketplace/`** | Internal architecture/governance | ✅ Complete contracts |

A competent external developer following **only the published developer guide index** can build an **AI + iframe module** but **cannot** discover or implement **Platform Capability Participant** features without insider documentation.

---

## 2. Partner-facing inventory

### 2.1 Primary external entry points

| Document | Last updated | Covers upload/runtime | Covers delegates | Grade |
|----------|--------------|----------------------|------------------|-------|
| [THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md](../guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md) | 2026-04-21 | ✅ Index link | ❌ | **Incomplete** |
| [THIRD_PARTY_MODULE_RULEBOOK.md](../guides/THIRD_PARTY_MODULE_RULEBOOK.md) | 2026-05-21 | ✅ | ❌ | **Incomplete** |
| [THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) | 2026-04-21 | ✅ Strong | ❌ | **Partial** |
| [MODULE_AI_SDK_BOUNDARIES.md](../guides/MODULE_AI_SDK_BOUNDARIES.md) | Phase 4D | N/A | ❌ | OK for AI |
| [AI_CONTEXT_PROVIDER_API.md](../guides/AI_CONTEXT_PROVIDER_API.md) | — | N/A | ❌ | OK for AI |
| [MODULE_PLATFORM_ENVIRONMENT_MATRIX.md](../guides/MODULE_PLATFORM_ENVIRONMENT_MATRIX.md) | — | ✅ GCS caveat | ❌ | **Important** |
| [NOTIFICATION_METADATA_GUIDE.md](../guides/NOTIFICATION_METADATA_GUIDE.md) | — | N/A | ❌ | OK |

### 2.2 Internal-only (not linked from developer guide)

| Document | Content needed by partners |
|----------|---------------------------|
| [MODULE_SCOPE_STANDARD.md](./MODULE_SCOPE_STANDARD.md) | **Required** `moduleScope` |
| [SEARCH_DELEGATE_RESULT_CONTRACT.md](./SEARCH_DELEGATE_RESULT_CONTRACT.md) | Search delegate request/response |
| [SEARCH_DELEGATE_SECURITY_MODEL.md](./SEARCH_DELEGATE_SECURITY_MODEL.md) | JWT verification |
| [PARTNER_WORKSPACE_CONTRACT.md](./PARTNER_WORKSPACE_CONTRACT.md) | Embed + lifecycle |
| [POSTMESSAGE_AUTH_BRIDGE.md](./POSTMESSAGE_AUTH_BRIDGE.md) | Bridge message types |
| [PARTNER_ACTIVITY_EVENT_CONTRACT.md](./PARTNER_ACTIVITY_EVENT_CONTRACT.md) | Ingest body |
| [PARTNER_ACTIVITY_SECURITY_MODEL.md](./PARTNER_ACTIVITY_SECURITY_MODEL.md) | Ingest JWT |
| [BUSINESS_MODULE_BILLING_LIFECYCLE.md](./BUSINESS_MODULE_BILLING_LIFECYCLE.md) | Business paid modules |

---

## 3. Missing guides (required for external self-service)

| ID | Missing guide | Priority |
|----|---------------|----------|
| MG-01 | **Partner Capability Developer Guide** — unified index for scope + search + workspace + activity | P0 |
| MG-02 | **Search Delegate Implementation Guide** — JWT verify, request/response, errors | P0 |
| MG-03 | **Workspace Bridge Implementation Guide** — postMessage, init payload, lifecycle | P0 |
| MG-04 | **Activity Ingest Implementation Guide** — token exchange, idempotency, actions | P0 |
| MG-05 | **Module Scope Guide for Partners** — personal/business/both decision tree | P1 |
| MG-06 | **Business Billing Guide for Partners** — free vs paid, Stripe prerequisites | P1 |
| MG-07 | **Operator Runbook** — allowlist + env flags + probe checklist | P1 |
| MG-08 | **Local Dev Setup for Partners** — GCS bucket for artifact testing | P2 |

---

## 4. Missing examples

| ID | Missing example | Priority |
|----|-----------------|----------|
| EX-01 | **Full capability reference manifest** (search + workspace + activity + scope) | P0 |
| EX-02 | Minimal search delegate server (Node/Express sample) | P1 |
| EX-03 | Minimal iframe consuming workspace bridge init | P1 |
| EX-04 | Activity ingest client snippet (token + POST) | P1 |
| EX-05 | External-facing OpenAPI or JSON Schema for delegate contracts | P2 |

**Current fixtures:**

| File | Useful for | Delegate coverage |
|------|------------|-------------------|
| `full-ai-contract-module.json` | AI + scope | ❌ No delegates |
| `test-action-executor-module.json` | Webhook executor | ❌ |
| Upload zip fixtures | Artifact scan | ❌ |
| Internal `vssyl-pilot-assets` snapshots | Platform probes | ❌ Not packaged for external use |

---

## 5. Unclear requirements

| ID | Topic | Confusion |
|----|-------|-----------|
| UR-01 | `capabilities` shape | Object vs array — validator accepts both; docs inconsistent |
| UR-02 | `entities[]` vs delegate `entityTypes` | Must align; rule buried in certification |
| UR-03 | Activity vs analytics | Rulebook says emit activity; partners use **ingest API** for platform feed — not linked |
| UR-04 | When AI context is mandatory | G1–G7 vs delegate-only modules |
| UR-05 | Hosted URL vs bundle | Pipeline doc authoritative but long; quick-start missing |
| UR-06 | Delegate enablement | Partners assume publish = live; flags + allowlist undocumented externally |
| UR-07 | Certification vs runtime | Pass certification ≠ search/workspace/activity active |

---

## 6. Hidden assumptions exposed

| ID | Assumption | Reality |
|----|------------|---------|
| HA-01 | Docs are current with marketplace runtime | Developer guide **predates Phase 1B** |
| HA-02 | Partner can test upload locally | **503 without GCS** |
| HA-03 | Publish enables search | **Feature flag + allowlist** required |
| HA-04 | Certification checklist is public | Delegate items exist only in validator + marketplace docs |
| HA-05 | Partner verifies platform JWTs | No sample code in guides |
| HA-06 | Probes validate partner readiness | **Admin-only**; partner cannot run |
| HA-07 | Search failures are visible | Empty slice — silent degrade |
| HA-08 | `memory-bank/moduleSpecs.md` is partner-readable | GitHub path OK but not in developer guide read order for delegates |

---

## 7. Certification walkthrough (external comprehension)

| Checklist area | Understandable without internal knowledge? |
|----------------|---------------------------------------------|
| Permissions + manifest structure | ✅ Mostly |
| AI G1–G7 | ✅ With existing guides |
| `moduleScope` | ❌ Not in developer guide |
| `search_delegate` | ❌ |
| `workspace_participation` | ❌ |
| `activity_ingest` | ❌ |
| Entity / action alignment | ❌ |
| Post-certification ops enablement | ❌ |

**Verdict:** Validator is **correct**; partner-facing explanation is **insufficient**.

---

## 8. Documentation remediation plan (recommended)

| Wave | Deliverable | Closes |
|------|-------------|--------|
| **1C-A.1** | `docs/guides/PARTNER_CAPABILITY_DEVELOPER_GUIDE.md` | MG-01, links to contracts |
| **1C-A.2** | `docs/test-modules/full-capability-partner-module.json` | EX-01 |
| **1C-A.3** | Update `THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md` read order + date | UR-01, HA-01 |
| **1C-A.4** | Update `THIRD_PARTY_MODULE_RULEBOOK.md` delegate gates | UR-07 |
| **1C-A.5** | `docs/guides/PARTNER_OPERATOR_RUNBOOK.md` (internal/partner-shared) | MG-07, HA-03 |

**Out of scope for 1C:** Public developer portal (explicit).

---

## 9. Audit conclusion

| Metric | Assessment |
|--------|------------|
| Pipeline / upload docs | **Adequate** |
| AI partner docs | **Adequate** |
| Phase 1B capability docs | **Internal only — inadequate for external** |
| Examples | **Gap for full-capability module** |
| Certification comprehensibility | **Fail for delegates without remediation** |

---

**Last updated:** 2026-06-24
