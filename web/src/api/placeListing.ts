function authHeaders(token: string, headers: Record<string, string> = {}) {
  return { ...headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export interface InteractionLink {
  id: string;
  listingId: string;
  type: string;
  label: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PlaceListing {
  id: string;
  businessId: string;
  isEnabled: boolean;
  isPublished: boolean;
  displayName: string | null;
  shortDescription: string | null;
  coverImage: string | null;
  avatarImage: string | null;
  category: string;
  tags: string[];
  nodeColor: string | null;
  nodeShape: string | null;
  interactionLinks: InteractionLink[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaceListingWithBusiness extends PlaceListing {
  business: {
    id: string;
    name: string;
    logo: string | null;
    einVerified: boolean;
    industry: string | null;
    website?: string | null;
    description?: string | null;
  };
  followerCount?: number;
}

export interface PlaceCategory {
  value: string;
  label: string;
}

export async function getListing(businessId: string, token: string): Promise<PlaceListing | null> {
  const res = await fetch(`/api/place/listing/${businessId}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch listing');
  const data = await res.json();
  return data.data;
}

export async function upsertListing(businessId: string, payload: Record<string, unknown>, token: string): Promise<PlaceListing> {
  const res = await fetch(`/api/place/listing/${businessId}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.error || 'Failed to save listing';
    if (data.details && typeof data.details === 'object') {
      const first = Object.entries(data.details)[0] as [string, string[]] | undefined;
      if (first) msg += ` (${first[0]}: ${first[1]?.[0] || 'invalid'})`;
    }
    throw new Error(msg);
  }
  return data.data;
}

export async function addLink(businessId: string, link: { type: string; label: string; url: string; sortOrder?: number }, token: string): Promise<InteractionLink> {
  const res = await fetch(`/api/place/listing/${businessId}/links`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(link),
  });
  if (!res.ok) throw new Error('Failed to add link');
  const data = await res.json();
  return data.data;
}

export async function updateLink(businessId: string, linkId: string, payload: Record<string, unknown>, token: string): Promise<InteractionLink> {
  const res = await fetch(`/api/place/listing/${businessId}/links/${linkId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update link');
  const data = await res.json();
  return data.data;
}

export async function deleteLink(businessId: string, linkId: string, token: string): Promise<void> {
  const res = await fetch(`/api/place/listing/${businessId}/links/${linkId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete link');
}

export async function uploadCoverImage(businessId: string, file: File, token: string): Promise<{ coverImage: string }> {
  const formData = new FormData();
  formData.append('cover', file);
  const res = await fetch(`/api/place/listing/${businessId}/cover`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload cover image');
  }
  const data = await res.json();
  return data.data;
}

export async function deleteCoverImage(businessId: string, token: string): Promise<void> {
  const res = await fetch(`/api/place/listing/${businessId}/cover`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to remove cover image');
}

export async function uploadAvatarImage(businessId: string, file: File, token: string): Promise<{ avatarImage: string }> {
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await fetch(`/api/place/listing/${businessId}/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload avatar image');
  }
  const data = await res.json();
  return data.data;
}

export async function deleteAvatarImage(businessId: string, token: string): Promise<void> {
  const res = await fetch(`/api/place/listing/${businessId}/avatar`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to remove avatar image');
}

export async function explorePlaces(params: { category?: string; search?: string; limit?: number; offset?: number }, token: string): Promise<{ data: PlaceListingWithBusiness[]; pagination: { total: number; limit: number; offset: number } }> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.search) qs.set('search', params.search);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));
  const res = await fetch(`/api/place/explore?${qs.toString()}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to explore');
  return await res.json();
}

export async function getBusinessProfile(businessId: string, token: string): Promise<PlaceListingWithBusiness | null> {
  const res = await fetch(`/api/place/business/${businessId}/profile`, { headers: authHeaders(token) });
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) throw new Error('Failed to fetch profile');
  const data = await res.json();
  return data.data;
}

export async function getCategories(token: string): Promise<PlaceCategory[]> {
  const res = await fetch('/api/place/categories', { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch categories');
  const data = await res.json();
  return data.data;
}

// ============================================================================
// Discovery / Suggestions
// ============================================================================

export interface SuggestionItem {
  listing: PlaceListingWithBusiness;
  reason: string;
  score: number;
}

export async function getLocalSuggestions(token: string): Promise<{ data: SuggestionItem[]; location: { city: string; region: string; country: string } }> {
  const res = await fetch('/api/place/discover/local', { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch local suggestions');
  return await res.json();
}

export async function getForYouSuggestions(token: string): Promise<{ data: SuggestionItem[] }> {
  const res = await fetch('/api/place/discover/for-you', { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch suggestions');
  return await res.json();
}

export async function dismissSuggestion(businessId: string, reason: string, token: string): Promise<void> {
  const res = await fetch(`/api/place/discover/dismiss/${businessId}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to dismiss');
}
