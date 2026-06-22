import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const repoRoot = resolve(__dirname, '../../..');

describe('ActivityFeedWidget trust (Package 1)', () => {
  it('does not generate placeholder activities on API failure', () => {
    const source = readFileSync(
      resolve(repoRoot, 'web/src/components/widgets/ActivityFeedWidget.tsx'),
      'utf8'
    );
    expect(source).not.toContain('generatePlaceholderActivities');
    expect(source).toContain('setActivities([])');
  });
});

describe('DashboardModuleWrapper enterprise gating (Package 1)', () => {
  it('does not mount EnhancedDashboardModule by default', () => {
    const source = readFileSync(
      resolve(repoRoot, 'web/src/components/dashboard/DashboardModuleWrapper.tsx'),
      'utf8'
    );
    expect(source).not.toContain('EnhancedDashboardModule');
    expect(source).toContain('DashboardEnterpriseShowcase');
  });
});
