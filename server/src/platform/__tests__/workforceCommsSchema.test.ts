import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';

const EXPECTED_MODELS = [
  'WorkforceCommunication',
  'WorkforceCampaign',
  'WorkforceAudience',
  'WorkforceAudienceResolution',
  'WorkforceReadReceipt',
  'WorkforceAcknowledgement',
  'WorkforceAttachment',
  'WorkforceDeliveryLog',
  'WorkforceBridgeRef',
] as const;

const EXPECTED_ENUMS = [
  'WorkforceCommunicationType',
  'WorkforceCommunicationStatus',
  'WorkforcePriority',
  'WorkforceCampaignStatus',
  'WorkforceAudienceType',
  'WorkforceEngagementSource',
  'WorkforceDeliveryStatus',
  'WorkforceBridgeKind',
] as const;

describe('workforce_comms Prisma schema (Phase A)', () => {
  it('includes all workforce communication models in DMMF', () => {
    const modelNames = new Set(Prisma.dmmf.datamodel.models.map((model) => model.name));
    for (const modelName of EXPECTED_MODELS) {
      expect(modelNames.has(modelName)).toBe(true);
    }
  });

  it('includes workforce communication enums in DMMF', () => {
    const enumNames = new Set(Prisma.dmmf.datamodel.enums.map((enumDef) => enumDef.name));
    for (const enumName of EXPECTED_ENUMS) {
      expect(enumNames.has(enumName)).toBe(true);
    }
  });

  it('scopes WorkforceCommunication by businessId with trash index', () => {
    const model = Prisma.dmmf.datamodel.models.find((entry) => entry.name === 'WorkforceCommunication');
    expect(model).toBeDefined();
    const fieldNames = model?.fields.map((field) => field.name) ?? [];
    expect(fieldNames).toContain('businessId');
    expect(fieldNames).toContain('trashedAt');
    expect(fieldNames).toContain('legacyFrontPageId');
  });

  it('extends VLinkEntityType with workforce entity values', () => {
    const vlinkEnum = Prisma.dmmf.datamodel.enums.find((entry) => entry.name === 'VLinkEntityType');
    const values = vlinkEnum?.values.map((value) => value.name) ?? [];
    expect(values).toContain('WORKFORCE_COMMUNICATION');
    expect(values).toContain('WORKFORCE_CAMPAIGN');
  });
});
