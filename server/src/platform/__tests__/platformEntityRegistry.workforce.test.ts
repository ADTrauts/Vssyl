import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPlatformEntityRegistryForTests,
  getPlatformEntity,
  registerWorkforceCommsPlatformEntities,
} from '../platformEntityRegistry';

describe('platformEntityRegistry workforce_comms (Phase A)', () => {
  beforeEach(() => {
    clearPlatformEntityRegistryForTests();
  });

  it('registers communication and campaign descriptors', () => {
    registerWorkforceCommsPlatformEntities();

    const communication = getPlatformEntity('workforce_comms', 'communication');
    expect(communication).toMatchObject({
      moduleId: 'workforce_comms',
      entityType: 'communication',
      vlinkEntityType: 'WORKFORCE_COMMUNICATION',
      supportsTrash: true,
      activityTargetType: 'communication',
    });

    const campaign = getPlatformEntity('workforce_comms', 'campaign');
    expect(campaign).toMatchObject({
      moduleId: 'workforce_comms',
      entityType: 'campaign',
      vlinkEntityType: 'WORKFORCE_CAMPAIGN',
      supportsTrash: true,
      activityTargetType: 'campaign',
    });
  });

  it('is idempotent on repeat registration', () => {
    registerWorkforceCommsPlatformEntities();
    registerWorkforceCommsPlatformEntities();
    expect(getPlatformEntity('workforce_comms', 'communication')).toBeDefined();
  });
});
