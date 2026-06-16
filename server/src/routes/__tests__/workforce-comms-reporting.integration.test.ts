import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('workforce comms reporting routes (Phase G)', () => {
  const routesSource = readFileSync(
    resolve(__dirname, '../../routes/workforceComms.ts'),
    'utf8'
  );

  it('registers admin reporting endpoints with policy engine', () => {
    expect(routesSource).toContain("'/admin/reports/summary'");
    expect(routesSource).toContain("'/admin/reports/communications'");
    expect(routesSource).toContain("'/admin/reports/campaigns'");
    expect(routesSource).toContain("'/admin/reports/acknowledgements'");
    expect(routesSource).toContain('POLICY_ACTIONS.WORKFORCE_REPORT_READ');
  });

  it('protects AI context routes with policy engine (F-WC-004)', () => {
    const overviewBlock = routesSource.slice(
      routesSource.indexOf("'/ai/context/overview'"),
      routesSource.indexOf("'/ai/context/reach'")
    );
    const reachBlock = routesSource.slice(routesSource.indexOf("'/ai/context/reach'"));

    expect(overviewBlock).toContain('checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ)');
    expect(reachBlock).toContain('checkWorkforceCommsPolicy(POLICY_ACTIONS.WORKFORCE_REPORT_READ)');
  });
});

describe('WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX post-implementation (F-WC-005)', () => {
  const matrixPath = resolve(
    __dirname,
    '../../../../docs/business-operations/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md'
  );
  const matrix = readFileSync(matrixPath, 'utf8');

  it('documents implemented module identity', () => {
    expect(matrix).toContain('workforce_comms');
    expect(matrix).toContain('Phase G');
    expect(matrix).not.toContain('NOT PRESENT — zero matches');
  });
});
