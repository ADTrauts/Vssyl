import { describe, expect, it } from 'vitest';
import { WORKFORCE_COMMS_NOTIFICATION_TYPES, WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES } from '../workforceCommsNotificationTaxonomy';
import { buildBuiltInModuleManifest } from '../../startup/builtInModuleManifests';

describe('workforceCommsNotificationTaxonomy (Phase G)', () => {
  it('defines four workforce notification types with live/planned split', () => {
    expect(WORKFORCE_COMMS_NOTIFICATION_TYPES).toHaveLength(4);
    expect(WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES).toHaveLength(3);
    expect(WORKFORCE_COMMS_NOTIFICATION_TYPES.every((entry) => entry.type.startsWith('workforce_'))).toBe(
      true
    );
  });

  it('aligns with built-in manifest notification registration', () => {
    const manifestTypes =
      buildBuiltInModuleManifest('workforce_comms').notifications?.map((entry) => entry.type) ?? [];
    const taxonomyTypes = WORKFORCE_COMMS_NOTIFICATION_TYPES.map((entry) => entry.type);
    expect(manifestTypes).toEqual(taxonomyTypes);
  });
});
