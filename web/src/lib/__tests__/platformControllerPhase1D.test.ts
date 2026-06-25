import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  formatSubscriptionAmountDisplay,
  sumDisplayableSubscriptionAmounts,
} from '../subscriptionAmountDisplay';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');
const ADMIN_SERVICES_DIR = join(REPO_ROOT, 'server/src/services/admin');

describe('platformControllerPhase1D truth fixes', () => {
  describe('security metrics hygiene', () => {
    it('adminSecurityService does not use Math.random for operator metrics', () => {
      const source = readFileSync(
        join(ADMIN_SERVICES_DIR, 'adminSecurityService.ts'),
        'utf8',
      );
      expect(source).not.toMatch(/Math\.random/);
      expect(source).toContain('complianceScoreStatus');
      expect(source).toContain('requires_instrumentation');
    });

    it('module security metrics route is distinct from platform event metrics', () => {
      const source = readFileSync(
        join(REPO_ROOT, 'server/src/routes/adminSecurityRoutes.ts'),
        'utf8',
      );
      expect(source).toContain("'/module-metrics'");
    });
  });

  describe('billing amount display', () => {
    it('does not coerce unknown tier amounts to $0 in UI formatter', () => {
      expect(formatSubscriptionAmountDisplay(null, 'unknown')).toBe('Unavailable');
      expect(formatSubscriptionAmountDisplay(undefined, 'unknown', 'pro')).toBe('Unavailable');
    });

    it('shows Free for free tier', () => {
      expect(formatSubscriptionAmountDisplay(0, 'free', 'free')).toBe('Free');
    });

    it('billing route uses subscriptionDisplayAmount resolver', () => {
      const route = readFileSync(
        join(REPO_ROOT, 'server/src/routes/admin-portal/adminPortalRoutes.analyticsOps.ts'),
        'utf8',
      );
      expect(route).toContain('resolveTierSubscriptionAmount');
      expect(route).toContain('amountStatus');
      expect(route).not.toMatch(/typeof sub\.amount === 'number' \? sub\.amount : 0/);
    });

    it('billing page does not default unknown amounts to zero', () => {
      const page = readFileSync(join(WEB_ROOT, 'app/admin-portal/billing/page.tsx'), 'utf8');
      expect(page).toContain('formatSubscriptionAmountDisplay');
      expect(page).not.toMatch(/amount: sub\.amount \|\| 0/);
    });

    it('sumDisplayableSubscriptionAmounts flags unknown rows', () => {
      const result = sumDisplayableSubscriptionAmounts([
        { amount: 10, amountStatus: 'known' },
        { amount: null, amountStatus: 'unknown' },
      ]);
      expect(result).toEqual({ total: 10, hasUnknown: true });
    });
  });

  describe('platform programs honest copy', () => {
    it('health hook does not label kernel proxy as system health', () => {
      const hook = readFileSync(
        join(WEB_ROOT, 'components/admin-portal/usePlatformProgramsHubHealth.ts'),
        'utf8',
      );
      expect(hook).toContain('Infrastructure pressure');
      expect(hook).not.toMatch(/healthSummary: `System health/);
      expect(hook).toContain('Review queue');
      expect(hook).toContain('Registered sources');
      expect(hook).toContain('Pipeline quality');
    });

    it('program card uses operational signal labeling', () => {
      const card = readFileSync(
        join(WEB_ROOT, 'components/admin-portal/PlatformProgramCard.tsx'),
        'utf8',
      );
      expect(card).toContain('Within threshold');
      expect(card).toContain('Operational signal:');
      expect(card).not.toContain("return 'Healthy'");
    });
  });

  describe('Phase 1D documentation', () => {
    it('truth fixes doc exists', () => {
      expect(
        existsSync(
          join(REPO_ROOT, 'docs/platform-controller/PLATFORM_CONTROLLER_PHASE_1D_TRUTH_FIXES.md'),
        ),
      ).toBe(true);
    });
  });
});
