function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export interface FeedItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string | null;
  businessId: string | null;
  targetUserId: string | null;
  meetingId: string | null;
  isPrivate: boolean;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

export interface PersonalAnalytics {
  network: {
    totalNodes: number;
    businessNodes: number;
    userConnections: number;
    interests: number;
    communitiesJoined: number;
    weeklyGrowth: number[];
  };
  spending: {
    totalSpent: number;
    purchaseCount: number;
    externalClicks: number;
    topCategories: { category: string; count: number }[];
  };
  engagement: {
    meetingsCreated: number;
    meetingsAttended: number;
    totalActivity: number;
  };
  topBusinesses: { businessId: string; name: string; category: string; interactions: number }[];
  period: string;
}

export interface CommunityData {
  id: string;
  name: string;
  description: string | null;
  type: 'AUTO_CLUSTER' | 'USER_CREATED';
  tags: string[];
  isPublic: boolean;
  creator: { id: string; name: string | null } | null;
  _count: { members: number };
  createdAt: string;
}

export async function getActivityFeed(params: { limit?: number; offset?: number; type?: string }, token: string): Promise<{ data: FeedItem[]; pagination: { total: number } }> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));
  if (params.type) qs.set('type', params.type);
  const res = await fetch(`/api/place/feed?${qs.toString()}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch feed');
  return await res.json();
}

export async function getPersonalAnalytics(period: string, token: string): Promise<PersonalAnalytics> {
  const res = await fetch(`/api/place/analytics?period=${period}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  const data = await res.json();
  return data.data;
}

export async function getCommunities(filter?: string, token?: string): Promise<CommunityData[]> {
  if (!token) throw new Error('Authentication required');
  const qs = filter ? `?filter=${filter}` : '';
  const res = await fetch(`/api/place/communities${qs}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch communities');
  const data = await res.json();
  return data.data;
}

export async function createCommunity(payload: { name: string; description?: string; tags?: string[]; isPublic?: boolean }, token: string): Promise<CommunityData> {
  const res = await fetch('/api/place/communities', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create community');
  const data = await res.json();
  return data.data;
}

export async function joinCommunity(communityId: string, token: string): Promise<void> {
  const res = await fetch(`/api/place/communities/${communityId}/join`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to join community');
}

export async function leaveCommunity(communityId: string, token: string): Promise<void> {
  const res = await fetch(`/api/place/communities/${communityId}/leave`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to leave community');
}

export async function exportPlaceData(token: string): Promise<Blob> {
  const res = await fetch('/api/place/export', { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to export data');
  return await res.blob();
}
