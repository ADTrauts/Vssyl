import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ACTIVITY_INGEST_CONTRACT_VERSION } from 'vssyl-shared/types/activity-ingest';
import { probeActivityIngest } from '../activityIngestProbe';
import {
  clearPartnerActivityIngestRegistry,
  registerPartnerActivityIngest,
  resetActivityIngestIdempotencyStore,
} from '../activityIngestRegistry';
import { resetActivityIngestJtiCache } from '../activityIngestJwt';

vi.mock('../../services/moduleActivityService.js', () => ({
  emitModuleActivityEvent: vi.fn().mockResolvedValue('evt_probe_1'),
}));

describe('activityIngestProbe', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-only-jwt-secret-not-for-production-use-32b';
    clearPartnerActivityIngestRegistry();
    resetActivityIngestIdempotencyStore();
    resetActivityIngestJtiCache();
    registerPartnerActivityIngest({
      moduleId: 'vssyl-pilot-assets',
      moduleName: 'Pilot',
      moduleVersionId: 'mv-1',
      semver: '1.0.0',
      contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
      supportedContexts: ['business'],
      entityTypes: ['asset'],
      actionTypes: ['create'],
      maxMetadataBytes: 4096,
      idempotencyRequired: true,
      registeredAt: new Date().toISOString(),
    });
  });

  it('validates manifest without live probe', async () => {
    const manifest = {
      capabilities: { activity: true },
      supportedContexts: ['business'],
      entities: [{ type: 'asset', supportsActivity: true }],
      activityIngest: {
        contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
        supportedContexts: ['business'],
        entityTypes: ['asset'],
        actionTypes: ['create'],
      },
    };

    const result = await probeActivityIngest({
      moduleId: 'vssyl-pilot-assets',
      manifest,
      registration: undefined,
      probeUserId: 'admin-1',
    });

    expect(result.hasActivityCapability).toBe(true);
    expect(result.ok).toBe(true);
  });

  it('executes live probe when registered', async () => {
    const manifest = {
      capabilities: { activity: true },
      supportedContexts: ['business'],
      entities: [{ type: 'asset', supportsActivity: true }],
      activityIngest: {
        contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
        supportedContexts: ['business'],
        entityTypes: ['asset'],
        actionTypes: ['create'],
      },
    };

    const { getPartnerActivityIngest } = await import('../activityIngestRegistry.js');
    const registration = getPartnerActivityIngest('vssyl-pilot-assets');
    expect(registration).toBeDefined();

    const result = await probeActivityIngest({
      moduleId: 'vssyl-pilot-assets',
      manifest,
      registration: registration!,
      probeUserId: 'admin-1',
      executeLiveProbe: true,
    });

    expect(result.ok).toBe(true);
    expect(result.probeOutcome).toBe('success');
    expect(result.eventId).toBe('evt_probe_1');
  });
});
