import { request, APIRequestContext } from '@playwright/test';

export const baseURL = 'http://localhost:5000/api';

export async function registerUser(api: APIRequestContext, email: string, password: string) {
  const res = await api.post('/auth/register', {
    data: { email, password, name: email.split('@')[0] },
  });
  return res.ok();
}

export async function loginUser(api: APIRequestContext, email: string, password: string) {
  const res = await api.post('/auth/login', {
    data: { email, password },
  });
  if (!res.ok()) throw new Error('Login failed');
  const { token } = await res.json();
  return token;
}

export async function getAuthContext(baseURL: string, token: string) {
  return await request.newContext({ baseURL, extraHTTPHeaders: { Authorization: `Bearer ${token}` } });
} 