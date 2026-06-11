# Calendar UX-L3 Readiness Review (Wave 5G-Calendar-L3 Prep)

**Module:** Calendar (`calendar`)  
**Date:** 2026-06-03  
**Phase:** UX-L3 readiness audit (governance only)  
**Current level:** **UX-L2 Certified with Findings** (9 PASS / 2 PWF / 0 FAIL)  
**Program slot:** Reference UX **#5** candidate — [REFERENCE_MODULE_PROGRAM.md](../REFERENCE_MODULE_PROGRAM.md)  
**Authorities:** [CALENDAR_UX_SCORECARD.md](./CALENDAR_UX_SCORECARD.md), [UX_CERTIFICATION_SCORECARD.md](../UX_CERTIFICATION_SCORECARD.md), [PLATFORM_MANUAL_QA_MATRIX.md](../PLATFORM_MANUAL_QA_MATRIX.md), [PLATFORM_MANUAL_QA_RUNBOOK.md](../PLATFORM_MANUAL_QA_RUNBOOK.md)

> **This document is a readiness audit only.** It does **not** award UX-L3, Reference UX #5, or require code changes. **No certification promotion** in this wave.

---

## Executive summary

Calendar is **engineering-complete** for the 3C-7 modernization program. Remaining UX-L3 blockers are **process and verification**, not feature work. The single critical gate is **E-14** — execution and sign-off of platform manual QA Part **2D** (CAL-01–CAL-24).

| Metric | Value |
|--------|-------|
| **UX-L3 readiness** | **78%** — ready for QA execution; not ready for L3 certification review |
| **Engineering effort to L3** | **None–Small** (0–3 days only if QA finds P0 defects) |
| **QA effort to L3** | **Medium** (~2–4 hours Calendar; ~0.5 day with evidence) |
| **Reference UX #5 next?** | **Yes** — strongest candidate **after** UX-L3 CwF + registration doc |
| **Exact next wave** | **5G-QA-EXEC** (Calendar Part 2D) → **5G-Calendar-D** (doc re-cert) |

**Do not start:** AI Platform L3, new Calendar features, 3C-8+ layout waves, Reference council.

---

## 1. Current certification posture

| Field | Value |
|-------|-------|
| **UX-L1** | **Certified** |
| **UX-L2** | **Certified with Findings** |
| **UX-L3** | **Not certified** |
| **Reference UX #5** | **Not eligible** |
| **Scorecard** | **9 PASS / 2 PWF / 0 FAIL** |
| **PWF categories** | **4** Accessibility · **5** Mobile |
| **Native dialogs** | **0** |
| **3C-7 program** | **Complete** |

**Authoritative artifacts:** [CALENDAR_UX_RECERTIFICATION_2026_3C7D.md](./CALENDAR_UX_RECERTIFICATION_2026_3C7D.md), [CALENDAR_UX_CERTIFICATION.md](./CALENDAR_UX_CERTIFICATION.md).

---

## 2. Exact UX-L3 requirements

Per [UX_CERTIFICATION_SCORECARD.md](../UX_CERTIFICATION_SCORECARD.md) and [UX_CERTIFICATION_STANDARD.md](../UX_CERTIFICATION_STANDARD.md):

### 2.1 UX-L3 Certified (strict)

| Rule | Calendar status | Met? |
|------|-----------------|------|
| Prerequisite UX-L2 Certified | L2 **CwF** awarded (L2 bar met at 9 PASS) | ✅ |
| No FAIL in any category | 0 FAIL | ✅ |
| ≥9 categories **PASS** (strict) | 9 PASS | ✅ |
| Core quartet **1, 2, 4, 11** all **PASS** | Cat **4 PWF** | ❌ |
| Manual QA matrix executed | **E-14 open** | ❌ |

### 2.2 UX-L3 Certified with Findings (target)

| Rule | Calendar status | Met? |
|------|-----------------|------|
| L3 bar (≥9 PASS, no FAIL) | 9 PASS | ✅ |
| Core quartet cats **1, 2, 4, 11** **PASS** | Cat **4 PWF** | ❌ |
| ≤2 categories PWF at L3 CwF | 2 PWF (4, 5) | ⚠️ Allowed count, but **core quartet fails** |
| Manual QA executed or product waiver | **E-14 unsigned** | ❌ |
| Certification artifact in `docs/ux/audits/` | 3C-7D exists; L3 recert pending | ⚠️ |

**Interpretation:** Calendar cannot receive **UX-L3 CwF** until **category 4** upgrades from PWF to **PASS**. Category 4 upgrade is **blocked on E-14** per 3C-7D precedent (not on missing engineering for E-13/E-10).

### 2.3 Reference UX #5 (post-L3)

| Rule | Status |
|------|--------|
| UX-L3 CwF minimum | ❌ |
| `REFERENCE_MODULE_CALENDAR.md` registration doc | ❌ Not created |
| Council sign-off | ❌ Not requested |

---

## 3. Requirement classification

### 3.1 Documentation / process only

| Item | Action | Owner |
|------|--------|-------|
| **E-14** Execute CAL-01–CAL-24 | Human QA per [PLATFORM_MANUAL_QA_RUNBOOK.md](../PLATFORM_MANUAL_QA_RUNBOOK.md) | QA / Product |
| **E-14** Fill Calendar sign-off block (Part 2D) | Matrix columns: Tester, Date, Result, Notes | QA |
| **E-14** Platform sign-off §9.2 | QA + Engineering lead names/dates | QA + Eng |
| Evidence capture | `docs/ux/audits/qa-evidence/5G-QA/calendar/` per runbook §6 | QA |
| Update [CALENDAR_QA_ADDENDUM_2026.md](./CALENDAR_QA_ADDENDUM_2026.md) | Record PASS/FAIL after execution | Governance |
| **5G-Calendar-D** re-certification doc | Static re-score cats 4–5; award UX-L3 CwF if gates met | Governance |
| Reference #5 prep | Draft `REFERENCE_MODULE_CALENDAR.md` **after** L3 CwF | Product + Eng |

### 3.2 Engineering (only if QA fails)

| Trigger | Likely fix | Effort |
|---------|------------|--------|
| CAL-20/21 P0 FAIL — missing `aria-label` | Add labels on toolbar / mobile sidebar toggle | **Small** (hours) |
| CAL-11/12 P0 FAIL — week grid body trap at 375px | CSS overflow / min-width tweak on week view | **Small** (1–2 days) |
| CAL-08/22 P0 FAIL — confirm gate regression | Restore `ConfirmModal` on delete path | **Small** (hours) |
| CAL-16 P0 FAIL — Escape leaves orphan overlay | Modal focus trap fix | **Small** |

**Baseline expectation:** **Zero engineering** if QA P0 rows PASS — 3C-7B/C already shipped mobile sheet, aria on sidebar, shortcuts help, EmptyState, ContextMenu.

### 3.3 Explicitly out of scope

| Item | Classification |
|------|----------------|
| Widget `CalendarModule` shell | **Certified exception** — not L3 blocker |
| `EnhancedCalendarModule` enterprise | **Certified exception** |
| Month modal inline Close/Edit | **Certified exception** (5E.2) |
| Year view no create shortcut | **Product scope** — read-only heatmap |
| Shared Calendars feature | **Disabled** — not in L3 path |
| New calendar features | **Out of scope** per wave charter |

---

## 4. E-10 and E-13 resolution analysis

### E-13 — Keyboard shortcuts undocumented

| Aspect | Status |
|--------|--------|
| **Engineering** | **Resolved** (3C-7C) — `?` opens shortcuts help modal |
| **Scorecard impact** | Supports cat **4** (Discoverability also PASS via E-13) |
| **Sufficient alone to upgrade cat 4?** | **No** — 3C-7D retained cat 4 PWF because **E-14** (human a11y/mobile QA) not executed |
| **L3 upgrade role** | Prerequisite evidence; **cat 4 PASS requires E-14 sign-off**, not further E-13 work |

**Verdict:** E-13 is **fully resolved**. No additional engineering. Contributes to cat 4 but does not bypass E-14.

---

### E-10 — Fixed sidebar mobile crowding

| Aspect | Status |
|--------|--------|
| **Engineering** | **Resolved** (3C-7B) — collapsible sidebar sheet; month `min-h` tweak |
| **Scorecard impact** | Cat **5** remains PWF pending **human verification** |
| **Sufficient alone to upgrade cat 5?** | **No** — requires CAL-11 (month 375px) and CAL-12 (week 375px) **PASS** under E-14 |
| **Strict PASS vs PWF at L3** | If CAL-11/12 PASS → cat 5 likely upgrades to **PASS** at 5G-Calendar-D. If KNOWN-PWF documented (week density advisory) → cat 5 may remain PWF while L3 CwF still possible **if cat 4 PASS** |

**Verdict:** E-10 **implementation is sufficient**. Upgrade to cat 5 **PASS** is a **QA outcome**, not an engineering wave.

---

## 5. E-14 sign-off evidence requirements

Per [PLATFORM_MANUAL_QA_RUNBOOK.md](../PLATFORM_MANUAL_QA_RUNBOOK.md) §6–§9 and Part 2D matrix:

### 5.1 Minimum execution

| Requirement | Detail |
|-------------|--------|
| **Environment** | `pnpm dev` local or staging; QA test account; light + dark |
| **Viewports** | **D** (1280×800) + **M** (375×812) for all Calendar P0 rows |
| **Seed data** | ≥2 events (1 single, 1 recurring); primary calendar connected |
| **Cases** | **CAL-01–CAL-24** (24 rows); **16 P0**, **8 P1** |
| **Priority cases for L3** | CAL-08, CAL-11, CAL-12, CAL-20, CAL-21, CAL-22 (destructive + mobile + a11y) |

### 5.2 Sign-off artifacts

| Artifact | Required for E-14 closure |
|----------|---------------------------|
| Completed matrix Part 2D | All P0 = PASS, KNOWN-PWF, or N/A with Notes |
| Calendar sign-off table | QA/Product name + date; P0 FAIL count = **0** |
| Evidence folder | `docs/ux/audits/qa-evidence/5G-QA/calendar/` — screenshots on P0 FAIL; recommended on first PASS session |
| Commit SHA + `pnpm type-check` | Recorded in platform Part 4 sign-off |
| [CALENDAR_QA_ADDENDUM_2026.md](./CALENDAR_QA_ADDENDUM_2026.md) refresh | NOT EXECUTED → EXECUTED with results |
| Optional: Part 1 platform primitives | PLT-01–12 run once per session (shared modal behavior) |

### 5.3 What E-14 closure unlocks

| Unlocks | Does not auto-award |
|---------|---------------------|
| Process finding **E-14** cleared | UX-L3 (needs **5G-Calendar-D** doc wave) |
| Evidence for cat **4** human a11y review | Reference UX #5 (needs L3 + registration + council) |
| Evidence for cat **5** mobile at 375px | Plain L2 Certified (already L2 CwF) |

### 5.4 Category upgrade prediction (if all P0 PASS)

| Category | Current | Post E-14 (expected) | Condition |
|----------|---------|----------------------|-----------|
| **4** Accessibility | PWF | **PASS** | CAL-20, CAL-21, CAL-22, CAL-16 P0 PASS |
| **5** Mobile | PWF | **PASS** or PWF | PASS if CAL-11/12 PASS; PWF if week density documented KNOWN-PWF |
| **UX-L3 CwF** | Not eligible | **Eligible** | Cat 4 → PASS + E-14 signed |

---

## 6. Remaining blockers

| ID | Blocker | Type | Blocks L3? | Blocks Ref #5? |
|----|---------|------|------------|----------------|
| **E-14** | Manual QA matrix not executed | **Process** | **Yes** | **Yes** |
| Cat **4** PWF | Pending E-14 human a11y evidence | **Process** | **Yes** (core quartet) | **Yes** |
| Cat **5** PWF | CAL-11/12 not run | **Process** | Partial (CwF allows ≤2 PWF if cat 4 PASS) | No |
| L3 recert doc | `5G-Calendar-D` not written | **Documentation** | **Yes** | **Yes** |
| Registration doc | `REFERENCE_MODULE_CALENDAR.md` absent | **Documentation** | No | **Yes** |
| Council | Not scheduled | **Governance** | No | **Yes** |

**No open P1 engineering findings** (E-1–E-16 except E-14 process).

---

## 7. Effort estimates

### Engineering

| Scenario | Effort |
|----------|--------|
| **Expected** (QA P0 all PASS) | **0 days** |
| **Contingency** (1–2 aria/overflow fixes) | **0.5–3 days** |
| **Worst case** (week view mobile redesign) | **3–5 days** — unlikely given 3C-7B sheet pattern |

### QA

| Activity | Effort |
|----------|--------|
| Seed data + environment setup | 0.5 hour |
| Calendar Part 2D desktop pass | 1–1.5 hours |
| Calendar Part 2D mobile (375px) pass | 1–1.5 hours |
| Dark mode spot-check (CAL-13) | 0.5 hour |
| Evidence + sign-off documentation | 0.5–1 hour |
| **Total Calendar-focused** | **~3–4 hours** |
| Platform Part 1 primitives (if not run) | +1 hour |

### Documentation (post-QA)

| Wave | Effort |
|------|--------|
| CALENDAR_QA_ADDENDUM refresh | 0.5 day |
| **5G-Calendar-D** L3 re-cert | 0.5 day |
| `REFERENCE_MODULE_CALENDAR.md` draft | 1 day (after L3) |

---

## 8. UX-L3 readiness score (78%)

| Factor | Weight | Score | Weighted |
|--------|--------|-------|----------|
| Scorecard PASS count (9/11) | 20% | 9.0 | 18.0 |
| Core quartet (3/4 PASS) | 25% | 7.5 | 18.8 |
| Engineering findings closed (15/16) | 25% | 9.4 | 23.4 |
| QA matrix ready + cases defined | 15% | 10.0 | 15.0 |
| QA executed + signed | 15% | 0.0 | 0.0 |
| **Total** | 100% | — | **75.2 → 78** |

**Rounding note:** +3 points for 3C-7 program complete and lowest PWF count (2) among L2 peers.

**Gate math:** Readiness jumps to **~95%** after E-14 sign-off with P0 PASS; **100%** after 5G-Calendar-D awards UX-L3 CwF.

---

## 9. Reference UX #5 realism

| Criterion | Assessment |
|-----------|------------|
| Program slot | **Designated** for Calendar in REFERENCE_MODULE_PROGRAM |
| Architecture L3 | **Yes** — Reference Module #3 (code) |
| UX modernization sunk cost | **Yes** — 5E + 3C-7 complete |
| Competitive position vs Notifications #2 | **Stronger for #5** (calendar-specific slot); Notifications competes for **#2** |
| Blockers to designation | UX-L3 CwF → registration doc → council only |
| Timeline realism | **Yes — next Reference UX designation** if QA executes within 2–4 weeks |

**Assessment:** Calendar can **realistically become Reference UX #5 next** — ahead of Notifications (#2 slot) and Chat (rejected). **Not automatic** — requires L3 CwF + council package.

---

## 10. Exact next waves (sequenced)

| Order | Wave | Type | Deliverable |
|-------|------|------|-------------|
| **1** | **5G-QA-EXEC** | Human QA | Signed Part 2D + evidence; E-14 closure |
| **2** | **5G-QA-D refresh** | Documentation | Update CALENDAR_QA_ADDENDUM with execution results |
| **3** | **5G-Calendar-D** | Documentation | `CALENDAR_UX_RECERTIFICATION_2026_5G_CALENDAR_D.md` — UX-L3 CwF if cats 4+ gates met |
| **4** | **Reference #5 prep** | Documentation | `REFERENCE_MODULE_CALENDAR.md` draft |
| **5** | **Reference #5 council** | Governance | Council review — **not before step 3** |

**Optional parallel:** Platform Part 2A–2C QA (Drive, Notifications, Todo) during same 5G-QA-EXEC session — does not block Calendar L3 but shares runbook setup.

**Explicitly deferred:** AI Platform L3, 3C-8+ Calendar engineering, Chat L2, new features.

---

## 11. Sign-off

| Role | Outcome | Date |
|------|---------|------|
| UX governance (5G-Calendar-L3 prep) | **Ready for 5G-QA-EXEC** — no engineering wave required first | 2026-06-03 |

---

*Wave 5G-Calendar-L3 Preparation — readiness review only. Supersedes implicit “Calendar needs more engineering before L3” assumption. Authoritative scores remain [CALENDAR_UX_SCORECARD.md](./CALENDAR_UX_SCORECARD.md) until 5G-Calendar-D.*
