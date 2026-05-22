'use client';

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface WebhookSubscriptionRow {
  id: string;
  businessId: string;
  url: string;
  eventTypes: string[];
  status: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listWebhookSubscriptions(token: string, businessId: string) {
  const res = await fetch(`/api/business/${businessId}/webhook-subscriptions`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'Failed to load webhook subscriptions');
  }
  return res.json() as Promise<{ subscriptions: WebhookSubscriptionRow[] }>;
}

export async function createWebhookSubscription(
  token: string,
  businessId: string,
  input: { url: string; eventTypes: string[]; description?: string }
) {
  const res = await fetch(`/api/business/${businessId}/webhook-subscriptions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'Failed to create webhook subscription');
  }
  return res.json() as Promise<{ subscription: WebhookSubscriptionRow; signingSecret: string }>;
}

export async function deleteWebhookSubscription(
  token: string,
  businessId: string,
  subscriptionId: string
) {
  const res = await fetch(
    `/api/business/${businessId}/webhook-subscriptions/${subscriptionId}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'Failed to delete webhook subscription');
  }
}

export async function testWebhookSubscription(
  token: string,
  businessId: string,
  subscriptionId: string
) {
  const res = await fetch(
    `/api/business/${businessId}/webhook-subscriptions/${subscriptionId}/test`,
    { method: 'POST', headers: authHeaders(token) }
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'Failed to send test webhook');
  }
  return res.json() as Promise<{ deliveryId: string }>;
}

export async function fetchSupportedWebhookEvents(token: string) {
  const res = await fetch('/api/business/supported-events', {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to load supported webhook events');
  return res.json() as Promise<{ eventTypes: string[] }>;
}
