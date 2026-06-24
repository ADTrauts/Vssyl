# Marketplace Partner Capability — Certification Review

**Program:** Marketplace & Module Ecosystem — Phase 1B-G  
**Date:** 2026-06-24  
**Status:** Governance review — **no runtime implementation**  
**Pilot module:** `vssyl-pilot-assets`  
**Authority:** Phases 0A–1B-F closeouts, [`moduleSpecs.md`](../../memory-bank/moduleSpecs.md), [`THIRD_PARTY_MODULE_RULEBOOK.md`](../guides/THIRD_PARTY_MODULE_RULEBOOK.md)

---

## 1. Executive summary

The Marketplace Partner Capability stack has crossed from **installable third-party modules** to **governed platform capability participation** for a curated pilot cohort. Search Delegate, Workspace Bridge, Business Billing, Activity Ingest, and Module Scope enforcement are implemented, certified in the validator, and probeable from Admin Portal.

**Certification recommendation:** **Level 3 — Platform Capability Participant (Certified With Findings)**

The stack is **ready for controlled partner pilots** under feature flags and allowlists. It is **not ready** for open third-party developers or Level 4/5 ecosystem posture without external partner validation and operational hardening.

**Record:** [MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md](./MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md)

---

## 2. Certification scorecard (partner ecosystem levels)

| Level | Name | Definition | Current posture |
|-------|------|------------|-----------------|
| **0** | No Partner Runtime | No third-party execution path | ❌ Superseded |
| **1** | Hosted Partner Module | iframe/GCS runtime only | ✅ Exceeded |
| **2** | Governed Partner Runtime | Admin review, certification, scope gates | ✅ Met |
| **3** | Platform Capability Participant | Delegate participation in search, workspace, billing, activity | ✅ **Met (pilot-gated)** |
| **4** | Certified Partner Ecosystem Foundation | External partners certified E2E; production ops | 🟡 **Not met** |
| **5** | Open Marketplace Platform | Public developer program, open allowlist | ❌ Not met |

### Determination

| Dimension | Level | Rationale |
|-----------|-------|-----------|
| **Runtime capability** | **3** | All four delegate surfaces implemented; pilot module registered |
| **Governance & certification** | **3 CwF** | Validator v1.4.0, readiness card, probes; no external partner record |
| **Security posture** | **3 CwF** | JWT boundaries strong; partner SoR trust gap remains |
| **Operational readiness** | **2–3 CwF** | Cloud Run/GCS fit confirmed; in-memory pilot stores; flags default off |
| **Composite recommendation** | **3 CwF** | Controlled pilots yes; open ecosystem no |

---

## 3. Runtime capability review

| Capability | Implementation | Certification | Pilot | Finding |
|------------|----------------|---------------|-------|---------|
| **Module upload / lifecycle** | ✅ Submit, scan, approve, publish, rollback | ✅ Structural validator + admin gates | ✅ | Artifact upload requires GCS in prod |
| **GCS artifact execution** | ✅ Signed URLs, private bucket, 500 MB cap | ✅ Scan + forbidden keys | ✅ | CI does not exercise GCS path by default |
| **Sandbox module runtime** | ✅ `/modules/run`, ModuleHost iframe | ✅ | ✅ | Blob bundle reduces iframe isolation vs cross-origin |
| **Workspace embed** | ✅ `PartnerModuleWorkspaceEmbed`, business default route | ✅ `workspace_participation` | ✅ | Personal workspace parity deferred |
| **Auth bridge** | ✅ postMessage + bridge JWT (`vssyl:workspace-bridge:v1`) | ✅ | ✅ | No session token in postMessage |
| **Search delegate** | ✅ Registry, JWT, proxy, normalizer, Unified Search merge | ✅ `search_delegate` | ✅ | Default `PARTNER_SEARCH_DELEGATE_ENABLED=false` |
| **Business billing** | ✅ `BusinessModuleSubscription` write path + entitlement gates | ✅ Scope + install gates | ✅ | Paid path requires Stripe configuration |
| **Activity ingest** | ✅ JWT, registry, ingest service, `emitModuleActivityEvent` | ✅ `activity_ingest` v1.4.0 | ✅ | In-memory idempotency; default flag off |
| **Scope enforcement** | ✅ `moduleScope` authoritative; install/browse/billing gates | ✅ Validator v1.3.0+ | ✅ | Household scope deferred |

**Evidence:** [MARKETPLACE_PHASE_1B_B_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_B_CLOSEOUT.md), [MARKETPLACE_PHASE_1B_C_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_C_CLOSEOUT.md), [MARKETPLACE_PHASE_1B_D_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_D_CLOSEOUT.md), [MARKETPLACE_PHASE_1B_E5F_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_E5F_CLOSEOUT.md), [MARKETPLACE_PHASE_1B_F_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_F_CLOSEOUT.md)

---

## 4. Security review (summary)

Full detail: [MARKETPLACE_PARTNER_SECURITY_REVIEW.md](./MARKETPLACE_PARTNER_SECURITY_REVIEW.md)

| Control area | Status | Notes |
|--------------|--------|-------|
| iframe isolation | ✅ Partial | sandbox attrs + origin checks; blob mode weaker |
| Bridge JWTs | ✅ | Short TTL, distinct audience, module + tenant binding |
| Search delegate JWTs | ✅ | 60s TTL, jti replay, moduleId pin on results |
| Activity ingest JWTs | ✅ | 90s TTL, jti replay, actor hash match |
| Tenant isolation (platform) | ✅ Strong | dashboardId/businessId on all platform paths |
| Tenant isolation (partner SoR) | 🟡 Partner obligation | MS-01 — not automated |
| moduleId pinning | ✅ | URL path + JWT claims enforced |
| jti replay protection | ✅ | Per-surface in-memory cache (pilot) |
| Entitlement checks | ✅ | Install + `evaluateBusinessModuleEntitlement` |
| Certification gates | ✅ | v1.4.0 blocks promote on capability mismatch |
| Admin probes | ✅ | Search, workspace, billing, activity |

---

## 5. Admin Portal review

Prior audit (1B-E.5) gaps **substantially closed** in 1B-E.5-F and 1B-F.

| Surface | Status | Notes |
|---------|--------|-------|
| Submission status | ✅ | List, filters, bulk actions |
| Certification status | ✅ | Inline panel + stored version status |
| Sandbox / artifact scan | ✅ | Scan badge + publish readiness |
| Search delegate status | ✅ | Readiness card + probe button |
| Workspace bridge status | ✅ | Readiness card + probe button |
| Business billing readiness | ✅ | Readiness card + probe button |
| Activity ingest status | ✅ | Readiness card + probe button (1B-F) |
| Module scope | ✅ | Scope badge on readiness card |
| Readiness card completeness | ✅ | All four delegate capabilities + cert + scope |

**Remaining admin gaps (non-blocking for pilot):**

| ID | Gap | Severity |
|----|-----|----------|
| AP-G07 | No probe result history persisted in UI | Advisory |
| AP-G08 | No aggregate sandbox pilot dashboard | Advisory |
| AP-G09 | AI Context tab does not show delegate readiness | Advisory |

**Evidence:** [MARKETPLACE_ADMIN_READINESS_CARD.md](./MARKETPLACE_ADMIN_READINESS_CARD.md), [ADMIN_PORTAL_MARKETPLACE_ALIGNMENT_REVIEW.md](./ADMIN_PORTAL_MARKETPLACE_ALIGNMENT_REVIEW.md) (superseded for probe/scope gaps)

---

## 6. Pilot module review (`vssyl-pilot-assets`)

| Dimension | Expected | Status |
|-----------|----------|--------|
| Install (business) | Free/paid entitlement path | ✅ Gated by scope + subscription |
| Business billing | Entitlement probe | ✅ Admin billing probe |
| Workspace embed | Business hub default route | ✅ Bridge probe |
| Search delegate | Unified Search merge | ✅ Search probe (`?live=true`) |
| Activity ingest | Normalized platform activity | ✅ Activity probe (`?live=true`) |
| Admin probes | All four capabilities | ✅ |
| Scope enforcement | `moduleScope: business` | ✅ |

**Pilot limitation:** Internal sandbox registration only — **no external partner module** has completed full E2E certification.

**Evidence:** [SEARCH_DELEGATE_SANDBOX_PILOT.md](./SEARCH_DELEGATE_SANDBOX_PILOT.md), [PARTNER_ACTIVITY_SANDBOX_PILOT.md](./PARTNER_ACTIVITY_SANDBOX_PILOT.md)

---

## 7. GCP operational review (summary)

Full Phase 0A analysis remains valid; partner delegates add **application-layer** egress to partner HTTPS endpoints.

| Area | Status | Notes |
|------|--------|-------|
| Cloud Run compatibility | ✅ | Stateless API; no in-process partner code |
| GCS artifact runtime | ✅ | Private artifacts + signed URLs |
| Egress behavior | 🟡 | Server-side fetch to partner delegate URLs; timeout/circuit patterns in search proxy |
| Environment flags | ✅ | All partner capabilities flag-gated + allowlist |
| Rollback controls | ✅ | Version promote/rollback in admin |
| Deployment readiness | ✅ | No new GCP services required for pilot |

**Pilot ops note:** In-memory registries, jti caches, and idempotency stores are **not multi-instance safe** until Redis or equivalent (Phase 1C+ hardening).

**Evidence:** [MARKETPLACE_GCP_DEPLOYMENT_ANALYSIS.md](./MARKETPLACE_GCP_DEPLOYMENT_ANALYSIS.md)

---

## 8. Blockers

### Blockers to Level 4 (Certified Partner Ecosystem Foundation)

| ID | Blocker | Owner |
|----|---------|-------|
| MP-01 | No **external partner** certified E2E | Marketplace 1C |
| MP-02 | All delegate capabilities **default disabled** | Ops / config |
| MP-03 | In-memory idempotency / jti / rate limits | Platform eng |
| MP-04 | No partner delegate **metrics / rejection dashboards** | Platform eng |
| MP-05 | Partner API permission enforcement **not audited** (MS-01) | Security |
| MP-06 | GCS artifact path **not in CI** by default | DevOps |
| MP-07 | Personal workspace embed parity | Marketplace |

### Blockers to Level 5 (Open Marketplace)

| ID | Blocker |
|----|---------|
| MP-08 | No developer portal / public docs |
| MP-09 | No open allowlist policy |
| MP-10 | No automated runtime compliance scanning |
| MP-11 | No partner SLA / abuse monitoring tier |
| MP-12 | Legal/commercial partner agreement workflow |

---

## 9. Findings register

| ID | Severity | Finding |
|----|----------|---------|
| F-01 | Major | External partner E2E not demonstrated |
| F-02 | Major | Pilot stores in-memory — Cloud Run multi-instance risk |
| F-03 | Major | Feature flags default off — production enablement is manual |
| F-04 | Minor | Personal workspace embed not parity with business |
| F-05 | Minor | Probe results not persisted for audit trail |
| F-06 | Advisory | Partner SoR tenant scoping relies on certification honor system |
| F-07 | Advisory | Sandbox HTML bundle for pilot iframe consumption documented as follow-up (1B-C) |
| F-08 | Advisory | V_Link, Context Graph, notifications, AI activity remain first-party only |

---

## 10. Certification recommendation

| Question | Answer |
|----------|--------|
| Crossed from installable marketplace to ecosystem foundation? | **Partially** — runtime foundation yes; **certified ecosystem foundation (L4) not yet** |
| Ready for controlled partner pilots? | **Yes** — with allowlist, flags, admin review, probe pass |
| Ready for open third-party developers? | **No** |
| Recommended band | **Level 3 — Platform Capability Participant (Certified With Findings)** |

**Council action:** Accept Phase 1B foundation closeout; authorize **Phase 1C — External Partner Pilot** as next engineering wave.

---

## 11. Test evidence

| Suite | Location | Approx. coverage |
|-------|----------|------------------|
| Marketplace delegate tests | `server/src/marketplace/__tests__/` | 16 files — JWT, registry, proxy, scope, billing, activity |
| Certification validator | `moduleCertificationValidator.test.ts` | Scope + capability checklist |
| Scope enforcement | `moduleScopeService.test.ts` | Install/browse/billing gates |

Phase 1B-E.5-F reported **63+** marketplace-related tests passing at scope enforcement closeout; activity ingest adds **14** tests (1B-F).

---

**Last updated:** 2026-06-24
