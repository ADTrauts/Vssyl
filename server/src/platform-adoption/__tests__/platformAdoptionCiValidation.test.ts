import { describe, expect, it } from 'vitest';
import { runPlatformAdoptionCiValidation } from '../platformAdoptionValidation.js';

describe('platformAdoptionCiValidation', () => {
  it('runs participation checks and reports warnings', () => {
    const result = runPlatformAdoptionCiValidation();
    expect(result.assessedAt).toBeTruthy();

    for (const warning of result.warnings) {
      const prefix = warning.severity === 'error' ? 'ERROR' : 'WARN';
      const module = warning.moduleId ? ` [${warning.moduleId}]` : '';
      // eslint-disable-next-line no-console -- CI operator output
      console.log(`${prefix}${module} (${warning.code}): ${warning.message}`);
    }

    if (result.warnings.length === 0) {
      // eslint-disable-next-line no-console -- CI operator output
      console.log('No platform adoption participation warnings.');
    }

    if (process.env.PLATFORM_ADOPTION_CI_STRICT === 'true') {
      expect(result.errorCount, 'Platform adoption CI strict mode: errors must be zero').toBe(0);
    }
  });
});
