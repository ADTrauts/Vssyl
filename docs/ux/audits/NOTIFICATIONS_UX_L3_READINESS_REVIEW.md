# Notifications UX-L3 Readiness Review (Wave 5G-Notifications-L3 Prep)

**Module:** Notifications (`notifications`)  
**Date:** 2026-06-03  
**Phase:** UX-L3 readiness audit (governance only)  
**Current level:** **UX-L2 Certified with Findings** (9 PASS / 4 PWF / 0 FAIL)  
**Program slot:** Reference UX **#2** candidate — [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md)  
**Authorities:** [`NOTIFICATIONS_UX_SCORECARD.md`](./NOTIFICATIONS_UX_SCORECARD.md), [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md), [`PLATFORM_MANUAL_QA_MATRIX.md`](../PLATFORM_MANUAL_QA_MATRIX.md) Part 2B, [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](../PLATFORM_CERTIFICATION_GAP_ANALYSIS.md)

> **This document is a readiness audit only.** It does **not** award UX-L3, Reference UX #2, or require code changes. **No certification promotion** in this wave.

---

## Executive summary

Notifications is the **strongest documented Reference UX #2 alternate** per Wave 5F gap analysis — cross-module routing hub, management-page archetype (`PageHeader` + `PageToolbar`), and **9 PASS** at L2. Remaining UX-L3 blockers are **process (N-6)**, **core-quartet accessibility (cat 4 + N-7)**, and **four PWF categories** (vs Calendar’s pre-L3 count of two).

| Metric | Value |
|--------|-------|
| **UX-L3 readiness** | **65%** — QA-ready; not ready for L3 certification review |
| **Engineering effort to L3** | **Small** (0–2 days baseline; +1–2 days if NTF-09 mobile FAIL) |
| **QA effort to L3** | **Medium** (~2–3 hours Notifications; ~0.5 day with evidence) |
| **Documentation effort** | **Small** (~0.5 day post-QA re-cert + registration draft) |
| **Reference UX #2 likelihood** | **Strong candidate** (vs peers); **Moderate** absolute readiness |
| **Exact next wave** | **5G-QA-EXEC** (Part 2B) → optional **5G-Notifications polish** (N-7, N-2) → **5G-Notifications-D** |

**Post-Calendar note:** Calendar completed UX-L3 + Reference UX #5 (2026-06-03). Notifications is the **logical next UX-L3 target** for platform breadth (hub module), but **Todo** may reach L3 faster (2 PWF vs 4).

---

## 1. Current certification state

| Field | Value |
|-------|-------|
| **PASS** | **9** |
| **PWF** | **4** |
| **FAIL** | **0** |
| **UX-L1** | **Certified with Findings** |
| **UX-L2** | **Certified with Findings** |
| **UX-L3** | **Not certified** |
| **Reference UX #2** | **Not eligible** (informal management-page exemplar only) |

**PWF categories:** 4 Accessibility · 5 Mobile · 7 Error Handling · 8 Empty States

**Authoritative artifacts:** [`NOTIFICATIONS_UX_RECERTIFICATION_2026.md`](./NOTIFICATIONS_UX_RECERTIFICATION_2026.md), [`NOTIFICATIONS_UX_CERTIFICATION.md`](./NOTIFICATIONS_UX_CERTIFICATION.md)

---

## 2. UX-L3 gate analysis

Per [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md):

### UX-L3 Certified (strict)

| Rule | Notifications status | Met? |
|------|---------------------|------|
| Prerequisite UX-L2 Certified | L2 **CwF** awarded | ✅ (chain) |
| No FAIL in any category | 0 FAIL | ✅ |
| ≥9 strict PASS | 9 PASS | ✅ |
| Core quartet **1, 2, 4, 11** all **PASS** | Cat **4 PWF** | ❌ |
| Manual QA matrix executed | **N-6 open** | ❌ |

### UX-L3 Certified with Findings (realistic target)

| Rule | Notifications status | Met? |
|------|---------------------|------|
| L3 bar (≥9 PASS, no FAIL) | 9 PASS | ✅ |
| Core quartet cats **1, 2, 4, 11** **PASS** | Cat **4 PWF** | ❌ |
| ≤2 categories PWF at L3 CwF | **4 PWF** | ❌ (need −2) |
| Manual QA executed | **N-6 unsigned** | ❌ |

**Interpretation:** Notifications cannot receive **UX-L3 CwF** until (a) **cat 4 → PASS**, (b) **N-6** closed, and (c) **PWF count ≤2** (upgrade two of cats 5, 7, 8 via QA and/or small engineering). Calendar precedent: two PWF → both cleared by QA only; Notifications has **more surface area** before L3.

---

## 3. Remaining findings review (N-2 through N-8)

| ID | Finding | Severity | Engineering effort | Certification impact | Blocks UX-L3? |
|----|---------|----------|-------------------|----------------------|---------------|
| **N-2** | Main feed API errors often `console.error` only; settings uses `toast` | **P2** | **Small** (hours) — add `toast.error` on fetch/load-more failures | Cat **7** PWF; does not block core quartet | **No** (blocks strict 11 PASS; contributes to PWF count) |
| **N-5** | Fixed `w-64` category sidebar may crowd **375px** | **P2** | **Small–Medium** (0.5–2 days) — collapsible sheet or responsive hide if NTF-09 FAIL | Cat **5** PWF; tied to NTF-09 | **No** alone; **Yes** if mobile QA FAIL and not remediated |
| **N-6** | Manual QA matrix Part **2B** not executed / unsigned | **Process (P0 gate)** | **None** — QA execution only | Blocks L3 evidence requirement; cats **4** and **5** human verification | **Yes** |
| **N-7** | Row overflow / actions trigger lacks `aria-label` (NTF-16) | **P3** (P0 in matrix) | **Small** (hours) — label on icon-only menu trigger | Cat **4** PWF; core quartet | **Yes** (core quartet) |
| **N-8** | Grouped view: limited per-notification delete in collapsed rows | **P3** | **None** unless product expands affordances | Cat **11** already **PASS**; discoverability polish | **No** |

**Resolved (context):** **N-1** bulk delete `ConfirmModal` — 5C.1; upgraded cats 1 and 11.

**Non-requested but open:** **N-3** settings `PageHeader` (P3), **N-4** local vs shared `EmptyState` (P3) — affect cats 2/8 polish, not L3 core quartet.

---

## 4. UX-L3 readiness score (65%)

| Factor | Weight | Score (0–10) | Weighted |
|--------|--------|--------------|----------|
| Scorecard PASS count (9/11) | 20% | 8.2 | 16.4 |
| Core quartet (3/4 PASS) | 25% | 7.5 | 18.75 |
| Engineering findings closed (N-1 only; 4 open material) | 25% | 6.0 | 15.0 |
| QA matrix defined + cases mapped (Part 2B) | 15% | 10.0 | 15.0 |
| QA executed + signed (N-6) | 15% | 0.0 | 0.0 |
| **Total** | 100% | — | **65.2 → 65%** |

**Comparison:**

| Module | Pre-L3 readiness (est.) | PWF at L2 | Primary gate |
|--------|-------------------------|-----------|--------------|
| Calendar (pre-5G-D) | **78%** | 2 | E-14 QA |
| **Notifications** | **65%** | **4** | N-6 QA + cat 4 + PWF reduction |
| Todo (5G-D) | **~72%** | 2 | T-11 QA |
| Chat | **~45%** | 5 | L2 bar + C-8 QA |

**Gate math:** Readiness → **~88%** after N-6 + N-7 + cat 4/5 QA PASS; **~95%** after L3 CwF doc wave; **100%** after Reference UX #2 registration.

---

## 5. Effort estimates

### Engineering

| Scenario | Effort |
|----------|--------|
| **Expected** (N-7 only + QA P0 PASS on mobile) | **0.5 day** |
| **Likely** (N-7 + N-2 toast) | **1 day** |
| **Contingency** (NTF-09 FAIL → sidebar sheet like Calendar E-10) | **+1–2 days** |
| **Optional polish** (N-4 shared EmptyState, N-3 settings header) | **+0.5–1 day** (not L3-blocking) |

### QA

| Activity | Effort |
|----------|--------|
| Environment + test account | 0.5 hour |
| Part 2B desktop (NTF-01–20) | 1–1.5 hours |
| Mobile 375px + dark (NTF-09, NTF-10) | 0.5–1 hour |
| Keyboard/a11y (NTF-11, 12, 17, 18) | 0.5 hour |
| Evidence + sign-off | 0.5 hour |
| **Total** | **~2.5–3.5 hours** |

### Documentation (post-QA)

| Wave | Effort |
|------|--------|
| `NOTIFICATIONS_QA_ADDENDUM` refresh | 0.25 day |
| **5G-Notifications-D** L3 re-cert review | 0.5 day |
| `REFERENCE_MODULE_NOTIFICATIONS.md` draft | 0.5 day (after L3) |

---

## 6. Reference UX #2 assessment

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) Reference UX Module definition:

| Requirement | Notifications status |
|-------------|---------------------|
| UX-L3 CwF minimum | ❌ Not L3 |
| Modernization waves (interaction + layout) | ✅ 3A-4B, 3C-6, 5C.1 |
| 11-category scorecard | ✅ 5C.2 authoritative |
| Interaction certification | ✅ 5C.1 closeout |
| Manual QA matrix | ❌ N-6 pending |
| Registration doc | ❌ Not created |
| Council / registration decision | ❌ Chat **Rejected** for #2 at 5B.3; Notifications not yet assessed |

### Candidate strength: **Strong** (relative to Todo and Chat)

| Dimension | Notifications | Todo | Chat |
|-----------|---------------|------|------|
| PASS count | **9** | **9** | 6 |
| PWF count | **4** | **2** | **5** |
| UX-L2 | **CwF** | **CwF** | Not certified |
| Cross-module hub value | **Strongest** — routes to chat/drive/place/AI | Task links | Messaging-centric |
| Distinct benchmark role | **Management-page** + notification routing | Workspace split + boards | Realtime collaboration |
| Reference #2 history | **Designated alternate** (5F gap analysis) | Not slot-designated | **Rejected** (5B.3) |
| L3 distance | **Medium** (4 PWF) | **Shorter** (2 PWF) | **Large** (3 PASS short of L2) |

**Verdict:** **Strong candidate** for Reference UX **#2** on **product fit** (platform notification hub, cross-module deep links, management archetype). **Moderate** on **readiness velocity** — Todo is closer to L3 by PWF count; Chat is **too immature** for near-term Reference designation.

**Not comparable to Calendar UX #5:** Calendar held a **program-designated scheduling slot** and completed a larger modernization program (3C-7). Notifications competes for the **general Reference UX #2** vacancy (Drive #1 is the only registered UX reference today besides Calendar #5).

---

## 7. Category upgrade prediction (post N-6, if P0 PASS)

| Category | Current | Post-QA (expected) | Condition |
|----------|---------|-------------------|-----------|
| **4** Accessibility | PWF | **PASS** | N-7 fixed + NTF-16/11/17/18 PASS |
| **5** Mobile | PWF | **PASS** or PWF | PASS if NTF-09 PASS; else N-5 engineering |
| **7** Error Handling | PWF | PWF or **PASS** | PASS if N-2 fixed or QA accepts settings-only toast pattern |
| **8** Empty States | PWF | PWF | N-4 optional; QA NTF-13 PASS on copy |
| **UX-L3 CwF** | Not eligible | **Eligible** if cat 4 PASS + ≤2 PWF + N-6 signed |
| **UX-L3 Certified (strict)** | Not eligible | Unlikely without cats 7+8 upgrade |

---

## 8. Strategic recommendation

### 1. Should Notifications become the next UX-L3 target?

**Yes — as the primary hub-module track**, parallel to or immediately after Todo.

- Highest **cross-module** teaching value for the platform.
- Interaction safety **complete** (5C.1); layout **complete** (3C-6).
- Blockers are **bounded**: N-6 + N-7 + PWF reduction, not greenfield modernization.

**Caveat:** If the goal is **fastest second L3 award**, run **Todo T-11 QA first** (2 PWF vs 4).

### 2. Is Todo a better candidate?

**For speed to L3:** **Yes** — 9 PASS / **2 PWF** / T-11 gate only; 5G polish already closed T-8/T-9.

**For Reference UX #2 breadth:** **No** — Notifications is the better **copy target** for management feeds, bulk selection, category sidebars, and notification routing metadata.

**Recommendation:** **Todo L3 first (optional fast win)** → **Notifications L3 + Reference #2** as the strategic hub designation.

### 3. Is Chat still too immature?

**Yes.** **6 PASS / 5 PWF**; UX-L2 not met; Reference UX #2 **explicitly rejected** at 5B.3; product gaps **C-5, C-6** dominate. Chat requires a **large** engineering wave before L3 or Reference consideration — not competitive with Notifications or Todo for next designation.

### 4. Fastest path to another Reference UX designation

| Path | Steps | Est. calendar time |
|------|-------|-------------------|
| **A — Todo (fastest L3)** | T-11 QA → 5G-Todo-D → `REFERENCE_MODULE_TODO.md` (if council approves) | ~1 week |
| **B — Notifications (best #2 fit)** | N-7 (+ optional N-2) → Part 2B QA → 5G-Notifications-D → `REFERENCE_MODULE_NOTIFICATIONS.md` | ~1–2 weeks |
| **C — Chat** | C-5/C-6 product + L2 push + C-8 QA | **Multi-week** — not fastest |

**Fastest Reference UX designation after Calendar #5:** Path **A** or **B**; **B** preferred if Reference UX **#2** must teach **hub/routing** patterns.

---

## 9. Remaining blockers (summary)

| Blocker | Type | Blocks L3? | Blocks Ref #2? |
|---------|------|------------|----------------|
| **N-6** | Process | **Yes** | **Yes** |
| **N-7** | Engineering (small) | **Yes** (cat 4) | Indirect |
| **4 PWF categories** | Scorecard | **Yes** (L3 CwF needs ≤2) | Indirect |
| **N-5** | Engineering (conditional) | If NTF-09 FAIL | No |
| **N-2, N-4, N-8** | Polish | No (L3 CwF path) | No |
| L3 recert doc | Documentation | **Yes** | **Yes** |
| `REFERENCE_MODULE_NOTIFICATIONS.md` | Documentation | No | **Yes** |

---

## 10. Recommended next waves (sequenced)

| Order | Wave | Type | Deliverable |
|-------|------|------|-------------|
| **1** | **5G-Notifications polish** (optional) | Engineering | N-7 `aria-label`; optional N-2 feed `toast` |
| **2** | **5G-QA-EXEC** (Part 2B) | QA | N-6 closure; evidence in `qa-evidence/5G-QA/notifications/` |
| **3** | **5G-Notifications-D** | Governance | L3 re-cert review (no award in prep wave) |
| **4** | **REFERENCE_MODULE_NOTIFICATIONS.md** | Registration | Reference UX #2 package (post-L3) |

**Do not start:** UX certification level changes in this prep wave; Chat L2 program; new notification product features.

---

## 11. Sign-off

| Role | Outcome | Date |
|------|---------|------|
| UX governance (5G-Notifications-L3 prep) | **Ready for QA execution** — small N-7 engineering recommended before Part 2B | 2026-06-03 |

---

## Related

- [`NOTIFICATIONS_UX_SCORECARD.md`](./NOTIFICATIONS_UX_SCORECARD.md)
- [`NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md`](./NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md)
- [`CALENDAR_UX_L3_READINESS_REVIEW.md`](./CALENDAR_UX_L3_READINESS_REVIEW.md) — completed L3 precedent
- [`REFERENCE_MODULE_CALENDAR.md`](./REFERENCE_MODULE_CALENDAR.md) — UX #5 registered
- [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](../PLATFORM_CERTIFICATION_GAP_ANALYSIS.md)

---

*Wave 5G-Notifications-L3 Preparation — readiness review only. No certification promotion. No Reference designation.*
