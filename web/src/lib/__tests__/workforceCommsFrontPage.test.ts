import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/apiUtils', () => ({
  authenticatedApiCall: vi.fn(),
}));

import { authenticatedApiCall } from '@/lib/apiUtils';
import { listFrontPageCommunications } from '@/api/workforceComms';

describe('workforceComms front page cutover API', () => {
  it('listFrontPageCommunications calls public front-page endpoint with businessId', async () => {
    vi.mocked(authenticatedApiCall).mockResolvedValue({
      communications: [
        {
          id: 'comm-1',
          title: 'Q3 Update',
          showOnFrontPage: true,
          status: 'PUBLISHED',
        },
      ],
    });

    const result = await listFrontPageCommunications('biz-1', 10);

    expect(authenticatedApiCall).toHaveBeenCalledWith(
      '/api/workforce-comms/public/front-page?businessId=biz-1&limit=10'
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Q3 Update');
  });
});
