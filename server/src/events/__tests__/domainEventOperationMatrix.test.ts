import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DOMAIN_EVENT_PRODUCTION_SUBSCRIBER_IDS,
  DOMAIN_EVENT_SUBSCRIBER_MATRIX,
  DOMAIN_EVENT_MODULE_PARTICIPATION,
  isOptionalDomainEventSubscriberEnabled,
  resolveActiveDomainEventSubscribers,
  validateDomainEventOperationMatrix,
  validateCertifiedModuleParticipation,
} from '../domainEventOperationMatrix';

describe('domainEventOperationMatrix (PK-W3-DE-1)', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    delete process.env.DOMAIN_EVENT_SEARCH_INDEX_SUBSCRIBER_ENABLED;
    delete process.env.DOMAIN_EVENT_WORKFLOW_ROUTER_SUBSCRIBER_ENABLED;
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('validates matrix integrity by default', () => {
    const result = validateDomainEventOperationMatrix();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.productionStubCount).toBe(0);
  });

  it('registers seven production subscribers by default', () => {
    const active = resolveActiveDomainEventSubscribers();
    expect(active.map((s) => s.id)).toEqual(DOMAIN_EVENT_PRODUCTION_SUBSCRIBER_IDS);
    expect(active).toHaveLength(7);
  });

  it('excludes stub subscribers unless explicitly enabled', () => {
    const active = resolveActiveDomainEventSubscribers();
    expect(active.some((s) => s.id === 'search_index_stub')).toBe(false);
    expect(active.some((s) => s.id === 'workflow_router_stub')).toBe(false);
  });

  it('allows opt-in stub registration via env flags', () => {
    process.env.DOMAIN_EVENT_SEARCH_INDEX_SUBSCRIBER_ENABLED = 'true';
    const active = resolveActiveDomainEventSubscribers();
    expect(active.some((s) => s.id === 'search_index_stub')).toBe(true);

    const stub = DOMAIN_EVENT_SUBSCRIBER_MATRIX.find((s) => s.id === 'search_index_stub');
    expect(stub).toBeDefined();
    expect(isOptionalDomainEventSubscriberEnabled(stub!)).toBe(true);
  });

  it('documents ownership and purpose for every subscriber', () => {
    for (const entry of DOMAIN_EVENT_SUBSCRIBER_MATRIX) {
      expect(entry.owner.trim().length).toBeGreaterThan(0);
      expect(entry.constitutionalPurpose.trim().length).toBeGreaterThan(0);
      expect(entry.handler.trim().length).toBeGreaterThan(0);
      expect(entry.sourceFile.trim().length).toBeGreaterThan(0);
    }
  });

  it('marks stub subscribers as non-registrable by default', () => {
    const stubs = DOMAIN_EVENT_SUBSCRIBER_MATRIX.filter((s) => s.classification === 'stub');
    expect(stubs).toHaveLength(2);
    for (const stub of stubs) {
      expect(stub.registrable).toBe(false);
      expect(stub.optionalDevFlag).toBe(true);
      expect(stub.subscriberEnvFlag).toBeTruthy();
    }
  });

  it('validates certified module participation including HR facade', () => {
    const result = validateCertifiedModuleParticipation();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    const hr = DOMAIN_EVENT_MODULE_PARTICIPATION.find((m) => m.moduleId === 'hr');
    expect(hr?.facade).toBe('hrDomainEventService.ts');
    expect(hr?.emitsDomainEvents).toBe(true);
  });
});
