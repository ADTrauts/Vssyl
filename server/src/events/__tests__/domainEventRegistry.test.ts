import { describe, it, expect } from 'vitest';
import {
  DOMAIN_EVENT_TYPES,
  DOMAIN_EVENT_CONTRACTS,
  sanitizeDomainEventMetadata,
  buildTypedDomainEventInput,
} from '../domainEventRegistry';
import { emitDomainEvent } from '../emitDomainEvent';
import { emitModuleInstalledEvent } from '../domainEventEmitters';
import { subscribeDomainEvents } from '../domainEventBus';

describe('domainEventRegistry', () => {
  it('exports stable constants for adopted and near-term types', () => {
    expect(DOMAIN_EVENT_TYPES.USER_PREFERENCE_UPDATED).toBe('user.preference.updated');
    expect(DOMAIN_EVENT_TYPES.MODULE_INSTALLED).toBe('module.installed');
    expect(DOMAIN_EVENT_TYPES.MODULE_UNINSTALLED).toBe('module.uninstalled');
    expect(DOMAIN_EVENT_TYPES.BUSINESS_MEMBER_ADDED).toBe('business.member.added');
    expect(Object.keys(DOMAIN_EVENT_CONTRACTS).length).toBeGreaterThanOrEqual(12);
  });

  it('each contract has version and description', () => {
    for (const contract of Object.values(DOMAIN_EVENT_CONTRACTS)) {
      expect(contract.version).toBeGreaterThanOrEqual(1);
      expect(contract.description.length).toBeGreaterThan(0);
      expect(contract.entityType.length).toBeGreaterThan(0);
      expect(contract.defaultAction.length).toBeGreaterThan(0);
    }
  });

  it('sanitizeDomainEventMetadata strips sensitive keys for preferences', () => {
    const sanitized = sanitizeDomainEventMetadata(DOMAIN_EVENT_TYPES.USER_PREFERENCE_UPDATED, {
      key: 'theme',
      value: 'dark',
      password: 'secret',
    });
    expect(sanitized).toEqual({ key: 'theme' });
  });

  it('buildTypedDomainEventInput applies contract defaults', () => {
    const input = buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.MODULE_INSTALLED, {
      actorUserId: 'u1',
      entityId: 'inst_1',
      businessId: 'b1',
      metadata: { moduleId: 'hr', installScope: 'business', configured: { secret: true } },
    });
    expect(input.type).toBe(DOMAIN_EVENT_TYPES.MODULE_INSTALLED);
    expect(input.entityType).toBe('ModuleInstallation');
    expect(input.action).toBe('install');
    expect(input.metadata).toMatchObject({ moduleId: 'hr', installScope: 'business' });
    expect(input.metadata).not.toHaveProperty('configured');
  });
});

describe('emitModuleInstalledEvent', () => {
  it('emits module.installed with sanitized metadata', () => {
    const received: unknown[] = [];
    const unsub = subscribeDomainEvents((e) => {
      received.push(e);
    });

    const event = emitModuleInstalledEvent({
      actorUserId: 'u1',
      moduleId: 'hr',
      installationId: 'inst_1',
      installScope: 'business',
      businessId: 'b1',
    });

    expect(event.type).toBe(DOMAIN_EVENT_TYPES.MODULE_INSTALLED);
    expect(event.businessId).toBe('b1');
    expect(event.metadata).toMatchObject({
      moduleId: 'hr',
      installScope: 'business',
      installationId: 'inst_1',
    });
    expect(event.metadata).not.toHaveProperty('configuration');
    expect(received).toHaveLength(1);
    unsub();
  });
});

describe('emitDomainEvent sanitization', () => {
  it('strips value from unregistered types when globally disallowed', () => {
    const event = emitDomainEvent({
      type: 'custom.legacy.event',
      actorUserId: 'u1',
      entityType: 'Thing',
      entityId: 't1',
      action: 'create',
      metadata: { token: 'abc', safe: true },
    });
    expect(event.metadata).toEqual({ safe: true });
  });
});
