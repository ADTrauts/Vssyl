import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { BUILT_IN_MODULE_IDS } from '../../constants/builtInModuleIds';
import { buildBuiltInModuleManifest } from '../builtInModuleManifests';
import {
  WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES,
  WORKFORCE_COMMS_NOTIFICATION_TYPE_NAMES,
} from '../../platform/workforceCommsNotificationTaxonomy';

describe('builtIn module ids workforce_comms', () => {
  it('includes workforce_comms in built-in module ids', () => {
    expect(BUILT_IN_MODULE_IDS).toContain('workforce_comms');
  });
});

describe('registerBuiltInModules workforce_comms AI registration (F-WC-001)', () => {
  const registerSource = readFileSync(
    resolve(__dirname, '../registerBuiltInModules.ts'),
    'utf8'
  );

  it('registers workforce_comms module definition and AI context providers', () => {
    expect(registerSource).toContain("id: 'workforce_comms'");
    expect(registerSource).toContain("moduleId: 'workforce_comms'");
    expect(registerSource).toContain('/api/workforce-comms/ai/context/overview');
    expect(registerSource).toContain('/api/workforce-comms/ai/context/reach');
  });
});

describe('builtInModuleManifests workforce_comms certification closure (F-WC-003)', () => {
  it('marks live notification types as not planned', () => {
    const manifest = buildBuiltInModuleManifest('workforce_comms');
    const published = manifest.notifications?.find(
      (entry) => entry.type === 'workforce_communication_published'
    );
    const ackRequired = manifest.notifications?.find((entry) => entry.type === 'workforce_ack_required');
    const campaignCompleted = manifest.notifications?.find(
      (entry) => entry.type === 'workforce_campaign_completed'
    );
    const ackReminder = manifest.notifications?.find((entry) => entry.type === 'workforce_ack_reminder');

    expect(published?.planned).not.toBe(true);
    expect(ackRequired?.planned).not.toBe(true);
    expect(campaignCompleted?.planned).not.toBe(true);
    expect(ackReminder?.planned).toBe(true);
  });

  it('aligns live taxonomy with manifest', () => {
    const manifestTypes =
      buildBuiltInModuleManifest('workforce_comms').notifications?.map((entry) => entry.type) ?? [];
    expect(manifestTypes).toEqual(WORKFORCE_COMMS_NOTIFICATION_TYPE_NAMES);
    expect(WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES).toContain('workforce_communication_published');
    expect(WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES).toContain('workforce_ack_required');
    expect(WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES).not.toContain('workforce_ack_reminder');
  });
});
