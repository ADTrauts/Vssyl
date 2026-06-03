import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('notebookWorkspace API', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/api/notebookWorkspace.ts'), 'utf8');

  it('fetches workspace context endpoint', () => {
    expect(source).toMatch(/\/api\/notebook\/workspace\/context/);
  });
});
