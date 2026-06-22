import { describe, expect, it } from 'vitest';
import { isRegisteredDomainEventType, DOMAIN_EVENT_TYPES } from '../domainEventRegistry';

describe('dashboard domain event registry (Package 2)', () => {
  it('registers all four required dashboard event types', () => {
    expect(isRegisteredDomainEventType(DOMAIN_EVENT_TYPES.DASHBOARD_TAB_CREATED)).toBe(true);
    expect(isRegisteredDomainEventType(DOMAIN_EVENT_TYPES.DASHBOARD_TAB_DELETED)).toBe(true);
    expect(isRegisteredDomainEventType(DOMAIN_EVENT_TYPES.DASHBOARD_WIDGET_ADDED)).toBe(true);
    expect(isRegisteredDomainEventType(DOMAIN_EVENT_TYPES.DASHBOARD_WIDGET_REMOVED)).toBe(true);
  });
});
