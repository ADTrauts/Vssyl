# Platform job registry (inventory annex)

**Status:** Governance + inventory — runtime registry code deferred to Batch 3  
**Constitutional reference:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §22

## Philosophy

Background jobs are Tier 0 scheduler infrastructure. Jobs invoke **canonical services** only. No new scattered `setInterval`. No external queue in v1.

## Inventory

| Job / system | Location | Schedule | Class | `operation` | Idempotency notes |
|--------------|----------|----------|-------|-------------|-------------------|
| Trash permanent delete | `cleanupService.ts` | `0 0 * * *` | Transitional | `cleanupservice_*` | Re-scan trashed; **duplicate cron register**; direct Prisma — migrate |
| Reminder dispatch | `index.ts` | `* * * * *` | Transitional | `cron_reminders` | Lookahead window |
| Ambient suggestion expiry | `index.ts` | `0 * * * *` | Transitional | `cron_ambient_suggestion_expiry` | Stale row expire |
| AI allowance reset | `index.ts` | `0 0 1 * *` | Transitional | `cron_ai_allowance_reset` | Monthly |
| Developer revenue | `index.ts` | `0 1 1 * *` | Transitional | `cron_developer_revenue` | Monthly |
| Overage billing | `index.ts` | `0 3 * * *` | Transitional | `cron_overage_billing` | Daily |
| AI provider sync | `index.ts` | `0 4 * * *` + startup | Transitional | `cron_ai_provider_sync` | Upsert sync |
| Module registry sync | `POST /admin/modules/ai/sync` | Cloud Scheduler HTTP | Transitional | `module_registry_sync_*` | Good multi-instance pattern |
| Webhook delivery | `webhookDeliveryService.ts` | Event-driven | **Canonical** | delivery records | 3 attempts → DEAD_LETTER |
| Ambient AI correlation | `AIEventConsumer.ts` | Domain event async | **Canonical pattern** | `ai_domain_event_consumed` | Dedupe in service |
| Pattern analysis | `PatternAnalysisScheduler.ts` | setInterval (opt-in) | **Legacy** | console | `ENABLE_PATTERN_ANALYSIS_SCHEDULER` |
| Log retention | `logService.ts` | setInterval | **Legacy** | `logservice_*` | Migrate to registry |
| Behavioral monitoring | `behavioralMonitoringService.ts` | setInterval | **Legacy** | — | Marketplace only |
| Pipeline diagnostic purge | Admin API | Manual | Transitional | `pipeline_diagnostics_purge` | Should become scheduled job |
| WorkflowAutomationService | In-memory | — | **Tier 4** | — | Non-canonical |

## Target lifecycle states

`pending` → `running` → `retrying` → `completed` | `failed` | `dead-lettered` | `cancelled`

## Migration batches

1. Doc + this annex  
2. `registerPlatformJob()` metadata  
3. Wrap existing crons (no behavior change)  
4. Dedupe cleanupService; migrate trash job to trash service  

**Last updated:** 2026-05-28
