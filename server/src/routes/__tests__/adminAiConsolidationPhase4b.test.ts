/**
 * Phase 4B — Admin AI Pipeline consolidation tests (server + static nav assertions).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildOperationsAuthContext,
  requireOperationsPermission,
  canAccessBusinessRecord,
  resolveOperationsRole,
} from '../../ai/operations/operationsRbac';

const ROOT = join(__dirname, '../../../..');

/** Map of Phase 4 operations paths → canonical Pipeline destinations. */
export const OPERATIONS_TO_PIPELINE_REDIRECTS: Record<string, string> = {
  '/admin-portal/ai/operations': '/admin-portal/ai-pipeline',
  '/admin-portal/ai/operations/executions': '/admin-portal/ai-pipeline/executions',
  '/admin-portal/ai/operations/evaluations': '/admin-portal/ai-pipeline/evaluations',
  '/admin-portal/ai/operations/corrections': '/admin-portal/ai-pipeline/corrections',
  '/admin-portal/ai/operations/regressions': '/admin-portal/ai-pipeline/regressions',
  '/admin-portal/ai/operations/metrics': '/admin-portal/ai-pipeline/metrics',
  '/admin-portal/ai/operations/replay': '/admin-portal/ai-pipeline/replay',
  '/admin-portal/ai/operations/system-health': '/admin-portal/ai-pipeline/system-health',
  '/admin-portal/ai/operations/settings': '/admin-portal/ai-pipeline/settings',
};

describe('Phase 4B navigation consolidation', () => {
  it('removes AI Operations Center from platformControllerNavigation', () => {
    const src = readFileSync(
      join(ROOT, 'web/src/config/platformControllerNavigation.ts'),
      'utf8'
    );
    expect(src).not.toMatch(/label: 'AI Operations Center'/);
    expect(src).not.toMatch(/path: '\/admin-portal\/ai\/operations'/);
    expect(src).toMatch(/id: 'ai-pipeline'/);
    expect(src).toMatch(/'ai-operations'/); // retained in REMOVED_NAV_IDS
    expect(src).toMatch(/\/ai\/operations.*ai-pipeline/);
  });

  it('defines PipelineOperatorSubNav under ai-pipeline with canonical overview', () => {
    const src = readFileSync(
      join(ROOT, 'web/src/components/admin-portal/ai-pipeline/PipelineOperatorSubNav.tsx'),
      'utf8'
    );
    expect(src).toMatch(/href: '\/admin-portal\/ai-pipeline'/);
    expect(src).toMatch(/label: 'Executions'/);
    expect(src).toMatch(/label: 'Evaluations'/);
    expect(src).not.toMatch(/\/ai\/operations/);
  });

  it('documents complete operations→pipeline redirect matrix', () => {
    expect(Object.keys(OPERATIONS_TO_PIPELINE_REDIRECTS).length).toBeGreaterThanOrEqual(9);
    for (const [from, to] of Object.entries(OPERATIONS_TO_PIPELINE_REDIRECTS)) {
      expect(from.startsWith('/admin-portal/ai/operations')).toBe(true);
      expect(to.startsWith('/admin-portal/ai-pipeline')).toBe(true);
    }
  });

  it('operations route pages redirect (server components)', () => {
    const overview = readFileSync(
      join(ROOT, 'web/src/app/admin-portal/ai/operations/page.tsx'),
      'utf8'
    );
    expect(overview).toMatch(/redirect\('\/admin-portal\/ai-pipeline'\)/);
    const exec = readFileSync(
      join(ROOT, 'web/src/app/admin-portal/ai/operations/executions/page.tsx'),
      'utf8'
    );
    expect(exec).toMatch(/redirect\('\/admin-portal\/ai-pipeline\/executions'\)/);
    const detail = readFileSync(
      join(ROOT, 'web/src/app/admin-portal/ai/operations/executions/[id]/page.tsx'),
      'utf8'
    );
    expect(detail).toMatch(/ai-pipeline\/executions/);
  });

  it('pipeline executions page exists as canonical shell', () => {
    const page = readFileSync(
      join(ROOT, 'web/src/app/admin-portal/ai-pipeline/executions/page.tsx'),
      'utf8'
    );
    expect(page).toMatch(/PipelineSubpageShell/);
    expect(page).toMatch(/ExecutionExplorerTable/);
  });
});

describe('Phase 4B RBAC consolidation', () => {
  it('denies non-ADMIN even with business role headers', () => {
    const ctx = buildOperationsAuthContext({
      user: { id: 'u1', role: 'USER' },
      headers: {
        'x-ai-operations-business-role': 'BUSINESS_ADMIN',
        'x-ai-operations-business-id': 'biz-1',
      },
    } as never);
    expect(ctx.businessId).toBeUndefined();
    expect(requireOperationsPermission(ctx, 'operations:read').ok).toBe(false);
  });

  it('does not trust business scope header for record access grant', () => {
    const ctx = buildOperationsAuthContext({
      user: { id: 'u1', role: 'USER' },
      headers: { 'x-ai-operations-business-id': 'biz-1' },
    } as never);
    expect(canAccessBusinessRecord(ctx, 'biz-1')).toBe(false);
  });

  it('allows platform ADMIN full operator permissions', () => {
    const ctx = buildOperationsAuthContext({
      user: { id: 'a1', role: 'ADMIN' },
      headers: {},
    } as never);
    expect(resolveOperationsRole({ user: { id: 'a1', role: 'ADMIN' }, headers: {} } as never)).toBe(
      'PLATFORM_ADMIN'
    );
    expect(requireOperationsPermission(ctx, 'evaluations:write').ok).toBe(true);
    expect(requireOperationsPermission(ctx, 'replay:prepare').ok).toBe(true);
  });
});
