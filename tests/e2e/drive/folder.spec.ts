import { test, expect, request } from '@playwright/test';
import { registerUser, loginUser, getAuthContext, baseURL } from './setup';

const owner = { email: 'owner2@example.com', password: 'Password123!' };

let ownerToken: string;
let ownerApi: any;
let folderId: string;

test.describe('Drive API - Folder Endpoints', () => {
  test.beforeAll(async () => {
    const api = await request.newContext({ baseURL });
    await registerUser(api, owner.email, owner.password);
    ownerToken = await loginUser(api, owner.email, owner.password);
    ownerApi = await getAuthContext(baseURL, ownerToken);
  });

  test('should create a folder', async () => {
    const res = await ownerApi.post('/folders', { data: { name: 'Test Folder' } });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.folder.name).toBe('Test Folder');
    folderId = data.folder.id;
  });

  test('should list folders', async () => {
    const res = await ownerApi.get('/folders');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.folders)).toBeTruthy();
  });

  test('should update a folder', async () => {
    const res = await ownerApi.put(`/folders/${folderId}`, { data: { name: 'Updated Folder' } });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.folder.name).toBe('Updated Folder');
  });

  test('should delete a folder', async () => {
    const res = await ownerApi.delete(`/folders/${folderId}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.deleted).toBe(true);
  });

  test('should move a folder to a different parent folder', async () => {
    // First create a parent folder
    const parentRes = await ownerApi.post('/folders', { data: { name: 'Parent Folder' } });
    expect(parentRes.ok()).toBeTruthy();
    const parentData = await parentRes.json();
    const parentId = parentData.folder.id;

    // Create a folder to move
    const folderRes = await ownerApi.post('/folders', { data: { name: 'Folder to Move' } });
    expect(folderRes.ok()).toBeTruthy();
    const folderData = await folderRes.json();
    const folderToMoveId = folderData.folder.id;

    // Move the folder to the parent
    const moveRes = await ownerApi.post(`/folders/${folderToMoveId}/move`, { data: { targetParentId: parentId } });
    expect(moveRes.ok()).toBeTruthy();
    const moveData = await moveRes.json();
    expect(moveData.folder.parentId).toBe(parentId);
    expect(moveData.message).toBe('Folder moved successfully');

    // Verify the folder is now in the parent
    const listRes = await ownerApi.get(`/folders?parentId=${parentId}`);
    expect(listRes.ok()).toBeTruthy();
    const listData = await listRes.json();
    expect(listData.folders.some((f: any) => f.id === folderToMoveId)).toBeTruthy();
  });

  test('should prevent moving a folder into itself', async () => {
    // Create a folder
    const folderRes = await ownerApi.post('/folders', { data: { name: 'Test Folder' } });
    expect(folderRes.ok()).toBeTruthy();
    const folderData = await folderRes.json();
    const folderId = folderData.folder.id;

    // Try to move the folder into itself
    const moveRes = await ownerApi.post(`/folders/${folderId}/move`, { data: { targetParentId: folderId } });
    expect(moveRes.ok()).toBeFalsy();
    expect(moveRes.status()).toBe(400);
  });
}); 