# Admin Portal Route Architecture Standard

**Program:** Stage 1B-C — Controller Governance  
**Date:** 2026-06-17  
**Status:** Normative for admin-portal route modules post-1B-C

---

## 1. Layer responsibilities

### Routes may

- Parse and validate request parameters (query, body, params)
- Enforce auth stack (`authenticateJWT` → `requireAdmin`)
- Call domain service methods
- Map service results/errors to HTTP status + JSON
- Invoke shared gates (`enforceDangerousMigrationOpGate`, `logDangerousMigrationOpExecuted`)

### Routes may not

- Contain domain business rules (>20 LOC of logic without service extraction)
- Perform direct persistence (`prisma.*`, raw SQL)
- Emit audit writes directly (`auditLog.create`)
- Own calculations, aggregations, or cross-table orchestration
- Import `AdminService` monolith facade (use `admin/*Service`)

### Services own

- Persistence (Prisma, raw SQL when justified e.g. migration table)
- Business rules and invariants
- Audit emission via `adminAuditService` helpers
- Transactions and compensating actions

---

## 2. Mandatory handler shape

```typescript
router.post('/resource/:id/action', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await adminExampleService.performAction({
      resourceId: req.params.id,
      adminId: adminUser.id,
      payload: req.body,
    });

    return res.json({ success: true, data: result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to perform action', {
      operation: 'admin_example_action',
      error: { message: err.message, stack: err.stack },
    });
    return res.status(500).json({ error: 'Failed to perform action' });
  }
});
```

---

## 3. Examples from extracted architecture (1B-A / 1B-C)

### Impersonation start (core route → service)

**Route:** validates auth, calls `adminImpersonationService.beginImpersonation`, maps denied vs success.

**Service:** `validateImpersonationTarget`, session creation, `logImpersonationStartAudit`.

### Migration delete (platform route → service)

**Route:** `enforceDangerousMigrationOpGate` → `adminSystemOpsService.deleteMigrationRecords` → `logDangerousMigrationOpExecuted` → JSON response.

**Service:** `$queryRaw` / `$executeRaw` on `_prisma_migrations`, structured logging.

### Pipeline diagnostics list (aiPipeline route → service)

**Route:** parses `limit` / `userId`, calls `adminAiPipelineDiagnosticsService.listAdminPipelineDiagnostics`.

**Service:** combines `listPipelineDiagnosticsFromDb` + legacy `aIConversationHistory` fallback, enriches traces.

### Module review (analyticsOps route → service)

**Route:** extracts `adminUser.id`, calls `adminModuleGovernanceService.reviewModuleSubmission`.

**Service:** Prisma updates, `logModuleGovernanceAudit` with `ADMIN_MODULE_APPROVE` / `REJECT`.

---

## 4. Auth stack (unchanged)

```
authenticateJWT → requireAdmin → [optional dangerous-op gate] → handler
```

Dangerous operations additionally require `ADMIN_PORTAL_DANGEROUS_OPS_ENABLED=true` and typed confirmation string.

---

## 5. File size guidance

| Metric | Target | Current exceptions |
|--------|--------|-------------------|
| Route file LOC | ≤500 (aspirational) | `platform` 1,588; `analyticsOps` 1,289; `aiPipeline` 1,203 |
| Handler LOC | ≤40 | Enforced by extraction when exceeded |
| Prisma in routes | **0** | **Met (1B-C)** |

File splits are organizational follow-up — not blocking route architecture compliance.

---

## 6. Dependency rules

| Layer | May import |
|-------|------------|
| Route | `admin/*Service`, `adminPortalShared`, `adminPortalAuth`, `ai/pipeline/*` (AI admin only) |
| `admin/*Service` | `prisma`, `logger`, `adminAuditService`, platform libs |
| `admin/*Service` | **Must not** import route files |
| `adminAuditService` | `prisma` only |

---

## 7. Verification

Conformance checked by:

- `server/src/routes/__tests__/admin-portal-route-governance.test.ts`
- `server/src/services/__tests__/adminServiceFacade.test.ts`

---

## 8. Cross-references

- [Controller Governance Standard](./ADMIN_PORTAL_CONTROLLER_GOVERNANCE_STANDARD.md) (blueprint)
- [Ownership Enforcement Model](./ADMIN_PORTAL_OWNERSHIP_ENFORCEMENT_MODEL.md)
- [Controller Governance Assessment](./ADMIN_PORTAL_CONTROLLER_GOVERNANCE_ASSESSMENT.md)

**Standard close:** Effective for all new admin-portal route work post-1B-C.
