# Reference Workspace QA Evidence Inventory — Wave 2E (Part 2H)

**Date:** 2026-06-14  
**Program:** Reference Workspace Wave 2E — Cross-Surface QA  
**Matrix:** RWS-01–27 (Part 2H)  
**QA account:** `qa-calendar-5g-exec-2026@test.com`  
**Publisher business:** from `QA_PUBLISHER_BUSINESS_ID` env or local `qa-seed.json` (not committed)  
**Personal dashboard:** `2eb3a451-ec7b-48b7-b8a3-be727d9a64eb`

---

## Screenshot index

| File | Case | Surface | Notes |
|------|------|---------|-------|
| `RWS-01-business-shell-D-light.png` | RWS-01 | Business hub | Segment workspace loading |
| `RWS-02-business-drive-D-light.png` | RWS-02 | Business Drive | File Hub interior |
| `RWS-03-business-chat-D-light.png` | RWS-03 | Business Chat | No stub page |
| `RWS-05-personal-dashboard-D-light.png` | RWS-05 | Personal grid | Widget grid / templates |
| `RWS-06-personal-drive-scoped-D-light.png` | RWS-06 | Personal Drive | `?dashboard=` scope |
| `RWS-08-personal-active-module-D-light.png` | RWS-08 | Personal active state | Drive module |
| `RWS-09-business-to-personal-D-light.png` | RWS-09 | B→P transition | Personal dashboard after switch |
| `RWS-11-personal-work-tab-D-light.png` | RWS-11 | P→Work tab | Work embed (R1 capture) |
| `RWS-12-personal-to-business-D-light.png` | RWS-12 | P→B transition | Business workspace segment |
| `RWS-14-place-tab-embed-D-light-fail.png` | RWS-14 | Place tab | Automation miss — grid not embed |
| `RWS-15-personal-to-place-D-light.png` | RWS-15 | Personal → `/place` | Consumer Place |
| `RWS-16-business-to-place-publisher-D-light-blocked.png` | RWS-16 | B→Place publisher | **404 Page Not Found** |
| `RWS-18-widget-escalation-drive-D-light.png` | RWS-18 | Widget escalation | Scoped drive URL |
| `RWS-19-ai-rail-D-light.png` | RWS-19 | AI entry | `/ai-chat` family |
| `RWS-20-module-to-dashboard-D-light.png` | RWS-20 | Module → grid | Dashboard return |
| `RWS-22-personal-platformshell-D-light.png` | RWS-22 | Personal chrome | Place / Dashboard / Work tabs |
| `RWS-23-business-platformshell-D-light.png` | RWS-23 | Business chrome | Left nav + rails |
| `RWS-26-mobile-personal-shell-M-light.png` | RWS-26 | Mobile 375px | Personal shell |
| `RWS-27-global-surfaces-D-light.png` | RWS-27 | Global trash | Trash panel + search/AI chrome |

**Cross-surface transition evidence:** RWS-09, RWS-12, RWS-15, RWS-16 (failure), RWS-20

---

## Machine-readable results

- `qa-results.json` — automated runner output (2026-06-14)
- Runner: `run-part2h-qa.mjs`

---

## Corroborating prior evidence

| Transition | Prior PASS | Notes |
|------------|------------|-------|
| Place tab embed | PLC-03 (Part 2G) | Same QA account — consumer embed |
| Business Place publisher | PLC-04 (Part 2G R2) | Uses `?module=place` — **not** `/workspace/place` segment |
| Cross-surface navigation | `crossSurfaceNavigation.test.ts` (6 PASS) | Contract layer |

---

## L2-B3 evidence bar

| Requirement | Status |
|-------------|--------|
| Matrix published (Part 2H) | ✅ 27 rows |
| Execution performed | ✅ Local `localhost:3000` |
| Screenshots captured | ✅ 19 files |
| P0 product FAIL documented | ✅ RWS-16 segment 404 |
| Report + addendum | ✅ |

---

*Last updated: 2026-06-14*
