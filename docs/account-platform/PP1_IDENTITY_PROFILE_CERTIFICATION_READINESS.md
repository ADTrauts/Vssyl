# PP-1 — Identity & Profile Certification Readiness

**Program:** Account Platform Phase 0B-1 — Identity & Profile Platform Audit  
**Date:** 2026-06-19  
**Status:** Discovery only — **no certification execution**

**Framework:** Adapted G1–G9 platform capability gates (consistent with Admin Portal, BO, Reference Workspace programs).

---

## Readiness determination

| Option | Selected? |
|--------|-----------|
| NOT CERTIFIABLE | ✅ **Today** |
| READY FOR AUDIT | ✅ **After Phase 0B-1** (this package) |
| READY FOR REVIEW (L3 eval) | ❌ — requires PP-1 implementation charter |
| L3 WITH FINDINGS candidate | ❌ — post-implementation |
| Plain L3 candidate | ❌ |

**Headline:** PP-1 is **READY FOR IMPLEMENTATION CHARTER** planning — not certification evaluation.

---

## G1–G9 estimate (current state)

| Gate | Score | Status | Evidence |
|------|------:|--------|----------|
| **G1** Authorization | 1 | **FAIL** | No PE on profile, photo, privacy, connection writes |
| **G2** Auditability | 1 | **FAIL** | No normalized activity on most mutations; security events partial |
| **G3** Service boundaries | 1 | **FAIL** | Inline `index.ts`; fat controllers; no `profileService` |
| **G4** API coherence | 2 | **PARTIAL** | REST-ish routes exist; fragmented namespaces |
| **G5** Ownership | 1 | **FAIL** | No enforced ownership model (now documented PP-1) |
| **G6** Test evidence | 1 | **FAIL** | No profile/photo/privacy integration test suite |
| **G7** Documentation | 2 | **PARTIAL** | Phase 0A/0B docs; no prior operation matrix |
| **G8** Production safety | 2 | **PARTIAL** | Auth hardened; MFA missing; misleading 2FA UI |
| **G9** UX consistency | 2 | **PARTIAL** | Profile settings hub exists; split privacy path |
| **Total** | **~12/27 (~44%)** | **NOT READY** | |

*Post-PP-1 implementation target: **~18–22/27 (~67–81%)** for L3 WITH FINDINGS evaluation.*

---

## Operation matrix compliance

From [PP1_IDENTITY_PROFILE_OPERATION_MATRIX.md](./PP1_IDENTITY_PROFILE_OPERATION_MATRIX.md):

| Metric | Value |
|--------|-------|
| Compliant (C) rows | **4** (~10%) |
| Partial (P) rows | **28** (~70%) |
| Non-compliant (N) rows | **7** (~17%) |

**Blocking majors for certification review:** PP1-F01 through PP1-F06 (see operation matrix).

---

## Likely findings at certification evaluation

| ID | Severity | Finding | Gate |
|----|----------|---------|------|
| PP1-F01 | **Major** | No `profileService` | G3 |
| PP1-F02 | **Major** | Auth routes inline in `index.ts` | G3, G7 |
| PP1-F03 | **Major** | MFA not implemented | G8 |
| PP1-F04 | **Major** | Photo logic in controller only | G3 |
| PP1-F05 | **Major** | Connection mutations without PE | G1 |
| PP1-F06 | **Major** | Privacy updates without PE/activity | G1, G2 |
| PP1-F07 | Advisory | Notification pref fragmentation | G5 |
| PP1-F08 | Advisory | No session management UX | G9 |
| PP1-F09 | Advisory | Legacy photo URL dual fields | G4 |
| PP1-F10 | Advisory | Misleading 2FA UI (business settings) | G9 |
| PP1-F11 | Advisory | No Global Trash handler for photos | G8 |
| PP1-F12 | Advisory | `useUserSettings` `/settings` drift | G4 — PP-2 |

**Expected open advisories at WITH FINDINGS:** 6–10 if majors closed.

---

## Likely certification level

| Outcome | Probability | Conditions |
|---------|-------------|------------|
| **NOT CERTIFIABLE** | **Today** | Current posture |
| **L3 WITH FINDINGS** | **High** (first award) | Majors closed + operation matrix ≥60% C/P |
| **Plain L3** | **Low** (first pass) | MFA + advisories ≤3 + G6 PASS |

**Precedent:** Business Operations L3 WITH FINDINGS at 24/27; Reference Workspace WS-L3 WITH FINDINGS at 23/27 with 11 advisories.

---

## Reference capability potential

| Designation | Assessment |
|-------------|------------|
| **Reference Implementation (L4)** | **Denied** — File Hub only |
| **Architecture Reference Module #N** | **Not applicable** — platform capability not module |
| **Reference Candidate — Identity Foundation** | **Possible post-L3** — if `profileService` + photo pipeline become teaching patterns |
| **UX Reference slot** | **No** |

**Teaching value (future):** Photo library + slot assignment + authenticated serve proxy + Vssyl ID — **after** service extraction and certification.

**Not reference today:** Fragmentation and inline routes are anti-patterns, not copy targets.

---

## Certification path (recommended)

```
Phase 0B-1 (this audit) ✅
    ↓
PP-1 Implementation Charter (council — NOT authorized by 0B-1)
    ↓ Service extraction phases 1–6
PP-1 Validation + matrix re-audit
    ↓
PP-1 Certification Evaluation (WS-L3-1 analog)
    ↓ Recommend L3 WITH FINDINGS
Council Ratification
    ↓
Governance Execution + optional ledger platform capability row
```

**Earliest evaluation:** Q1 2027 aligned with portfolio roadmap — assumes charter approved Q4 2026.

---

## Pre-certification checklist

| # | Requirement | Status |
|---|-------------|--------|
| P1 | PP-1 reality assessment | ✅ Phase 0B-1 |
| P2 | PP-1 operation matrix | ✅ This package |
| P3 | PP-1 ownership model | ✅ This package |
| P4 | Service boundary analysis | ✅ This package |
| P5 | Implementation charter approved | ❌ |
| P6 | Service extraction complete | ❌ |
| P7 | Integration test suite | ❌ |
| P8 | Matrix re-audit ≥60% C/P | ❌ |
| P9 | Findings register with closure evidence | ❌ |

---

## Dependencies on PP-2 and PP-3

| Dependency | Direction | Impact on PP-1 cert |
|------------|-----------|-------------------|
| **PP-2 Settings** | PP-2 benefits from PP-1 `profileService` + preference registry | PP-1 can certify **without** PP-2 complete |
| **PP-2 Settings** | Privacy IA unification | Advisory PP1-F10/F08 — can remain on certificate |
| **PP-3 Billing** | `User.stripeCustomerId` on User model | **No blocker** — Billing owns subscription SoR |
| **PP-3 Billing** | Avatar menu BillingModal entry | UX cross-link only |

**PP-1 certification does not require Billing L3.**

---

## Related

- [PP1_IDENTITY_PROFILE_EXECUTIVE_SUMMARY.md](./PP1_IDENTITY_PROFILE_EXECUTIVE_SUMMARY.md)
- [ACCOUNT_PLATFORM_CERTIFICATION_READINESS.md](./ACCOUNT_PLATFORM_CERTIFICATION_READINESS.md)

**Last updated:** 2026-06-19 (Phase 0B-1)
