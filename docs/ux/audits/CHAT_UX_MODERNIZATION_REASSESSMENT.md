# Chat UX Modernization Reassessment (Post-5B.3)

**Module:** Chat (`chat`)  
**Date:** 2026-06-03  
**Phase:** Fresh certification-gap and modernization review (assessment only)  
**Current level:** **UX-L1 Certified with Findings** (6 PASS / 5 PWF / 0 FAIL)  
**Benchmark:** Drive / File Hub — Reference UX **#1**  
**Authorities:** [`CHAT_UX_SCORECARD.md`](./CHAT_UX_SCORECARD.md), [`CHAT_UX_CERTIFICATION.md`](./CHAT_UX_CERTIFICATION.md), [`CHAT_UX_RECERTIFICATION_2026.md`](./CHAT_UX_RECERTIFICATION_2026.md), [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md), [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](../PLATFORM_CERTIFICATION_GAP_ANALYSIS.md), [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md), [`REFERENCE_MODULE_CATALOG.md`](../../architecture/REFERENCE_MODULE_CATALOG.md), [`PLATFORM_MANUAL_QA_MATRIX.md`](../PLATFORM_MANUAL_QA_MATRIX.md) Part 2E

> **This document is a reassessment only.** It does **not** award UX-L2/L3, change certification levels, or require code changes. **No certification promotion** in this wave.

---

## Executive summary

Chat completed a substantial remediation arc (**5B.1** interaction safety, **5B.2** mobile parity, **5B.3** re-certification) and holds a solid **UX-L1 Certified with Findings** baseline. Since 5B.3, peer modules (Calendar, Notifications, Todo) have reached **UX-L3**; Chat has **not** advanced on the 11-category scorecard. The gap to **UX-L2 Certified with Findings** is **three PASS categories**; the gap to **UX-L3 eligibility** is **L2 + core quartet + QA + PWF reduction + product decisions**.

| Metric | Value |
|--------|-------|
| **Authoritative scorecard** | **6 PASS / 5 PWF / 0 FAIL** (5B.3 — unchanged) |
| **UX-L2 readiness** | **52%** — path defined; engineering + QA not started |
| **UX-L3 readiness** | **28%** — L2 prerequisite unmet; five PWF; C-8 open |
| **Engineering to L2 CwF** | **Medium** (3–5 days) |
| **QA to L2 CwF** | **Medium** (~4 hours Part 2E + ~0.5 day evidence) |
| **Engineering to L3 CwF** | **Large** (8–15 days incl. product scope) |
| **QA to L3 CwF** | **Medium** (~4–6 hours; may extend Part 2E) |
| **Architecture Reference #2** | **Retain** — independent L3 code track |
| **UX Reference path** | **Not viable near-term** — UX #2 slot held by Notifications; no vacant messaging slot |
| **Strategic priority** | **#4** among UX certification work (after Todo Ref #3, AI L3 scoping deferral, Place/new-module policy) |

**Shortest path to UX-L2 CwF:** **5H-Chat-L2** (EmptyState + a11y polish) → **5G-QA-EXEC** Part 2E (C-8) → **5H-Chat-L2-D** (re-cert documentation).

**Shortest path to UX-L3 eligibility:** Complete L2 CwF chain → **5H-Chat-L3-Prep** → **5H-Chat-L3** (core quartet cat 4 + PWF ≤2 + C-5/C-6 disposition) → **5H-Chat-L3-D**.

---

## 1. Current authoritative PASS / PWF / FAIL counts

**Source of truth:** [`CHAT_UX_SCORECARD.md`](./CHAT_UX_SCORECARD.md) — Wave **5B.3** (2026-06-03). No subsequent Chat certification review has changed these counts. [`CHAT_QA_ADDENDUM_2026.md`](./CHAT_QA_ADDENDUM_2026.md) (5G-QA-D) confirms **unchanged**.

| Metric | Count |
|--------|-------|
| **PASS** | **6** |
| **PASS WITH FINDINGS** | **5** |
| **FAIL** | **0** |

### Category table (authoritative)

| # | Category | Rating | Blocks L2? | Blocks L3? |
|---|----------|--------|------------|------------|
| 1 | Interaction Consistency | **PASS** | — | — |
| 2 | Layout Consistency | **PASS** | — | — |
| 3 | Navigation | **PASS** | — | — |
| 4 | Accessibility | **PWF** | Contributes to 3-short | **Yes** (core quartet) |
| 5 | Mobile | **PWF** | Contributes to 3-short | Possible if QA FAIL |
| 6 | Cross-Module Integration | **PWF** | Contributes to 3-short | PWF count (>2) |
| 7 | Error Handling | **PASS** | — | — |
| 8 | Empty States | **PWF** | Contributes to 3-short | PWF count (>2) |
| 9 | Loading States | **PASS** | — | — |
| 10 | Discoverability | **PWF** | Contributes to 3-short | PWF count (>2); C-5 |
| 11 | Workflow Completion | **PASS** | — | — |

### Level awards (unchanged since 5B.3)

| Level | Status |
|-------|--------|
| **UX-L1** | **Certified with Findings** |
| **UX-L2** | **Not certified** (6/11 PASS; requires ≥9) |
| **UX-L3** | **Not certified** |
| **Reference UX #2** | **Rejected** (superseded by Notifications registration) |

---

## 2. Remaining findings (C-*)

| ID | Finding | Severity | Status (post-5B.3) | L2 impact | L3 impact |
|----|---------|----------|---------------------|-----------|-----------|
| **C-1** | Message delete no `ConfirmModal` | P1 | **Resolved** (5B.1) | — | — |
| **C-2** | Conversation drag immediate trash | P1 | **Resolved** (5B.1) | — | — |
| **C-3** | Global/stackable delete stubs | P1 | **Resolved** (5B.1) | — | — |
| **C-4** | Mobile delete / overflow stubs | P1 | **Resolved** (5B.2) | — | — |
| **C-5** | In-conversation message search stub | P2 | **Open** | Cat **10** PWF | PWF count; discoverability |
| **C-6** | Pin / archive / mute / leave absent | P2 | **Open** | Product completeness | Workflow polish; not L1 blocker |
| **C-7** | `ChatPopup.tsx` missing | Process | **N/A** | Documentation hygiene | — |
| **C-8** | Manual QA matrix Part 2E not executed | **Process (P0 gate)** | **Open** | Evidence for cats **4**, **5** upgrade | **Blocks L3** |
| **C-9** | No `ChatWorkspaceLanding.tsx` | P3 | **Partially resolved** | Hub convention; optional L2 polish | Reference hub pattern |

**P1 findings:** All resolved (C-1–C-4).  
**Material open blockers:** C-5, C-6 (product), C-8 (process), C-9 (hygiene).

---

## 3. Category-by-category blockers

### UX-L2 Certified with Findings (target: ≥9 PASS, 2+ PWF, no FAIL in cats 1,2,3,5,7,8,9)

| Category | Current | Blocker | Shortest remediation |
|----------|---------|---------|----------------------|
| **4** Accessibility | PWF | Hover-only desktop message actions; no signed human QA | **5H-Chat-L2:** keyboard affordance or documented pattern + labels; **C-8** Part 2E (CHT-15, CHT-16) |
| **5** Mobile | PWF | 375px manual QA unsigned (C-8) | **5G-QA-EXEC** Part 2E (CHT-04, CHT-06, CHT-10, CHT-17) — engineering largely done (5B.2) |
| **6** Cross-Module | PWF | No V_Link; Tasks partial; notifications partial | Defer to L3 or document scoped integration matrix; **not** on critical L2 path if other three upgrade |
| **8** Empty States | PWF | Custom inline empty UI vs shared `EmptyState` | **5H-Chat-L2:** adopt shared primitive (`ChatMainPanel`, `ChatLeftPanel`, `MobileChat`) — Calendar/Todo precedent |
| **10** Discoverability | PWF | Message search stub (C-5) | Product implement **or** formal deferral; deferral alone unlikely to flip cat 10 to PASS — **defer to L3** if L2 reached via 4+5+8 |

**L2 math:** 6 PASS today + upgrade **cats 4, 5, 8** → **9 PASS** with **cats 6, 10** remaining PWF → **UX-L2 CwF** eligible.

### UX-L3 Certified with Findings (target: L2 chain + ≥9 PASS + core quartet 1,2,4,11 PASS + ≤2 PWF + C-8 executed)

| Gate | Chat status | Blocker |
|------|-------------|---------|
| L2 prerequisite | ❌ | Need **5H-Chat-L2-D** first |
| ≥9 strict PASS | ❌ (6 today) | Same as L2 + sustain through L3 waves |
| Core quartet **1, 2, 4, 11** PASS | ❌ (cat **4** PWF) | Desktop a11y beyond L2 bar; C-8 evidence |
| ≤2 PWF at L3 | ❌ (5 PWF today) | Must upgrade **three** of cats 5, 6, 8, 10 |
| Manual QA executed | ❌ | **C-8** Part 2E |
| C-5 / C-6 disposition | Open | Product: search MVP vs deferral; conversation management vs documented backlog |

**L3 realistic PWF retention (≤2):** Accept **C-5** (search stub) + **C-6** (secondary actions) as documented product findings **if** cats 5, 6, 8 upgrade to PASS via engineering + QA.

---

## 4. Engineering effort estimate

| Target | Scope | Effort | Confidence |
|--------|-------|--------|------------|
| **UX-L2 CwF** | Shared `EmptyState`; optional `ChatWorkspaceLanding` (C-9); desktop message-action a11y (keyboard or focus path); no C-5/C-6 product build | **Medium — 3–5 days** | High — mirrors **5G-Todo** / **3C-7C** patterns |
| **UX-L3 CwF** | L2 scope + cat **4** core-quartet PASS; reduce PWF (cat **6** integration doc or Tasks wiring; cat **8** if not done at L2); C-5 minimal search or council-approved deferral; optional C-6 subset (mute/leave) | **Large — 8–15 days** | Medium — product decisions dominate |
| **UX-L3 Certified (strict)** | 11 PASS + C-5 search + C-6 management + full a11y | **Very large — 15–25+ days** | Low near-term — not recommended path |

**Completed engineering (no re-work):** 5B.1 confirm/trash parity; 5B.2 mobile message actions; 3A-4C menus; 3C-3 layout shell.

---

## 5. QA effort estimate

| Target | Matrix | Effort | Notes |
|--------|--------|--------|-------|
| **UX-L2 CwF** | Part **2E** (CHT-01–20) | **~4 hours** execution + **~0.5 day** evidence packaging | Parallel with **5H-Chat-L2** per [`PLATFORM_MANUAL_QA_RUNBOOK.md`](../PLATFORM_MANUAL_QA_RUNBOOK.md) |
| **UX-L3 CwF** | Part 2E + cat 4/5 re-verification | **~4–6 hours** | May extend CHT-16 hover/keyboard adjudication; CHT-20 (C-5) KNOWN-PWF |
| **Regression** | Re-run after L3 engineering | **~2 hours** | If C-5/C-6 scope changes surfaces |

**Process gate:** **C-8** remains open — [`CHAT_QA_ADDENDUM_2026.md`](./CHAT_QA_ADDENDUM_2026.md) documents zero executed rows. Todo/Calendar/Notifications QA-EXEC precedents apply.

---

## 6. Architecture Reference #2 only?

**Recommendation: Yes — Chat should remain Architecture Reference Module #2 only.**

| Track | Chat status | Evidence |
|-------|-------------|----------|
| **Architecture Reference #2** | **Held** — Level 3 code | [`REFERENCE_MODULE_CATALOG.md`](../../architecture/REFERENCE_MODULE_CATALOG.md), [`CHAT_LEVEL3_CERTIFICATION_REVIEW.md`](../../architecture/audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) |
| **Reference UX #2** | **Rejected** (5B.3); slot **registered to Notifications** | [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md), [`REFERENCE_MODULE_NOTIFICATIONS.md`](./REFERENCE_MODULE_NOTIFICATIONS.md) |

Architecture L3 **does not imply** UX-L3 per program rules. Chat’s service extraction, realtime, and ActionExecutor patterns remain valid **code** copy targets independent of UX scorecard.

**Do not conflate** Architecture #2 (Chat) with UX #2 (Notifications) in registration or council materials.

---

## 7. Realistic future UX reference path?

**Near-term: No.** Chat does **not** have a realistic UX reference registration path on the current program slots.

| Factor | Assessment |
|--------|------------|
| **UX Reference #2** | **Closed** — Notifications **Approved with Findings** (2026-06) |
| **UX Reference #3** | **Todo eligible** — **11 PASS / 0 PWF / UX-L3 Certified**; Chat cannot compete |
| **UX Reference #4** | Vacant — designated for **AI** module, not Chat |
| **UX Reference #5** | **Calendar registered** |
| **Prerequisite** | UX-L3 CwF minimum for any Reference UX slot |
| **Messaging exemplar value** | **5B.1/5B.2 closeouts** suffice as informal copy targets for confirm/trash/mobile actions — registration not required |

**Conditional long-term path (2027+):** If platform creates a **dedicated messaging UX slot** or Todo #3 registration is deferred indefinitely, Chat could pursue **UX-L3 CwF** → `REFERENCE_MODULE_CHAT.md` council review. That requires **full L3 chain** above plus distinctive benchmark rationale beyond Drive/Notifications overlap.

**Practical guidance:** Cite **5B interaction closeouts** for messaging patterns; do **not** plan UX reference council for Chat until L3 CwF achieved and a **vacant slot** exists.

---

## 8. Exact waves required

### Path A — UX-L2 Certified with Findings (shortest)

| Order | Wave | Type | Deliverables | Unlocks |
|-------|------|------|--------------|---------|
| 1 | **5H-Chat-L2** | Engineering | `EmptyState` adoption; optional `ChatWorkspaceLanding`; desktop a11y polish (cat 4) | Cats **8** (+1), **4** (+1) toward 9 PASS |
| 2 | **5G-QA-EXEC** (Part **2E**) | QA process | `CHAT_QA_EXECUTION_REPORT_2026.md`, `qa-evidence/5G-QA/chat/` | **C-8** closable; cat **5** (+1) → **9 PASS** |
| 3 | **5H-Chat-L2-D** | Documentation | Update scorecard + certification + recert artifact | **UX-L2 Certified with Findings** (projected **9 PASS / 2 PWF**) |

**Parallelization:** Wave 1 and 2 may overlap per platform QA runbook Chat exception.

**Out of L2 scope (defer):** C-5 search implementation; C-6 conversation management; V_Link integration.

### Path B — UX-L3 eligibility (eventual UX-L3 CwF)

| Order | Wave | Type | Prerequisites | Deliverables |
|-------|------|------|---------------|--------------|
| 1–3 | Path A complete | — | **UX-L2 CwF** awarded | — |
| 4 | **5H-Chat-L3-Prep** | Readiness audit | L2 CwF | `CHAT_UX_L3_READINESS_REVIEW.md` (future) |
| 5 | **5H-Chat-L3** | Engineering + product | Prep approved | Cat **4** core-quartet PASS; cat **6** integration upgrade or doc; C-5 disposition; optional C-6 subset |
| 6 | **5H-Chat-L3-D** | Certification review | ≤2 PWF; C-8 closed; core quartet PASS | `CHAT_UX_L3_CERTIFICATION_REVIEW.md` (future) |

**Projected post-L3 CwF scorecard:** **9–10 PASS / 1–2 PWF / 0 FAIL** (C-5 and/or C-6 as retained findings).

**UX-L3 Certified (strict, 11 PASS):** Not on shortest path — requires C-5 + C-6 product delivery; estimate **+10–15 days** beyond L3 CwF.

### Path C — UX reference (not recommended near-term)

Requires Path B **UX-L3 CwF** + vacant program slot + `REFERENCE_MODULE_CHAT.md` + council — **no slot available** in 2026 program.

---

## 9. UX-L2 / UX-L3 readiness scores

### UX-L2 readiness: **52%**

| Factor | Weight | Score (0–10) | Weighted |
|--------|--------|--------------|----------|
| PASS count toward L2 bar (6/9) | 30% | 6.7 | 20.0 |
| Zero FAIL in L2-gated categories | 15% | 10.0 | 15.0 |
| Interaction + layout + menus complete (5B.1–5B.3) | 25% | 9.0 | 22.5 |
| Engineering path defined (5H-Chat-L2) | 15% | 7.0 | 10.5 |
| QA matrix published; execution pending (C-8) | 15% | 0.0 | 0.0 |
| **Total** | | | **68.0** → **adjusted 52%** |

*Adjustment:* −16 points for **three-category PASS gap** and **zero QA execution** — same penalty class Calendar/Todo carried pre-QA-EXEC, but Chat also lacks L2 scorecard proximity (6 vs 9 PASS).

**Interpretation:** Chat is **interaction-ready** for L2 but **not QA-ready** for certification review. Engineering is **medium** lift; process gate is **identical** to peer modules pre-5G-QA-EXEC.

### UX-L3 readiness: **28%**

| Factor | Weight | Score (0–10) | Weighted |
|--------|--------|--------------|----------|
| PASS count (6/11 strict) | 20% | 5.5 | 11.0 |
| Core quartet (3/4 PASS; cat 4 PWF) | 25% | 7.5 | 18.75 |
| PWF count vs L3 CwF max (5 vs ≤2) | 20% | 2.0 | 4.0 |
| L2 prerequisite met | 15% | 0.0 | 0.0 |
| Engineering findings (4/9 C-* resolved) | 10% | 4.4 | 4.4 |
| QA executed (C-8) | 10% | 0.0 | 0.0 |
| **Total** | | | **38.15** → **adjusted 28%** |

*Adjustment:* −10 points for **product backlog** (C-5, C-6) blocking efficient PWF reduction.

**Peer comparison (post-5G program):**

| Module | L3 readiness (at prep) | PASS / PWF | Outcome |
|--------|------------------------|------------|---------|
| Calendar | 78% | 9 / 2 | UX-L3 Certified |
| Todo | 74% | 9 / 2 | UX-L3 Certified |
| Notifications | 65% | 9 / 4 → 11 / 1 | UX-L3 CwF |
| **Chat** | **28%** | **6 / 5** | UX-L1 CwF only |

---

## 10. Remaining certification blockers (consolidated)

| Priority | Blocker | Blocks | Owner wave |
|----------|---------|--------|------------|
| **P0** | **3 PASS short of L2** (cats 4, 5, 8 primary) | UX-L2, UX-L3 | **5H-Chat-L2** + **5G-QA-EXEC** |
| **P0** | **C-8** manual QA unsigned | UX-L3; cats 4/5 human verification | **5G-QA-EXEC** Part 2E |
| **P1** | **Cat 4** core quartet PWF | UX-L3 CwF | **5H-Chat-L3** |
| **P1** | **5 PWF** (max 2 at L3 CwF) | UX-L3 CwF | **5H-Chat-L3** |
| **P2** | **C-5** message search stub | Cat 10; strict L3 | Product or deferral council |
| **P2** | **C-6** conversation management absent | Product completeness | Product backlog |
| **P3** | **C-9** hub landing pattern | Marketplace convention | **5H-Chat-L2** optional |
| **Closed** | UX Reference #2 | Registration | **Notifications** holds slot |

---

## 11. Strategic priority versus peer initiatives

| Initiative | Relative priority | Rationale |
|------------|-------------------|-----------|
| **Todo Reference UX #3 registration** | **Higher** | UX-L3 Certified (strict); governance-only; completes workspace trio; **~0.5 day** |
| **AI Platform L3** | **Higher (architecture track)** | Independent of Chat UX; constitutional AI readiness — defer UX Chat work |
| **New module modernization (Place, etc.)** | **Higher (product)** | Place Architecture #5 active; hub exists; Chat L2 does not unblock Place |
| **Chat UX-L2 path** | **Lower (#4)** | Largest PASS gap; product findings (C-5, C-6); peer modules already L3 |
| **Chat UX-L3 / UX reference** | **Deprioritize** | No vacant UX slot; 28% readiness; large product scope |

**Recommended sequencing (platform UX):**

1. **Todo Reference UX #3** registration (governance)  
2. **Place / Dashboard** modernization policy (product)  
3. **AI Platform L3** prep (architecture — when capacity allows)  
4. **Chat 5H-Chat-L2** + **5G-QA-EXEC Part 2E** (when Chat is explicitly prioritized)  
5. **Chat L3** only after L2 CwF + product council on C-5/C-6  

**Do not start in parallel with Todo #3 registration:** Chat L2 engineering (competes for same platform QA / engineering bandwidth without higher ROI).

---

## 12. Post-5B.3 peer context (what changed)

Since Chat **5B.3** (2026-06-03), the platform UX certification landscape advanced:

| Module | Pre-5B.3 peer state | Current (reassessment baseline) |
|--------|---------------------|----------------------------------|
| Calendar | UX-L2 CwF | **UX-L3 Certified**; Reference UX **#5** registered |
| Notifications | UX-L2 CwF | **UX-L3 CwF**; Reference UX **#2** registered |
| Todo | UX-L1 CwF | **UX-L3 Certified**; Reference UX **#3 eligible** |
| Chat | UX-L1 CwF (6/5/0) | **Unchanged** — no Chat waves post-5B.3 |

Chat’s **interaction safety** and **mobile parity** remain reference-quality **informal** evidence (5B closeouts). Formal certification has **stalled** while process + polish waves consumed peer modules.

---

## 13. Related artifacts

| Artifact | Role |
|----------|------|
| [`CHAT_UX_SCORECARD.md`](./CHAT_UX_SCORECARD.md) | Authoritative 11-category table |
| [`CHAT_UX_CERTIFICATION.md`](./CHAT_UX_CERTIFICATION.md) | Certification record |
| [`CHAT_UX_RECERTIFICATION_2026.md`](./CHAT_UX_RECERTIFICATION_2026.md) | 5B.3 decision rationale |
| [`CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md`](./CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md) | C-1–C-3 resolved |
| [`CHAT_MOBILE_PARITY_BATCH5B2_CLOSEOUT.md`](./CHAT_MOBILE_PARITY_BATCH5B2_CLOSEOUT.md) | C-4 resolved |
| [`CHAT_QA_ADDENDUM_2026.md`](./CHAT_QA_ADDENDUM_2026.md) | C-8 open confirmation |
| [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](../PLATFORM_CERTIFICATION_GAP_ANALYSIS.md) | Wave 5F strategic ranking |
| [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md) | Wave registry |

---

**Last updated:** 2026-06-03 (Chat UX Modernization Reassessment — assessment only; no certification change)
