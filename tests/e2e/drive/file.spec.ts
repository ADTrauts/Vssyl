import { test, expect, request } from '@playwright/test';
import { registerUser, loginUser, getAuthContext, baseURL } from './setup';

const owner = { email: 'owner@example.com', password: 'Password123!' };
const shared = { email: 'shared@example.com', password: 'Password123!' };

let ownerToken: string;
let sharedToken: string;
let ownerApi: any;
let sharedApi: any;
let fileId: string;

test.describe('Drive API - File Endpoints', () => {
  test.beforeAll(async () => {
    const api = await request.newContext({ baseURL });
    await registerUser(api, owner.email, owner.password);
    await registerUser(api, shared.email, shared.password);
    ownerToken = await loginUser(api, owner.email, owner.password);
    sharedToken = await loginUser(api, shared.email, shared.password);
    ownerApi = await getAuthContext(baseURL, ownerToken);
    sharedApi = await getAuthContext(baseURL, sharedToken);
  });

  test('should create a file (metadata only)', async () => {
    const res = await ownerApi.post('/files', { data: { name: 'Test.txt', type: 'text/plain', size: 10 } });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.file.name).toBe('Test.txt');
    fileId = data.file.id;
  });

  test('should list files', async () => {
    const res = await ownerApi.get('/files');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.files)).toBeTruthy();
  });

  test('should update a file', async () => {
    const res = await ownerApi.put(`/files/${fileId}`, { data: { name: 'Updated.txt' } });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.file.name).toBe('Updated.txt');
  });

  test('should delete a file', async () => {
    const res = await ownerApi.delete(`/files/${fileId}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.deleted).toBe(true);
  });

  test('should move a file to a different folder', async () => {
    // First create a folder to move the file to
    const folderRes = await ownerApi.post('/folders', { data: { name: 'Test Folder' } });
    expect(folderRes.ok()).toBeTruthy();
    const folderData = await folderRes.json();
    const folderId = folderData.folder.id;

    // Create a file to move
    const fileRes = await ownerApi.post('/files', { data: { name: 'File to Move.txt', type: 'text/plain', size: 10 } });
    expect(fileRes.ok()).toBeTruthy();
    const fileData = await fileRes.json();
    const fileToMoveId = fileData.file.id;

    // Move the file to the folder
    const moveRes = await ownerApi.post(`/files/${fileToMoveId}/move`, { data: { targetFolderId: folderId } });
    expect(moveRes.ok()).toBeTruthy();
    const moveData = await moveRes.json();
    expect(moveData.file.folderId).toBe(folderId);
    expect(moveData.message).toBe('File moved successfully');

    // Verify the file is now in the folder
    const listRes = await ownerApi.get(`/files?folderId=${folderId}`);
    expect(listRes.ok()).toBeTruthy();
    const listData = await listRes.json();
    expect(listData.files.some((f: any) => f.id === fileToMoveId)).toBeTruthy();
  });

  // TODO: Add upload and download tests when file upload endpoint is ready
}); 