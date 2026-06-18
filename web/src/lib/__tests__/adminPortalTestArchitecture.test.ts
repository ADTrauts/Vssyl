import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '../../../..');
const SERVER_TESTS = join(REPO_ROOT, 'server/src/routes/__tests__');
const SERVER_SERVICE_TESTS = join(REPO_ROOT, 'server/src/services/__tests__');
const WEB_TESTS = join(REPO_ROOT, 'web/src/lib/__tests__');

const REQUIRED_SERVER_ROUTE_TESTS = [
  'admin-portal-route-architecture.test.ts',
  'admin-portal-domain-contracts.test.ts',
  'admin-portal-ai-pipeline-coverage.test.ts',
  'admin-portal-route-governance.test.ts',
  'admin-portal-impersonation.test.ts',
  'admin-portal-dangerous-migration-ops.test.ts',
  'admin-portal-security-events-route.test.ts',
  'admin-portal-billing-analytics-route.test.ts',
  'admin-portal-system-ops-performance-route.test.ts',
];

const REQUIRED_SERVER_SERVICE_TESTS = [
  'adminPortalServiceBoundary.contract.test.ts',
  'adminAuditTaxonomy.test.ts',
  'adminServiceFacade.test.ts',
  'adminImpersonationService.test.ts',
  'adminSystemOpsService.test.ts',
];

const REQUIRED_WEB_HYGIENE_TESTS = [
  'adminPortalAiPipelineConsolidation.test.ts',
  'adminPortalProviderGovernance.test.ts',
  'adminPortalDiagnosticsOwnership.test.ts',
  'adminPortalMockFallbackHygiene.test.ts',
  'adminPortalDebugGate.test.ts',
];

describe('admin portal test architecture manifest (1B-D / AP-F-027)', () => {
  it('required server route test files exist', () => {
    const files = readdirSync(SERVER_TESTS);
    for (const name of REQUIRED_SERVER_ROUTE_TESTS) {
      expect(files, `missing server route test ${name}`).toContain(name);
    }
  });

  it('required server service contract tests exist', () => {
    const files = readdirSync(SERVER_SERVICE_TESTS);
    for (const name of REQUIRED_SERVER_SERVICE_TESTS) {
      expect(files, `missing server service test ${name}`).toContain(name);
    }
  });

  it('required web hygiene tests exist', () => {
    const files = readdirSync(WEB_TESTS);
    for (const name of REQUIRED_WEB_HYGIENE_TESTS) {
      expect(files, `missing web hygiene test ${name}`).toContain(name);
    }
  });

  it('AI pipeline handler registry documents 45 handlers', () => {
    const registryPath = join(
      SERVER_TESTS,
      'fixtures/aiPipelineHandlerRegistry.ts',
    );
    expect(existsSync(registryPath)).toBe(true);
    const source = readFileSync(registryPath, 'utf8');
    const registryBlock =
      source.match(/export const AI_PIPELINE_HANDLER_REGISTRY[\s\S]*?\];/)?.[0] ?? '';
    const handlerCount = (registryBlock.match(/method: '(get|post|put|patch|delete)'/g) ?? [])
      .length;
    expect(handlerCount).toBe(45);
  });

  it('route architecture standard doc exists', () => {
    const doc = join(
      REPO_ROOT,
      'docs/architecture/audits/ADMIN_PORTAL_ROUTE_ARCHITECTURE_STANDARD.md',
    );
    expect(existsSync(doc)).toBe(true);
  });

  it('audit taxonomy doc exists for mutation audit assertions', () => {
    const doc = join(
      REPO_ROOT,
      'docs/architecture/audits/ADMIN_PORTAL_AUDIT_TAXONOMY.md',
    );
    expect(existsSync(doc)).toBe(true);
  });
});
