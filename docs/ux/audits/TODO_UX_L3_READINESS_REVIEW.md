# Todo UX-L3 Readiness Review (Wave 5G-Todo-L3 Prep)

**Module:** Todo (`todo`)  
**Date:** 2026-06-12  
**Phase:** UX-L3 readiness audit (governance only)  
**Current level:** **UX-L2 Certified with Findings** (9 PASS / 2 PWF / 0 FAIL)  
**Program slot:** Reference UX **#3** vacant candidate — [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md)  
**Authorities:** [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md), [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md), [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md), [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md), [`PLATFORM_MANUAL_QA_MATRIX.md`](../PLATFORM_MANUAL_QA_MATRIX.md) Part 2C, [`PLATFORM_MANUAL_QA_RUNBOOK.md`](../PLATFORM_MANUAL_QA_RUNBOOK.md)

> **This document is a readiness audit only.** It does **not** award UX-L3, Reference UX designation, or require code changes. **No certification promotion** in this wave.

---

## Executive summary

Todo is **engineering-mostly-complete** for UX-L3. Wave **5G** resolved **T-8** (shared `EmptyState`) and **T-9** (`aria-label`s); **T-7** received partial responsive secondary width. Remaining UX-L3 blockers are **process (T-11)** and **human verification** of categories **4** and **5** — same gate class as Calendar pre-**5G-Calendar-D** (E-14) and Notifications pre-**5G-Notifications-D** (N-6).

| Metric | Value |
|--------|-------|
| **UX-L3 readiness** | **74%** — QA-ready; not ready for L3 certification review |
| **Engineering effort to L3** | **None–Small** (0–3 days only if TODO-15 mobile FAIL) |
| **QA effort to L3** | **Medium** (~3–4 hours Todo; ~0.5 day with evidence) |
| **Documentation effort** | **Small** (~0.5 day post-QA L3 review + optional registration draft) |
| **Reference UX viability** | **Moderate** — Architecture **#4** strong; UX **#3** slot open but not designated |
| **Exact next wave** | **5G-QA-EXEC** (Part 2C) → optional **5H-Todo** (T-7 sheet, T-12 shortcuts) → **5G-Todo-L3-D** |

**Post-Calendar/Notifications note:** Calendar (**UX-L3 Certified**, Reference UX **#5**) and Notifications (**UX-L3 CwF**, Reference UX **#2**) are complete. Todo is the **fastest remaining UX-L3 path** among L2-certified modules (2 PWF, single process gate).

**Do not start:** AI Platform L3, Chat L2/L3, new Todo features, Reference council.

---

## 1. Current certification state

| Field | Value |
|-------|-------|
| **PASS** | **9** |
| **PWF** | **2** |
| **FAIL** | **0** |
| **UX-L1** | **Certified** |
| **UX-L2** | **Certified with Findings** |
| **UX-L3** | **Not certified** |
| **Reference UX slot** | **Not eligible** |
| **Architecture Reference** | **#4** (Level 3 code — independent track) |

**PWF categories:** **4** Accessibility · **5** Mobile

**Authoritative artifacts:** [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md), [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md), [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md)

### Wave history (relevant)

| Wave | Outcome |
|------|---------|
| 5D.1 | T-1 delete confirm — interaction safety |
| 5D.3 | T-2–T-5 layout/workflow/hub |
| 5D.4 | 8 PASS / 3 PWF — UX-L1 CwF |
| 5G | T-8, T-9 resolved; T-7 partial |
| 5G-Todo-D | **9 PASS / 2 PWF** — UX-L2 CwF |

---

## 2. UX-L3 gate analysis

Per [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md):

### 2.1 UX-L3 Certified (strict)

| Rule | Todo status | Met? |
|------|-------------|------|
| Prerequisite UX-L2 Certified | L2 **CwF** awarded | ✅ (chain) |
| No FAIL in any category | 0 FAIL | ✅ |
| ≥9 categories **PASS** (strict) | 9 PASS | ✅ |
| Core quartet **1, 2, 4, 11** all **PASS** | Cat **4 PWF** | ❌ |
| Manual QA matrix executed | **T-11 open** | ❌ |

### 2.2 UX-L3 Certified with Findings (realistic target)

| Rule | Todo status | Met? |
|------|-----------------|------|
| L3 bar (≥9 PASS, no FAIL) | 9 PASS | ✅ |
| Core quartet cats **1, 2, 4, 11** **PASS** | Cat **4 PWF** | ❌ |
| ≤2 categories PWF at L3 CwF | **2 PWF** (4, 5) | ✅ (count) |
| Manual QA executed or product waiver | **T-11 unsigned** | ❌ |
| Certification L3 review artifact | Not written | ❌ |

**Interpretation:** Todo cannot receive **UX-L3 CwF** until (a) **category 4 → PASS** (requires **T-11** human a11y evidence), and (b) **T-11** process gate closed. Category **5** may remain PWF at L3 CwF if ≤2 total PWF and cat 4 PASS — same precedent as Calendar (cat 5 PWF allowed at L3 CwF when cat 4 clears).

---

## 3. Remaining findings review (T-6 through T-12)

| ID | Finding | Severity | Engineering effort | Certification impact | Blocks UX-L3? |
|----|---------|----------|-------------------|----------------------|---------------|
| **T-11** | Manual QA matrix Part **2C** not executed / unsigned | **Process (P0 gate)** | **None** — QA execution only | Blocks L3 evidence; cats **4** and **5** human verification | **Yes** |
| **T-7** | Detail panel — partial responsive width; no mobile sheet | **P2** | **Small–Medium** (1–3 days) — overlay/sheet only if **TODO-15** FAIL | Cat **5** PWF; tied to TODO-14/15 | **No** alone; **Yes** if mobile QA FAIL and not remediated |
| **T-12** | No list keyboard navigation; no shortcuts help | **P3** | **Small** (0.5–1 day) — optional `?` help modal | Cat **4** strict PASS; matrix allows **KNOWN-PWF** (TODO-18) | **No** for L3 CwF if documented |
| **T-6** | Board compact hides overflow menu | **P3** | **None** unless product expands | TODO-28 **KNOWN-PWF** per matrix | **No** |
| **T-10** | Drive file unlink without confirm | **P3** | **Small** (hours) if product requires | Cross-module polish | **No** |

**Resolved (context):** **T-1**–**T-5** (5D), **T-8** shared `EmptyState` (5G), **T-9** aria labels (5G).

---

## 4. T-7 and T-12 resolution analysis

### T-9 — Overflow aria-label (resolved)

| Aspect | Status |
|--------|--------|
| **Engineering** | **Resolved** (5G) — `TaskItem` `aria-label="Task actions"`; `ProjectManager` action labels |
| **Scorecard impact** | Cleared primary L1 code defect; cat **4** still PWF pending **T-11** |
| **Sufficient alone for cat 4 PASS?** | **No** — 5G-Todo-D precedent: process gate + T-12 remain |

**Verdict:** T-9 **fully resolved**. Cat 4 upgrade requires **T-11** sign-off (TODO-24/25 P0), not more T-9 work.

### T-7 — Mobile detail panel (partial)

| Aspect | Status |
|--------|--------|
| **Engineering** | **Partial** (5G) — removed rigid `min-w-[384px]`; responsive `lg:w-96` |
| **Not implemented** | Mobile sheet / hide-secondary pattern (deferred in 5G closeout) |
| **Scorecard impact** | Cat **5** PWF pending human verification |
| **Sufficient alone for cat 5 PASS?** | **No** — requires **TODO-14** (board 375px) and **TODO-15** (detail at 375px) **PASS** under T-11 |

**Verdict:** T-7 partial improvement may suffice for **TODO-15 PASS** — contingency engineering only if QA FAIL.

### T-12 — Keyboard shortcuts (open)

| Aspect | Status |
|--------|--------|
| **Engineering** | **Open** — no `j`/`k` list nav; no shortcuts help modal |
| **Matrix treatment** | **TODO-18** P1 — **KNOWN-PWF if absent** (explicit waiver path) |
| **Calendar precedent** | Calendar upgraded cat 4 after **E-13** shortcuts help; Todo may retain cat 4 **PASS** at L3 CwF with T-12 documented as non-blocking per matrix |

**Verdict:** T-12 is **optional polish** for strict 11/11 PASS — not required for **UX-L3 CwF** if TODO-18 recorded KNOWN-PWF.

---

## 5. T-11 sign-off evidence requirements

Per [`PLATFORM_MANUAL_QA_RUNBOOK.md`](../PLATFORM_MANUAL_QA_RUNBOOK.md) and Part 2C matrix:

### 5.1 Minimum execution

| Requirement | Detail |
|-------------|--------|
| **Environment** | `pnpm dev` local or staging; QA test account; light + dark |
| **Viewports** | **D** (1280×800) + **M** (375×812) for all Todo P0 rows |
| **Seed data** | ≥3 tasks (mixed statuses); ≥1 project; optional Drive attachment + due date for P1 rows |
| **Cases** | **TODO-01–TODO-30** (30 rows); **22 P0**, **8 P1** |
| **Priority cases for L3** | TODO-09/10/13 (delete confirms), TODO-14/15 (mobile), TODO-24/25 (aria), TODO-17 (Escape), TODO-19/20 (empty) |

### 5.2 Sign-off artifacts

| Artifact | Required for T-11 closure |
|----------|---------------------------|
| Completed matrix Part 2C | All P0 = PASS, KNOWN-PWF, or N/A with Notes |
| Todo sign-off table | QA/Product name + date; P0 FAIL count = **0** |
| Evidence folder | `docs/ux/audits/qa-evidence/5G-QA/todo/` — screenshots on P0 FAIL |
| Commit SHA + `pnpm type-check` | Recorded in execution report |
| [`TODO_QA_ADDENDUM_2026.md`](./TODO_QA_ADDENDUM_2026.md) refresh | NOT EXECUTED → EXECUTED with results |
| Optional: Part 1 platform primitives | PLT-01–12 once per session |

### 5.3 What T-11 closure unlocks

| Unlocks | Does not auto-award |
|---------|---------------------|
| Process finding **T-11** cleared | UX-L3 (needs **5G-Todo-L3-D** doc wave) |
| Evidence for cat **4** human a11y review | Reference UX (needs L3 + registration) |
| Evidence for cat **5** mobile at 375px | Plain L2 Certified (already L2 CwF) |

### 5.4 Category upgrade prediction (if all P0 PASS)

| Category | Current | Post T-11 (expected) | Condition |
|----------|---------|----------------------|-----------|
| **4** Accessibility | PWF | **PASS** | TODO-24/25/17 P0 PASS; T-12 KNOWN-PWF acceptable |
| **5** Mobile | PWF | **PASS** or PWF | PASS if TODO-14/15 PASS; PWF if TODO-15 documents T-7 partial |
| **UX-L3 CwF** | Not eligible | **Eligible** | Cat 4 → PASS + T-11 signed |

**Optimistic post-QA scorecard:** **10–11 PASS / 0–1 PWF / 0 FAIL**

---

## 6. Remaining blockers

| ID | Blocker | Type | Blocks L3? | Blocks Reference? |
|----|---------|------|------------|-------------------|
| **T-11** | Manual QA matrix not executed | **Process** | **Yes** | **Yes** |
| Cat **4** PWF | Pending T-11 human a11y evidence | **Process** | **Yes** (core quartet) | **Yes** |
| Cat **5** PWF | TODO-14/15 not run | **Process** | Partial (CwF allows ≤2 PWF if cat 4 PASS) | No |
| L3 review doc | `5G-Todo-L3-D` not written | **Documentation** | **Yes** | **Yes** |
| Registration doc | `REFERENCE_MODULE_TODO.md` absent | **Documentation** | No | **Yes** |
| UX slot designation | Reference UX **#3** not defined in program beyond vacant | **Governance** | No | **Yes** |

**No open P1 engineering findings** (T-1–T-5, T-8, T-9 resolved).

---

## 7. Effort estimates

### Engineering

| Scenario | Effort |
|----------|--------|
| **Expected** (QA P0 all PASS) | **0 days** |
| **Contingency** (TODO-15 FAIL — detail panel at 375px) | **1–3 days** — mobile sheet or hide-secondary on narrow viewports |
| **Optional** (T-12 shortcuts help for strict cat 4) | **0.5–1 day** — not required for L3 CwF |
| **Optional** (T-10 Drive unlink confirm) | **0.5 day** — P3 only |

### QA

| Activity | Effort |
|----------|--------|
| Seed data + environment setup | 0.5 hour |
| Todo Part 2C desktop pass | 1.5–2 hours |
| Todo Part 2C mobile (375px) pass | 1–1.5 hours |
| Dark mode spot-check (TODO-16) | 0.5 hour |
| Evidence + sign-off documentation | 0.5–1 hour |
| **Total Todo-focused** | **~3.5–4.5 hours** |
| Platform Part 1 primitives (if not run) | +1 hour |

### Documentation (post-QA)

| Wave | Effort |
|------|--------|
| `TODO_QA_ADDENDUM_2026.md` refresh | 0.5 day |
| **5G-Todo-L3-D** L3 certification review | 0.5 day |
| `REFERENCE_MODULE_TODO.md` draft (optional UX #3) | 1 day (after L3) |

---

## 8. UX-L3 readiness score (74%)

| Factor | Weight | Score (0–10) | Weighted |
|--------|--------|--------------|----------|
| Scorecard PASS count (9/11) | 20% | 9.0 | 18.0 |
| Core quartet (3/4 PASS) | 25% | 7.5 | 18.75 |
| Engineering findings closed (T-1–T-9 material; T-7 partial) | 25% | 8.5 | 21.25 |
| QA matrix defined + cases mapped (Part 2C) | 15% | 10.0 | 15.0 |
| QA executed + signed (T-11) | 15% | 0.0 | 0.0 |
| **Total** | 100% | — | **73.0 → 74%** |

**Comparison (post-L3 peers):**

| Module | Pre-L3 readiness | PWF at L2 | Primary gate | Post-L3 outcome |
|--------|------------------|-----------|--------------|-----------------|
| Calendar (pre-5G-D) | **78%** | 2 | E-14 QA | UX-L3 Certified |
| Notifications (pre-5G-D) | **65%** | 4 | N-6 QA + PWF reduction | UX-L3 CwF |
| **Todo (now)** | **74%** | **2** | **T-11 QA** | — |
| Chat | **~45%** | 5 | L2 bar + C-8 QA | Rejected UX #2 |

**Gate math:** Readiness → **~92%** after T-11 sign-off with P0 PASS; **~98%** after 5G-Todo-L3-D awards UX-L3 CwF.

---

## 9. Reference-module viability

### UX Reference eligibility

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md):

| Requirement | Todo status |
|-------------|-------------|
| UX-L3 Certified with Findings minimum | ❌ Not L3 |
| Manual QA matrix executed | ❌ T-11 pending |
| Interaction + layout modernization | ✅ 5D.1 + 5D.3 + 3A-4D |
| Distinctive benchmark role | **Moderate** — workspace-split task UX; overlaps Drive #1 shell teachings |

### Slot assessment

| Slot | Assessment |
|------|------------|
| **Reference UX #1** | N/A — Drive |
| **Reference UX #2** | N/A — Notifications (registered) |
| **Reference UX #3** | **Vacant** — Todo is **plausible** candidate for work-management / board UX after L3 CwF |
| **Reference UX #5** | N/A — Calendar |
| **Architecture Reference #4** | ✅ **Already held** — code patterns independent of UX registration |

**Viability rating:** **Moderate**

- **Strengths:** Full workspace shell (`WorkspaceSplitLayout` + hub); list/board/calendar tri-view; confirm-gated deletes; shared `EmptyState`; Architecture L3 parity for backend copy targets.
- **Weaknesses:** No designated program slot (unlike Calendar #5); teaching overlap with Drive workspace split; T-7/T-12 gaps vs Calendar/Notifications polish depth.
- **Realistic path:** **UX-L3 CwF first** → product decision on whether UX **#3** registration adds value beyond Architecture **#4**.

**Not competitive** with completed Reference UX holders for immediate registration — **L3 CwF is prerequisite**.

---

## 10. Exact next waves (sequenced)

| Order | Wave | Type | Deliverable |
|-------|------|------|-------------|
| **1** | **5G-QA-EXEC** (Part 2C) | Human QA | Signed TODO-01–30 + evidence; **T-11** closure |
| **2** | **5G-QA addendum refresh** | Documentation | `TODO_QA_ADDENDUM_2026.md` + execution report |
| **3** | **5G-Todo-L3-D** | Documentation | L3 certification review — UX-L3 CwF if cats 4+ gates met |
| **4** | **5H-Todo** (optional) | Engineering | T-7 mobile sheet + T-12 shortcuts — only if TODO-15 FAIL or product wants strict 11/11 |
| **5** | **Reference UX #3 prep** (optional) | Documentation | `REFERENCE_MODULE_TODO.md` — **after** step 3; product approval required |

**Explicitly deferred:** AI Platform L3, Chat L2/L3, new Todo features, Place/Dashboard modernization.

---

## 11. Strategic priority

### Versus Chat UX

| Dimension | Chat | Todo |
|-----------|------|------|
| UX-L1 | CwF (6 PASS) | **Certified** (9 PASS) |
| UX-L2 | Not certified | **CwF** |
| Distance to L3 | **Far** (~3+ PASS cats + C-8 QA) | **Near** (T-11 + cat 4 verification) |
| Reference UX | **#2 Rejected** | **#3 plausible post-L3** |
| **Priority** | **Lower** — defer until L2 bar met | **Higher** — finish L3 first |

### Versus AI Platform L3

Per [`AI_PLATFORM_LEVEL3_READINESS_REVIEW.md`](../../architecture/audits/AI_PLATFORM_LEVEL3_READINESS_REVIEW.md):

| Dimension | AI Platform L3 | Todo UX-L3 |
|-----------|------------------|------------|
| Readiness score | **52%** | **74%** |
| Engineering effort | **8–14 weeks** | **0–3 days** |
| QA effort | Integration smoke + matrix C push | **~4 hours** Part 2C |
| ROI rank | **5 of 5** (lowest) | **#1 remaining UX-L3** (Calendar/Notifications done) |
| **Priority** | **Defer** | **Execute now** |

### Versus new module modernization

| Option | Effort | Certification ROI |
|--------|--------|-------------------|
| **Todo → UX-L3 CwF** | ~1 week total (QA + docs) | **High** — third module at L3 |
| **Chat → UX-L2** | Multi-wave engineering + QA | Medium — still far from Reference |
| **Place UX waves** | Large — menus/layout/interaction not Drive-parity | Medium-long — architecture L3 exists |
| **AI / Dashboard / Analytics UX** | Not started | Low near-term |

**Strategic headline:** **Todo UX-L3 is the highest-ROI remaining UX certification work** on the platform. Execute **5G-QA-EXEC Part 2C** before resuming AI Platform L3 or broad new-module UX investment.

---

## 12. Remaining work summary (UX-L3 CwF)

| Work item | Type | Required? | Est. effort |
|-----------|------|-----------|-------------|
| Execute Part 2C matrix (TODO-01–30) | QA | **Yes** | ~4 hours |
| T-11 sign-off + evidence package | Process | **Yes** | incl. above |
| Cat 4 upgrade (a11y P0 PASS) | Certification review | **Yes** | 5G-Todo-L3-D |
| Cat 5 upgrade or documented PWF | Certification review | Partial | 5G-Todo-L3-D |
| T-7 mobile sheet (if TODO-15 FAIL) | Engineering | Conditional | 1–3 days |
| T-12 shortcuts help | Engineering | Optional | 0.5–1 day |
| `5G-Todo-L3-D` certification review doc | Documentation | **Yes** | 0.5 day |
| Reference UX #3 registration | Governance | Optional | 1 day post-L3 |

---

## Related

- [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md) — **5G-Todo-D authoritative** until L3 review
- [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](./TODO_L2_POLISH_BATCH5G_CLOSEOUT.md)
- [`CALENDAR_UX_L3_READINESS_REVIEW.md`](./CALENDAR_UX_L3_READINESS_REVIEW.md) — methodology precedent
- [`NOTIFICATIONS_UX_L3_READINESS_REVIEW.md`](./NOTIFICATIONS_UX_L3_READINESS_REVIEW.md)
- [`REFERENCE_MODULE_CALENDAR.md`](./REFERENCE_MODULE_CALENDAR.md) — post-L3 registration precedent

---

## Sign-off

| Role | Outcome | Date |
|------|---------|------|
| UX governance (5G-Todo-L3 prep) | **Ready for 5G-QA-EXEC Part 2C** — no engineering wave required first | 2026-06-12 |

---

*Wave 5G-Todo-L3 Preparation — readiness review only. Authoritative scores remain [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md) until 5G-Todo-L3-D.*
