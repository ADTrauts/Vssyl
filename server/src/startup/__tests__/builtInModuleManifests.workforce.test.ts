import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest } from '../builtInModuleManifests';
import {
  WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES,
  WORKFORCE_COMMS_NOTIFICATION_TYPE_NAMES,
} from '../../platform/workforceCommsNotificationTaxonomy';

describe('builtInModuleManifests workforce_comms (Phase G)', () => {
  it('declares workforce comms capabilities and V-Link entities', () => {
    const manifest = buildBuiltInModuleManifest('workforce_comms');

    expect(manifest.capabilities?.vlink).toBe(true);
    expect(manifest.capabilities?.trash).toBe(true);
    expect(manifest.capabilities?.globalActivity).toBe(true);
    expect(manifest.capabilities?.notifications).toBe(true);
    expect(manifest.capabilities?.businessWorkspace).toBe(true);
    expect(manifest.capabilities?.realtime).not.toBe(true);

    expect(manifest.entities).toHaveLength(2);
    expect(manifest.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'communication',
          vlinkEntityType: 'WORKFORCE_COMMUNICATION',
          supportsTrash: true,
        }),
        expect.objectContaining({
          type: 'campaign',
          vlinkEntityType: 'WORKFORCE_CAMPAIGN',
          supportsTrash: true,
        }),
      ])
    );
  });

  it('registers workforce notification types with live/planned truthfulness', () => {
    const manifest = buildBuiltInModuleManifest('workforce_comms');
    const types = manifest.notifications?.map((entry) => entry.type) ?? [];

    expect(types).toEqual(WORKFORCE_COMMS_NOTIFICATION_TYPE_NAMES);
    expect(WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES.every((type) => types.includes(type))).toBe(
      true
    );
    const liveEntries =
      manifest.notifications?.filter((entry) =>
        WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES.includes(entry.type)
      ) ?? [];
    expect(liveEntries.every((entry) => entry.planned !== true)).toBe(true);
  });
});
