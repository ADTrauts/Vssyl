# Account Platform — Certification Risk Review

**Program:** Account Platform — Umbrella Certification Evaluation Authorization Review  
**Date:** 2026-06-20  
**Type:** Governance risk assessment — **no evaluation executed**  
**Scope:** Umbrella composite — Identity · Settings · Billing · Entitlements · Cross-domain governance

**Supersedes for umbrella scope:** Prior PP-1/PP-2 risk review sections in this file (2026-06-20) — trilogy now ratified; umbrella lens applies.

---

## Risk summary

| Tier | Count | Eval impact |
|------|-------|-------------|
| **Critical** | 0 | — |
| **High** | 2 | M01 MFA · M02 billing UX — manageable at WITH FINDINGS |
| **Medium** | 5 | M03–M07 · G9 compensation · evaluator interpretation |
| **Low** | 18+ | Advisories · closed sub-domain findings |

**Overall certification risk posture:** **Acceptable** for L3 WITH FINDINGS entry.

**Overall evaluation risk posture:** **LOW** — comprehensive packet; pre-briefed majors.

---

## A. Identity risks

| Risk | Likelihood | Impact | Mitigation | Residual | Finding |
|------|------------|--------|------------|----------|---------|
| MFA bypass / account takeover | Medium | Critical | JWT + refresh rotation; Admin Portal ops | Medium | AP-UMB-M01 |
| Unauthorized profile mutation | Low | High | PE on all write paths | Low | — |
| Photo upload abuse | Low | Medium | PE + storageService + auth | Low | AP-UMB-M06 partial |
| Connection graph leak | Low | High | Tenant scoping + PE | Low | — |
| Session management gap | Medium | Medium | No server revoke endpoint | Medium | AP-UMB-ADV-01 |
| Identity domain events missing | Low | Low | Module activity present | Low | AP-UMB-ADV-05 |

**Identity slice verdict:** Service substrate **strong**; security UX plane **weakest** (MFA).

---

## B. Settings risks

| Risk | Likelihood | Impact | Mitigation | Residual | Finding |
|------|------------|--------|------------|----------|---------|
| Preference key injection | Low | Medium | Registry validation | Low | — |
| Notification write bypass | Low | Medium | Adapter → settingsService | Low | PP2-F06 closed |
| Theme persistence loss | Low | Low | Server-backed theme | Low | PP2-F07 closed |
| Business settings confusion | Medium | Low | BA-owned dedup | Medium | AP-UMB-M03 |
| Email notification silent writes | Low | Low | Separate path documented | Low | AP-UMB-ADV-09/10 |
| Legacy API drift | Low | Low | Inventory documented | Low | AP-UMB-ADV-11 |

**Settings slice verdict:** **Lowest risk** in trilogy — 0N on core matrix; strongest sub-domain (26/27).

---

## C. Billing risks

| Risk | Likelihood | Impact | Mitigation | Residual | Finding |
|------|------------|--------|------------|----------|---------|
| Unauthorized subscription mutation | Low | High | `billing:write` PE | Low | — |
| Checkout → entitlement desync | Low | High | `upsertSubscriptionFromCheckout` | Low | — |
| Invoice webhook without activity | Medium | Low | Lifecycle path complete | Medium | AP-UMB-M05 |
| Module commerce without PE | Medium | Medium | JWT auth only | Medium | AP-UMB-M07 |
| Legacy payment API drift | Low | High | 410 retirement + client migration | Low | PP3-F03 closed |
| Stripe webhook misconfiguration | Medium | High | External ops — documented exception | Medium | — |
| Modal-only billing UX confusion | Medium | Medium | Functional within modal | Medium | AP-UMB-M02 |

**Billing slice verdict:** Lifecycle **strong**; UX and module commerce **primary gaps**.

---

## D. Entitlement risks

| Risk | Likelihood | Impact | Mitigation | Residual | Finding |
|------|------------|--------|------------|----------|---------|
| Tier read from stale cache | Low | High | `resolveTier()` canonical | Low | — |
| Admin override bypass | Low | High | F04 closed | Low | — |
| Tier enum edge case | Medium | Medium | `normalizeTier()` | Medium | AP-UMB-ACC-01 |
| HR gating matrix divergence | Low | Medium | By design — separate matrix | Low | AP-UMB-ADV-12 |
| Dual SoR regression | Very low | Critical | Ratified architecture frozen | Very low | — |

**Entitlement slice verdict:** SoR **coherent** post PP-3 Package 1; vocabulary hardening deferred.

---

## E. Cross-domain governance risks

| Risk | Likelihood | Impact | Mitigation | Residual |
|------|------------|--------|------------|----------|
| Identity → Settings projection break | Low | Medium | Ratified integration frozen | Low |
| Settings → Billing IA gap | Medium | Medium | Modal functional; M02 documented | Medium |
| Billing → Entitlement sync failure | Low | High | Service chain tested | Low |
| Scope creep (BA/AI/Dashboard) | Low | Medium | Exclusions documented and held | Low |
| Umbrella score inflation from trilogy mean | Medium | Low | Composite model uses gate aggregation | Low |
| G9 compensation rejected by evaluator | Medium | Medium | Rule documented in G1–G9 model | Medium |
| Closed finding reopen without evidence | Low | High | Frozen register rules | Low |

**Cross-domain verdict:** **Coherent WITH FINDINGS** — no ownership conflicts.

---

## F. Evaluation risks (process)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Evaluator uses stale Phase 0B matrices | Low | High | Unified matrix + validation in packet |
| Evaluator rejects G9 compensation | Medium | Medium | Pre-brief; may score 21/27 |
| Evaluator treats MFA as blocking | Low | Medium | MFA disposition doc in packet |
| Plain L3 expected by stakeholder | Medium | Medium | Target WITH FINDINGS explicit in authorization |
| New blocker at eval (regression) | Low | High | No regression identified; frozen closed findings |
| Trilogy ledger absent pre-eval | Low | Low | Documented as recommended not required |
| Sub-domain re-audit attempted | Low | Medium | Scope boundary: cross-cut only |

---

## G. Certification outcome risks

| Scenario | Probability | Trigger |
|----------|-------------|---------|
| **L3 WITH FINDINGS** | **~85%** | Expected path — 0 blockers, 81% composite |
| Score 21/27 (conservative) | ~40% | G9=1 or G1/G6 strict |
| Score 22/27 (prep match) | ~35% | Baseline expectation |
| Score 23/27 (optimistic) | ~10% | Evaluator accepts all WF gates at 2 |
| Plain L3 | &lt;5% | Would require major closure pre-eval |
| NOT CERTIFIED | ~10% | G3/G4 failure or undisclosed regression |

---

## H. Risk comparison to portfolio precedent

| Surface | Score at eval auth | Blockers | Majors | Risk posture | Umbrella alignment |
|---------|-------------------|----------|--------|--------------|-------------------|
| Business Operations | 24/27 | 0 | 0 (+17 adv) | Accepted | ✅ Similar advisory density |
| Reference Workspace | 23/27 | 0 | 0 (+11 adv) | Accepted | ✅ Similar score band |
| PP-3 (sub-domain) | 23/27 eval | 0 | 3 WF | Accepted | ✅ Umbrella inherits |
| **Account Platform umbrella** | **22/27** | **0** | **7** | **Acceptable** | ✅ Within precedent |

---

## Risk disposition summary

| Class | Umbrella treatment |
|-------|-------------------|
| High (2) | WITH FINDINGS on certificate — M01, M02 |
| Medium (5) | WITH FINDINGS or accepted partial — M03–M07, ACC-01 |
| Low (18+) | Track-only advisories |
| Critical (0) | — |

**Authorization risk gate:** **PASS** — risks do not warrant deferral or denial.

---

**Last updated:** 2026-06-20 (Umbrella Evaluation Authorization Review)
