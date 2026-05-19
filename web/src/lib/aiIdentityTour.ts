/** localStorage key for first-visit AI Identity hub tour (v1). */
export const AI_IDENTITY_TOUR_STORAGE_KEY = 'vssyl_ai_identity_hub_tour_v1';

export function hasSeenAIIdentityTour(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(AI_IDENTITY_TOUR_STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

export function markAIIdentityTourSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AI_IDENTITY_TOUR_STORAGE_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}

export function clearAIIdentityTourSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AI_IDENTITY_TOUR_STORAGE_KEY);
  } catch {
    // ignore
  }
}
