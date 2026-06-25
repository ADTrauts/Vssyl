# Admin Portal — Marketplace Governance Review

**Program:** Admin Portal Program — Phase 0A  
**Date:** 2026-06-24  
**Status:** Discovery only

**Context:** Marketplace Partner Capability Foundation certified **Level 3 CwF** (2026-06-24). Admin Portal is the **canonical operator surface** for partner module governance, certification, and delegate probes.

**Related:** [`MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_REVIEW.md`](../marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_REVIEW.md) · [Capability Matrix](./ADMIN_PORTAL_CAPABILITY_MATRIX.md) · [`MARKETPLACE_ADMIN_READINESS_CARD.md`](../marketplace/MARKETPLACE_ADMIN_READINESS_CARD.md)

---

## 1. Executive summary

**Is Marketplace governance complete in Admin Portal?**

**For controlled pilot cohort: Yes (~85%).**  
**For open partner ecosystem: No (~45%).**

Admin Portal provides production-grade **submission review**, **certification gating**, **artifact scan visibility**, and **four delegate probes** (Search, Workspace Bridge, Business Billing, Activity Ingest) via the Marketplace Readiness Card. Prior audit gaps (1B-E.5) are **substantially closed** in phases 1B-E.5-F and 1B-F.

Remaining gaps are **operator experience and scale** issues — not missing core governance mechanics.

---

## 2. Governance surface inventory

### 2.1 Canonical UI

| Surface | Path | Component | Status |
|---------|------|-----------|--------|
| Module submissions list | `/admin-portal/modules` | modules page — Submissions tab | ✅ Implemented |
| Submission detail modal | modules page | Modal with manifest, versions, scan | ✅ Implemented |
| Certification review | modules page | `ModuleCertificationReviewPanel` | ✅ Implemented |
| Marketplace readiness | modules page | `MarketplaceReadinessCard` | ✅ Implemented |
| AI Context status | modules page — AI Context tab | Provider test + registration | ✅ Implemented |
| Developer oversight | `/admin-portal/developers` | Developer stats | ✅ Implemented |
| Version promote/rollback | modules actions | API-gated by certification | ✅ Implemented |

### 2.2 Canonical API — module governance domain

| Method | Route | Function |
|--------|-------|----------|
| GET | `/api/admin-portal/modules/submissions` | List/filter submissions |
| GET | `/api/admin-portal/modules/stats` | Aggregate module stats |
| POST | `/api/admin-portal/modules/submissions/:id/review` | Approve/reject |
| POST | `/api/admin-portal/modules/bulk-action` | Bulk approve/reject |
| GET | `/api/admin-portal/modules/:moduleId/versions` | Version history |
| GET | `/api/admin-portal/modules/analytics` | Module analytics |
| GET | `/api/admin-portal/modules/developers/stats` | Developer stats |
| GET | `/api/admin-portal/modules/:moduleId/revenue` | Module revenue |
| GET | `/api/admin-portal/modules/export` | Export module data |
| GET | `/api/admin-portal/modules/:moduleId/marketplace-readiness` | Readiness DTO |
| GET | `/api/admin-portal/modules/:moduleId/search-delegate-probe` | Search delegate probe |
| GET | `/api/admin-portal/modules/:moduleId/workspace-bridge-probe` | Workspace bridge probe |
| GET | `/api/admin-portal/modules/:moduleId/business-billing-probe` | Billing entitlement probe |
| GET | `/api/admin-portal/modules/:moduleId/activity-ingest-probe` | Activity ingest probe |

**Auth note:** Probe and readiness routes use inline `req.user.role === 'ADMIN'` check rather than shared middleware — functionally equivalent if JWT middleware runs globally; inconsistent with other routes.

---

## 3. Readiness card review

**Component:** `web/src/components/admin/MarketplaceReadinessCard.tsx`  
**Client methods:** `adminApiService.getMarketplaceReadiness`, `runSearchDelegateProbe`, `runWorkspaceBridgeProbe`, `runBusinessBillingProbe`, `runActivityIngestProbe`

### 3.1 Displayed readiness dimensions

| Dimension | Shown on card | Probe button |
|-----------|---------------|--------------|
| Module scope | ✅ Badge (personal/business/both/internal) | — |
| Search delegate | ✅ Declared / registered / ready | ✅ Search probe |
| Workspace bridge | ✅ Declared / registered / allowlisted | ✅ Workspace probe |
| Business billing | ✅ Paid vs free / scope compatibility | ✅ Billing probe |
| Activity ingest | ✅ Declared / registered / cert active | ✅ Activity probe |
| Certification status | ✅ Via parent certification panel | — |

### 3.2 Probe behavior

| Probe | Live execution | Sandbox pilot support | Notes |
|-------|----------------|----------------------|-------|
| Search delegate | Optional `?live=true` | `vssyl-pilot-assets` manifest snapshot | Exercises registry + optional live call |
| Workspace bridge | Default dry probe | Pilot workspace manifest snapshot | Business context default `sandbox-business-a` |
| Business billing | Entitlement evaluation | Configurable `businessId` query | No Stripe charge in probe |
| Activity ingest | Optional `?live=true` | Pilot activity registration | JWT + ingest path validation |

**UX gap:** On success, UI shows *"probe completed — see server response in network tab"* — operators lack inline structured results.

---

## 4. Certification tooling review

### 4.1 Validator integration

| Capability | Status | Evidence |
|------------|--------|----------|
| Structural manifest validation | ✅ | Validator v1.4.0 |
| Capability mismatch blocks promote | ✅ | `ModuleVersionCertificationBlockedError` |
| Checklist in UI | ✅ | `ModuleCertificationReviewPanel` |
| Validator version displayed | ✅ | Panel shows version + validatedAt |
| Smart artifact scan | ✅ | Scan verdict on submission rows |
| Scope enforcement (moduleScope) | ✅ | Validator v1.3.0+ |

### 4.2 Certification workflow completeness

| Workflow step | Admin Portal support | Complete? |
|---------------|---------------------|-----------|
| Developer submits module | User-facing `/modules` — not AP | N/A |
| Admin reviews submission | ✅ List + modal | Yes |
| Run certification validator | ✅ On promote + displayed status | Yes |
| Review readiness probes | ✅ Manual probe buttons | Partial — no auto-run on review |
| Approve/reject submission | ✅ With notes | Yes |
| Publish / promote version | ✅ With certification gate | Yes |
| Rollback version | ✅ API exists | Yes |
| External partner E2E record | ❌ No external partner certified | No — pilot internal only |

---

## 5. Sandbox testing review

| Sandbox capability | Admin Portal role | Status |
|--------------------|-------------------|--------|
| Pilot module registration | Server-side sandbox pilots | ✅ Internal only |
| Module runtime iframe | User `/modules/run` — not AP | Out of AP scope |
| Probe against sandbox business | Default `sandbox-business-a` | ✅ |
| Sandbox pilot dashboard | — | ❌ Missing (AP-G08) |
| Feature flag visibility in UI | — | ❌ Flags not shown on readiness card |
| Multi-instance pilot store warning | — | ❌ Not surfaced to operators |

**Verdict:** Sandbox **testing mechanics exist** via probes; **sandbox program oversight UI does not**.

---

## 6. Gap register

| ID | Gap | Severity | Blocks pilot? | Blocks open ecosystem? |
|----|-----|----------|---------------|------------------------|
| MG-01 | No probe result history in UI | Advisory | No | No |
| MG-02 | No aggregate sandbox pilot dashboard | Advisory | No | Yes (scale) |
| MG-03 | AI Context tab lacks delegate readiness summary | Advisory | No | No |
| MG-04 | Feature flags not visible to operators on readiness card | Advisory | No | Yes |
| MG-05 | Probe auth pattern inconsistent with canonical middleware | Advisory | No | No |
| MG-06 | No external partner certification record in admin | Major | No | **Yes** |
| MG-07 | modules page UI monolith | Advisory | No | No |
| MG-08 | Personal workspace parity not in readiness card | Advisory | No | Deferred product |

**Prior gaps closed:** Search probe, workspace probe, billing probe, activity probe, scope badge, readiness service, certification v1.4.0 activity ingest gate.

---

## 7. Completeness scorecard

| Dimension | Pilot cohort (L3 CwF) | Open ecosystem (L4+) |
|-----------|----------------------:|---------------------:|
| Submission & review | **95%** | 90% |
| Certification tooling | **90%** | 85% |
| Readiness card | **90%** | 75% |
| Probe coverage | **85%** | 70% |
| Sandbox oversight | **50%** | 40% |
| Operator workflows | **80%** | 60% |
| External partner validation | **N/A (internal pilot)** | **0%** |
| **Composite** | **~85%** | **~45%** |

---

## 8. Recommendations (planning only)

1. **Declare marketplace governance pilot-complete** for Admin Portal — sufficient for Phase 1B-G partner capability certification.
2. **Phase 0B/1C admin enhancements** (not implementation now):
   - Inline probe result panel on readiness card
   - Sandbox pilot dashboard under Platform or Modules
   - Feature flag status on readiness DTO
   - Auto-run probes on certification review (optional toggle)
3. **Do not block open marketplace** on Admin Portal alone — external partner E2E and ops hardening are cross-cutting.

---

## 9. Verdict

| Question | Answer |
|----------|--------|
| Are readiness cards complete? | **Yes** for four delegate capabilities + scope |
| Are probes wired? | **Yes** — all four with sandbox pilot support |
| Are certification tools complete? | **Yes** for validator v1.4.0 + promote gate |
| Is sandbox testing complete? | **Partial** — probes yes, dashboard no |
| Is Marketplace governance complete? | **Yes for pilot; no for open ecosystem** |

---

**Last updated:** 2026-06-24 (Phase 0A discovery)
