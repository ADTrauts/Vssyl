# Place QA Execution Report (Wave 6B-Place-QA + R2)

**Status:** **Complete** — evidence only; no certification promotion  
**Date:** 2026-06-03 (R1) · 2026-06-14 (R2 closeout)  
**Wave:** 6B-Place-QA — Part 2G + **6B-Place-QA-R2**  
**Environment:** Local `http://localhost:3000` + `http://localhost:5000` (inline `JWT_SECRET`, `NEXTAUTH_URL`)  
**QA account:** `qa-calendar-5g-exec-2026@test.com`  
**Matrix:** [PLATFORM_MANUAL_QA_MATRIX.md](../PLATFORM_MANUAL_QA_MATRIX.md) Part 2G (PLC-01–27)  
**Runbook:** [PLATFORM_MANUAL_QA_RUNBOOK.md](../PLATFORM_MANUAL_QA_RUNBOOK.md)  
**Evidence:** [qa-evidence/5G-QA/place/](./qa-evidence/5G-QA/place/)  

---

## 1. Executive summary (combined R1 + R2)

| Field | R1 (2026-06-03) | After R2 (2026-06-14) |
|-------|-----------------|------------------------|
| **Objective** | Execute PLC-01–PLC-27 | Re-run 15 failed/blocked rows after env remediation |
| **Total cases** | **27** | **27** (12 unchanged PASS + 15 re-run) |
| **PASS** | 12 | **27** |
| **FAIL** | 3 | **0** |
| **BLOCKED** | 12 | **0** |
| **P0 failures** | 1 (PLC-05) | **0** |
| **P1 failures** | 2 (PLC-20, PLC-27) | **0** |
| **Evidence** | 15 screenshots + `qa-results.json` | +15 R2 screenshots + `qa-results-r2.json` + `seed-qa-place.mjs` |
| **P-13** | Closable | **Closable** |
| **Certification review** | Not ready | **Ready for review gate** (human sign-off pending) |
| **Mode** | Evidence only | Evidence only — no UX-L1/L2, no certification award |

---

## 2. Results by priority (combined)

| Tier | Total | PASS | FAIL | BLOCKED |
|------|------:|-----:|-----:|--------:|
| **P0** | 18 | **18** | **0** | **0** |
| **P1** | 9 | **9** | **0** | **0** |

---

## 3. Migration status (PLC-QA-ENV-01)

| Check | Result |
|-------|--------|
| Migration `20260603140000_place_listing_meeting_trash_vlink` in repo | ✅ Present |
| `pnpm prisma migrate deploy` (local) | ✅ Applied (includes `place_meeting_places.trashedAt`) |
| `pnpm prisma:generate` | ✅ Refreshed client |
| Runtime column `place_meeting_places.trashedAt` | ✅ Verified |
| **PLC-QA-ENV-01 resolved?** | **Yes** |

---

## 4. Environment and data (post-R2)

| ID | Finding | Severity | Status | Notes |
|----|---------|----------|--------|-------|
| **QA-ENV-02** | `JWT_SECRET` not in root `.env` | P1 (env) | Open | Inline env workaround at dev start |
| **PLC-QA-ENV-01** | `trashedAt` migration drift | P0 (env) | **Resolved** | R2 migration deploy |
| **PLC-QA-DATA-01** | No business on QA account | P0 (data) | **Resolved** | `seed-qa-place.mjs` — publisher + discovery businesses |
| **PLC-QA-DATA-02** | No published listings for follow | P1 (data) | **Resolved** | Discovery listing seeded; PLC-08 follow exercised |

---

## 5. R2 re-run scope and results

**Re-run only (15 cases):** PLC-04, PLC-05, PLC-06, PLC-08, PLC-09, PLC-10, PLC-11, PLC-12, PLC-13, PLC-14, PLC-16, PLC-17, PLC-20, PLC-24, PLC-27  

**R2 outcome:** **15 PASS / 0 FAIL / 0 BLOCKED** (`run-part2g-qa-r2.mjs`, `qa-results-r2.json`)

| Case | R1 | R2 | Notes |
|------|----|----|-------|
| PLC-04 | BLOCKED | **PASS** | Publisher hub + PageHeader |
| PLC-05 | FAIL | **PASS** | Meeting create after migration |
| PLC-06 | BLOCKED | **PASS** | Listing save in publisher editor |
| PLC-08 | BLOCKED | **PASS** | Follow → graph node |
| PLC-09 | BLOCKED | **PASS** | BusinessProfilePanel from node list |
| PLC-10 | BLOCKED | **PASS** | Meeting trash via ConfirmModal |
| PLC-11 | BLOCKED | **PASS** | Listing danger-zone trash |
| PLC-12 | BLOCKED | **PASS** | Meeting restore from GlobalTrashBin |
| PLC-13 | BLOCKED | **PASS** | Listing restore from global trash |
| PLC-14 | BLOCKED | **PASS** | Permanent delete (Delete forever) |
| PLC-16 | BLOCKED | **PASS** | PlaceCalendarLinkModal |
| PLC-17 | BLOCKED | **PASS** | On calendar badge |
| PLC-20 | FAIL | **PASS** | Mobile create form usable |
| PLC-24 | BLOCKED | **PASS** | Keyboard node list |
| PLC-27 | FAIL | **PASS** | Feed inline error + Retry |

**R2 fixes applied (QA-related only):**

| Fix | File | Finding |
|-----|------|---------|
| Meeting actions menu toggle | `web/src/components/place/PlaceMeetings.tsx` | **PLC-QA-02** — dropdown never opened |
| Trash restore proxy forwards body | `web/src/app/api/trash/restore/[id]/route.ts` | **PLC-QA-03** — restore POST dropped `moduleId`/`type` → HTTP 500 |
| Trash delete proxy forwards query | `web/src/app/api/trash/delete/[id]/route.ts` | Aligns with client `?moduleId=&type=` |

---

## 6. Full case inventory (PLC-01–27, combined)

| Case | Pri | Result | View | Theme | Notes | Screenshot |
|------|-----|--------|------|-------|-------|------------|
| PLC-01 | P0 | **PASS** | D | light | `PlacePageShell` + default My Place tab | PLC-01-D-light.png |
| PLC-02 | P0 | **PASS** | D | light | Tab bar switches all panels; single shell | PLC-02-D-light.png |
| PLC-03 | P0 | **PASS** | D | light | Dashboard Place embed shares consumer tabs | PLC-03-D-light.png |
| PLC-04 | P0 | **PASS** | D | light | `PlaceWorkspaceLanding` + PageHeader (R2) | PLC-04-D-light-R2.png |
| PLC-05 | P0 | **PASS** | D | light | Meeting created and listed (R2) | PLC-05-D-light-R2.png |
| PLC-06 | P1 | **PASS** | D | light | Listing save in publisher editor (R2) | PLC-06-D-light-R2.png |
| PLC-07 | P0 | **PASS** | D | light | Search + desktop category chips | PLC-07-D-light.png |
| PLC-08 | P1 | **PASS** | D | light | Follow added graph node (R2) | PLC-08-D-light-R2.png |
| PLC-09 | P1 | **PASS** | D | light | BusinessProfilePanel from node list (R2) | PLC-09-D-light-R2.png |
| PLC-10 | P0 | **PASS** | D | light | Meeting trashed via ConfirmModal (R2) | PLC-10-D-light-R2.png |
| PLC-11 | P0 | **PASS** | D | light | Listing danger-zone trash (R2) | PLC-11-D-light-R2.png |
| PLC-12 | P0 | **PASS** | D | light | Meeting restored to Meetings tab (R2) | PLC-12-D-light-R2.png |
| PLC-13 | P0 | **PASS** | D | light | Listing restore; hub loads (R2) | PLC-13-D-light-R2.png |
| PLC-14 | P0 | **PASS** | D | light | Permanent delete confirmed (R2) | PLC-14-D-light-R2.png |
| PLC-15 | P1 | **PASS** | D | light | Empty trash ConfirmModal; cancelled | PLC-15-D-light.png |
| PLC-16 | P0 | **PASS** | D | light | PlaceCalendarLinkModal linked meeting (R2) | PLC-16-D-light-R2.png |
| PLC-17 | P1 | **PASS** | D | light | On calendar badge visible (R2) | PLC-17-D-light-R2.png |
| PLC-18 | P0 | **PASS** | M | light | MOB-001 left nav sheet + backdrop | PLC-18-M-light.png |
| PLC-19 | P0 | **PASS** | M | light | Category filter right sheet at 375px | PLC-19-M-light.png |
| PLC-20 | P1 | **PASS** | M | light | Mobile meeting create form usable (R2) | PLC-20-M-light-R2.png |
| PLC-21 | P0 | **PASS** | B | dark | Consumer shell readable | PLC-21-B-dark.png |
| PLC-22 | P1 | **PASS** | B | dark | Explore cards in dark mode | PLC-22-B-dark.png |
| PLC-23 | P1 | **PASS** | B | dark | Graph + minimap in dark mode | PLC-23-B-dark.png |
| PLC-24 | P0 | **PASS** | D | light | Keyboard node list with labeled buttons (R2) | PLC-24-D-light-R2.png |
| PLC-25 | P0 | **PASS** | D | light | Privacy overlay `role="dialog"` `aria-modal` | PLC-25-D-light.png |
| PLC-26 | P0 | **PASS** | D | light | `PlaceGraphEmptyState` visible | PLC-26-D-light.png |
| PLC-27 | P1 | **PASS** | D | light | Feed inline error + Retry (R2) | PLC-27-D-light-R2.png |

---

## 7. Coverage checklist (combined)

| Area | Status | Cases |
|------|--------|-------|
| Consumer shell | **PASS** | PLC-01, PLC-02, PLC-21 |
| Publisher shell | **PASS** | PLC-04, PLC-06 |
| Dashboard embed | **PASS** | PLC-03 |
| Explore / empty | **PASS** | PLC-07, PLC-26 |
| Graph interactions | **PASS** | PLC-08, PLC-09, PLC-23, PLC-24 |
| Meetings create | **PASS** | PLC-05, PLC-20 |
| Calendar linking | **PASS** | PLC-16, PLC-17 |
| Trash lifecycle | **PASS** | PLC-10, PLC-11, PLC-14, PLC-15 |
| Restore workflow | **PASS** | PLC-12, PLC-13 |
| Mobile 375px | **PASS** | PLC-18, PLC-19, PLC-20 |
| Dark mode | **PASS** | PLC-21–23 |
| Accessibility | **PASS** | PLC-24, PLC-25 |
| Error handling | **PASS** | PLC-27 |

---

## 8. Findings log

| ID | Severity | R1 | R2 | Description |
|----|----------|----|----|-------------|
| **PLC-QA-ENV-01** | P0 (env) | Open | **Resolved** | Migration `20260603140000_place_listing_meeting_trash_vlink` applied |
| **PLC-QA-01** | P0 (UX/API) | Open | **Resolved** | Meeting create/list 500 — same root cause as ENV-01 |
| **PLC-QA-02** | P1 (UX) | — | **Fixed** | `PlaceMeetings` actions dropdown missing `onClick` toggle |
| **PLC-QA-03** | P0 (proxy) | — | **Fixed** | Next.js trash restore route dropped POST body → restore HTTP 500 |

---

## 9. Certification readiness (evidence only)

| Question | Answer |
|----------|--------|
| Remaining FAIL count | **0** |
| Remaining BLOCKED count | **0** |
| P0 FAIL on exercisable rows | **0** |
| Env blocker resolved? | **Yes** (PLC-QA-ENV-01) |
| Ready for certification review? | **Yes** — matrix green; human sign-off still pending |
| Recommended next wave | **Place certification review** (no UX-L1/L2 award in QA waves) |

---

## 10. Sign-off

| Role | Name | Date | Viewports | P0 FAIL | Notes |
|------|------|------|-----------|---------|-------|
| QA / Product | Agent | 2026-06-14 | D + M 375px + dark | **0** | R2 complete; evidence only |
| Engineering | — | — | — | — | Human sign-off pending |

---

**Last updated:** 2026-06-14 (Wave 6B-Place-QA-R2 closeout)
