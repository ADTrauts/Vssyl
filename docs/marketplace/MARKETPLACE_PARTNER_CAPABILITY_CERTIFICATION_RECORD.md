# Marketplace Partner Capability — Certification Record

**Program:** Marketplace & Module Ecosystem — Phase 1B-G  
**Date:** 2026-06-24  
**Decision ID:** RD-MP-1B-G-001  
**Status:** **LEVEL 3 CERTIFIED WITH FINDINGS**  
**Review:** [MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_REVIEW.md](./MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_REVIEW.md)

---

## 1. Certification decision

| Field | Value |
|-------|-------|
| **Capability id** | `marketplace_partner_runtime` |
| **Name** | Marketplace Partner Capability Foundation |
| **Band** | Level 3 — Platform Capability Participant |
| **Outcome** | **Certified With Findings** |
| **Pilot module** | `vssyl-pilot-assets` |
| **Validator version** | Module certification **1.4.0** |
| **Blocking findings** | **0** |
| **Major findings** | **3** (F-01, F-02, F-03) |
| **Advisories** | **5** (F-04–F-08) |

---

## 2. Certified capability surfaces

| Surface | Contract | JWT audience | Default |
|---------|----------|--------------|---------|
| Search Delegate | `search-delegate` v1 | `vssyl:search-delegate:v1` | OFF |
| Workspace Bridge | `workspace-bridge` v1 | `vssyl:workspace-bridge:v1` | OFF |
| Activity Ingest | `activity-ingest` v1 | `vssyl:activity-ingest:v1` | OFF |
| Business Billing | Stripe + `BusinessModuleSubscription` | Session (platform) | ON (when configured) |
| Module Scope | `moduleScope` enum | N/A | ON |

---

## 3. Phase completion map

| Phase | Scope | Status |
|-------|-------|--------|
| 0A | Discovery, GCP, security baseline | ✅ |
| 1A | Capability participation assessment | ✅ |
| 1B-A | Search delegate architecture | ✅ |
| 1B-B | Search delegate runtime + pilot | ✅ |
| 1B-C | Workspace embed + auth bridge | ✅ |
| 1B-D | Business billing lifecycle | ✅ |
| 1B-E | Activity ingest architecture | ✅ |
| 1B-E.5 / E.5-F | Module scope + admin readiness | ✅ |
| 1B-F | Activity ingest runtime + pilot | ✅ |
| **1B-G** | **Certification review & closeout** | **✅ This record** |
| **1C** | **External partner pilot definition & audit** | **✅ Audit complete — 1C-A enablement docs complete; live pilot 1C-B** |

---

## 4. Findings on certificate

| ID | Severity | Finding | Remediation target |
|----|----------|---------|-------------------|
| F-01 | Major | No external partner E2E certified | Phase 1C-B (after 1C-A doc remediation) |
| F-02 | Major | In-memory pilot stores (jti, idempotency, rate limit) | Phase 1C / 1D ops |
| F-03 | Major | Delegate capabilities default disabled | Ops runbook + 1C enablement |
| F-04 | Minor | Personal workspace embed parity | Phase 1D+ |
| F-05 | Minor | Probe history not persisted | Admin portal enhancement |
| F-06 | Advisory | Partner SoR tenant audit not automated | Security backlog |
| F-07 | Advisory | Pilot iframe bundle consumption follow-up | Partner sandbox |
| F-08 | Advisory | V_Link / Graph / notifications / AI activity deferred | Post-1C roadmap |

---

## 5. Explicitly not certified (this record)

| Capability | Status |
|------------|--------|
| V_Link partner participation | Not implemented |
| Context Graph partner adapters | Not implemented |
| Partner notifications from activity | Not implemented |
| AI-readable partner activity | Not implemented |
| Developer portal / open ecosystem | Not implemented |
| Realtime iframe bridge | Not implemented |

---

## 6. Enablement runbook (controlled pilot)

Production or staging pilot requires:

```bash
PARTNER_SEARCH_DELEGATE_ENABLED=true
PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST=vssyl-pilot-assets

PARTNER_WORKSPACE_BRIDGE_ENABLED=true
PARTNER_WORKSPACE_BRIDGE_MODULE_ALLOWLIST=vssyl-pilot-assets

PARTNER_ACTIVITY_INGEST_ENABLED=true
PARTNER_ACTIVITY_INGEST_MODULE_ALLOWLIST=vssyl-pilot-assets
```

Plus: module **APPROVED**, certification passed, business install + entitlement, admin probe pass.

---

## 7. Promotion criteria to Level 4

| # | Criterion |
|---|-----------|
| 1 | At least one **external** partner module certified E2E |
| 2 | Redis-backed (or equivalent) jti + idempotency + rate limits |
| 3 | Partner delegate metrics and rejection telemetry in Admin Portal |
| 4 | Production runbook with rollback tested |
| 5 | Developer-facing contract docs (internal minimum) |
| 6 | Security review of first external partner SoR |

---

## 8. Sign-off

| Role | Status | Date |
|------|--------|------|
| Architecture governance (Phase 1B-G review) | ✅ Recorded | 2026-06-24 |
| External partner pilot authorization | 🟡 Deferred to 1C | — |
| Open ecosystem authorization | ❌ Not authorized | — |

---

**Last updated:** 2026-06-24
