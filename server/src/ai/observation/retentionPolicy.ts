/**
 * Phase 5B — Retention policy constants + description.
 */
export {
  AI_OBSERVATION_RETENTION_POLICY,
  type AIObservationRetentionPolicy,
} from 'vssyl-shared';

export function describeRetentionPolicy(): string {
  return [
    'Hot retention: 30 days',
    'Archive after: 90 days (future)',
    'Purge after: 365 days',
    'Purge service: available (dry-run default)',
    'Cron: registered only when AI_OBSERVATION_RETENTION_CRON_ENABLED=true',
  ].join('; ');
}
