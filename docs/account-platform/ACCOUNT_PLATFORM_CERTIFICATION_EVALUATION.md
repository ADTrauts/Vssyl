# Account Platform — Certification Evaluation

**Program:** Account Platform — Umbrella Certification Evaluation  
**Date:** 2026-06-20  
**Authority:** Platform Architecture Governance (Account Platform)  
**Evaluator:** Certification Evaluation Panel (documentation + evidence review)  
**Status:** **EVALUATION COMPLETE** — recommendation issued; **no certification awarded**

**Scope:** Formal G1–G9 evaluation of **Account Platform umbrella composite** based on trilogy ratification, umbrella progress review, planning, preparation, and council authorization (EA-AP-UMB-001).

**Constraint:** Sub-domain certifications **inherited** — PP-1, PP-2, PP-3 not re-audited. Cross-cutting coherence evaluated only.

---

## 1. Evaluation scope

| Phase | Status | Evidence |
|-------|--------|----------|
| PP-1 Identity ratification | L3 WF · 24/27 | Inherited |
| PP-2 Settings ratification | L3 WF · 26/27 | Inherited |
| PP-3 Billing ratification | L3 WF · 23/27 | Inherited |
| Umbrella progress review | Complete | Composite 22/27 planning est. |
| Umbrella planning + prep | Complete | Unified matrix, binder, findings |
| Evaluation authorization | EA-AP-UMB-001 APPROVE | Council decision |

---

## 2. G1–G9 evaluation summary

| Gate | Name | Prep | Eval | Max | Status |
|------|------|-----:|-----:|----:|--------|
| **G1** | Authorization | 2 | **2** | 3 | PARTIAL |
| **G2** | Auditability | 2 | **2** | 3 | PARTIAL |
| **G3** | Service boundaries | 3 | **3** | 3 | PASS |
| **G4** | API coherence | 3 | **3** | 3 | PASS |
| **G5** | Ownership | 2 | **2** | 3 | PARTIAL |
| **G6** | Test evidence | 2 | **2** | 3 | PARTIAL |
| **G7** | Documentation | 3 | **3** | 3 | PASS |
| **G8** | Production safety | 2 | **2** | 3 | PARTIAL |
| **G9** | UX consistency | 2 | **2** | 3 | PARTIAL |
| | **Total** | 22 | **22** | **27** | **~81%** |

Detailed scorecard: [ACCOUNT_PLATFORM_CERTIFICATION_SCORECARD.md](./ACCOUNT_PLATFORM_CERTIFICATION_SCORECARD.md)

**Evaluator delta vs prep:** **0** — prep score confirmed at evaluation.

---

## 3. Gate evaluations (A–I)

### A. G1 — Authorization

**Score: 2 (PARTIAL)**

| Slice | Finding |
|-------|---------|
| **Identity** | ✅ PE on profile, privacy, photo, connection writes (inherited PP-1) |
| **Settings** | ✅ `settings:read` / `settings:update` on orchestrated writes (inherited PP-2) |
| **Billing** | ✅ `billing:*` on lifecycle via `billingService` (inherited PP-3) |
| **Entitlements** | ✅ `entitlement:*` on admin authority path (inherited PP-3) |
| **Cross-domain** | ⚠️ Module commerce JWT-only — AP-UMB-M07 |
| **Security** | ⚠️ MFA absent — AP-UMB-M01 dispositioned |

No P0 authorization bypass across umbrella scope. Auth credential plane uses security logging by design — not scored down further.

---

### B. G2 — Auditability

**Score: 2 (PARTIAL)**

| Path | Activity | Domain events |
|------|----------|---------------|
| Identity mutations | ✅ | ⚠️ No identity registry events — ADV-05 |
| Settings writes | ✅ | ✅ |
| Billing lifecycle | ✅ | ✅ |
| Entitlement admin | ✅ | ✅ |
| Checkout sync | ✅ | ✅ |
| Invoice webhooks | ❌ | ❌ — M05 |

Cross-domain visibility adequate for WITH FINDINGS: settings/billing/entitlement registry complete; identity domain events gap is umbrella-level advisory theme elevated from PP-1 eval.

---

### C. G3 — Service boundaries

**Score: 3 (PASS)**

| Boundary | Verdict |
|----------|---------|
| Identity services (`authService`, `profileService`, etc.) | ✅ Clean — inherited |
| Settings orchestration (`settingsService`) | ✅ Clean — inherited |
| Billing facade (`billingService`, `entitlementService`) | ✅ Clean — inherited |
| Cross-slice unauthorized writes | ✅ None detected |
| Excluded domains (BA, AI, Dashboard, Admin Portal) | ✅ Held |

AP-UMB-M06 (photo multer) is boundary hygiene — does not fail G3 at umbrella lens.

---

### D. G4 — API coherence

**Score: 3 (PASS)**

| Namespace | Verdict |
|-----------|---------|
| Identity APIs (`/api/auth`, `/api/profile`, etc.) | ✅ Inherited PP-1 |
| Settings API (`/api/settings`) | ✅ Inherited PP-2 |
| Billing API (`/api/billing`) | ✅ Inherited PP-3 |
| Entitlement reads (`/api/account/*`) | ✅ Inherited PP-3 |
| Payment retirement (410) | ✅ Inherited PP-3 |
| Cross-domain client paths | ✅ No double-prefix drift |

Strongest composite gate — full trilogy API convergence validated in unified matrix sample.

---

### E. G5 — Ownership

**Score: 2 (PARTIAL)**

| Concern | Owner | Umbrella verdict |
|---------|-------|------------------|
| Personal identity | PP-1 | ✅ |
| Settings orchestration | PP-2 | ✅ |
| Billing lifecycle | PP-3 | ✅ |
| Tier SoR | PP-3 `entitlementService` | ✅ WF — ACC-01 |
| Business profile/branding | BA L3 — excluded | ✅ |
| AI persona | AI Platform — excluded | ✅ |
| Dashboard layout | Wave 3 — excluded | ✅ |
| Business settings triplication | BA — cross-ref | ⚠️ M03 |

SoR hierarchy coherent. AP-UMB-M03 is cross-domain reference advisory — BA-owned.

---

### F. G6 — Test evidence

**Score: 2 (PARTIAL)**

| Suite | Count | Adequacy |
|-------|-------|----------|
| PP-1 scoped | ~8 | Partial — inherited |
| PP-2 scoped | ~24 | Strong — inherited |
| PP-3 scoped | ~25+ | Adequate — inherited |
| **Trilogy total** | **~57** | Adequate for WITH FINDINGS |
| Umbrella cross-slice integration | **0** | ❌ AP-UMB-EVAL-F01 |

Inherited sub-domain evidence sufficient in aggregate. No dedicated umbrella integration E2E — new eval advisory.

---

### G. G7 — Documentation

**Score: 3 (PASS)**

Complete program doc set: Phase 0A discovery, trilogy architecture/implementation/eval/ratification (60+ docs), umbrella progress review, planning, preparation, authorization, council decision, and this evaluation package. Unified 122-row matrix with validation report.

---

### H. G8 — Production safety

**Score: 2 (PARTIAL)**

| Control | Status |
|---------|--------|
| Client migration / 410 retirement | ✅ Inherited PP-3 |
| Stripe webhook security | ✅ Inherited PP-3 |
| Settings registry validation | ✅ Inherited PP-2 |
| JWT + refresh hardening | ✅ Inherited PP-1 |
| Tier bypass via cache-only | ✅ Closed PP-3 |
| MFA absent | ⚠️ M01 dispositioned |
| Tier enum edge cases | ⚠️ ACC-01 |

Production-viable at WITH FINDINGS. MFA gap accepted per disposition document and Admin Portal compensating controls.

---

### I. G9 — UX consistency

**Score: 2 (PARTIAL)** — G9 compensation rule applied

| Surface | Status |
|---------|--------|
| Settings hub IA | ✅ Strong — inherited PP-2 |
| Identity profile UX | ✅ Strong — inherited PP-1 |
| Billing modal flows | ✅ Functional — inherited PP-3 |
| Dedicated billing dashboard | ❌ M02 |
| Settings → billing IA | ⚠️ Modal embed only |

PP-3 sub-domain G9=1 (FAIL) compensated to umbrella G9=2 per [ACCOUNT_PLATFORM_COMPOSITE_G1_G9_MODEL.md](./ACCOUNT_PLATFORM_COMPOSITE_G1_G9_MODEL.md) and EA-AP-UMB-001 constraint. PP-1/PP-2 UX coherence supports composite partial score. Plain L3 still blocked.

---

## 4. Threshold evaluation

| Threshold | Requirement | Result |
|-----------|-------------|--------|
| NOT CERTIFIABLE | &lt;70% OR blocking OR critical fail | **Not met** — passes |
| L3 WITH FINDINGS | All gates ≥2 · 0 blockers · constitutional core | **Met** — 22/27 |
| Plain L3 | All ≥3 or ≥2 with G9≥3 · no open majors | **Not met** |

---

## 5. Certification recommendation

| Field | Value |
|-------|-------|
| **Recommendation** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Plain L3** | **Not recommended** |
| **NOT CERTIFIED** | **Not recommended** |
| **Certification awarded** | **No** — evaluation only |
| **Ledger update** | **Not performed** — recommend on ratification |

---

## 6. Comparison to authorization prediction

| Metric | Predicted (EA-AP-UMB-001) | Evaluator actual |
|--------|---------------------------|------------------|
| G1–G9 total | 21–23/27 | **22/27** |
| Outcome | L3 WITH FINDINGS | **L3 WITH FINDINGS** |
| Open blocking | 0 | **0** |
| G9 compensation | Applied | **Applied** — G9=2 |

Evaluator confirmed prep score. No downgrade required — evidence quality matches binder assertions.

---

## 7. Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Final G1–G9 score? | **22/27 (~81%)** |
| 2 | Blocking findings? | **0** |
| 3 | Major findings? | **7** — AP-UMB-M01–M07 |
| 4 | Advisory findings? | **19** — ADV-01–18 + AP-UMB-EVAL-F01 |
| 5 | Certification recommendation? | **L3 WITH FINDINGS** |
| 6 | Plain L3 appropriate? | **No** |
| 7 | L3 WITH FINDINGS appropriate? | **Yes** |
| 8 | Reference status? | `#AP-BILL-1` Reference Capability With Findings — see reference review |
| 9 | Remaining risks? | MFA, billing UX, business dedup, tier vocab, cross-slice tests |
| 10 | Certification readiness? | **Ready for ratification recommendation** — not yet awarded |
| 11 | Recommended next gate? | **Council ratification vote** |
| 12 | Modernization complete? | **Yes** — chartered Account Platform scope |
| 13 | Remediation required? | **Optional post-ratification** — not eval blockers |
| 14 | Ledger recommendation? | **Recommend draft row on ratification** — trilogy + umbrella |
| 15 | Evaluation outcome? | **COMPLETE — recommend L3 WITH FINDINGS, no award** |

---

## 8. Deliverables

| Document |
|----------|
| [ACCOUNT_PLATFORM_CERTIFICATION_EVALUATION.md](./ACCOUNT_PLATFORM_CERTIFICATION_EVALUATION.md) (this file) |
| [ACCOUNT_PLATFORM_CERTIFICATION_SCORECARD.md](./ACCOUNT_PLATFORM_CERTIFICATION_SCORECARD.md) |
| [ACCOUNT_PLATFORM_FINDINGS_REVIEW.md](./ACCOUNT_PLATFORM_FINDINGS_REVIEW.md) |
| [ACCOUNT_PLATFORM_REFERENCE_REVIEW.md](./ACCOUNT_PLATFORM_REFERENCE_REVIEW.md) |
| [ACCOUNT_PLATFORM_CERTIFICATION_EXECUTIVE_SUMMARY.md](./ACCOUNT_PLATFORM_CERTIFICATION_EXECUTIVE_SUMMARY.md) |

---

**Last updated:** 2026-06-20 (Umbrella Certification Evaluation)
