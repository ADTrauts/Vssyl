import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeTool } from '../toolExecutor';
import * as placeAIActionService from '../../../services/place/placeAIActionService';

const toolExecutorSource = readFileSync(
  join(process.cwd(), 'src/ai/tools/toolExecutor.ts'),
  'utf8'
);

describe('toolExecutor place tools (Wave 1F)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('place tools have no direct Prisma', () => {
    expect(toolExecutorSource).not.toMatch(/businessPlaceListing\.find/);
    expect(toolExecutorSource).toMatch(/placeAIActionService/);
  });

  it('search_places delegates to placeAIActionService', async () => {
    vi.spyOn(placeAIActionService, 'searchPlaces').mockResolvedValue({
      success: true,
      data: { query: 'pizza', results: [{ title: 'Pizza Co' }] },
    });

    const raw = await executeTool('search_places', { query: 'pizza' }, { userId: 'user-1' });
    const parsed = JSON.parse(raw) as { success: boolean; message: string };

    expect(parsed.success).toBe(true);
    expect(parsed.message).toMatch(/Found/i);
  });

  it('get_place_recommendations delegates to recommendPlaces', async () => {
    vi.spyOn(placeAIActionService, 'recommendPlaces').mockResolvedValue({
      success: true,
      data: { recommendations: [{ businessName: 'Cafe' }] },
    });

    const raw = await executeTool('get_place_recommendations', { limit: 3 }, { userId: 'user-1' });
    const parsed = JSON.parse(raw) as { success: boolean };

    expect(parsed.success).toBe(true);
  });

  it('get_place_purchase_help does not create transactions', async () => {
    vi.spyOn(placeAIActionService, 'purchaseHelp').mockResolvedValue({
      success: true,
      data: { found: true, recommendedLink: { url: 'https://example.com' } },
    });

    const raw = await executeTool(
      'get_place_purchase_help',
      { query: 'order food', businessId: 'biz-1' },
      { userId: 'user-1' }
    );
    const parsed = JSON.parse(raw) as { success: boolean; message: string };

    expect(parsed.success).toBe(true);
    expect(parsed.message).toMatch(/no transaction/i);
    expect(toolExecutorSource).not.toMatch(/placeTransaction\.create/);
  });
});
