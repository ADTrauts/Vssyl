import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AI user-context routing (Wave 1B)', () => {
  it('mounts canonical user-context path in server index', () => {
    const indexSource = readFileSync(join(process.cwd(), 'src/index.ts'), 'utf8');
    expect(indexSource).toMatch(/\/api\/ai\/user-context/);
  });

  it('documents user-context router canonical mount', () => {
    const routerSource = readFileSync(join(process.cwd(), 'src/routes/ai-user-context.ts'), 'utf8');
    expect(routerSource).toMatch(/\/api\/ai\/user-context/);
  });

  it('rejects UUID module ids on twin context route', () => {
    const aiSource = readFileSync(join(process.cwd(), 'src/routes/ai.ts'), 'utf8');
    expect(aiSource).toMatch(/UUID_LIKE/);
    expect(aiSource).toMatch(/user-context\/:id/);
  });
});
