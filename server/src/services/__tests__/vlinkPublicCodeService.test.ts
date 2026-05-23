import { describe, expect, it } from 'vitest';
import {
  formatVLinkPublicCode,
  isUuid,
  normalizePublicCodeInput,
} from '../vlinkPublicCodeService';

describe('vlinkPublicCodeService', () => {
  it('formats public code with VL- prefix', () => {
    expect(formatVLinkPublicCode('483920174625')).toBe('VL-483920174625');
  });

  it('normalizes input with or without prefix', () => {
    expect(normalizePublicCodeInput('483920174625')).toBe('VL-483920174625');
    expect(normalizePublicCodeInput('vl-483920174625')).toBe('VL-483920174625');
  });

  it('validates uuid strings', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isUuid('VL-483920174625')).toBe(false);
  });
});
