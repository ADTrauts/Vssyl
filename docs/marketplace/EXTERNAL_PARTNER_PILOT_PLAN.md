# External Partner Pilot — Plan

**Program:** Marketplace & Module Ecosystem — Phase 1C  
**Date:** 2026-06-24  
**Status:** Pilot definition — **governance and validation; no runtime implementation**  
**Prior certification:** RD-MP-1B-G-001 (Level 3 CwF)

---

## 1. Objective

Validate that a **competent external developer** — without platform insider knowledge — can complete the full partner module lifecycle:

**build → submit → certify → install → operate** (including Search, Workspace, Activity delegates where declared).

This phase **defines and audits** the journey. Execution of a live external pilot is the **next operational step** after documentation remediation (see findings register).

---

## 2. Pilot module selection

### Recommended pilot: **Asset Register** (external module id TBD at submission)

| Criterion | Fit | Rationale |
|-----------|-----|-----------|
| Searchable | ✅ | Simple entity search (`asset` by name, tag, location) |
| Workspace embeddable | ✅ | List/detail UI fits business workspace tab |
| Business compatible | ✅ | Natural business-only scope; no personal/household complexity |
| Activity capable | ✅ | Low-risk verbs: `create`, `update`, `assign`, `retire` |
| Low operational risk | ✅ | No PHI, payments, or regulated data in pilot |
| Billing testable | ✅ | Free tier for pilot; optional paid tier later |

### Why not other verticals

| Vertical | Rejection reason |
|----------|------------------|
| CRM | Higher data sensitivity; complex entity graph |
| Healthcare | Compliance barrier for first external pilot |
| Inventory/WMS | Overlaps pilot scope but higher integration expectations |
| Personal productivity | Misses business billing + workspace embed validation |
| Full AI-first demo only | `full-ai-contract-module.json` path exists but **does not** exercise Phase 1B delegates |

### Relationship to internal pilot

Internal sandbox `vssyl-pilot-assets` proves **platform** delegate architecture. External **Asset Register** proves **partner-authored** manifests, HTTPS delegates, iframe bridge, and operator enablement — without repo access.

---

## 3. Pilot partner profile

Treat the developer as:

| Attribute | Assumption |
|-----------|------------|
| Experience | Competent full-stack developer; API + SPA + HTTPS hosting |
| Vssyl knowledge | None beyond public/partner-shared docs |
| Repository access | **None** |
| Platform contacts | Marketplace operator for approval + flag enablement only |
| Infrastructure | Own Cloud Run / static host for UI + delegate APIs |

---

## 4. Pilot scope

### In scope

| # | Capability | Validation |
|---|------------|------------|
| 1 | Module submission + GCS artifact | Upload, scan, publish |
| 2 | Certification v1.4.0 | Scope + delegate checklist items |
| 3 | Business install + entitlement | Free business module path |
| 4 | iframe runtime | Hosted URL or bundle mode |
| 5 | Workspace embed + auth bridge | Business hub tab |
| 6 | Search delegate | Unified Search returns partner hits |
| 7 | Activity ingest | Platform activity feed receives events |
| 8 | Admin readiness + probes | Operator validates before enablement |

### Out of scope (unchanged)

- V_Link, Context Graph, notifications, AI-readable activity
- Open allowlist / public developer portal
- Personal workspace embed parity
- Multi-partner cohort

---

## 5. Pilot manifest target (conceptual)

External partner manifest must include (minimum for full capability pilot):

```json
{
  "moduleScope": "business",
  "supportedContexts": ["business"],
  "capabilities": {
    "search": true,
    "workspace": true,
    "activity": true
  },
  "entities": [
    { "type": "asset", "displayName": "Asset", "supportsSearch": true, "supportsActivity": true }
  ],
  "searchDelegate": {
    "contractVersion": "1",
    "url": "https://partner.example.com/vssyl/search-delegate",
    "entityTypes": ["asset"],
    "supportedContexts": ["business"],
    "timeoutMs": 2500,
    "maxResults": 20
  },
  "workspaceParticipation": {
    "contractVersion": "1",
    "supportedContexts": ["business"],
    "embedMode": "iframe",
    "lifecycleEvents": ["activate", "deactivate"]
  },
  "activityIngest": {
    "contractVersion": "1",
    "supportedContexts": ["business"],
    "entityTypes": ["asset"],
    "actionTypes": ["create", "update", "assign", "retire"],
    "maxMetadataBytes": 4096,
    "idempotencyRequired": true
  }
}
```

Plus standard AI context, permissions, and artifact/hosted runtime per existing pipeline docs.

**Gap:** No such manifest exists today in `docs/test-modules/` — **EP-01** in findings register.

---

## 6. Operator prerequisites (platform side)

Before external pilot goes live, operators must:

| Step | Action |
|------|--------|
| 1 | Approve module after certification + probes pass |
| 2 | Add module id to allowlists: `PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST`, `PARTNER_WORKSPACE_BRIDGE_MODULE_ALLOWLIST`, `PARTNER_ACTIVITY_INGEST_MODULE_ALLOWLIST` |
| 3 | Set env flags to `true` in target environment |
| 4 | Redeploy or restart `vssyl-server` |
| 5 | Confirm partner delegate URLs reachable from Cloud Run egress |
| 6 | Run all four admin probes with `?live=true` where applicable |

**Hidden assumption exposed:** Partner cannot self-enable delegates — **EP-02**.

---

## 7. Success metrics

| Metric | Target |
|--------|--------|
| Time to first successful submission | Documented; ≤ 5 business days with remediated docs |
| Certification pass without internal help | First attempt or one revision cycle |
| Install + runtime in business workspace | Pass |
| Live search delegate probe | Pass |
| Live activity ingest probe | Pass |
| Findings register completeness | All friction points captured |

---

## 8. Phase 1C deliverables

| Document | Role |
|----------|------|
| [EXTERNAL_PARTNER_DEVELOPER_JOURNEY.md](./EXTERNAL_PARTNER_DEVELOPER_JOURNEY.md) | End-to-end workflow + friction |
| [EXTERNAL_PARTNER_DOCUMENTATION_AUDIT.md](./EXTERNAL_PARTNER_DOCUMENTATION_AUDIT.md) | Doc gap analysis |
| [EXTERNAL_PARTNER_FINDINGS_REGISTER.md](./EXTERNAL_PARTNER_FINDINGS_REGISTER.md) | Prioritized findings |
| [MARKETPLACE_PHASE_1C_EXECUTIVE_SUMMARY.md](./MARKETPLACE_PHASE_1C_EXECUTIVE_SUMMARY.md) | Decision + certification answer |

---

## 9. Recommended execution sequence (post-audit)

| Wave | Action |
|------|--------|
| **1C-A (docs)** | Partner Capability Developer Guide + full reference manifest + env runbook |
| **1C-B (pilot)** | Recruit one external developer; run Asset Register pilot |
| **1C-C (closeout)** | Update certification record F-01; promote toward Level 4 |

---

**Last updated:** 2026-06-24
