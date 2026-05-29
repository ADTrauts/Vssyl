/**
 * Platform Job Registry (Batch 4) — metadata + single registration path for recurring jobs.
 * Wraps node-cron; no external queue in v1.
 */
import cron from 'node-cron';
import { logger } from '../lib/logger';

export type PlatformJobTier = 'transitional' | 'canonical' | 'legacy';

export interface PlatformJobDefinition {
  id: string;
  schedule: string;
  handler: () => void | Promise<void>;
  timezone?: string;
  tier?: PlatformJobTier;
  operation: string;
  description?: string;
}

const registeredJobIds = new Set<string>();

export function registerPlatformJob(def: PlatformJobDefinition): void {
  if (registeredJobIds.has(def.id)) {
    void logger.warn('Platform job already registered — skipping duplicate', {
      operation: 'platform_job_duplicate_skipped',
      context: { jobId: def.id },
    });
    return;
  }

  registeredJobIds.add(def.id);

  const wrapped = async (): Promise<void> => {
    try {
      await def.handler();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Platform job failed', {
        operation: def.operation,
        error: { message: err.message, stack: err.stack },
        context: { jobId: def.id },
      });
    }
  };

  cron.schedule(def.schedule, () => {
    void wrapped();
  }, {
    timezone: def.timezone ?? 'America/New_York',
  });

  void logger.info('Platform job registered', {
    operation: 'platform_job_registered',
    context: {
      jobId: def.id,
      schedule: def.schedule,
      tier: def.tier ?? 'transitional',
      description: def.description,
    },
  });
}

export function getRegisteredPlatformJobIds(): string[] {
  return [...registeredJobIds];
}

export function resetPlatformJobRegistryForTests(): void {
  registeredJobIds.clear();
}
