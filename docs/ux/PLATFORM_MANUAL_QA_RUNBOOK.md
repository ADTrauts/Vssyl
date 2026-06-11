# Platform Manual QA Runbook (Wave 5G-QA)

**Status:** Ready for execution  
**Date:** 2026-06-03  
**Program:** UX Modernization Wave 5G-QA  
**Matrix:** [`PLATFORM_MANUAL_QA_MATRIX.md`](./PLATFORM_MANUAL_QA_MATRIX.md)  
**Framework:** [`UX_CERTIFICATION_STANDARD.md`](./UX_CERTIFICATION_STANDARD.md), [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md)

---

## 1. Purpose

Execute human QA across **Drive**, **Notifications**, **Todo**, **Calendar**, and **Chat** using one unified matrix. Signed results become evidence for:

- Resolving process findings **F-1**, **N-6**, **T-11**, **E-14**, **C-8**
- Future **UX-L3** and **Reference Module** re-certification waves
- Regression baselines before further remediation

**This runbook does not upgrade certification levels.** Post-execution re-cert waves (e.g. **5G-QA-D**) are separate documentation-only audits.

---

## 2. QA environment assumptions

| Item | Requirement |
|------|-------------|
| **Application** | Local: `pnpm dev` from repo root (web ~3000, API proxied) **or** staging `https://vssyl.com` |
| **API** | Browser calls use relative `/api/*` through Next.js proxy |
| **Auth** | Dedicated QA test account(s); do not use production customer data without approval |
| **Theme** | Run each module in **light** and **dark** mode (`.dark` on `html` or in-app toggle) |
| **Automated gate** | `pnpm type-check` PASS on branch under test (record commit SHA in sign-off) |
| **Out of scope** | Load/performance testing; full WCAG automated scan; third-party iframe modules |

---

## 3. Test user and data requirements

### 3.1 Contexts

| Context | Required |
|---------|----------|
| **Personal dashboard** | Primary test user with all five modules enabled |
| **Business workspace** | Business with `drive`, `chat`, `todo`, `calendar`, `notifications` in hub |

### 3.2 Seed data (minimum)

| Module | Seed before QA |
|--------|----------------|
| **Drive** | ≥2 folders, ≥3 files (1 nested), 1 item in trash, 1 starred item |
| **Notifications** | ≥8 notifications (mix read/unread; ≥2 types e.g. `drive_*`, `chat_*`, `todo_*`) |
| **Todo** | ≥4 tasks (TODO, IN_PROGRESS, DONE); 1 project with tasks; 1 unscoped task |
| **Calendar** | ≥2 events on primary calendar (1 single, 1 recurring); primary calendar connected |
| **Chat** | ≥1 DM thread + 1 group/channel with ≥5 messages |

### 3.3 Data hygiene

- Use QA-labeled titles (`[QA] Test task`, `[QA] Folder`) for easy cleanup.
- After destructive tests, restore from trash where applicable before next module.
- Document any **BLOCKED** row if seed data missing.

---

## 4. Browser and viewport sizes

| ID | Size | Primary use |
|----|------|-------------|
| **M** | 375 × 812 | Mobile P0 — L3 cat 5 evidence |
| **T** | 768 × 1024 | Tablet spot-check (optional P1) |
| **D** | 1280 × 800 | Desktop primary |

| Browser | Priority |
|---------|----------|
| Chrome (latest) | **P0** — all modules |
| Safari (latest) | **P1** — mobile M viewport spot-check for iOS |

**Device emulation:** Chrome DevTools responsive mode is acceptable for M/T if real device unavailable — note in sign-off.

---

## 5. Pass / fail notation

| Result | When to use |
|--------|-------------|
| **PASS** | Expected behavior observed |
| **FAIL** | Undocumented defect or regression — file new finding |
| **N/A** | Feature absent by design — cite rationale in Notes |
| **KNOWN-PWF** | Matches pre-certified finding (e.g. N-7, T-6, C-5) — not a regression |
| **BLOCKED** | Environment, auth, or seed data prevents test |

### Priority tiers (matrix column **Pri**)

| Pri | Meaning |
|-----|---------|
| **P0** | L3 gate — must PASS or KNOWN-PWF for module sign-off |
| **P1** | L2 evidence — should PASS; FAIL warrants backlog item |
| **P2** | Advisory — document only |

**Module sign-off gate:** All **P0** rows **PASS**, **KNOWN-PWF**, or **N/A** (with rationale). Any P0 **FAIL** blocks that module's process-finding resolution.

---

## 6. Evidence expectations

### 6.1 Storage layout

```
docs/ux/audits/qa-evidence/5G-QA/
  platform/          # Part 1 primitives
  drive/
  notifications/
  todo/
  calendar/
  chat/
```

**Filename:** `[case-id]-[viewport]-[light|dark].png`  
**Example:** `DRV-07-M-dark.png`, `TODO-12-D-light.png`

### 6.2 When screenshots are required

| Situation | Screenshot |
|-----------|------------|
| P0 **FAIL** | **Required** |
| P0 **PASS** (first module in session) | Recommended for ConfirmModal + 375px |
| **KNOWN-PWF** | Optional — link to existing finding doc |
| P1/P2 | Optional |

### 6.3 Matrix recording

Fill **Tester**, **Date**, **Result**, and **Notes** columns in [`PLATFORM_MANUAL_QA_MATRIX.md`](./PLATFORM_MANUAL_QA_MATRIX.md). Do not alter Expected criteria during execution — record deviations in Notes.

---

## 7. Execution order

| Step | Module | Rationale |
|------|--------|-----------|
| 0 | **Platform primitives** (Part 1) | Validates shared patterns once |
| 1 | **Drive** | Reference UX #1; extends existing 3B matrix |
| 2 | **Notifications** | Simplest management-page archetype |
| 3 | **Todo** | Workspace split; fresh L2 CwF |
| 4 | **Calendar** | Highest L3 ROI; four view modes |
| 5 | **Chat** | L1 CwF; most KNOWN-PWF rows |

**Parallelization:** After step 1 validates the runbook, Notifications + Todo may run in parallel (different testers).

**Estimated effort:** ~2–4 hours per module (M + D viewports); ~1–1.5 days total platform pass.

---

## 8. Per-module procedure

1. Confirm seed data (§3.2).
2. Run **D** viewport: navigation → create → edit → delete → menus → layout.
3. Run **M** viewport: repeat P0 rows for mobile (§7 areas marked M).
4. Toggle **dark mode**; repeat P0 chrome/modal/empty-state rows.
5. Complete module sign-off block in matrix.
6. Attach evidence folder for any FAIL.

---

## 9. Sign-off format

### 9.1 Per-module sign-off (in matrix)

| Role | Name | Date | Viewports | P0 FAIL count | Notes |
|------|------|------|-----------|---------------|-------|
| QA / Product | | | M, D | | |
| Engineering | | | — | | |

### 9.2 Platform sign-off (after all modules)

| Field | Value |
|-------|-------|
| **Commit / deploy** | |
| **`pnpm type-check`** | PASS / FAIL |
| **Modules completed** | Drive ☐ Notifications ☐ Todo ☐ Calendar ☐ Chat ☐ |
| **Platform primitives** | Part 1 ☐ |
| **Process findings cleared** | F-1 ☐ N-6 ☐ T-11 ☐ E-14 ☐ C-8 ☐ |

| Role | Name | Date | Notes |
|------|------|------|-------|
| QA / Product lead | | | |
| Engineering lead | | | |

---

## 10. How QA maps to UX-L3 certification

Per [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md):

| L3 requirement | QA evidence source |
|----------------|-------------------|
| **Manual QA matrix executed** | Signed platform matrix + this runbook §9.2 |
| **Mobile verification** (cat 5) | Module §7 P0 rows at viewport **M** |
| **Accessibility audit** (cat 4) | Module §12 P0 rows + KNOWN-PWF register |
| **Core quartet** (cats 1, 2, 4, 11) | §4 Delete, §13 ConfirmModal, §12 A11y, §11 Workflow P0 rows |

### What QA resolves vs what it does not

| Resolves (process) | Does **not** auto-resolve |
|--------------------|---------------------------|
| F-1, N-6, T-11, E-14, C-8 unsigned matrix | Certification level upgrade (needs **5G-QA-D** doc wave) |
| Cat 5 partial evidence at 375px | Cat 4 PASS if engineering gaps remain (N-7, T-12) |
| Regression detection | Chat L2 threshold (still 6 PASS without engineering) |

### Post-QA documentation waves (not part of 5G-QA execution)

| Wave | Action |
|------|--------|
| **5G-QA-D** | Per-module re-cert addenda citing signed matrix |
| **5G-Drive-D** | Formal Drive 11-category platform scorecard |
| **5G-Calendar-D** | Calendar L3 CwF re-cert after E-14 sign-off |

---

## 11. Remediation sequencing guidance

**Run QA before further L2 CwF remediation** (Notifications, Todo, Calendar, Drive) to establish baseline evidence.

| After QA | Action |
|----------|--------|
| P0 **FAIL** (new) | File finding → targeted engineering wave |
| **KNOWN-PWF** | Existing backlog (N-7, T-12, T-6, C-5, etc.) |
| All P0 **PASS** | Proceed to **5G-QA-D** for process-finding closure |

**Chat exception:** Execute QA for C-8 evidence; L2 engineering (5H-Chat) may proceed in parallel if product prioritizes.

---

## Related

- [`PLATFORM_MANUAL_QA_MATRIX.md`](./PLATFORM_MANUAL_QA_MATRIX.md)
- [`DRIVE_INTERACTION_MANUAL_QA_MATRIX.md`](./audits/DRIVE_INTERACTION_MANUAL_QA_MATRIX.md) (Drive rows DRV-01–33 heritage)
- [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](./PLATFORM_CERTIFICATION_GAP_ANALYSIS.md)
- [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md)

**Last updated:** 2026-06-03 (Wave 5G-QA)
