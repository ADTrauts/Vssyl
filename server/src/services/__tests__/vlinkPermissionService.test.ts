import { describe, expect, it } from 'vitest';
import { VLinkScope } from '@prisma/client';
import { memberCanPerform, validateScopeFields } from '../vlinkPermissionService';

describe('vlinkPermissionService', () => {
  it('validates scope field requirements', () => {
    expect(validateScopeFields(VLinkScope.PERSONAL)).toBeNull();
    expect(validateScopeFields(VLinkScope.BUSINESS, null)).toMatch(/businessId/);
    expect(validateScopeFields(VLinkScope.HOUSEHOLD, null, null)).toMatch(/householdId/);
    expect(validateScopeFields(VLinkScope.PERSONAL, 'biz', null)).toMatch(/PERSONAL/);
  });

  it('grants owner full actions and viewer read-only', () => {
    expect(memberCanPerform('OWNER', 'delete')).toBe(true);
    expect(memberCanPerform('VIEWER', 'read')).toBe(true);
    expect(memberCanPerform('VIEWER', 'link_entity')).toBe(false);
  });
});
