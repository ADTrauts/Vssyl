import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('autonomous route retirement (Wave 1B)', () => {
  it('does not invoke AutonomousActionExecutor on write paths', () => {
    const source = readFileSync(join(process.cwd(), 'src/routes/ai/autonomous.ts'), 'utf8');
    expect(source).not.toMatch(/AutonomousActionExecutor/);
    expect(source).not.toMatch(/executeAutonomousAction/);
    expect(source).toMatch(/410/);
    expect(source).toMatch(/POST \/api\/ai\/twin/);
  });

  it('preserves read-only history for audit visibility', () => {
    const source = readFileSync(join(process.cwd(), 'src/routes/ai/autonomous.ts'), 'utf8');
    expect(source).toMatch(/router\.get\('\/history'/);
    expect(source).toMatch(/read-only audit visibility/i);
  });
});
