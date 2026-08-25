/**
 * Explicit Places API (New) field masks — no wildcards in production.
 * Fields chosen for Text Search / Details first wave (recommendation + provenance).
 */

/** Text Search (New) — id, name, address, type, rating, Maps link, open status. */
export const GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.primaryType',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.businessStatus',
].join(',');

/** Place Details (New) — same core fields for follow-up enrichment. */
export const GOOGLE_PLACES_DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'primaryType',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'businessStatus',
].join(',');

export const GOOGLE_PLACES_DEFAULT_MAX_RESULTS = 5;
