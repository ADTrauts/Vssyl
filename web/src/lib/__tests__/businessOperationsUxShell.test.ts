import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');

const BO_ROOTS = [
  join(WEB_ROOT, 'components/scheduling'),
  join(WEB_ROOT, 'components/hr'),
  join(WEB_ROOT, 'components/workforce-comms'),
  join(WEB_ROOT, 'components/business-operations'),
];

function listBoSources(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) files.push(full);
    }
  };
  for (const root of BO_ROOTS) walk(root);
  return files;
}

const REQUIRED_CONFIRM_MIGRATIONS = [
  'components/scheduling/SchedulingAdminContent.tsx',
  'components/scheduling/ScheduleBuilderVisual.tsx',
  'components/scheduling/TemplateBuilderVisual.tsx',
  'components/scheduling/ShiftBlock.tsx',
  'components/scheduling/AvailabilityManagement.tsx',
  'components/scheduling/SchedulingEmployeeContent.tsx',
  'components/scheduling/OpenShiftsList.tsx',
  'components/workforce-comms/CommunicationList.tsx',
  'components/workforce-comms/CampaignManager.tsx',
  'components/workforce-comms/CommunicationComposer.tsx',
];

const REQUIRED_EMPTY_STATE_SURFACES = [
  'components/scheduling/OpenShiftsList.tsx',
  'components/scheduling/SchedulingEmployeeContent.tsx',
  'components/workforce-comms/CommunicationList.tsx',
  'components/workforce-comms/CampaignManager.tsx',
  'components/workforce-comms/WorkforceCommsFeed.tsx',
  'components/workforce-comms/reporting/CommunicationAnalyticsPanel.tsx',
  'components/workforce-comms/reporting/CampaignAnalyticsPanel.tsx',
  'components/workforce-comms/reporting/AckComplianceDashboard.tsx',
  'components/hr/onboarding/EmployeeOnboardingJourneyView.tsx',
  'components/hr/onboarding/TeamOnboardingTaskList.tsx',
];

describe('businessOperationsUxShell (BO-1B)', () => {
  const sources = listBoSources();

  it('no native window.confirm or browser confirm() in BO surfaces', () => {
    for (const file of sources) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/window\.confirm/);
      expect(source, file).not.toMatch(/if\s*\(\s*!confirm\(/);
      expect(source, file).not.toMatch(/if\s*\(\s*confirm\(/);
      expect(source, file).not.toMatch(/window\.prompt/);
      expect(source, file).not.toMatch(/\bprompt\(/);
    }
  });

  it('destructive flows use useConfirm or ConfirmModal', () => {
    for (const rel of REQUIRED_CONFIRM_MIGRATIONS) {
      const source = readFileSync(join(WEB_ROOT, rel), 'utf8');
      const hasConfirm = source.includes('useConfirm') || source.includes('ConfirmModal');
      expect(hasConfirm, rel).toBe(true);
    }
  });

  it('SchedulingEmployeeContent uses Modal for swap notes (no prompt)', () => {
    const source = readFileSync(
      join(WEB_ROOT, 'components/scheduling/SchedulingEmployeeContent.tsx'),
      'utf8'
    );
    expect(source).toContain('swapNotesModalShiftId');
    expect(source).toContain('<Modal');
    expect(source).not.toMatch(/\bprompt\(/);
  });

  it('BusinessOperationsEmptyState adopted on key surfaces', () => {
    for (const rel of REQUIRED_EMPTY_STATE_SURFACES) {
      const source = readFileSync(join(WEB_ROOT, rel), 'utf8');
      expect(
        source.includes('BusinessOperationsEmptyState') || source.includes('EmptyState'),
        rel
      ).toBe(true);
    }
    expect(
      sources.filter((f) => readFileSync(f, 'utf8').includes('BusinessOperationsEmptyState')).length
    ).toBeGreaterThanOrEqual(10);
  });

  it('BusinessOperationsEmptyState wrapper exists', () => {
    expect(
      existsSync(join(WEB_ROOT, 'components/business-operations/BusinessOperationsEmptyState.tsx'))
    ).toBe(true);
  });

  it('v-* design tokens dominate legacy gray-* in BO module trees', () => {
    let vTokenHits = 0;
    let grayHits = 0;
    for (const file of sources) {
      const source = readFileSync(file, 'utf8');
      vTokenHits += (source.match(/text-v-text-|bg-v-|border-v-/g) ?? []).length;
      grayHits += (source.match(/gray-/g) ?? []).length;
    }
    expect(vTokenHits).toBeGreaterThan(grayHits * 3);
  });

  it('BO-1B audit artifacts exist', () => {
    const docs = [
      'docs/business-operations/BO_1B_UX_SHELL_AUDIT.md',
      'docs/business-operations/BO_1B_UX_STANDARDIZATION_MATRIX.md',
      'docs/business-operations/BO_1B_IMPLEMENTATION_REPORT.md',
      'docs/business-operations/BO_1B_G9_EVALUATION.md',
      'docs/business-operations/BO_1B_EXECUTIVE_SUMMARY.md',
    ];
    for (const rel of docs) {
      expect(existsSync(join(REPO_ROOT, rel))).toBe(true);
    }
  });
});
