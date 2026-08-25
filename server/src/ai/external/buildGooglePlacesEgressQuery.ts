/**
 * Build intentionally minimal Google Places Text Search queries.
 * Explicit user location wins over coarse IP geolocation.
 */

import type { LocationData } from '../../services/geolocationService';

const NEAR_ME =
  /\b(near me|nearby|in my area|around me|close by|close-by)\b/i;

const LOCAL_DISCOVERY_HINT =
  /\b(restaurant|coffee|hotel|shop|store|bar|cafe|plumber|gym|salon|pizza|italian|sushi|find|recommend)\b/i;

/** "in Rochester", "in Buffalo, NY", "in New York City" */
const EXPLICIT_IN_LOCATION =
  /\bin\s+([A-Za-z][A-Za-z\s,'.-]{1,60}?)(?:\?|\.|$|\s+(?:near|with|that|who|for|and)\b)/i;

export interface GooglePlacesEgressSuccess {
  egressQuery: string;
  locationSource: 'explicit' | 'coarse';
}

export interface GooglePlacesEgressNeedsClarification {
  needsClarification: true;
  reason: 'location_required';
}

export type GooglePlacesEgressOutcome = GooglePlacesEgressSuccess | GooglePlacesEgressNeedsClarification;

function stripNearMePhrases(text: string): string {
  return text
    .replace(/\b(find me|find|show me|recommend|suggest|good|great|best|a|an|the)\b/gi, ' ')
    .replace(NEAR_ME, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSubject(text: string): string {
  const cleaned = stripNearMePhrases(text);
  if (cleaned.length >= 3) return cleaned;
  return text.replace(NEAR_ME, '').replace(/\s+/g, ' ').trim();
}

export function buildGooglePlacesEgressQuery(
  userMessage: string,
  coarseLocation?: LocationData | null
): GooglePlacesEgressOutcome {
  let text = (userMessage || '').trim();
  if (!text) {
    return { needsClarification: true, reason: 'location_required' };
  }

  if (NEAR_ME.test(text)) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const localSentence =
      sentences.find((s) => NEAR_ME.test(s) || LOCAL_DISCOVERY_HINT.test(s)) ?? text;
    text = localSentence.trim();
  }

  const explicitMatch = text.match(EXPLICIT_IN_LOCATION);
  if (explicitMatch?.[1]) {
    const place = explicitMatch[1].trim().replace(/[,.]$/, '');
    const subject = normalizeSubject(text.replace(EXPLICIT_IN_LOCATION, ' '));
    const egressQuery =
      subject.length >= 3 ? `${subject} in ${place}` : `places in ${place}`;
    return { egressQuery, locationSource: 'explicit' };
  }

  if (NEAR_ME.test(text) || /\blocal\b/i.test(text)) {
    if (!coarseLocation?.city || coarseLocation.city === 'Unknown') {
      return { needsClarification: true, reason: 'location_required' };
    }
    const subject = normalizeSubject(text);
    const regionPart =
      coarseLocation.region && coarseLocation.region !== 'Unknown'
        ? `, ${coarseLocation.region}`
        : '';
    const locationLabel = `${coarseLocation.city}${regionPart}`;
    const egressQuery =
      subject.length >= 3 ? `${subject} in ${locationLabel}` : `places in ${locationLabel}`;
    return { egressQuery, locationSource: 'coarse' };
  }

  if (coarseLocation?.city && coarseLocation.city !== 'Unknown') {
    const subject = normalizeSubject(text);
    if (subject.length >= 3) {
      const regionPart =
        coarseLocation.region && coarseLocation.region !== 'Unknown'
          ? `, ${coarseLocation.region}`
          : '';
      return {
        egressQuery: `${subject} in ${coarseLocation.city}${regionPart}`,
        locationSource: 'coarse',
      };
    }
  }

  return { needsClarification: true, reason: 'location_required' };
}
