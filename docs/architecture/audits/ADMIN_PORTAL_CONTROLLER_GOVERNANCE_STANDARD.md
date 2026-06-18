# Admin Portal — Controller Governance Standard

**Program:** Stage 1B — Governance Architecture Blueprint  
**Date:** 2026-06-17  
**Findings addressed:** AP-F-014, AP-F-016  
**Constraint:** Standard definition only — no implementation

---

## 1. Thin controller standard

### 1.1 Route handler responsibilities (allowed)

| Responsibility | Allowed |
|----------------|---------|
| Parse/validate request (Zod or express-validator) | ✅ |
| Extract `req.user` admin identity | ✅ |
| Call domain service method | ✅ |
| Map service result to HTTP response | ✅ |
| Catch errors → normalized HTTP error | ✅ |

### 1.2 Route handler prohibitions

| Prohibition | Rationale |
|-------------|-----------|
| Direct `prisma.*` calls | AP-F-004 — belongs in service |
| Business logic >20 LOC | Extract to service |
| Duplicate auth logic | Use `requireAdmin` from `adminPortalAuth.ts` only |
| Ad hoc `auditLog.create` | Use `adminAuditService` |
| Mock/random data in production paths | AP-F-005 resolved — must not regress |

### 1.3 File size limits

| Metric | Pass | Fail |
|--------|------|------|
| Route file LOC | **≤500** | >500 |
| Single handler LOC | **≤40** | >40 |
| Imports per route file | ≤15 domain imports | Monolithic import of AdminService |

**Current failures:** `platform.ts` (1,882), `analyticsOps.ts` (1,368), `core.ts` (1,295) — all **FAIL**.

---

## 2. Service ownership rules

| Rule | Description |
|------|-------------|
| **S1** | One domain service owns all Prisma queries for its aggregate |
| **S2** | Services return typed DTOs from `admin/adminServiceContracts.ts` (expanded) |
| **S3** | Cross-domain orchestration uses explicit service composition — no route orchestration |
| **S4** | `server/src/ai/pipeline/*` remains AI domain — admin routes do not duplicate pipeline logic |
| **S5** | Satellite mounts (`/api/admin/ai-providers`) keep ownership until explicit merge program |

---

## 3. Dependency rules

| Layer | May depend on |
|-------|---------------|
| Route | Domain admin service, `adminPortalShared`, auth middleware |
| Domain admin service | `prisma`, `logger`, `adminAuditService`, platform libs (email, security) |
| Domain admin service | **Must not** depend on other route files |
| `adminAuditService` | `prisma` only — no domain service imports |

---

## 4. Route design standards

### 4.1 Naming

| Pattern | Example |
|---------|---------|
| Resource collection | `GET /users` |
| Resource instance | `GET /users/:userId` |
| Action sub-resource | `POST /users/:userId/reset-password` |
| Domain prefix | `/moderation/reports`, `/support/tickets` |

### 4.2 Auth stack (mandatory order)

```
authenticateJWT → requireAdmin → [optional policyGate] → [optional dangerousOpsGate] → handler
```

### 4.3 Response envelope

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "...", "code": "ADMIN_*" }
```

Align with existing AI Pipeline route responses.

### 4.4 Error handling

| Case | HTTP | Body |
|------|------|------|
| Missing auth | 401 | `{ message: "Access token required" }` |
| Non-admin | 403 | `{ error: "Admin access required" }` |
| Validation | 400 | `{ error, fields? }` |
| Not found | 404 | `{ error }` |
| Server error | 500 | Log structured; generic client message |

Use `catch (error: unknown)` per TypeScript quality rules.

---

## 5. Policy Engine standard (AP-F-016)

### 5.1 Decision tree

| Path | When |
|------|------|
| **A — Adopt PE** | Fine-grained admin actions need role+scope beyond `ADMIN` (e.g. billing refunds, dangerous ops) |
| **B — Waiver** | Control-plane uses single `ADMIN` role with compensating audit + dangerous-op gates |

### 5.2 If Path A (PE adoption)

| Requirement | Detail |
|-------------|--------|
| Action catalog | `admin_*` actions in `policyActions.ts` |
| Enforcement | `authorizePolicy(action)` before service execute on mutations |
| Tests | Policy allow/deny per action |

**Candidate PE actions:** `admin_impersonate`, `admin_dangerous_migration`, `admin_module_promote`, `admin_billing_refund`, `admin_pipeline_policy_write`.

### 5.3 If Path B (waiver — default recommendation for 1B-C)

| Compensating control | Required |
|----------------------|----------|
| `requireAdmin` on all mutations | Yes |
| `adminAuditService` on all mutations | Yes |
| Dangerous ops env gate | Yes (existing) |
| Documented waiver in certification packet | Yes |

**Pass criteria for Path B:** Waiver doc + audit coverage ≥95% + no unauthenticated mutations.

---

## 6. Testing standards (controller layer)

| Standard | Requirement |
|----------|-------------|
| **T1** | Every mutation route has ≥1 integration test (authZ + success path) |
| **T2** | Deny tests for non-admin on mutation routes |
| **T3** | Audit emission asserted for P0 mutations after 1B-B |
| **T4** | No test imports `AdminService` directly — test via HTTP |

---

## 7. Pass/fail certification checklist

| # | Criterion | Pass | Fail |
|---|-----------|------|------|
| C1 | No route file >500 LOC | All compliant | Any file >500 |
| C2 | Zero inline Prisma in routes (except transitional shim) | 0 calls | Any new inline calls |
| C3 | AdminService deleted or <200 LOC shim | Deleted/shim | >200 LOC active logic |
| C4 | All mutations emit `ADMIN_*` audit | ≥95% coverage | <95% |
| C5 | PE adopted OR waiver documented | One path complete | Neither |
| C6 | Integration tests per domain router | All domains | Any domain missing |

**AP-F-014 closure:** C6 + integration test matrix complete.  
**AP-F-016 closure:** C5 satisfied.

---

## References

- [`ADMIN_PORTAL_SERVICE_DECOMPOSITION_BLUEPRINT.md`](./ADMIN_PORTAL_SERVICE_DECOMPOSITION_BLUEPRINT.md)
- [`ADMIN_PORTAL_AUDIT_ARCHITECTURE.md`](./ADMIN_PORTAL_AUDIT_ARCHITECTURE.md)
- `.cursor/rules/policy-engine.mdc`
