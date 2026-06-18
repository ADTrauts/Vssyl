# Business Administration Reference Status Review

**Program:** BA-5 — Post-Remediation Promotion Review  
**Date:** 2026-06-18  
**Status:** Recommendation only — no reference designation awarded  
**Parent:** [BUSINESS_ADMINISTRATION_REFERENCE_CANDIDATE_DECISION.md](./BUSINESS_ADMINISTRATION_REFERENCE_CANDIDATE_DECISION.md) (BA-3)

---

## 1. Reference determination summary

| Designation | BA-3 (ratified) | BA-5 recommendation |
|-------------|-----------------|---------------------|
| Reference Domain | Denied | **Denied** (unchanged) |
| Reference Implementation (L4) | Denied | **Denied** (unchanged) |
| **#OC-1** Org Chart | **Candidate** | **Reference Platform Capability With Findings** |
| **#OC-2** Permissions | **Candidate** | **Reference Platform Capability With Findings** |
| **#OC-3** Approval Boundaries | **Deferred** | **Reference Platform Capability With Findings** |
| Plain Reference Platform Capability | Not awarded | **Defer** — open advisories prevent zero-finding reference bar |

---

## 2. Eligibility verification (post BA-4)

### #OC-1 — Org Chart Identity & Structure

| Criterion | Evidence | Reference bar |
|-----------|----------|---------------|
| Teaching value | Identity hub; tier/department/position; `EmployeePosition` extension | **Met** |
| Service boundaries | Thin routes; named services; BA-1B extraction | **Met** |
| Constitutional compliance | G2/G3/G6 PASS; activity + PE on structure mutations | **Met** |
| Test evidence | BA-1D integration + org-chart PE tests | **Met** |
| UX reference | BA-1E PASS; 97 token residual advisory | **Met With Findings** |
| Open advisories | BA-F-008 mount fragmentation; BA-F-011 matrix path | **Findings attach** |

**Recommendation:** Promote from **Candidate** → **Reference Platform Capability With Findings**.

**Not** plain Reference Platform Capability until BA-F-008/011 closed or accepted at council zero-advisory vote.

---

### #OC-2 — Permission Sets & Module Access

| Criterion | Evidence | Reference bar |
|-----------|----------|---------------|
| Teaching value | Module access gating; catalog vs PE dual layer | **Met** |
| Implementation | `permissionService`; PE on permission mutations | **Met** |
| Pairs with #OC-1 | Org-chart mount; not standalone module | **Met** |
| Open advisories | BA-F-003-R1 integration PE (peripheral to permissions core) | **Minor attach** |

**Recommendation:** Promote from **Candidate** → **Reference Platform Capability With Findings**.

---

### #OC-3 — Approval Boundaries

| Criterion | Pre BA-4 | Post BA-4 |
|-----------|----------|-----------|
| Model | Prisma only | Runtime **implemented** |
| API | None | 10 routes; `approvalHierarchyService` |
| PE + activity + events | None | **Complete** (BA-4) |
| Admin UI | None | **None** — advisory |
| Workflow consumption | Deferred | **Deferred** (by design) |
| Tests | None | 11/11 PASS |

**BA-3 deferral condition met:** approval hierarchy runtime exists.

**Recommendation:** Promote from **Deferred** → **Reference Platform Capability With Findings**.

**Advisory notation:** No admin UI for hierarchy management; API-only platform layer. Future HR/Scheduling consumers use `resolveApprovalChain()`.

**Not** plain Reference Platform Capability until admin UI ships or council documents API-only reference pattern.

---

## 3. Comparison to Admin Portal reference promotion

| Field | Admin Portal (post-promotion) | Business Administration (BA-5) |
|-------|------------------------------|--------------------------------|
| Certification | LEVEL 3 CERTIFIED | **Recommend LEVEL 3 CERTIFIED** |
| Open findings | 0 | 0 majors; **6 advisories** |
| G1–G9 | 27/27 | **23/27** |
| Reference sub-designation | Control Plane **Reference With Findings** | Platform Capabilities **With Findings** (#OC-1/2/3) |
| Reference Module integer | N/A (control plane) | N/A (platform capabilities — separate taxonomy) |

Admin Portal achieved **zero advisories** before reference promotion. BA retains advisories — **With Findings** sub-designation is appropriate; plain Reference Platform Capability is **not** recommended.

---

## 4. Registry update recommendation (not executed)

Add or update annex in `REFERENCE_MODULE_CATALOG.md`:

```markdown
## Business Administration — Platform Capabilities (promoted 2026-06-18)

| # | Capability | Status | Primary audit |
|---|------------|--------|---------------|
| **OC-1** | Org Chart Identity & Structure | **With Findings** | BUSINESS_ADMINISTRATION_PROMOTION_REVIEW.md |
| **OC-2** | Permission Sets & Module Access | **With Findings** | BA_1C_IMPLEMENTATION_REPORT.md |
| **OC-3** | Approval Boundaries | **With Findings** | BA_4_APPROVAL_HIERARCHY_ARCHITECTURE.md |
```

---

## 5. What does not change

| Item | Status |
|------|--------|
| Reference Domain | **Not eligible** — BO program |
| Reference Module #N integer | **Not assigned** — OC taxonomy is platform capability track |
| Reference Implementation (L4) | **Denied** |
| UX Reference #N | **Not in scope** — architecture track only |

---

## 6. Reference recommendation (summary)

| Capability | Move from | Move to |
|------------|-----------|---------|
| **#OC-1** | Reference Capability **Candidate** | **Reference Platform Capability With Findings** |
| **#OC-2** | Reference Capability **Candidate** | **Reference Platform Capability With Findings** |
| **#OC-3** | **Deferred** | **Reference Platform Capability With Findings** |

---

## Related

- [BUSINESS_ADMINISTRATION_PROMOTION_REVIEW.md](./BUSINESS_ADMINISTRATION_PROMOTION_REVIEW.md)
- [BUSINESS_ADMINISTRATION_REFERENCE_REVIEW.md](./BUSINESS_ADMINISTRATION_REFERENCE_REVIEW.md)
- [ADMIN_PORTAL_REFERENCE_STATUS_REVIEW.md](../architecture/audits/ADMIN_PORTAL_REFERENCE_STATUS_REVIEW.md) (precedent — if present)

**Last updated:** 2026-06-18
