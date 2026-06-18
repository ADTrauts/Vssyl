# Admin Portal — Audit Architecture

**Program:** Stage 1B — Governance Architecture Blueprint  
**Date:** 2026-06-17  
**Finding addressed:** AP-F-013  
**Constraint:** Design only — no schema migrations in blueprint program

---

## 1. Design principles

Admin Portal is a **platform control plane**, not a product module. Audit architecture must:

1. **Not** force `emitModuleActivityEvent` on every admin read (N/A per certification framework).
2. **Do** emit immutable audit records on **privileged mutations** and **high-risk reads** (impersonation start, dangerous ops, policy changes).
3. **Adapt** lessons from HR and AI Pipeline without copying product-module activity feeds.

| Reference | Lesson adopted | Not adopted |
|-----------|----------------|-------------|
| HR `logEmployeeAudit` | Structured `resourceType`, `action`, `changes` JSON | HR tenant `businessId` scoping model |
| Pipeline `writePipelinePolicyAudit` | Dedicated audit table for domain policies | Separate table per domain (evaluate single admin audit store first) |
| WC activity envelope | Normalized action naming, actor attribution | Cross-module fan-out / realtime |

---

## 2. Admin audit taxonomy

### 2.1 Namespace

All admin audit actions use prefix: **`ADMIN_`**

### 2.2 Event categories

| Category | Prefix | Examples |
|----------|--------|----------|
| **Identity & access** | `ADMIN_IDENTITY_` | `ADMIN_IDENTITY_IMPERSONATION_START`, `ADMIN_IDENTITY_IMPERSONATION_END`, `ADMIN_IDENTITY_IMPERSONATION_DENIED`, `ADMIN_IDENTITY_USER_STATUS_CHANGE`, `ADMIN_IDENTITY_PASSWORD_RESET` |
| **Moderation** | `ADMIN_MODERATION_` | `ADMIN_MODERATION_REPORT_RESOLVED`, `ADMIN_MODERATION_BULK_ACTION` |
| **Module governance** | `ADMIN_MODULE_` | `ADMIN_MODULE_SUBMISSION_APPROVED`, `ADMIN_MODULE_VERSION_PROMOTED` |
| **Security** | `ADMIN_SECURITY_` | `ADMIN_SECURITY_EVENT_RESOLVED`, `ADMIN_SECURITY_REPORT_EXPORTED` |
| **System ops** | `ADMIN_SYSTEM_` | `ADMIN_SYSTEM_CONFIG_UPDATED`, `ADMIN_SYSTEM_MAINTENANCE_ENABLED`, `ADMIN_SYSTEM_BACKUP_CREATED` |
| **Billing** | `ADMIN_BILLING_` | `ADMIN_BILLING_REFUND_ISSUED` (if applicable) |
| **Support** | `ADMIN_SUPPORT_` | `ADMIN_SUPPORT_TICKET_UPDATED`, `ADMIN_SUPPORT_KB_PUBLISHED` |
| **Dangerous ops** | `ADMIN_DANGEROUS_` | `ADMIN_DANGEROUS_MIGRATION_DELETE`, `ADMIN_DANGEROUS_MIGRATION_RESET` |
| **AI Pipeline** | `ADMIN_PIPELINE_` | Maps to existing `aIPipelinePolicyAuditLog` — **bridge**, do not duplicate |

### 2.3 Envelope (normalized)

```typescript
interface AdminAuditEvent {
  action: string;           // ADMIN_* from taxonomy
  actorUserId: string;      // admin operator
  resourceType: string;     // e.g. user | module_submission | system_config
  resourceId: string;
  tenantScope: 'platform';  // always platform-global for control plane
  ipAddress?: string;
  userAgent?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  outcome: 'success' | 'denied' | 'failed';
}
```

**Storage (Phase 1):** Extend existing `prisma.auditLog` with consistent `resourceType` + JSON `details` matching envelope.

**Storage (Phase 2 optional):** `AdminAuditEvent` dedicated table if query volume or retention requirements exceed `auditLog` suitability.

---

## 3. Audit service architecture

### 3.1 `adminAuditService`

| Function | Purpose |
|----------|---------|
| `emitAdminAuditEvent(event: AdminAuditEvent)` | Single write path; never throws to caller |
| `listAdminAuditEvents(filters)` | Operator query API |
| `validateAction(action)` | Taxonomy guard — reject unknown actions in dev/test |

### 3.2 Integration points

| Caller | When to emit |
|--------|--------------|
| All domain admin services | After successful mutation; on explicit deny for impersonation |
| Route handlers | **Never** direct `prisma.auditLog` — delegate to service |
| AI Pipeline | Continue `writePipelinePolicyAudit`; add **bridge** reader in admin audit UI |
| Dangerous ops middleware | Emit before executing gated operation |

### 3.3 Read path

| Consumer | API |
|----------|-----|
| Admin Portal audit UI | `GET /api/admin-portal/audit/events` (new, paginated) |
| Security dashboard | Filter `ADMIN_SECURITY_*` + `ADMIN_DANGEROUS_*` |
| Compliance export | `GET /api/admin-portal/audit/export` |

---

## 4. Retention model

| Tier | Events | Retention |
|------|--------|-----------|
| **Tier 1 — Security** | Impersonation, dangerous ops, security resolves | **7 years** (compliance default) |
| **Tier 2 — Governance** | Module cert, moderation, billing mutations | **3 years** |
| **Tier 3 — Operational** | Config tweaks, support updates | **1 year** |
| **Tier 4 — Read access** | High-volume list endpoints (if logged) | **90 days** |

**Implementation:** `metadata.retentionTier` on envelope; archival job deferred post-1B.

---

## 5. Compliance model

| Control | Mechanism |
|---------|-----------|
| **Impersonation accountability** | Mandatory `ADMIN_IDENTITY_IMPERSONATION_*` with target user + reason |
| **Separation of duties** | Document which `ADMIN_*` actions require super-admin vs admin (role matrix) |
| **Tamper evidence** | Append-only `auditLog`; no update/delete APIs |
| **Failed authorization** | Emit `outcome: denied` for impersonation denial (already partial) |
| **Dangerous ops** | Existing env gate + mandatory `ADMIN_DANGEROUS_*` (0E-B) |

**Policy Engine (AP-F-016):** Audit architecture **complements** PE — if PE waiver chosen, audit becomes **compensating control** for fine-grained authorization gaps.

---

## 6. Migration from current state

| Current | Target |
|---------|--------|
| 17 ad hoc `auditLog` writes in AdminService | Routed through `adminAuditService` with taxonomy |
| 3 route-level impersonation writes | Single impersonation service emission |
| Pipeline `aIPipelinePolicyAuditLog` | Unified admin audit **view**; separate store acceptable |
| Zero taxonomy doc | This document → enforced in service |

### Coverage matrix (mutations requiring audit)

| Domain | Operations (from matrix) | Priority |
|--------|--------------------------|----------|
| Impersonation | 9 | P0 |
| Users | 4 | P0 |
| Moderation | 6 | P1 |
| Modules | 12 | P1 |
| System/dangerous | 8 | P0 |
| Support | 10 | P2 |
| Billing | 6 | P1 |
| AI Pipeline policies | 45 (policy writes only) | P1 — bridge existing |

---

## 7. AP-F-013 closure criteria

| Criterion | Pass condition |
|-----------|----------------|
| Taxonomy published | This doc + enum in `adminAuditService` |
| Single emission service | Zero direct `auditLog` in routes after 1B-B |
| Mutation coverage | ≥95% of matrix **write** operations emit `ADMIN_*` |
| Query API | Admin can list/filter audit events |
| Tests | Audit emission verified in integration tests per domain |

---

## References

- HR pattern: `server/src/services/hrServiceShared.ts` `logEmployeeAudit`
- Pipeline pattern: `writePipelinePolicyAudit` in `pipelineCatalogService.ts`
- Impersonation policy: existing 0E docs + `adminPortalShared.ts`
