import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/placeController.ts');

function extractCoreHandlersSection(source: string): string {
  const start = source.indexOf('/* <place-core-graph-handlers> */');
  const end = source.indexOf('/* </place-core-graph-handlers> */');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('place-core-graph-handlers markers missing from placeController.ts');
  }
  return source.slice(start, end);
}

describe('placeController contract (Phase 1B)', () => {
  const source = readFileSync(controllerPath, 'utf8');
  const core = extractCoreHandlersSection(source);

  it('core handlers delegate to placeService', () => {
    expect(core).toMatch(/placeService\.updatePlaceSettings/);
    expect(core).toMatch(/placeService\.addNode/);
    expect(core).toMatch(/placeService\.updateNode/);
    expect(core).toMatch(/placeService\.removeNode/);
    expect(core).toMatch(/placeService\.setInterests/);
    expect(core).toMatch(/placeService\.completeSetup/);
    expect(core).toMatch(/placeService\.getFollowVisibility/);
    expect(core).toMatch(/placeService\.updateFollowVisibility/);
    expect(core).toMatch(/respondPlaceServiceError/);
  });

  it('core handlers have no direct Prisma usage', () => {
    expect(core).not.toMatch(/\bprisma\./);
    expect(core).not.toMatch(/PrismaClient/);
  });

  it('core handlers have no direct realtime ownership', () => {
    expect(core).not.toMatch(/getChatSocketService/);
    expect(core).not.toMatch(/broadcastPlaceEvent/);
  });
});
