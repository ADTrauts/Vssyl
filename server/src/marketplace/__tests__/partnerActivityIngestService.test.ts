import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ACTIVITY_INGEST_CONTRACT_VERSION } from 'shared/types/activity-ingest';
import {
  validatePartnerActivityIngestRequest,
  ingestPartnerActivity,
} from '../partnerActivityIngestService';
import {
  resetActivityIngestIdempotencyStore,
  resetActivityIngestRateLimits,
} from '../activityIngestRegistry';
import { resetActivityIngestJtiCache } from '../activityIngestJwt';
import { emitModuleActivityEvent } from '../../services/moduleActivityService';

vi.mock('../../services/moduleActivityService.js', () => ({
  emitModuleActivityEvent: vi.fn().mockResolvedValue('evt_test_1'),
}));

const registration = {
  moduleId: 'vssyl-pilot-assets',
  moduleName: 'Pilot',
  moduleVersionId: 'mv-1',
  semver: '1.0.0',
  contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
  supportedContexts: ['business'] as const,
  entityTypes: ['asset'],
  actionTypes: ['create', 'update', 'checked_out', 'maintenance_scheduled'],
  maxMetadataBytes: 4096,
  idempotencyRequired: true,
  registeredAt: new Date().toISOString(),
};

const baseBody = {
  contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
  idempotencyKey: 'key-1',
  occurredAt: new Date().toISOString(),
  action: 'create',
  actor: { userRef: 'user-1' },
  target: { type: 'asset', id: 'asset-1' },
  context: { scope: 'business', businessId: 'biz-1' },
  metadata: { label: 'Forklift', apiKey: 'secret-should-strip' },
};

const baseClaims = {
  sub: 'user-1',
  aud: 'vssyl:activity-ingest:v1' as const,
  iss: 'vssyl-platform' as const,
  jti: 'jti-1',
  moduleId: 'vssyl-pilot-assets',
  moduleVersionId: 'mv-1',
  requestId: 'req-1',
  userRef: 'abc',
  scope: 'business' as const,
  businessId: 'biz-1',
};

describe('partnerActivityIngestService', () => {
  beforeEach(() => {
    resetActivityIngestIdempotencyStore();
    resetActivityIngestRateLimits();
    resetActivityIngestJtiCache();
    vi.mocked(emitModuleActivityEvent).mockClear();
  });

  it('validates request against registration', () => {
    const ok = validatePartnerActivityIngestRequest(baseBody, registration);
    expect(ok.ok).toBe(true);

    const bad = validatePartnerActivityIngestRequest(
      { ...baseBody, action: 'unknown_action' },
      registration
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.code).toBe('UNKNOWN_ACTION');
  });

  it('rejects moduleId pin mismatch', async () => {
    const result = await ingestPartnerActivity({
      urlModuleId: 'other-module',
      claims: baseClaims,
      registration,
      body: baseBody,
      probeMode: true,
    });
    expect(result.response.success).toBe(false);
    if (!result.response.success) {
      expect(result.response.error.code).toBe('FORBIDDEN');
    }
  });

  it('accepts valid activity in probe mode', async () => {
    const result = await ingestPartnerActivity({
      urlModuleId: 'vssyl-pilot-assets',
      claims: baseClaims,
      registration,
      body: baseBody,
      probeMode: true,
    });
    expect(result.response.success).toBe(true);
    if (result.response.success) {
      expect(result.response.eventId).toBe('evt_test_1');
    }
    expect(emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'vssyl-pilot-assets',
        action: 'create',
        metadata: expect.objectContaining({
          partnerOrigin: true,
          label: 'Forklift',
        }),
      })
    );
    const call = vi.mocked(emitModuleActivityEvent).mock.calls[0][0];
    expect(call.metadata).not.toHaveProperty('apiKey');
  });

  it('returns duplicate for same idempotency key', async () => {
    await ingestPartnerActivity({
      urlModuleId: 'vssyl-pilot-assets',
      claims: { ...baseClaims, jti: 'jti-a' },
      registration,
      body: baseBody,
      probeMode: true,
    });

    const dup = await ingestPartnerActivity({
      urlModuleId: 'vssyl-pilot-assets',
      claims: { ...baseClaims, jti: 'jti-b' },
      registration,
      body: baseBody,
      probeMode: true,
    });
    expect(dup.response.success).toBe(true);
    if (dup.response.success) {
      expect(dup.response.duplicate).toBe(true);
    }
    expect(emitModuleActivityEvent).toHaveBeenCalledTimes(1);
  });

  it('rejects actor mismatch', async () => {
    const result = await ingestPartnerActivity({
      urlModuleId: 'vssyl-pilot-assets',
      claims: baseClaims,
      registration,
      body: { ...baseBody, actor: { userRef: 'other-user' } },
      probeMode: true,
    });
    expect(result.response.success).toBe(false);
    if (!result.response.success) {
      expect(result.response.error.code).toBe('FORBIDDEN');
    }
  });
});
