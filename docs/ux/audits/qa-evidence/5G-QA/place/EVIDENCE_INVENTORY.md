# Place Part 2G — Evidence Inventory

**Wave:** 6B-Place-QA + **6B-Place-QA-R2**  
**Date:** 2026-06-03 (R1) · 2026-06-14 (R2)  
**Matrix:** Part 2G (PLC-01–27)  
**Runners:** `run-part2g-qa.mjs` (R1), `run-part2g-qa-r2.mjs` (R2)  
**Seed:** `seed-qa-place.mjs`, `qa-seed.json`  
**Results:** `qa-results.json` (merged), `qa-results-r2.json`  
**Environment:** Local `localhost:3000` + `localhost:5000` (inline `JWT_SECRET`)

---

## Summary

| Metric | R1 | Combined (R1+R2) |
|--------|---:|-----------------:|
| Cases | 27 | 27 |
| PASS | 12 | **27** |
| FAIL | 3 | **0** |
| BLOCKED | 12 | **0** |
| Screenshots | 15 | **30** |

---

## R2 screenshot index (re-executed rows only)

| File | Case | Description |
|------|------|-------------|
| [PLC-04-D-light-R2.png](./screenshots/PLC-04-D-light-R2.png) | PLC-04 | Publisher `PlaceWorkspaceLanding` + PageHeader |
| [PLC-05-D-light-R2.png](./screenshots/PLC-05-D-light-R2.png) | PLC-05 | Meeting created and listed |
| [PLC-06-D-light-R2.png](./screenshots/PLC-06-D-light-R2.png) | PLC-06 | Listing save in publisher editor |
| [PLC-08-D-light-R2.png](./screenshots/PLC-08-D-light-R2.png) | PLC-08 | Follow → graph node |
| [PLC-09-D-light-R2.png](./screenshots/PLC-09-D-light-R2.png) | PLC-09 | BusinessProfilePanel from node list |
| [PLC-10-D-light-R2.png](./screenshots/PLC-10-D-light-R2.png) | PLC-10 | Meeting trash ConfirmModal |
| [PLC-11-D-light-R2.png](./screenshots/PLC-11-D-light-R2.png) | PLC-11 | Listing danger-zone trash |
| [PLC-12-D-light-R2.png](./screenshots/PLC-12-D-light-R2.png) | PLC-12 | Meeting restore from global trash |
| [PLC-13-D-light-R2.png](./screenshots/PLC-13-D-light-R2.png) | PLC-13 | Listing restore; hub loads |
| [PLC-14-D-light-R2.png](./screenshots/PLC-14-D-light-R2.png) | PLC-14 | Permanent delete (Delete forever) |
| [PLC-16-D-light-R2.png](./screenshots/PLC-16-D-light-R2.png) | PLC-16 | PlaceCalendarLinkModal |
| [PLC-17-D-light-R2.png](./screenshots/PLC-17-D-light-R2.png) | PLC-17 | On calendar badge |
| [PLC-20-M-light-R2.png](./screenshots/PLC-20-M-light-R2.png) | PLC-20 | Mobile meeting create form |
| [PLC-24-D-light-R2.png](./screenshots/PLC-24-D-light-R2.png) | PLC-24 | Keyboard node list |
| [PLC-27-D-light-R2.png](./screenshots/PLC-27-D-light-R2.png) | PLC-27 | Feed inline error + Retry |

---

## R1 screenshot index (unchanged PASS rows)

### Consumer shell

| File | Case | Description |
|------|------|-------------|
| [PLC-01-D-light.png](./screenshots/PLC-01-D-light.png) | PLC-01 | Standalone `/place` — `PlacePageShell` + My Place default |
| [PLC-02-D-light.png](./screenshots/PLC-02-D-light.png) | PLC-02 | Tab switching across consumer panels |
| [PLC-03-D-light.png](./screenshots/PLC-03-D-light.png) | PLC-03 | Dashboard Place embed |
| [PLC-21-B-dark.png](./screenshots/PLC-21-B-dark.png) | PLC-21 | Consumer shell dark mode |

### Mobile sheets (375px)

| File | Case | Description |
|------|------|-------------|
| [PLC-18-M-light.png](./screenshots/PLC-18-M-light.png) | PLC-18 | MOB-001 left navigation sheet |
| [PLC-19-M-light.png](./screenshots/PLC-19-M-light.png) | PLC-19 | Explore category filter right sheet |

### Graph / explore / trash / a11y

| File | Case | Description |
|------|------|-------------|
| [PLC-07-D-light.png](./screenshots/PLC-07-D-light.png) | PLC-07 | Search + category filter |
| [PLC-15-D-light.png](./screenshots/PLC-15-D-light.png) | PLC-15 | Global trash — Empty trash confirm modal |
| [PLC-23-B-dark.png](./screenshots/PLC-23-B-dark.png) | PLC-23 | Graph + minimap dark mode |
| [PLC-22-B-dark.png](./screenshots/PLC-22-B-dark.png) | PLC-22 | Explore dark mode |
| [PLC-25-D-light.png](./screenshots/PLC-25-D-light.png) | PLC-25 | Privacy overlay dialog |
| [PLC-26-D-light.png](./screenshots/PLC-26-D-light.png) | PLC-26 | `PlaceGraphEmptyState` |

### R1 fail captures (superseded by R2)

| File | Case | Notes |
|------|------|-------|
| [PLC-05-D-light-fail.png](./screenshots/PLC-05-D-light-fail.png) | PLC-05 | R1 API 500 — superseded by R2 PASS |
| [PLC-20-M-light.png](./screenshots/PLC-20-M-light.png) | PLC-20 | R1 error state — superseded by R2 PASS |
| [PLC-27-D-light.png](./screenshots/PLC-27-D-light.png) | PLC-27 | R1 partial — superseded by R2 PASS |

---

## Case → evidence map (combined)

| ID | Result | Screenshot | Wave | Notes |
|----|--------|------------|------|-------|
| PLC-01 | PASS | PLC-01-D-light.png | R1 | |
| PLC-02 | PASS | PLC-02-D-light.png | R1 | |
| PLC-03 | PASS | PLC-03-D-light.png | R1 | |
| PLC-04 | PASS | PLC-04-D-light-R2.png | R2 | Publisher hub |
| PLC-05 | PASS | PLC-05-D-light-R2.png | R2 | |
| PLC-06 | PASS | PLC-06-D-light-R2.png | R2 | |
| PLC-07 | PASS | PLC-07-D-light.png | R1 | |
| PLC-08 | PASS | PLC-08-D-light-R2.png | R2 | |
| PLC-09 | PASS | PLC-09-D-light-R2.png | R2 | |
| PLC-10 | PASS | PLC-10-D-light-R2.png | R2 | |
| PLC-11 | PASS | PLC-11-D-light-R2.png | R2 | |
| PLC-12 | PASS | PLC-12-D-light-R2.png | R2 | |
| PLC-13 | PASS | PLC-13-D-light-R2.png | R2 | |
| PLC-14 | PASS | PLC-14-D-light-R2.png | R2 | |
| PLC-15 | PASS | PLC-15-D-light.png | R1 | |
| PLC-16 | PASS | PLC-16-D-light-R2.png | R2 | |
| PLC-17 | PASS | PLC-17-D-light-R2.png | R2 | |
| PLC-18 | PASS | PLC-18-M-light.png | R1 | |
| PLC-19 | PASS | PLC-19-M-light.png | R1 | |
| PLC-20 | PASS | PLC-20-M-light-R2.png | R2 | |
| PLC-21 | PASS | PLC-21-B-dark.png | R1 | |
| PLC-22 | PASS | PLC-22-B-dark.png | R1 | |
| PLC-23 | PASS | PLC-23-B-dark.png | R1 | |
| PLC-24 | PASS | PLC-24-D-light-R2.png | R2 | |
| PLC-25 | PASS | PLC-25-D-light.png | R1 | |
| PLC-26 | PASS | PLC-26-D-light.png | R1 | |
| PLC-27 | PASS | PLC-27-D-light-R2.png | R2 | |

---

## Environment findings

| ID | R1 | R2 |
|----|----|----|
| **QA-ENV-02** | Open | Open (inline `JWT_SECRET` workaround) |
| **PLC-QA-ENV-01** | Open | **Resolved** — migration applied |
| **PLC-QA-02** | — | Fixed — meeting menu toggle |
| **PLC-QA-03** | — | Fixed — trash restore proxy body |

---

**Last updated:** 2026-06-14 (Wave 6B-Place-QA-R2)
