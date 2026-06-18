import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');

describe('admin portal centralized-ai retirement hygiene (0D-B + 0D-G)', () => {
  it('adminApiService has no centralized-ai fetch helpers', () => {
    const source = readFileSync(join(WEB_ROOT, 'lib/adminApiService.ts'), 'utf8');
    expect(source).not.toMatch(/\/api\/centralized-ai/);
    expect(source).not.toMatch(/getCentralizedAI/);
  });

  it('ai-learning page redirects to AI Pipeline', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-learning/page.tsx'), 'utf8');
    expect(source).toMatch(/redirect\(['"]\/admin-portal\/ai-pipeline['"]\)/);
    expect(source).not.toMatch(/\/api\/centralized-ai/);
  });

  it('middleware redirects /admin-portal/ai-learning to ai-pipeline', () => {
    const source = readFileSync(join(WEB_ROOT, 'middleware.ts'), 'utf8');
    expect(source).toMatch(/\/admin-portal\/ai-learning/);
    expect(source).toMatch(/\/admin-portal\/ai-pipeline/);
  });

  it('middleware redirects /admin-portal/ai-context to pipeline diagnostics', () => {
    const source = readFileSync(join(WEB_ROOT, 'middleware.ts'), 'utf8');
    expect(source).toMatch(/\/admin-portal\/ai-context/);
    expect(source).toMatch(/\/admin-portal\/ai-pipeline\/diagnostics/);
  });

  it('0D-G: server index mounts centralized-ai without legacy router', () => {
    const indexSource = readFileSync(join(REPO_ROOT, 'server/src/index.ts'), 'utf8');
    expect(indexSource).toMatch(/\/api\/centralized-ai/);
    expect(indexSource).toMatch(/centralizedAiDeprecatedMiddleware/);
    expect(indexSource).not.toMatch(/aiCentralizedRouter/);
    expect(existsSync(join(REPO_ROOT, 'server/src/routes/ai-centralized.ts'))).toBe(false);
  });

  it('no admin-portal page fetches centralized-ai except redirect stub', () => {
    function walk(dir: string): string[] {
      const entries = readdirSync(dir);
      const files: string[] = [];
      for (const entry of entries) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          files.push(...walk(full));
        } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
          files.push(full);
        }
      }
      return files;
    }

    const adminPortalDir = join(WEB_ROOT, 'app/admin-portal');
    const offenders: string[] = [];
    for (const file of walk(adminPortalDir)) {
      const content = readFileSync(file, 'utf8');
      if (content.includes('/api/centralized-ai') && !file.endsWith('ai-learning/page.tsx')) {
        offenders.push(file.replace(WEB_ROOT + '/', ''));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('ai-system launcher no longer links to ai-learning', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'), 'utf8');
    expect(source).not.toMatch(/\/admin-portal\/ai-learning/);
    expect(source).toMatch(/\/admin-portal\/ai-pipeline/);
  });
});
