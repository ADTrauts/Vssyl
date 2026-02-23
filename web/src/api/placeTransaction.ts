function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export interface PlaceTransactionData {
  id: string;
  userId: string;
  businessId: string;
  type: 'PURCHASE' | 'EXTERNAL_CLICK' | 'RESERVATION';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  amount: number | null;
  currency: string;
  vssylFee: number | null;
  description: string | null;
  externalService: string | null;
  externalUrl: string | null;
  isPrivate: boolean;
  completedAt: string | null;
  createdAt: string;
  business: { id: string; name: string; logo: string | null };
}

export interface TransactionSummary {
  totalTransactions: number;
  totalSpent: number;
  purchaseCount: number;
  externalClickCount: number;
  topBusinesses: { business: { id: string; name: string; logo?: string | null }; interactionCount: number }[];
}

export async function getTransactions(params: { limit?: number; offset?: number; type?: string; businessId?: string }, token: string): Promise<{ data: PlaceTransactionData[]; pagination: { total: number; limit: number; offset: number } }> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));
  if (params.type) qs.set('type', params.type);
  if (params.businessId) qs.set('businessId', params.businessId);
  const res = await fetch(`/api/place/transactions?${qs.toString()}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return await res.json();
}

export async function getTransactionSummary(token: string): Promise<TransactionSummary> {
  const res = await fetch('/api/place/transactions/summary', { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch summary');
  const data = await res.json();
  return data.data;
}

export async function updateTransactionPrivacy(transactionId: string, isPrivate: boolean, token: string): Promise<void> {
  const res = await fetch(`/api/place/transactions/${transactionId}/privacy`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ isPrivate }),
  });
  if (!res.ok) throw new Error('Failed to update privacy');
}

export async function trackClick(payload: { businessId: string; interactionLinkId?: string; externalService?: string; url: string }, token: string): Promise<void> {
  await fetch('/api/place/interactions/click', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
