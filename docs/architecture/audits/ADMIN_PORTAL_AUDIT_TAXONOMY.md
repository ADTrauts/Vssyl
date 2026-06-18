# Admin Portal Audit Taxonomy

**Program:** Stage 1B-B — Audit Taxonomy Finalization  
**Finding:** AP-F-013  
**Implementation:** `server/src/services/admin/adminAuditTaxonomy.ts`  
**Write path:** `server/src/services/admin/adminAuditService.ts` → `prisma.auditLog`

---

## 1. Principles

1. All Admin Portal privileged mutations emit audit via **`adminAuditService`** only.
2. Actions use the **`ADMIN_`** prefix with stable verb forms (`CREATE`, `UPDATE`, `RESOLVE`, …).
3. Resource types use **`lower_snake_case`** and identify the affected entity class.
4. Details JSON carries contextual metadata — never secrets, tokens, passwords, or raw SQL.

---

## 2. Action naming

Canonical constants live in `ADMIN_AUDIT_ACTIONS`.

| Domain | Actions |
|--------|---------|
| Impersonation | `ADMIN_IMPERSONATION_START`, `ADMIN_IMPERSONATION_END`, `ADMIN_IMPERSONATION_DENIED` |
| Moderation | `ADMIN_CONTENT_MODERATION_UPDATE`, `ADMIN_CONTENT_MODERATION_BULK` |
| Module governance | `ADMIN_MODULE_APPROVE`, `ADMIN_MODULE_REJECT`, `ADMIN_MODULE_STATUS_UPDATE`, `ADMIN_MODULE_VERSION_PROMOTE`, `ADMIN_MODULE_VERSION_PROMOTE_PREVIOUS` |
| Security | `ADMIN_SECURITY_EVENT_RESOLVE` |
| Analytics | `ADMIN_AB_TEST_CREATE`, `ADMIN_AB_TEST_UPDATE`, `ADMIN_USER_SEGMENT_CREATE`, `ADMIN_CUSTOM_REPORT_GENERATE` |
| Support | `ADMIN_SUPPORT_TICKET_CREATE`, `ADMIN_SUPPORT_TICKET_UPDATE`, `ADMIN_KNOWLEDGE_ARTICLE_CREATE`, `ADMIN_KNOWLEDGE_ARTICLE_UPDATE`, `ADMIN_LIVE_CHAT_JOIN` |
| System ops | `ADMIN_SYSTEM_CONFIG_UPDATE`, `ADMIN_BACKUP_CREATE`, `ADMIN_MAINTENANCE_MODE_UPDATE` |
| Performance | `ADMIN_OPTIMIZATION_RECOMMENDATION_UPDATE`, `ADMIN_PERFORMANCE_ALERT_UPDATE`, `ADMIN_PERFORMANCE_ALERT_CONFIGURE` |
| Dangerous ops | `ADMIN_DANGEROUS_MIGRATION_DELETE_DENIED`, `ADMIN_DANGEROUS_MIGRATION_DELETE_EXECUTED`, `ADMIN_DANGEROUS_MIGRATION_RESET_DENIED`, `ADMIN_DANGEROUS_MIGRATION_RESET_EXECUTED` |

### Legacy → canonical (1B-B)

| Legacy (pre-1B-B) | Canonical |
|-------------------|-----------|
| `USER_IMPERSONATION_*` | `ADMIN_IMPERSONATION_*` |
| `CONTENT_MODERATION_*` | `ADMIN_CONTENT_MODERATION_*` |
| `MODULE_*` | `ADMIN_MODULE_*` |
| `SECURITY_EVENT_RESOLVED` | `ADMIN_SECURITY_EVENT_RESOLVE` |
| `AB_TEST_CREATED` | `ADMIN_AB_TEST_CREATE` |
| `SUPPORT_TICKET_*` | `ADMIN_SUPPORT_TICKET_*` |
| `SYSTEM_CONFIG_UPDATED` | `ADMIN_SYSTEM_CONFIG_UPDATE` |
| `PERFORMANCE_ALERT_*` | `ADMIN_PERFORMANCE_ALERT_*` |

---

## 3. Resource types

Canonical constants live in `ADMIN_AUDIT_RESOURCE_TYPES`.

| Resource type | Used for |
|---------------|----------|
| `user` | Target user on deny / user-scoped admin actions |
| `impersonation_session` | Active impersonation start/end |
| `content_report` | Moderation reports |
| `module_submission` | Submission review workflows |
| `module` | Module status changes |
| `module_version` | Version promotion |
| `security_event` | Security event resolution |
| `ab_test` | A/B test admin mutations |
| `user_segment` | Segment creation |
| `analytics_report` | Custom report generation |
| `support_ticket` | Ticket lifecycle |
| `knowledge_article` | KB article mutations |
| `live_chat` | Admin live-chat join |
| `system_config` | Config key updates |
| `backup` | Manual backup initiation |
| `maintenance` | Maintenance mode changes |
| `optimization_recommendation` | Recommendation status updates |
| `performance_alert` | Alert configure/update |
| `database_migration` | Dangerous migration ops |

---

## 4. Metadata rules

Allowed in `details` (JSON):

| Field | When |
|-------|------|
| `targetUserId` | Impersonation, user-targeted actions |
| `targetUserEmail` | Impersonation |
| `businessId` | Business-scoped impersonation |
| `moduleId` | Module governance |
| `submissionId` | Submission review |
| `before` / `after` | State transitions when known |
| `reason` / `denyReason` | Denials and moderation |
| `dangerousOperation` | Migration ops (`delete_migration`, `reset_migration_baseline`) |
| `sourcePackage` | Optional trace (`adminModuleGovernanceService`, etc.) |

**Never include:** passwords, tokens, API keys, connection strings, raw SQL, `_prisma_migrations` payloads.

---

## 5. Helper map

| Helper | Default resource type |
|--------|----------------------|
| `logImpersonationStartAudit` / `logImpersonationEndAudit` | `impersonation_session` |
| `logImpersonationDeniedAudit` | `user` |
| `logContentModerationAudit` | `content_report` |
| `logModuleGovernanceAudit` | caller-supplied (`module_submission`, `module`, `module_version`) |
| `logSecurityEventResolvedAudit` | `security_event` |
| `logAnalyticsAudit` | caller-supplied |
| `logSupportTicketAudit` | caller-supplied |
| `logSystemOpsAudit` | caller-supplied |
| `logPerformanceAudit` | caller-supplied |
| `logDangerousMigrationOpDenied` / `logDangerousMigrationOpExecutedAudit` | `database_migration` |

---

## 6. Related docs

- `docs/architecture/audits/ADMIN_PORTAL_AUDIT_ARCHITECTURE.md` — blueprint design (Stage 1B)
- `docs/architecture/audits/ADMIN_PORTAL_IMPERSONATION_POLICY.md` — impersonation policy

**Last updated:** 2026-06-17 (Stage 1B-B)
