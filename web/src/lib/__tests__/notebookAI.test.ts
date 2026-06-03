import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('notebookAI API client', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/api/notebookAI.ts'),
    'utf8'
  );

  it('calls notebook page AI routes under /api/notebook', () => {
    expect(source).toMatch(/\/api\/notebook\/pages\/\$\{pageId\}\/ai\/summary/);
    expect(source).toMatch(/action-items\/confirm/);
    expect(source).toMatch(/meeting-recap/);
    expect(source).toMatch(/suggest-links/);
  });
});
