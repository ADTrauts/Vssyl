# PP-1 — MFA Disposition Review (PP1-F03)

**Program:** Account Platform — Certification Preparation (Phase 0)  
**Finding:** PP1-F03 — MFA not implemented  
**Date:** 2026-06-20  
**Status:** Disposition document — **no MFA implementation authorized**

---

## Finding summary

| Field | Value |
|-------|-------|
| **ID** | PP1-F03 |
| **Severity (audit)** | Major |
| **Description** | No TOTP, WebAuthn, or MFA challenge path in identity plane |
| **Matrix row** | MFA challenge — **N** (non-compliant) |
| **G8 impact** | Production safety gate at 2/3 |

---

## Classification for L3 WITH FINDINGS

| Classification lens | Determination |
|---------------------|---------------|
| **Blocks evaluation?** | **No** |
| **Blocks L3 WITH FINDINGS certification?** | **No** — documentable finding |
| **Blocks plain L3 certification?** | **Yes** |
| **Severity at evaluation** | **Advisory WITH FINDINGS** (elevated from major for cert path only) |

**Rationale:** Portfolio precedent (Admin Portal, Business Operations) accepts documented security gaps as WITH FINDINGS when risk is acknowledged, compensating controls exist (JWT auth, password hashing, refresh rotation, security event logging), and remediation is chartered separately (PP-1 Phase 1B).

---

## Compensating controls (current)

| Control | Evidence |
|---------|----------|
| JWT authentication on protected routes | `authenticateJWT` |
| bcrypt password hashing | Auth registration/login |
| Refresh token rotation | `authService` |
| Security event logging | Login failure, database errors |
| Email verification | `authService` verify flow |
| Admin impersonation gated | Admin Portal L3 |

---

## Risk acceptance statement (for evaluation packet)

Multi-factor authentication is **intentionally deferred** to PP-1 Phase 1B. The identity plane operates at L3 WITH FINDINGS with PP1-F03 recorded as an **accepted advisory finding**. Evaluator should verify:

1. No false MFA UI claims in PP-1 scope (business 2FA UI is PP2-F13 / BA advisory)
2. Security logging on auth failures is operational
3. Phase 1B charter exists or is planned for MFA implementation

---

## Recommended evaluation language

> **PP1-F03 (MFA):** Accepted WITH FINDINGS. Multi-factor authentication is not implemented. Compensating controls documented. Remediation tracked under PP-1 Phase 1B. Does not block L3 WITH FINDINGS recommendation for Identity & Profile platform capability.

---

## Disposition matrix

| Outcome | MFA required? |
|---------|---------------|
| L3 WITH FINDINGS | **No** — advisory |
| Plain L3 | **Yes** |
| Evaluation blocked | **No** |
| Umbrella composite blocked | **No** (sub-domain WITH FINDINGS acceptable) |

---

## Related findings (not MFA)

| ID | Relationship |
|----|--------------|
| PP1-F08 | Session revoke UX — separate advisory |
| PP1-F10 | Misleading business 2FA UI — BA/PP-2 advisory |
| PP2-F13 | Business security tab 2FA UI — BA advisory |

---

## Implementation note

**This document does not authorize MFA implementation.** PP-1 Phase 1B remains a separate charter.

---

**Last updated:** 2026-06-20 (Certification Preparation)
