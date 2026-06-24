# Platform Capability Catalog

**Version:** 1.0.0  
**Last updated:** 2026-06-24 (Marketplace Partner Runtime L3 CwF)  
**Status:** Living index of **platform capabilities** — distinct from product modules  
**Authority:** [CERTIFICATION_LEDGER.md](./CERTIFICATION_LEDGER.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)

---

## 1. Purpose

Product modules (`drive`, `chat`, `todo`, …) appear in the module certification matrix. **Platform capabilities** are cross-cutting infrastructure — they extend the Runtime Kernel without becoming workspace modules.

This catalog indexes capability class, certification band, and primary governance docs.

---

## 2. Certified platform capabilities

| Capability id | Name | Level | Band | G1–G9 | Record |
|---------------|------|-------|------|-------|--------|
| `platform_kernel` | Platform Kernel (Activity + Domain Events) | 2 | L2 CwF | 21/27 | [PLATFORM_KERNEL_CERTIFICATION_RECORD](../platform-kernel/PLATFORM_KERNEL_CERTIFICATION_RECORD.md) |
| `analytics` | Platform Analytics | 2 | L2 CwF | 21/27 | [ANALYTICS_CERTIFICATION_RECORD](../analytics/ANALYTICS_CERTIFICATION_RECORD.md) |
| `unified_search` | Unified Search | 2 | L2 CwF | 21/27 | [SEARCH_CAPABILITY_CERTIFICATION_REVIEW](../search/SEARCH_CAPABILITY_CERTIFICATION_REVIEW.md) |
| `ai_retrieval` | AI Retrieval Adapter | 2 | L2 CwF | 20/27 | [AI_RETRIEVAL_CAPABILITY_CERTIFICATION_REVIEW](../ai/retrieval/AI_RETRIEVAL_CAPABILITY_CERTIFICATION_REVIEW.md) |
| `marketplace_partner_runtime` | Marketplace Partner Runtime (delegates) | **3** | **L3 CwF** | *(delegate matrix)* | [MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD](../marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md) |

---

## 3. Certified platform capabilities (L3–L4)

| Capability id | Name | Level | Band | G1–G9 | Record |
|---------------|------|-------|------|-------|--------|
| `context_graph` | Context Graph (federated read + consumption unification) | **4** | **L4 CwF** | **26/27** | [CONTEXT_GRAPH_L4_CERTIFICATION_RECORD](../context-graph/CONTEXT_GRAPH_L4_CERTIFICATION_RECORD.md) |

**Composite certification:** L3 federation (#CG-1–#CG-3, RD-CG-010) + L4 consumption amendment (#CG-4, RD-CG-L4-001).

**Production gate:** L4-F01 **closed** — controlled pilot Approved With Findings. See [CONTEXT_GRAPH_L4_F01_CLOSEOUT](../context-graph/CONTEXT_GRAPH_L4_F01_CLOSEOUT.md).

**Prior L3 record:** [CONTEXT_GRAPH_CERTIFICATION_PROMOTION_RECORD](../context-graph/CONTEXT_GRAPH_CERTIFICATION_PROMOTION_RECORD.md)

---

## 4. Platform subdomains & control plane (not capability-id rows)

| Program | Class | Level | Notes |
|---------|-------|-------|-------|
| Business Administration | Platform subdomain | L3 | Org chart, permissions, approval boundaries |
| Admin Portal | Control plane | L3 | Operator surfaces — not tenant search |
| Account Platform | Platform domain | L3 | PP-1/2/3 umbrella |
| Reference Workspace | Shell program | WS-L3 | Business + personal co-surfaces |

---

## 5. Unified Search (`unified_search`) — summary

| Field | Value |
|-------|-------|
| **Entry API** | `POST /api/search` |
| **Orchestrator** | `searchCapabilityService` |
| **Architecture** | Option C Hybrid — federated providers first |
| **Providers** | 9 (drive, chat, calendar, todo, notes, place, dashboard, member, vlink) |
| **PE action** | `search:read` |
| **Constitution** | [SEARCH_CONSTITUTION.md](../search/SEARCH_CONSTITUTION.md) |
| **Module compliance** | [SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md](../search/SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md) |
| **Phase 1B summary** | [SEARCH_PHASE_1B_EXECUTIVE_SUMMARY.md](../search/SEARCH_PHASE_1B_EXECUTIVE_SUMMARY.md) |

---

## 6. AI Retrieval Adapter (`ai_retrieval`) — summary

| Field | Value |
|-------|-------|
| **Entry API** | Internal `discover()` — not public HTTP |
| **Orchestrator** | `aiRetrievalCapabilityService` |
| **Architecture** | Option B Hybrid — Search for discovery |
| **Consumers** | 2 wired (`planning`, `workflow_action`) |
| **Search dependency** | `executeGlobalSearch` via `unified_search` |
| **Constitution** | [AI_RETRIEVAL_CONSTITUTION.md](../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md) |
| **Consumer compliance** | [AI_RETRIEVAL_COMPLIANCE_REQUIREMENTS.md](../ai/retrieval/AI_RETRIEVAL_COMPLIANCE_REQUIREMENTS.md) |
| **Phase 2A summary** | [AI_RETRIEVAL_PHASE_2A_EXECUTIVE_SUMMARY.md](../ai/retrieval/AI_RETRIEVAL_PHASE_2A_EXECUTIVE_SUMMARY.md) |

---

## 7. Capability vs module decision tree

```
Does it own user-facing workspace landing + moduleId?
  YES → Product module (certification matrix)
  NO → Does it federate across modules without SoR?
    YES → Platform capability (this catalog)
    NO → Platform system or subdomain (ledger platform rows)
```

---

## 8. Marketplace Partner Runtime (`marketplace_partner_runtime`) — summary

| Field | Value |
|-------|-------|
| **Class** | Partner delegate orchestration (not tenant SoR) |
| **Surfaces** | Search Delegate · Workspace Bridge · Activity Ingest · Business Billing gates · Module Scope |
| **Pilot module** | `vssyl-pilot-assets` |
| **Certification** | Validator **1.4.0**; admin readiness card + four probes |
| **Default posture** | Feature flags OFF; allowlist-gated |
| **Level** | **3 — Platform Capability Participant (CwF)** |
| **Record** | [MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD](../marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md) |
| **Phase closeout** | [MARKETPLACE_PHASE_1B_G_EXECUTIVE_SUMMARY](../marketplace/MARKETPLACE_PHASE_1B_G_EXECUTIVE_SUMMARY.md) |

**Not included:** V_Link, Context Graph, partner notifications, AI-readable activity, developer portal.

---

**Last updated:** 2026-06-24
