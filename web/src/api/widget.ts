import { Widget, CreateWidgetRequest, UpdateWidgetRequest, WidgetResponse } from '../../../shared/src/types/widget';

// Helper to add Authorization header
function authHeaders(token: string, headers: Record<string, string> = {}) {
  return { ...headers, Authorization: `Bearer ${token}` };
}

const API_BASE = '/api/widget';

export async function createWidget(token: string, dashboardId: string, input: CreateWidgetRequest): Promise<Widget> {
  const res = await fetch(`/api/widget/${dashboardId}/widgets`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create widget');
  const data: WidgetResponse = await res.json();
  return data.widget;
}

export async function updateWidget(token: string, id: string, input: UpdateWidgetRequest): Promise<Widget> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to update widget');
  const data: WidgetResponse = await res.json();
  return data.widget;
}

export async function deleteWidget(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete widget');
}
