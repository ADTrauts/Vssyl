const API_BASE = '/api/user';

export async function getUserPreference(key: string, token: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/preferences/${key}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

export async function setUserPreference(key: string, value: string, token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/preferences/${key}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
  return res.ok;
} 