import { describe, expect, it } from 'vitest';
import { PLATFORM_ADOPTION_REGISTRY } from '../../platform-adoption/platformAdoptionRegistry.js';
import {
  adoptionLevelLabel,
  computeScoreFromCapabilities,
  decodeCapabilityString,
  scoreToAdoptionLevel,
} from '../../platform-adoption/platformAdoptionScoring.js';
import { runPlatformAdoptionCiValidation } from '../../platform-adoption/platformAdoptionValidation.js';
import { getPlatformAdoptionModuleDetail } from '../admin/platformAdoptionService.js';

describe('platformAdoptionRegistry', () => {
  it('has 22 evaluated surfaces', () => {
    expect(PLATFORM_ADOPTION_REGISTRY).toHaveLength(22);
  });

  it('uses 12-char capability encodings', () => {
    for (const entry of PLATFORM_ADOPTION_REGISTRY) {
      const encoded = Object.values(entry.capabilities);
      expect(encoded).toHaveLength(12);
    }
  });

  it('decodeCapabilityString maps F/P/M/N', () => {
    expect(decodeCapabilityString('FFFFNPFFFFFF')).toMatchObject({
      platformKernel: 'full',
      marketplaceCompat: 'na',
      platformController: 'partial',
    });
  });
});

describe('platformAdoptionScoring', () => {
  it('maps scores to adoption levels', () => {
    expect(scoreToAdoptionLevel(94)).toBe('A');
    expect(scoreToAdoptionLevel(86)).toBe('B');
    expect(scoreToAdoptionLevel(58)).toBe('C');
    expect(scoreToAdoptionLevel(41)).toBe('D');
    expect(adoptionLevelLabel('A')).toBe('Platform Native');
  });

  it('computes score from capabilities', () => {
    const drive = PLATFORM_ADOPTION_REGISTRY.find((m) => m.moduleId === 'drive');
    expect(drive).toBeDefined();
    if (drive) {
      const computed = computeScoreFromCapabilities(drive.capabilities);
      expect(computed).toBeGreaterThanOrEqual(85);
    }
  });
});

describe('platformAdoptionValidation', () => {
  it('runs CI validation without throwing', () => {
    const result = runPlatformAdoptionCiValidation();
    expect(result.warnings).toBeDefined();
    expect(result.assessedAt).toBeTruthy();
  });

  it('includes dashboard in manifest search parity', () => {
    const result = runPlatformAdoptionCiValidation();
    const stale = result.warnings.find((w) => w.code === 'SEARCH_PARITY_LIST_STALE');
    expect(stale).toBeUndefined();
  });
});

describe('platformAdoptionService', () => {
  it('returns module detail with checklist', () => {
    const detail = getPlatformAdoptionModuleDetail('drive');
    expect(detail.moduleId).toBe('drive');
    expect(detail.capabilityChecklist.length).toBe(12);
    expect(detail.adoptionLevelLabel).toBe('Platform Native');
  });

  it('throws for unknown module', () => {
    expect(() => getPlatformAdoptionModuleDetail('unknown-module')).toThrow();
  });
});
