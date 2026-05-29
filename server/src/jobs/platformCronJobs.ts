/**
 * Registers platform cron jobs via registerPlatformJob (Batch 4).
 * Called from handleServerListening in index.ts.
 */
import { registerPlatformJob } from './platformJobRegistry';
import { dispatchDueReminders } from '../services/reminderService';
import { AIQueryService } from '../services/aiQueryService';
import { OverageBillingService } from '../services/overageBillingService';
import { logger } from '../lib/logger';

export async function registerPlatformCronJobs(): Promise<void> {
  registerPlatformJob({
    id: 'reminder_dispatch',
    schedule: '* * * * *',
    handler: async () => {
      await dispatchDueReminders(5);
    },
    tier: 'transitional',
    operation: 'cron_reminders',
    description: 'Dispatch due calendar reminders',
  });

  registerPlatformJob({
    id: 'ambient_suggestion_expiry',
    schedule: '0 * * * *',
    handler: async () => {
      const { ambientSuggestionService } = await import('../services/ambientSuggestionService.js');
      const count = await ambientSuggestionService.expireStaleSuggestions();
      if (count > 0) {
        void logger.info('Ambient suggestion expiry job completed', {
          operation: 'cron_ambient_suggestion_expiry',
          count,
        });
      }
    },
    tier: 'transitional',
    operation: 'cron_ambient_suggestion_expiry',
    description: 'Expire stale ambient AI suggestions',
  });

  registerPlatformJob({
    id: 'ai_allowance_reset',
    schedule: '0 0 1 * *',
    handler: async () => {
      void logger.info('Running monthly AI query allowance reset', { operation: 'cron_ai_allowance_reset' });
      await AIQueryService.resetMonthlyAllowance();
    },
    tier: 'transitional',
    operation: 'cron_ai_allowance_reset',
    description: 'Monthly AI query allowance reset',
  });

  registerPlatformJob({
    id: 'developer_revenue',
    schedule: '0 1 1 * *',
    handler: async () => {
      const { RevenueSplitService } = await import('../services/revenueSplitService');
      await RevenueSplitService.updateAllModuleSmallBusinessEligibility();
    },
    tier: 'transitional',
    operation: 'cron_developer_revenue',
    description: 'Monthly developer small business eligibility',
  });

  registerPlatformJob({
    id: 'overage_billing',
    schedule: '0 3 * * *',
    handler: async () => {
      await OverageBillingService.processAllOverageBilling();
    },
    tier: 'transitional',
    operation: 'cron_overage_billing',
    description: 'Daily overage billing processing',
  });

  registerPlatformJob({
    id: 'ai_provider_sync',
    schedule: '0 4 * * *',
    handler: async () => {
      const { ProviderSyncService } = await import('../services/aiProviderServices/providerSyncService');
      const providerSyncService = new ProviderSyncService();
      await providerSyncService.syncProviderData();
    },
    tier: 'transitional',
    operation: 'cron_ai_provider_sync',
    description: 'Daily AI provider usage sync',
  });

  try {
    const { ProviderSyncService } = await import('../services/aiProviderServices/providerSyncService');
    const providerSyncService = new ProviderSyncService();
    providerSyncService.syncProviderData().catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.warn('Initial provider sync failed (non-critical)', {
        operation: 'ai_provider_sync_initial',
        error: { message: err.message, stack: err.stack },
      });
    });
  } catch {
    // non-critical startup sync
  }
}
