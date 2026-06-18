import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SERVER_ROOT = join(process.cwd(), 'src');
const BUSINESS_CONTROLLER = join(SERVER_ROOT, 'controllers/businessController.ts');
const ORG_CHART_ROUTES = join(SERVER_ROOT, 'routes/org-chart.ts');
const BUSINESS_SERVICES_DIR = join(SERVER_ROOT, 'services/business');
const BUSINESS_ACTIVITY = join(BUSINESS_SERVICES_DIR, 'businessActivityService.ts');
const ORG_CHART_ACTIVITY = join(BUSINESS_SERVICES_DIR, 'orgChartActivityService.ts');

describe('Business Administration service boundary contract (BA-1D)', () => {
  const controllerSource = readFileSync(BUSINESS_CONTROLLER, 'utf8');
  const orgChartRoutesSource = readFileSync(ORG_CHART_ROUTES, 'utf8');
  const businessActivitySource = readFileSync(BUSINESS_ACTIVITY, 'utf8');
  const orgChartActivitySource = readFileSync(ORG_CHART_ACTIVITY, 'utf8');

  it('businessController has zero direct prisma calls', () => {
    expect(controllerSource).not.toMatch(/\bprisma\./);
  });

  it('businessController does not emit module activity directly', () => {
    expect(controllerSource).not.toContain('emitModuleActivityEvent');
  });

  it('businessController delegates persistence to business services', () => {
    expect(controllerSource).toContain('businessProfileService');
    expect(controllerSource).toContain('businessMemberService');
    expect(controllerSource).toContain('businessBrandingService');
    expect(controllerSource).toContain('businessAnalyticsService');
    expect(controllerSource).toContain('businessSocialService');
  });

  it('org-chart routes delegate mutations to domain services', () => {
    expect(orgChartRoutesSource).toContain("import orgChartService from '../services/orgChartService'");
    expect(orgChartRoutesSource).toContain("import permissionService from '../services/permissionService'");
    expect(orgChartRoutesSource).toContain(
      "import employeeManagementService"
    );
    expect(orgChartRoutesSource).toMatch(/orgChartService\.createOrganizationalTier/);
    expect(orgChartRoutesSource).toMatch(/permissionService\.createPermissionSet/);
    expect(orgChartRoutesSource).toMatch(/employeeManagementService\.assignEmployeeToPosition/);
  });

  it('org-chart routes wire PE dual after legacy middleware', () => {
    expect(orgChartRoutesSource).toContain('checkOrgChartPolicy');
    expect(orgChartRoutesSource).toContain('ORGCHART_TIER_WRITE');
    expect(orgChartRoutesSource).toContain('ORGCHART_EMPLOYEE_ASSIGN');
  });

  it('activity services own emitModuleActivityEvent for BA writes', () => {
    expect(businessActivitySource).toContain('emitModuleActivityEvent');
    expect(orgChartActivitySource).toContain('emitModuleActivityEvent');
    expect(controllerSource).not.toContain('recordBusinessUpdated');
    expect(controllerSource).not.toContain('recordOrgChartTierCreated');
  });

  it('activity services broadcast business:config:updated via realtime helper', () => {
    expect(businessActivitySource).toContain('broadcastBusinessConfigUpdated');
    expect(orgChartActivitySource).toContain('broadcastBusinessConfigUpdated');
  });

  it('extracted business domain services exist', () => {
    const files = readdirSync(BUSINESS_SERVICES_DIR);
    const expected = [
      'businessProfileService.ts',
      'businessMemberService.ts',
      'businessBrandingService.ts',
      'businessConfigurationService.ts',
      'businessBootstrapService.ts',
      'businessAnalyticsService.ts',
      'businessSocialService.ts',
      'businessActivityService.ts',
      'orgChartActivityService.ts',
      'businessConfigRealtimeService.ts',
    ];
    for (const name of expected) {
      expect(files, `missing ${name}`).toContain(name);
    }
  });

  it('business services contain prisma persistence (not controller)', () => {
    const profileSource = readFileSync(join(BUSINESS_SERVICES_DIR, 'businessProfileService.ts'), 'utf8');
    const memberSource = readFileSync(join(BUSINESS_SERVICES_DIR, 'businessMemberService.ts'), 'utf8');
    expect(profileSource).toMatch(/\bprisma\./);
    expect(memberSource).toMatch(/\bprisma\./);
  });
});
