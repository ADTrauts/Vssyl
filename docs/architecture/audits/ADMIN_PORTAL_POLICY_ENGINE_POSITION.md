# Admin Portal Policy Engine Position

**Program:** Stage 1B-C — Controller Governance  
**Finding addressed:** AP-F-016  
**Date:** 2026-06-17

---

## 1. Decision

**Adopt: Selective Policy Engine + documented waiver model.**

Universal Policy Engine on all admin-portal mutations is **not required** for control-plane certification at this stage. The platform `ADMIN` role gate (`requireAdmin`) remains the primary authorization boundary. Selective PE adoption is recommended for **high-risk cross-tenant mutations** where module PE patterns already exist.

---

## 2. Rationale

| Factor | Assessment |
|--------|------------|
| Control-plane auth model | Single platform role (`ADMIN`) — coarse but explicit per [Auth Model](./ADMIN_PORTAL_AUTH_MODEL.md) |
| Existing PE usage in admin-portal routes | **Zero** `policyEngine` / `evaluatePolicy` calls (verified 2026-06-17) |
| Module PE maturity | Scheduling, HR, Workforce Comms have `*_ADMIN_ACTIONS` dual-enforcement patterns |
| Admin mutation surface | 143+ handlers across 4 route modules — universal PE would be high churn with low incremental value vs role gate |
| Audit trail | Stage 1B-B provides immutable `AuditLog` for privileged actions — compensating control for PE absence |
| Dangerous ops | Env flag + confirmation gate + audit (AP-F-002 closed) — stronger than generic PE |

---

## 3. Waiver model (AP-F-016 formal position)

### 3.1 Waived (role gate sufficient)

| Category | Authorization | Compensating control |
|----------|---------------|-------------------|
| Admin-portal CRUD (users, support, modules, config) | `requireAdmin` | `ADMIN_*` audit taxonomy |
| Analytics / BI reads | `requireAdmin` | Read-only; no audit required |
| Impersonation | `requireAdmin` + target validation rules | `ADMIN_IMPERSONATION_*` audit + policy doc |
| Dangerous migration ops | `requireAdmin` + env + confirm | `ADMIN_DANGEROUS_MIGRATION_*` audit |
| AI Pipeline admin (catalog, policies) | `requireAdmin` | Pipeline policy audit table |

### 3.2 Selective PE recommended (future, not 1B-C)

| Category | Proposed PE action | Trigger |
|----------|-------------------|---------|
| Cross-tenant module install override | `admin:module.override` | When admin mutates another business's module state |
| Impersonation in production | `admin:impersonation.start` | Optional fine-grained deny lists per environment |
| Billing / payout adjustments | `admin:billing.adjust` | When write paths added to admin billing surface |
| Satellite mounts (`ai-provider-usage`) | Align with provider PE or admin waiver doc | Auth matrix exceptions |

### 3.3 Not waived

| Requirement | Status |
|-------------|--------|
| `requireAdmin` on all privileged admin-portal routes | **Enforced** |
| Audit on governance mutations | **Enforced** (1B-B) |
| Dangerous op gates | **Enforced** (0E-B) |
| Multi-tenant scoping inside services | **Required** per `backend-trust-boundaries.mdc` |

---

## 4. Comparison to alternatives

| Option | Verdict |
|--------|---------|
| **Universal PE** | Rejected — disproportionate cost; no PE action registry for admin control-plane |
| **Selective PE + waiver** | **Adopted** — documents current truth; defines escalation path |
| **No documentation (status quo)** | Rejected — AP-F-016 requires explicit position |

---

## 5. Implementation status

| Item | 1B-C status |
|------|-------------|
| PE position document | **Complete** (this file) |
| PE code in admin-portal routes | **Not implemented** (by design — waiver) |
| PE action registry for admin | **Deferred** to future package if selective items prioritized |

---

## 6. AP-F-016 closure recommendation

**CLOSED** on documentation and architectural position grounds:

- Ownership model published ([Ownership Enforcement Model](./ADMIN_PORTAL_OWNERSHIP_ENFORCEMENT_MODEL.md))
- Selective PE + waiver formally adopted
- Role gate + audit + dangerous-op controls documented as compensating controls
- No blocking requirement for universal PE before certification review prep

---

## 7. Cross-references

- [Policy Engine architecture](../POLICY_ENGINE.md)
- [Controller Governance Standard](./ADMIN_PORTAL_CONTROLLER_GOVERNANCE_STANDARD.md)
- [Auth Matrix](./ADMIN_PORTAL_AUTH_MATRIX.md)

**Position close:** AP-F-016 remediated via documented selective PE + waiver model.
