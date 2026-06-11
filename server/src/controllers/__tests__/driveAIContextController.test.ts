import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('driveAIContextController (Wave 1C thin controller)', () => {
  const controllerSource = readFileSync(
    join(process.cwd(), 'src/controllers/driveAIContextController.ts'),
    'utf8'
  );

  it('does not import prisma directly', () => {
    expect(controllerSource).not.toMatch(/from ['"]\.\.\/lib\/prisma['"]/);
    expect(controllerSource).not.toMatch(/prisma\./);
  });

  it('delegates to driveAIContextService', () => {
    expect(controllerSource).toMatch(/driveAIContextService/);
    expect(controllerSource).toMatch(/buildRecentFilesAIContext/);
    expect(controllerSource).toMatch(/buildStorageStatsAIContext/);
  });
});
