import { describe, expect, it } from 'vitest';
import { selectContextProvider } from '../moduleContextProviderSelection';

describe('moduleContextProviderSelection place', () => {
  const providers = [
    { name: 'place_overview', endpoint: '/api/place/ai/context/overview' },
    { name: 'place_connections', endpoint: '/api/place/ai/context/connections' },
    { name: 'place_discoveries', endpoint: '/api/place/ai/context/discoveries' },
    { name: 'place_activity', endpoint: '/api/place/ai/context/activity' },
  ];

  it('selects place_discoveries for discovery queries', () => {
    const picked = selectContextProvider('place', 'discover new restaurants nearby', providers);
    expect(picked?.name).toBe('place_discoveries');
    expect(picked?.endpoint).toMatch(/\/api\/place\/ai\/context\//);
  });

  it('selects place_connections for follow queries', () => {
    const picked = selectContextProvider('place', 'who am I following on place', providers);
    expect(picked?.name).toBe('place_connections');
  });

  it('defaults to place_overview backed by visibility HTTP routes', () => {
    const picked = selectContextProvider('place', 'show my main street', providers);
    expect(picked?.name).toBe('place_overview');
    expect(picked?.endpoint).toBe('/api/place/ai/context/overview');
  });
});
