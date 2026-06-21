# PP-2 — Settings Platform Certification Readiness

**Program:** Account Platform Phase 0B-2 — Settings Platform Audit  
**Date:** 2026-06-19  
**Status:** Discovery only — **no certification execution**

---

## Readiness determination

| Option | Selected? |
|--------|-----------|
| NOT CERTIFIABLE | ✅ **Today** |
| READY FOR AUDIT | ✅ **After Phase 0B-2** (this package) |
| READY FOR REVIEW (L3 eval) | ❌ — requires PP-1 + PP-2 implementation |
| L3 WITH FINDINGS candidate | ❌ — post-implementation |
| Plain L3 candidate | ❌ |

**Headline:** Settings Platform is **NOT READY** (~37% gates). **PP-1 must precede PP-2 implementation.**

---

## G1–G9 estimate (Settings Platform slice)

| Gate | Score | Status | Evidence |
|------|------:|--------|----------|
| **G1** Authorization | 1 | **FAIL** | No PE on notification/privacy pref writes |
| **G2** Auditability | 1 | **FAIL** | Fragmented events; notification writes silent |
| **G3** Service boundaries | 1 | **FAIL** | No `settingsService`; controllers inline Prisma |
| **G4** API coherence | 1 | **FAIL** | `/settings` missing; 22+ route families |
| **G5** Ownership | 1 | **FAIL** | No enforced model until PP-2 doc (this audit) |
| **G6** Test evidence | 1 | **FAIL** | No settings platform integration tests |
| **G7** Documentation | 2 | **PARTIAL** | Phase 0A/0B docs; hub map new |
| **G8** Production safety | 2 | **PARTIAL** | Functional but drift-prone |
| **G9** UX consistency | 1 | **FAIL** | 16 hubs; stale placeholders; duplicates |
| **Total** | **~10/27 (~37%)** | **NOT READY** | |

*Post PP-1 + PP-2 implementation target: **~18–21/27** for L3 WITH FINDINGS.*

---

## Blocking findings

| ID | Finding | Why blocking |
|----|---------|--------------|
| **PP2-F01** | No Settings Platform capability | Cannot certify what isn't bounded |
| **PP2-F02** | `/settings` API contract missing | Documented client contract broken |
| **PP2-F03** | No preference key registry | Cannot enforce ownership or validation |

---

## Major findings (non-blocking for charter, blocking for cert)

| ID | Finding | Gate |
|----|---------|------|
| PP2-F04 | 16 fragmented hubs | G9 |
| PP2-F05 | Business settings triplication | G5, G9 |
| PP2-F06 | Triple notification write path | G3, G2 |
| PP2-F07 | Theme localStorage only | G4, G9 |
| PP2-F08 | Privacy outside settings hub | G9 |
| PP2-F09 | Notification writes bypass preference service | G2, G3 |

---

## Likely certification path

```
Phase 0B-2 (this audit) ✅
    ↓
PP-1 Implementation (prerequisite)
    ↓ profileService + userPreferenceService registry
PP-2 Implementation Charter
    ↓ settingsService + /api/settings + hub IA
PP-2 Validation + matrix re-audit
    ↓
PP-2 Certification Evaluation
    ↓ Recommend L3 WITH FINDINGS
Council ratification → governance execution
```

**Earliest PP-2 evaluation:** After PP-1 phases 1–3 + PP-2 implementation — likely **Q1–Q2 2027**.

**Alternative:** Certify **combined Account Platform** umbrella row linking PP-1 + PP-2 sub-capabilities after both reach WITH FINDINGS.

---

## Dependencies

### On PP-1 (hard)

| PP-1 deliverable | PP-2 needs it for |
|----------------|-----------------|
| `profileService` | Settings hub account section |
| Expanded `userPreferenceService` | Registry enforcement |
| `privacyService` | Privacy section embed/link |
| Preference domain events | Unified audit trail |

**PP-2 implementation should not start before PP-1 phases 1–3.**

### On PP-3 (soft)

| Link | Impact |
|------|--------|
| Billing tab in business settings | UX cross-link only |
| Avatar BillingModal | Not Settings SoR |
| Tier-gated module settings (HR) | Uses entitlements read — no PP-3 cert required for PP-2 |

---

## Reference capability potential

| Designation | Assessment |
|-------------|------------|
| Reference Implementation (L4) | **Denied** |
| **Reference Candidate — Settings IA & Preference Registry** | **Possible post-L3** — if unified hub + key registry become teaching patterns |
| UX Reference slot | **No** — Notifications UX Ref #2 is delivery, not settings platform |

**Not reference today:** Fragmentation is the anti-pattern to document, not copy.

---

## Pre-certification checklist

| # | Requirement | Status |
|---|-------------|--------|
| P1 | PP-2 reality + fragmentation analysis | ✅ |
| P2 | PP-2 operation matrix | ✅ |
| P3 | PP-2 ownership model | ✅ |
| P4 | PP-1 implementation (minimum) | ❌ |
| P5 | `settingsService` + `/api/settings` | ❌ |
| P6 | Hub IA consolidation | ❌ |
| P7 | Integration tests | ❌ |
| P8 | Matrix re-audit | ❌ |

---

## Related

- [PP2_SETTINGS_EXECUTIVE_SUMMARY.md](./PP2_SETTINGS_EXECUTIVE_SUMMARY.md)
- [PP1_IDENTITY_PROFILE_CERTIFICATION_READINESS.md](./PP1_IDENTITY_PROFILE_CERTIFICATION_READINESS.md)

**Last updated:** 2026-06-19 (Phase 0B-2)
