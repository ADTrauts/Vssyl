# Calendar QA Execution Report (Wave 5G-QA-EXEC)

**Status:** **Complete — live execution blocked**  
**Date:** 2026-06-03  
**Mode:** QA evidence wave only — **no certification promotion**  
**Program:** UX Modernization Wave 5G-QA-EXEC  
**Matrix:** [PLATFORM_MANUAL_QA_MATRIX.md](../PLATFORM_MANUAL_QA_MATRIX.md) Part 2D  
**Runbook:** [PLATFORM_MANUAL_QA_RUNBOOK.md](../PLATFORM_MANUAL_QA_RUNBOOK.md)  
**Evidence:** [qa-evidence/5G-QA/calendar/](./qa-evidence/5G-QA/calendar/)

---

## 1. Executive summary

| Field | Value |
|-------|-------|
| **Objective** | Execute CAL-01–CAL-24 (desktop + 375px mobile; light + dark) |
| **Outcome** | **0 live PASS** — **24 BLOCKED** |
| **Environment** | Local `pnpm dev`; commit `2a83d1f9`; `pnpm type-check` PASS |
| **Blocker** | Next.js compile error: `Can't resolve './menuShared.js'` — [ENVIRONMENT_BLOCKER.md](./qa-evidence/5G-QA/calendar/ENVIRONMENT_BLOCKER.md) |
| **E-14** | **Open** — cannot close without successful matrix execution |
| **5G-Calendar-D** | **Not ready** |

---

## 2. Results summary

| Metric | Count |
|--------|------:|
| **Total cases executed (in scope)** | **24** |
| **PASS** | **0** |
| **FAIL** | **0** |
| **N/A** | **0** (none confirmed live) |
| **KNOWN-PWF** | **0** |
| **BLOCKED** | **24** |

### By priority tier

| Tier | Total | PASS | FAIL | BLOCKED |
|------|------:|-----:|-----:|--------:|
| **P0** | 16 | 0 | 0 | **16** |
| **P1** | 8 | 0 | 0 | **8** |

### Priority cases (requested focus)

| Case | Pri | Result | Notes |
|------|-----|--------|-------|
| **CAL-08** | P0 | **BLOCKED** | Delete ConfirmModal — UI unreachable |
| **CAL-11** | P0 | **BLOCKED** | Month 375px sidebar — UI unreachable |
| **CAL-12** | P0 | **BLOCKED** | Week 375px scroll — UI unreachable |
| **CAL-20** | P0 | **BLOCKED** | Toolbar aria — live inspect blocked |
| **CAL-21** | P0 | **BLOCKED** | Mobile sidebar labels — live inspect blocked |
| **CAL-22** | P0 | **BLOCKED** | Delete cancel/Escape — UI unreachable |

---

## 3. Execution log

| Step | Action | Result |
|------|--------|--------|
| 1 | `pnpm dev` started | Web :3000; compile error on calendar |
| 2 | Browser → `/calendar/month` :3000 | **Failed to compile** |
| 3 | `pnpm build:shared` + `pnpm type-check` | **PASS** |
| 4 | Restart `pnpm dev` | Web :3001 (port conflict); same compile error |
| 5 | Browser → `/calendar/month` :3001 | **Failed to compile** |
| 6 | Document all CAL-* as BLOCKED | Complete |

**Viewports required:** Desktop (1280×800) and Mobile (375×812) — **not reached**.  
**Themes required:** Light and Dark — **not reached**.

---

## 4. New finding

| ID | Finding | Severity | Blocks E-14? |
|----|---------|----------|--------------|
| **QA-ENV-01** | Local Next.js cannot compile Calendar routes (`menuShared.js` import) | P0 (QA env) | **Yes** |

**Remediation (engineering — out of scope for 5G-QA-EXEC):** Fix shared menu import resolution for Next dev **or** run matrix on staging with QA account.

---

## 5. Supplementary static review (non-sign-off)

Source-only review performed while blocked. **Does not satisfy runbook PASS criteria.**

| Case | Observation | File |
|------|-------------|------|
| CAL-08 | `ConfirmModal` gated delete | `EventDrawer.tsx` |
| CAL-20 | Multiple `aria-label` on nav/toolbar | `CalendarPageShell.tsx`, view components |
| CAL-21 | Open/close calendars `aria-label` | `CalendarPageShell.tsx` |
| CAL-24 | `CalendarPageShell` + `WorkspaceSplitLayout` | `CalendarPageShell.tsx` |

Full inventory: [EVIDENCE_INVENTORY.md](./qa-evidence/5G-QA/calendar/EVIDENCE_INVENTORY.md).

---

## 6. Certification impact

| Field | Before | After 5G-QA-EXEC |
|-------|--------|------------------|
| UX-L1 | Certified | **Unchanged** |
| UX-L2 | Certified with Findings | **Unchanged** |
| UX-L3 | Not certified | **Unchanged** |
| Scorecard | 9 PASS / 2 PWF / 0 FAIL | **Unchanged** |
| **E-14** | Open | **Open** |
| Cat **4** Accessibility | PWF | **PWF** |
| Cat **5** Mobile | PWF | **PWF** |

**No certification promotion** in this wave.

---

## 7. E-14 closure assessment

| Criterion | Met? |
|-----------|------|
| CAL-01–24 executed with PASS/KNOWN-PWF/N/A on all P0 | **No** — 24 BLOCKED |
| Calendar sign-off table completed | **No** |
| Evidence folder with screenshots (where required) | **No** — blocker doc only |
| QA/Product + Engineering sign-off | **No** |

**E-14 can be closed?** **No.**

---

## 8. 5G-Calendar-D readiness

| Gate | Ready? |
|------|--------|
| E-14 closed | **No** |
| Cat 4 potentially PASS | **No** — no live a11y QA |
| Cat 5 potentially PASS | **No** — CAL-11/12 unrun |
| UX-L3 CwF re-cert doc | **Deferred** |

**Calendar ready for 5G-Calendar-D?** **No.**

**Recommended next:**

1. **Unblock QA environment** (fix QA-ENV-01 or use staging).
2. **Re-run 5G-QA-EXEC** — full Part 2D with sign-off.
3. **Then** open **5G-Calendar-D** documentation re-cert.

---

## 9. Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| QA execution | Agent session | 2026-06-03 | Live cases BLOCKED — QA-ENV-01 |
| QA / Product sign-off | — | — | **Not signed** |
| Engineering sign-off | — | — | **Not signed** |

---

## Related

- [CALENDAR_QA_ADDENDUM_2026.md](./CALENDAR_QA_ADDENDUM_2026.md) — updated post-exec
- [CALENDAR_UX_L3_READINESS_REVIEW.md](./CALENDAR_UX_L3_READINESS_REVIEW.md)
- [PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md](./PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md)

---

**Last updated:** 2026-06-03 (Wave 5G-QA-EXEC)
