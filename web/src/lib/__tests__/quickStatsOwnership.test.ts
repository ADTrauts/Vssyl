import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('QuickStats ownership model (Package 3)', () => {
  it('QuickStatsWidget consumes dashboardAnalyticsFacade only', () => {
    const path = join(__dirname, '../../components/widgets/QuickStatsWidget.tsx');
    const content = readFileSync(path, 'utf8');
    expect(content).toContain('dashboardAnalyticsFacade');
    expect(content).not.toContain("from '../../api/chat'");
    expect(content).not.toContain("from '../../api/todo'");
    expect(content).not.toContain('calendarAPI');
    expect(content).not.toContain('storageUsedPercent: 23');
  });

  it('useDashboardStats consumes dashboardAnalyticsFacade only', () => {
    const path = join(__dirname, '../../hooks/useDashboardStats.ts');
    const content = readFileSync(path, 'utf8');
    expect(content).toContain('dashboardAnalyticsFacade');
    expect(content).not.toContain("from '../api/chat'");
    expect(content).not.toContain("from '../api/todo'");
  });

  it('widget registry marks quickstats analytics capability with dashboard host', () => {
    const path = join(__dirname, '../../components/dashboard/widgetRegistry.ts');
    const content = readFileSync(path, 'utf8');
    expect(content).toContain("capabilityId: 'analytics'");
    expect(content).toContain("moduleId: 'dashboard'");
  });
});
