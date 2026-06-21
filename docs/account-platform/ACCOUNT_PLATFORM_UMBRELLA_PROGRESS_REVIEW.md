# Account Platform — Umbrella Progress Review

**Program:** Account Platform — Umbrella Progress Review  
**Date:** 2026-06-20  
**Authority:** Platform Architecture Governance  
**Status:** **COMPLETE** — governance review only; no certification, execution, ledger, or ratification

**Inputs:**

- [PP1_CERTIFICATION_RATIFICATION.md](./PP1_CERTIFICATION_RATIFICATION.md) — L3 WITH FINDINGS · 24/27
- [PP2_CERTIFICATION_RATIFICATION.md](./PP2_CERTIFICATION_RATIFICATION.md) — L3 WITH FINDINGS · 26/27
- [PP3_CERTIFICATION_RATIFICATION.md](./PP3_CERTIFICATION_RATIFICATION.md) — L3 WITH FINDINGS · 23/27
- [ACCOUNT_PLATFORM_PP3_COUNCIL_DECISION.md](./ACCOUNT_PLATFORM_PP3_COUNCIL_DECISION.md)
- [ACCOUNT_PLATFORM_DOMAIN_MAP.md](./ACCOUNT_PLATFORM_DOMAIN_MAP.md)
- [ACCOUNT_PLATFORM_CERTIFICATION_PLANNING_CHARTER.md](./ACCOUNT_PLATFORM_CERTIFICATION_PLANNING_CHARTER.md)

**Precedent:** Business Operations convergence program · Context Graph umbrella path · Workspace composite certification model

---

## Review purpose

Determine whether the Account Platform umbrella program is ready to **enter certification planning** and, on a subsequent timeline, **umbrella evaluation** — now that all three sub-domains (PP-1, PP-2, PP-3) are ratified at Level 3 Certified With Findings.

---

## A. Composite readiness

### Overall platform maturity

| Dimension | PP-1 | PP-2 | PP-3 | Umbrella composite |
|-----------|------|------|------|-------------------|
| Service substrate | ✅ Strong | ✅ Strong | ✅ Strong | **Coherent** |
| API convergence | ✅ | ✅ | ✅ | **Coherent** |
| PE + activity | ✅ WF | ✅ | ✅ WF | **Coherent with gaps** |
| Test evidence | Partial | ✅ Strong | Partial | **Adequate WF** |
| UX shell | ✅ | ✅ WF | ⚠️ G9 FAIL | **Weakest link: billing UX** |
| Documentation | ✅ | ✅ | ✅ | **Strong** |
| Cross-cutting security | ⚠️ MFA | — | — | **Documented gap** |

**Council finding:** Account Platform has transitioned from **L1–L2 fragmented subsystems** (Phase 0A) to **three ratified L3 WITH FINDINGS sub-domains** with constitutional service layers. Umbrella composite maturity is **production-viable at L3 WITH FINDINGS** — not plain L3.

### Cross-domain integration

| Integration path | Status | Evidence |
|------------------|--------|----------|
| **Identity → Settings** | ✅ Coherent | PP-2 settings hub projects identity stores; notification adapter closes PP1-F07; avatar/settings dedup closed (PP1-F12) |
| **Settings → Billing** | ⚠️ Functional WF | Billing accessed via modal; no dedicated settings billing hub (PP3-F08); tier display in settings partial |
| **Billing → Entitlement** | ✅ Strong | `billingService` → `entitlementService`; `Subscription.tier` SoR; `resolveTier()` read convergence |
| **Entitlement → consumers** | ✅ WF | HR gating, AI query balance, module gating via entitlement reads; F07 HR matrix by design |
| **Preferences cross-cut** | ✅ | `preferenceRegistry` + `settingsService` orchestration; theme server-backed (PP2-F07 closed) |
| **Security cross-cut** | ⚠️ WF | Auth extracted; MFA dispositioned (PP1-F03); session UX partial (PP1-F08) |

### Ownership coherence

| Concern | Owner | Umbrella assessment |
|---------|-------|---------------------|
| Personal identity | PP-1 Identity slice | ✅ Constitutional |
| Settings orchestration | PP-2 Settings slice | ✅ Constitutional |
| Billing lifecycle | PP-3 Billing slice | ✅ Constitutional |
| Entitlements / tier SoR | PP-3 (`entitlementService`) | ✅ WF — F02 vocab partial |
| Business profile/branding | Business Administration | ✅ Correctly excluded |
| AI persona | AI Platform | ✅ Correctly excluded |
| Dashboard layout | Dashboard Wave 3 | ✅ Correctly excluded |
| Admin billing ops | Admin Portal L3 | ✅ Operator plane excluded |
| MFA | Account Security (cross-cut) | ⚠️ L0 — dispositioned on PP-1 cert |

**Council finding:** Shared ownership is **coherent with documented exclusions**. No orphan SoR conflicts remain at blocking severity. Tier vocabulary (F02) and business settings triplication (PP2-F05) are the primary cross-domain ownership advisories.

### Service boundaries

| Boundary | Verdict |
|----------|---------|
| Identity services (`authService`, `profileService`, etc.) | ✅ Clean |
| Settings orchestration (`settingsService`, registry) | ✅ Clean |
| Billing facade (`billingService`, `entitlementService`) | ✅ Clean |
| Controller thinness | ✅ WF — PP1-F04 photo multer partial |
| Cross-slice reads | ✅ Documented — no unauthorized writes |

---

## B. Certification path determination

| Path option | Applicable? | Rationale |
|-------------|-------------|-----------|
| **Not certifiable** | **No** | All three sub-domains ratified L3 WF; 0 umbrella blockers |
| **Progress review only** | **Complete** | This document satisfies progress review gate |
| **Ready for evaluation planning** | **✅ YES — recommended outcome** | Trilogy complete; prep artifacts partially exist; unified matrix pending |
| **Ready for evaluation** | **No — not yet** | Unified operation matrix, composite evidence binder, evaluation authorization required |

**Determination:** Account Platform should **proceed to umbrella certification planning** (Option A). It should **not** remain in primary modernization mode — sub-domain modernization charters are complete. Remaining work is **hygiene + umbrella governance prep**, not foundational substrate.

---

## C. Shared findings summary

| Class | Count | Detail doc |
|-------|-------|------------|
| **Umbrella blockers** | **0** | [ACCOUNT_PLATFORM_SHARED_FINDINGS_REVIEW.md](./ACCOUNT_PLATFORM_SHARED_FINDINGS_REVIEW.md) |
| **Umbrella majors** | **7** | Cross-cutting + sub-domain majors |
| **Umbrella advisories** | **~18** | Aggregated track-only |
| **Closed (confirmed)** | **~20** | No reopen at umbrella lens |

See shared findings document for full register with AP-UMB-* umbrella IDs.

---

## D. Architectural coherence review

### Identity → Settings

- Settings hub IA consolidates account, photos, privacy, notifications under PP-2 orchestration.
- Privacy moved into settings flow (PP2-F08 closed).
- Notification writes route through settings adapter (PP2-F06 closed).
- **Gap:** Business 2FA misleading UI (PP1-F10 / PP2-F13 overlap) — BA-owned advisory.

### Settings → Billing

- User billing actions functional via `PaymentModal` and `/api/billing` client.
- No settings-native billing management page (PP3-F08) — primary umbrella UX gap.
- Module subscribe path converged to billing API (PP3-F03 closed).

### Billing → Entitlement

- Checkout → `upsertSubscriptionFromCheckout` → entitlement cache sync.
- Tier reads via `resolveTier()` / `entitlementService` in AI and usage paths.
- **Gap:** Tier enum drift (PP3-F02 partial); invoice webhook activity (PP3-F05 partial).

### Shared preference infrastructure

- `preferenceRegistry` keys documented; `settingsService` orchestrates writes.
- Theme server-backed (PP2-F07 closed).
- AI preference keys cross-reference AI Platform — documented exclusion.

### Shared account ownership

- Hybrid Option C topology **validated in production** across trilogy.
- Explicit exclusions (BA, AI, Dashboard, Admin Portal) **held** — no scope creep at ratification.

**Coherence verdict:** **COHERENT WITH FINDINGS** — suitable for umbrella L3 WITH FINDINGS target; not plain L3.

---

## E. Roadmap determination

### Remaining modernization work (hygiene — not blocking umbrella planning)

| Item | Finding | Priority | Blocks umbrella eval? |
|------|---------|----------|------------------------|
| MFA implementation | PP1-F03 | P1 (plain L3) | No |
| Billing dashboard UX | PP3-F08 | P1 (plain L3) | No |
| Business settings dedup | PP2-F05 | P2 | No |
| Tier enum migration | PP3-F02 | P2 | No |
| Invoice webhook activity | PP3-F05 | P3 | No |
| Photo controller extraction | PP1-F04 | P3 | No |

### Remaining certification work

| # | Gate | Status |
|---|------|--------|
| 1 | Trilogy ledger PR | Authorized — not executed |
| 2 | Unified operation matrix merge | **Not started** |
| 3 | Composite G1–G9 evidence binder | **Not started** |
| 4 | Umbrella findings register (AP-UMB-*) | **This review initiates** |
| 5 | Umbrella evaluation authorization | **Not authorized** |
| 6 | Umbrella certification evaluation | **Not authorized** |
| 7 | Umbrella ratification council | **Not authorized** |

### Remaining governance work

| # | Action | Priority |
|---|--------|----------|
| 1 | **Umbrella certification planning charter** | **High** — next gate |
| 2 | Reference catalog PR (`#AP-BILL-1`) | Medium |
| 3 | Trilogy ledger PR | High (parallel OK) |
| 4 | Pattern council (PP-1/PP-2 reference deferrals) | Low — post-umbrella |

---

## Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Composite readiness? | **READY FOR EVALUATION PLANNING** |
| 2 | Composite score? | **24/27 (~89%)** trilogy mean; **22/27 (~81%)** umbrella cross-cutting adjusted — see scorecard |
| 3 | Blocking findings? | **0** |
| 4 | Major findings? | **7** umbrella majors (MFA, billing UX, business dedup, tier vocab, invoice activity, photo controller, module PE) |
| 5 | Advisory findings? | **~18** aggregated |
| 6 | Shared ownership coherent? | **Yes** — with documented exclusions and WF gaps |
| 7 | Shared service boundaries coherent? | **Yes** — constitutional trilogy substrate |
| 8 | Certification planning justified? | **Yes** |
| 9 | Ready for umbrella evaluation? | **No** — prep package required |
| 10 | Ready only for progress review? | **No** — progress review complete; advance to planning |
| 11 | Remaining modernization work? | **Hygiene only** — MFA, billing UX, business dedup, tier hardening |
| 12 | Remaining governance work? | Unified matrix, composite binder, eval authorization, ledger PR |
| 13 | Earliest umbrella certification path? | **Q1–Q2 2027** illustrative — after planning prep + eval + ratification |
| 14 | Recommended next initiative? | **Umbrella certification planning charter** (+ ledger PR in parallel) |
| 15 | Overall platform posture? | **L3 WITH FINDINGS composite target** — trilogy ratified; umbrella path unlocked |

---

## Outcome

| Option | Decision |
|--------|----------|
| **A. Proceed to umbrella certification planning** | **✅ SELECTED** |
| **B. Remain in modernization mode** | **Rejected** — primary modernization complete |

---

## Stop condition

Governance review **complete**. No certification execution. No ledger update. No ratification council.

**Next authorized gate:** Umbrella certification planning charter (separate session).

---

**Last updated:** 2026-06-20 (Umbrella Progress Review)
