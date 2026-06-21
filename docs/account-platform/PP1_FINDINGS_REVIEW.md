# PP-1 — Findings Review

**Program:** Account Platform — PP-1 Identity & Profile Certification Evaluation  
**Date:** 2026-06-20  
**Type:** Post-evaluation findings disposition  
**Outcome:** **0 blocking · 2 major (1 open, 1 partial) · 8 advisory**

---

## Findings summary

| Class | Open at eval | Closed at eval | New at eval |
|-------|--------------|----------------|-------------|
| **Blocking** | 0 | 4 (F01, F02, F05, F06 historical) | 0 |
| **Major** | 2 | 4 | 0 |
| **Advisory** | 5 | 2 (F07, F12) | 3 (EVAL-A01–A03) |

---

## Blocking findings — **NONE**

| ID | Description | Eval status |
|----|-------------|-------------|
| PP1-F01 | No `profileService` | **Closed** — confirmed |
| PP1-F02 | Auth inline in `index.ts` | **Closed** — confirmed |
| PP1-F05 | Connection mutations without PE | **Closed** — confirmed |
| PP1-F06 | Privacy no PE/activity | **Closed** — confirmed |

**Evaluation blockers:** **0**

---

## Major findings (F01–F06)

| ID | Description | Pre-eval | Post-eval | Cert impact |
|----|-------------|----------|-----------|-------------|
| PP1-F01 | No `profileService` | Closed | **Confirmed closed** | — |
| PP1-F02 | Auth in `index.ts` | Closed | **Confirmed closed** | — |
| **PP1-F03** | MFA not implemented | Open | **Open — WITH FINDINGS** | Blocks plain L3 only |
| **PP1-F04** | Photo logic in controller | Partial | **Partial — WITH FINDINGS** | Blocks plain L3 |
| PP1-F05 | Connection mutations no PE | Closed | **Confirmed closed** | — |
| PP1-F06 | Privacy no PE/activity | Closed | **Confirmed closed** | — |

### PP1-F03 detail (open major → WITH FINDINGS at cert)

| Field | Value |
|-------|-------|
| **Severity (audit)** | Major |
| **Severity (L3 WF cert)** | Advisory WITH FINDINGS |
| **Disposition doc** | [PP1_MFA_DISPOSITION_REVIEW.md](./PP1_MFA_DISPOSITION_REVIEW.md) |
| **Blocks evaluation?** | No |
| **Blocks L3 WITH FINDINGS?** | No |
| **Blocks plain L3?** | **Yes** |
| **Remediation** | PP-1 Phase 1B — MFA charter |

### PP1-F04 detail (partial major)

| Field | Value |
|-------|-------|
| **Description** | Multer/storage wiring in `profilePhotoController`; logic in `profilePhotoService` |
| **Blocks L3 WITH FINDINGS?** | No |
| **Blocks plain L3?** | Yes |
| **Remediation** | Move multer middleware to route layer or dedicated upload module |

---

## Advisory findings

| ID | Description | Status | Owner |
|----|-------------|--------|-------|
| PP1-F07 | Notification write drift | **Closed** (PP-2 adapter) | — |
| PP1-F08 | Session revoke UX; logged-in password change | **Open — WITH FINDINGS** | PP-1 Phase 1B |
| PP1-F09 | Legacy photo URL fields on User | **Open — WITH FINDINGS** | Identity |
| PP1-F10 | Misleading business 2FA UI | **Open — WITH FINDINGS** | BA |
| PP1-F11 | Global Trash for profile photos | **Open — WITH FINDINGS** | Identity |
| PP1-F12 | Settings hub duplicate (avatar) | **Closed** (PP-2) | — |
| **PP1-EVAL-A01** | No identity domain events in registry | **New — WITH FINDINGS** | Identity |
| **PP1-EVAL-A02** | Auth security logging vs module activity | **New — advisory** | By design |
| **PP1-EVAL-A03** | Member read inline Prisma | **New — advisory** | Read layer |

---

## Findings blocker matrix

| Finding | Blocks eval? | Blocks L3 WF cert? | Blocks plain L3? |
|---------|--------------|-------------------|------------------|
| PP1-F03 (MFA) | No | No | **Yes** |
| PP1-F04 (photo controller) | No | No | **Yes** |
| PP1-F08 (session UX) | No | No (WITH FINDINGS) | Partial |
| PP1-EVAL-A01 (domain events) | No | No (WITH FINDINGS) | Partial |
| G6 test gaps | No | No (WITH FINDINGS) | Partial |

---

## Closed findings — evaluation confirmation

Evaluator verified closure evidence for:

- **F01:** `profileService.ts` with PE + activity on name update
- **F02:** `routes/auth.ts` + `authController.ts` — no auth inline in `index.ts`
- **F05:** `connectionService.ts` with `connection:*` PE actions
- **F06:** `privacyService.ts` with PE + `recordPrivacyUpdated`
- **F07:** PP-2 notification adapter closed write drift

No false closures detected.

---

## Remediation required (post-certification hygiene)

| Priority | Item | Required for L3 WF? |
|----------|------|---------------------|
| P1 | PP1-F03 MFA (Phase 1B) | No — WITH FINDINGS accepted |
| P2 | PP1-F04 photo controller extraction | No |
| P2 | PP1-F08 session revoke UX | No |
| P3 | PP1-EVAL-A01 identity domain events | No |
| P3 | G6 test expansion (privacy, connection, auth, photo) | No |
| P3 | PP1-F09 legacy photo URL cleanup | No |
| P3 | PP1-F11 Global Trash photos | No |

**Remediation required before plain L3:** PP1-F03 + PP1-F04 minimum; G6 expansion recommended.

---

## Certification findings package (for ratification council)

Recommended WITH FINDINGS register at ratification:

1. **PP1-F03** — MFA not implemented (disposition accepted)
2. **PP1-F04** — Photo multer in controller (partial)
3. **PP1-F08** — Session revoke / logged-in password change UX
4. **PP1-EVAL-A01** — No identity domain events
5. **PP1-EVAL-A02** — Auth security logging vs module activity (informational)
6. **PP1-F09** — Legacy photo URL fields
7. **PP1-F11** — Global Trash for photos
8. **G6** — Test coverage gaps (privacy, connection, auth, photo)
9. **PP1-F10** — Misleading business 2FA UI (BA advisory)

---

**Last updated:** 2026-06-20 (Certification Evaluation)
