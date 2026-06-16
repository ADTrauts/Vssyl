import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBusinessHRFeatures } from '../../middleware/hrFeatureGating';
import { getHRFeatureAvailability, getHRSettings, updateHRSettings } from '../hrSettingsService';

vi.mock('../../middleware/hrFeatureGating', () => ({
  getBusinessHRFeatures: vi.fn(),
}));

describe('hrSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHRSettings', () => {
    it('returns default settings stub', async () => {
      const result = await getHRSettings();
      expect(result.settings.defaults.timeOffSettings.defaultPTODays).toBe(15);
    });
  });

  describe('updateHRSettings', () => {
    it('returns framework stub response', async () => {
      const result = await updateHRSettings();
      expect(result.message).toContain('framework stub');
    });
  });

  describe('getHRFeatureAvailability', () => {
    it('delegates to getBusinessHRFeatures', async () => {
      vi.mocked(getBusinessHRFeatures).mockResolvedValue({
        tier: 'professional',
        features: { employees: true } as never,
      });

      const result = await getHRFeatureAvailability('biz-1');
      expect(getBusinessHRFeatures).toHaveBeenCalledWith('biz-1');
      expect(result.tier).toBe('professional');
    });
  });
});
