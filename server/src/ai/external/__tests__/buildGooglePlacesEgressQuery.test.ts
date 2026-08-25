import { describe, expect, it } from 'vitest';
import { buildGooglePlacesEgressQuery } from '../buildGooglePlacesEgressQuery';

describe('buildGooglePlacesEgressQuery', () => {
  const buffalo = {
    country: 'United States',
    region: 'New York',
    city: 'Buffalo',
    countryCode: 'US',
    regionCode: 'NY',
  };

  it('explicit city wins over coarse IP location', () => {
    const outcome = buildGooglePlacesEgressQuery(
      'Find an Italian restaurant in Rochester.',
      buffalo
    );
    expect('needsClarification' in outcome).toBe(false);
    if ('needsClarification' in outcome) return;
    expect(outcome.locationSource).toBe('explicit');
    expect(outcome.egressQuery.toLowerCase()).toContain('rochester');
    expect(outcome.egressQuery.toLowerCase()).not.toContain('buffalo');
  });

  it('near me uses coarse city/region', () => {
    const outcome = buildGooglePlacesEgressQuery('Find me a good Italian restaurant near me.', buffalo);
    expect('needsClarification' in outcome).toBe(false);
    if ('needsClarification' in outcome) return;
    expect(outcome.locationSource).toBe('coarse');
    expect(outcome.egressQuery).toContain('Buffalo');
    expect(outcome.egressQuery).toContain('New York');
  });

  it('requires clarification when near me without location', () => {
    const outcome = buildGooglePlacesEgressQuery('coffee near me', null);
    expect(outcome).toEqual({ needsClarification: true, reason: 'location_required' });
  });

  it('does not include unrelated conversation in egress', () => {
    const outcome = buildGooglePlacesEgressQuery(
      'My lender quoted 6.5%. Also find coffee near me.',
      buffalo
    );
    expect('needsClarification' in outcome).toBe(false);
    if ('needsClarification' in outcome) return;
    expect(outcome.egressQuery.toLowerCase()).not.toContain('lender');
    expect(outcome.egressQuery.toLowerCase()).not.toContain('6.5');
  });
});
