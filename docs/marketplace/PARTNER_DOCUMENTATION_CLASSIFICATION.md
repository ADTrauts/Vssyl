# Partner Documentation Classification

**Program:** Marketplace — Phase 1C-A  
**Date:** 2026-06-24  
**Status:** Active classification index

---

## 1. Purpose

Classify marketplace documentation so external partners, operators, and internal engineers know **which corpus to read** — without exposing internal governance noise to partners.

---

## 2. Classification tiers

| Tier | Audience | Location | Rule |
|------|----------|----------|------|
| **A — Partner-facing** | External developers | `docs/guides/PARTNER_*`, capability guides | Plain language; no repo internals required |
| **B — Operator-facing** | Admins / platform ops | `docs/marketplace/PARTNER_OPERATOR_*`, readiness card | Enablement, probes, flags |
| **C — Contract depth** | Partners (advanced) + integrators | Selected `docs/marketplace/*CONTRACT*`, `*SECURITY*` | Linked from A-tier guides |
| **D — Internal governance** | Architecture / program | Phase closeouts, certification reviews, executive summaries | Not required for build |
| **E — Internal implementation** | Vssyl engineers | `server/src/marketplace/`, validator source | Never partner onboarding path |

---

## 3. Partner-facing (Tier A) — canonical entry

| Document | Role |
|----------|------|
| [PARTNER_DEVELOPER_GUIDE.md](../guides/PARTNER_DEVELOPER_GUIDE.md) | **Start here** |
| [full-capability-partner-module.json](../guides/full-capability-partner-module.json) | Reference manifest |
| [REFERENCE_PARTNER_MODULE_SPEC.md](../guides/REFERENCE_PARTNER_MODULE_SPEC.md) | Asset Register spec |
| [MODULE_SCOPE_GUIDE.md](../guides/MODULE_SCOPE_GUIDE.md) | Scope |
| [SEARCH_DELEGATE_GUIDE.md](../guides/SEARCH_DELEGATE_GUIDE.md) | Search |
| [WORKSPACE_BRIDGE_GUIDE.md](../guides/WORKSPACE_BRIDGE_GUIDE.md) | Workspace |
| [ACTIVITY_INGEST_GUIDE.md](../guides/ACTIVITY_INGEST_GUIDE.md) | Activity |
| [BUSINESS_BILLING_GUIDE.md](../guides/BUSINESS_BILLING_GUIDE.md) | Billing |
| [PARTNER_VALIDATION_STRATEGY.md](../guides/PARTNER_VALIDATION_STRATEGY.md) | Pre-submit validation |
| [PARTNER_CERTIFICATION_WALKTHROUGH.md](../guides/PARTNER_CERTIFICATION_WALKTHROUGH.md) | Certification |
| [THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) | Upload/runtime authority |
| [THIRD_PARTY_MODULE_RULEBOOK.md](../guides/THIRD_PARTY_MODULE_RULEBOOK.md) | Must-pass checklist |
| [THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md](../guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md) | Legacy index → points to Partner guide |
| [MODULE_AI_SDK_BOUNDARIES.md](../guides/MODULE_AI_SDK_BOUNDARIES.md) | AI (if applicable) |

---

## 4. Operator-facing (Tier B)

| Document | Role |
|----------|------|
| [PARTNER_OPERATOR_RUNBOOK.md](./PARTNER_OPERATOR_RUNBOOK.md) | Post-approval enablement |
| [MARKETPLACE_ADMIN_READINESS_CARD.md](./MARKETPLACE_ADMIN_READINESS_CARD.md) | Admin UI probes |
| [ADMIN_PORTAL.md](../guides/ADMIN_PORTAL.md) | Admin portal overview |

---

## 5. Contract depth (Tier C) — linked from guides

| Document | Linked from |
|----------|-------------|
| [SEARCH_DELEGATE_RESULT_CONTRACT.md](./SEARCH_DELEGATE_RESULT_CONTRACT.md) | Search guide |
| [SEARCH_DELEGATE_SECURITY_MODEL.md](./SEARCH_DELEGATE_SECURITY_MODEL.md) | Search guide |
| [PARTNER_WORKSPACE_CONTRACT.md](./PARTNER_WORKSPACE_CONTRACT.md) | Workspace guide |
| [POSTMESSAGE_AUTH_BRIDGE.md](./POSTMESSAGE_AUTH_BRIDGE.md) | Workspace guide |
| [PARTNER_ACTIVITY_EVENT_CONTRACT.md](./PARTNER_ACTIVITY_EVENT_CONTRACT.md) | Activity guide |
| [PARTNER_ACTIVITY_SECURITY_MODEL.md](./PARTNER_ACTIVITY_SECURITY_MODEL.md) | Activity guide |
| [MODULE_SCOPE_STANDARD.md](./MODULE_SCOPE_STANDARD.md) | Scope guide |
| [BUSINESS_MODULE_BILLING_LIFECYCLE.md](./BUSINESS_MODULE_BILLING_LIFECYCLE.md) | Billing guide |

Partners **may read** Tier C; Tier A guides summarize requirements.

---

## 6. Internal governance (Tier D) — not onboarding

| Pattern | Examples |
|---------|----------|
| Phase closeouts | `MARKETPLACE_PHASE_*_CLOSEOUT.md` |
| Certification reviews | `MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_*.md` |
| Executive summaries | `MARKETPLACE_PHASE_*_EXECUTIVE_SUMMARY.md` |
| Audits | `EXTERNAL_PARTNER_*`, `ADMIN_PORTAL_MARKETPLACE_ALIGNMENT_*` |
| Strategic positioning | `MARKETPLACE_STRATEGIC_POSITIONING.md` |
| Participation architecture (future) | `VLINK_*`, `CONTEXT_GRAPH_*` |

---

## 7. Internal implementation (Tier E)

| Path | Notes |
|------|-------|
| `server/src/marketplace/` | Runtime — partners integrate via HTTP contracts only |
| `server/src/services/moduleCertificationValidator.ts` | Source of checklist truth |
| `shared/src/types/search-delegate.ts` etc. | Type authority for contract versions |

Partners should use **Tier A + C docs**, not source code, unless contributing to Vssyl core.

---

## 8. Consolidation actions (1C-A)

| Action | Status |
|--------|--------|
| Create Tier A partner guide corpus | ✅ |
| Link delegates from PARTNER_DEVELOPER_GUIDE | ✅ |
| Operator runbook for EP-02 | ✅ |
| Validation strategy for EP-18 | ✅ (architecture; CLI deferred) |
| Update `docs/guides/README.md` partner section | ✅ |
| Redirect legacy developer guide | ✅ |

---

## 9. Documents unchanged but superseded for delegates

| Document | Partner delegate content |
|----------|---------------------------|
| `THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md` | AI + pipeline only — use PARTNER_DEVELOPER_GUIDE for delegates |
| `full-ai-contract-module.json` | AI reference — merge with full-capability manifest |

---

## 10. Future public portal

When a developer portal launches, **Tier A** documents map 1:1 to portal sections. Tier D/E remain internal.

---

**Last updated:** 2026-06-24
