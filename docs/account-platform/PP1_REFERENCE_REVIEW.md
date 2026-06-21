# PP-1 — Reference Review

**Program:** Account Platform — PP-1 Identity & Profile Certification Evaluation  
**Date:** 2026-06-20  
**Type:** Reference candidacy assessment — **no designation awarded**

---

## Reference review question

Should PP-1 Identity & Profile receive **reference designation** within the Vssyl platform certification framework?

---

## Reference taxonomy context

| Reference type | Applicability to PP-1 |
|----------------|----------------------|
| **Reference Module #N** (workspace module catalog) | **Not applicable** — PP-1 is an Account Platform sub-program, not a workspace module |
| **Identity substrate reference** | **Candidate — deferred** |
| **Account Platform pattern reference** | **Partial** — identity services underpin PP-2 and PP-3 |

PP-1 is evaluated as a **platform sub-program capability** (Identity & Profile substrate), not as Reference Module #N in [REFERENCE_MODULE_CATALOG.md](../architecture/REFERENCE_MODULE_CATALOG.md).

---

## Reference candidacy criteria

| Criterion | Assessment | Score |
|-----------|------------|-------|
| Constitutional maturity (G1–G9) | 24/27; 3N rows (security UX only) | ✅ Adequate |
| Teachable patterns | Service extraction, PE dual, activity service | ✅ Yes |
| Reusability | PP-2 privacy projection; all modules depend on identity | ✅ High platform value |
| Uniqueness | First consolidated identity substrate in Account Platform | ✅ Yes |
| Documented debt acceptable at reference | MFA, F04, test gaps — WITH FINDINGS | ⚠️ Acceptable at L3 WF only |
| Cross-module adoption ready | Mutation path solid; security UX incomplete | ⚠️ Partial |

---

## Pattern catalog (teachable artifacts)

| Pattern | Artifact | Reference value |
|---------|----------|-----------------|
| Identity self-policy dual | `identityPolicyDual.ts` | **High** — personal-scope PE template |
| Account activity service | `identityActivityService.ts` | **High** — module activity for identity writes |
| Profile service extraction | `profileService.ts` | **High** — thin controller pattern |
| Privacy SoR separation | `privacyService.ts` | **High** — settings read projection model |
| Connection PE via `authorize()` | `connectionService.ts` | **Medium** — resource-scoped PE |
| Auth route extraction | `routes/auth.ts` | **Medium** — index.ts de-bloating |
| Photo service + controller split | `profilePhotoService.ts` | **Medium** — partial (F04) |

---

## Comparison to certified references

| Reference | PP-1 comparison |
|-----------|-----------------|
| **File Hub (L4 Reference Implementation)** | PP-1 has service extraction on mutation path; lacks File Hub's full matrix C majority and test depth |
| **Chat (Reference Module #2, L3)** | PP-1 matches Chat partial-acceptance posture; more security N rows than Chat at cert |
| **Admin Portal (Control-plane L3 WF)** | Analogous sub-program; PP-1 score (89%) comparable; AP had zero N at eval |
| **PP-2 (Settings, L3 WF recommended)** | PP-2 **exceeds** PP-1 at eval (96% vs 89%); settings builds on identity foundation |

---

## Reference candidate determination

| Status | Determination |
|--------|---------------|
| **Reference Module #N** | **Not candidate** — wrong taxonomy |
| **Account Platform Identity Pattern Reference** | **Candidate — deferred** |
| **Reference designation council** | **Not opened** |

### Rationale for candidate-deferred

1. Identity substrate is **foundational** — reference designation should follow or accompany umbrella composite certification.
2. **3N matrix rows** (MFA, session, password UX) weaken reference overclaim vs PP-2.
3. Test coverage (6 core tests) is thinner than reference modules typically demonstrate.
4. PP-2 settings patterns are more immediately teachable for new sub-programs; identity patterns need Phase 1B security completion for full reference packet.

### Rationale for not rejecting candidacy entirely

- Service boundary extraction (F01, F02, F05, F06 closures) provides real teachable value.
- Ownership model is clean and documented.
- Privacy SoR / settings projection pattern is adopted by PP-2 — cross-sub-program proof exists.

---

## Recommended reference path

```
PP-1 L3 WITH FINDINGS certification (ratification council)
    ↓
PP-1 Phase 1B (MFA + session UX) — optional reference strengthening
    ↓
PP-2 + PP-3 sub-domain certifications
    ↓
Umbrella progress review
    ↓
Account Platform Identity Pattern Reference council (optional)
```

**Do not** open Reference Module catalog integer assignment for PP-1.

**Do not** designate PP-1 as reference **before** PP-1 Phase 1B closes F03/F08 if plain reference bar is desired.

---

## Reference review outcome

| Field | Value |
|-------|-------|
| **Reference candidate status** | **Candidate deferred** — Account Platform identity substrate |
| **Reference designation awarded** | **No** |
| **Reference council opened** | **No** |
| **Revisit trigger** | Phase 1B completion or Umbrella Phase 3 review |

---

**Last updated:** 2026-06-20 (Certification Evaluation)
