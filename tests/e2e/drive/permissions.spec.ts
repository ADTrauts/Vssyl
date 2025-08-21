import { test, expect, request } from '@playwright/test';
import { registerUser, loginUser, getAuthContext, baseURL } from './setup';

const owner = { email: 'owner3@example.com', password: 'Password123!' };
const shared = { email: 'shared3@example.com', password: 'Password123!' };

let ownerToken: string;
let sharedToken: string;
let ownerApi: any;
let sharedApi: any;
let fileId: string;

// This test assumes the file endpoints work and a file can be created by the owner

test.describe('Drive API - Permissions Endpoints', () => {
  test.beforeAll(async () => {
    const api = await request.newContext({ baseURL });
    await registerUser(api, owner.email, owner.password);
    await registerUser(api, shared.email, shared.password);
    ownerToken = await loginUser(api, owner.email, owner.password);
    sharedToken = await loginUser(api, shared.email, shared.password);
    ownerApi = await getAuthContext(baseURL, ownerToken);
    sharedApi = await getAuthContext(baseURL, sharedToken);
    // Create a file as owner
    const res = await ownerApi.post('/files', { data: { name: 'PermTest.txt', type: 'text/plain', size: 10 } });
    const data = await res.json();
    fileId = data.file.id;
  });

  test('owner can grant permission to shared user', async () => {
    const res = await ownerApi.post(`/files/${fileId}/permissions`, { data: { userId: 'shared3@example.com', canRead: true, canWrite: false } });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.permission.canRead).toBe(true);
  });

  test('owner can update permission', async () => {
    const res = await ownerApi.put(`/files/${fileId}/permissions/shared3@example.com`, { data: { canRead: true, canWrite: true } });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.updated || data.permission.canWrite).toBe(true);
  });

  test('owner can list permissions', async () => {
    const res = await ownerApi.get(`/files/${fileId}/permissions`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.permissions)).toBeTruthy();
  });

  test('owner can revoke permission', async () => {
    const res = await ownerApi.delete(`/files/${fileId}/permissions/shared3@example.com`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.revoked).toBe(true);
  });

  // TODO: Add tests for permission enforcement (shared user access, forbidden cases)
}); 