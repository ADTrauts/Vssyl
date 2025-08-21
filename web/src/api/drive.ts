// Define types locally to avoid import issues
export type File = {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  url: string;
  starred: boolean;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Folder = {
  id: string;
  name: string;
  starred: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  type: 'create' | 'edit' | 'delete' | 'share' | 'download';
  user: {
    id: string;
    name: string;
    email: string;
  };
  file: File;
  timestamp: string;
  details?: {
    sharedWith?: string;
    permission?: 'view' | 'edit';
    action?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    originalName?: string;
    newName?: string;
    originalFolderId?: string;
    newFolderId?: string;
  };
};

// Drive API utility

// Helper to add Authorization header
function authHeaders(token: string, headers: Record<string, string> = {}) {
  return { ...headers, Authorization: `Bearer ${token}` };
}

export async function listFiles(token: string, folderId?: string, starred?: boolean) {
  const params = new URLSearchParams();
  if (folderId) params.append('folderId', folderId);
  if (starred !== undefined) params.append('starred', starred.toString());
  
  const url = `/api/drive/files${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch files');
  const data = await res.json();
  return data.files;
}

export async function listFolders(token: string, parentId?: string, starred?: boolean) {
  const params = new URLSearchParams();
  if (parentId) params.append('parentId', parentId);
  if (starred !== undefined) params.append('starred', starred.toString());
  
  const url = `/api/drive/folders${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch folders');
  const data = await res.json();
  return data.folders;
}

export async function uploadFile(token: string, file: globalThis.File, folderId?: string, isChatFile?: boolean): Promise<File> {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folderId', folderId);
  if (isChatFile) formData.append('isChatFile', 'true');
  const res = await fetch('/api/drive/files', {
    method: 'POST',
    body: formData,
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to upload file');
  const data = await res.json();
  return data.file;
}

export async function renameFile(token: string, id: string, name: string) {
  const res = await fetch(`/api/drive/files/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to rename file');
  const data = await res.json();
  return data.file;
}

export async function deleteFile(token: string, id: string) {
  const res = await fetch(`/api/drive/files/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete file');
  return true;
}

export async function createFolder(token: string, name: string, parentId?: string) {
  const res = await fetch('/api/drive/folders', {
    method: 'POST',
    body: JSON.stringify({ name, parentId }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to create folder');
  const data = await res.json();
  return data.folder;
}

export const downloadFile = async (token: string, fileId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/drive/files/${fileId}/download`, {
      method: 'GET',
      headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'download';

    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const shareItem = async (token: string, itemId: string, email: string, permission: 'view' | 'edit'): Promise<void> => {
  const response = await fetch(`/api/drive/items/${itemId}/share`, {
    method: 'POST',
    body: JSON.stringify({ email, permission }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });

  if (!response.ok) {
    throw new Error('Failed to share item');
  }
};

export const getShareLink = async (token: string, itemId: string): Promise<string> => {
  const response = await fetch(`/api/drive/items/${itemId}/share-link`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });

  if (!response.ok) {
    throw new Error('Failed to get share link');
  }

  const data = await response.json();
  return data.link;
};

export const getItemActivity = async (token: string, itemId: string): Promise<Activity[]> => {
  const response = await fetch(`/api/drive/items/${itemId}/activity`, {
    method: 'GET',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch activity');
  }

  const data = await response.json();
  return data.activities;
};

export async function getRecentActivity(token: string): Promise<Activity[]> {
  const response = await fetch('/api/drive/folders/activity/recent', {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recent activity');
  }

  const data = await response.json();
  return data.activities;
}

export async function toggleFileStarred(token: string, fileId: string): Promise<File> {
  const response = await fetch(`/api/drive/files/${fileId}/star`, {
    method: 'PUT',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Failed to toggle star on file');
  }
  return response.json();
}

export async function toggleFolderStarred(token: string, folderId: string): Promise<Folder> {
  const response = await fetch(`/api/drive/folders/${folderId}/star`, {
    method: 'PUT',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Failed to toggle star on folder');
  }
  return response.json();
}

// List trashed files
export async function listTrashedFiles(token: string) {
  const res = await fetch('/api/drive/files/trashed', { headers: authHeaders(token) });
  
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('You do not have permission to access trashed files');
    }
    if (res.status === 401) {
      throw new Error('Please log in to access trashed files');
    }
    throw new Error('Failed to fetch trashed files');
  }
  
  const data = await res.json();
  return data.files;
}

// Restore a trashed file
export async function restoreFile(token: string, id: string) {
  const res = await fetch(`/api/drive/files/${id}/restore`, { 
    method: 'POST', 
    headers: authHeaders(token) 
  });
  
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('You do not have permission to restore this file');
    }
    throw new Error('Failed to restore file');
  }
  
  return true;
}

// Permanently delete a trashed file
export async function hardDeleteFile(token: string, id: string) {
  const res = await fetch(`/api/drive/files/${id}/hard-delete`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('You do not have permission to permanently delete this file');
    }
    throw new Error('Failed to permanently delete file');
  }

  return true;
}

// List trashed folders
export async function listTrashedFolders(token: string) {
  const res = await fetch('/api/drive/folders/trashed', { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch trashed folders');
  const data = await res.json();
  return data.folders;
}

// Restore a trashed folder
export async function restoreFolder(token: string, id: string) {
  const res = await fetch(`/api/drive/folders/${id}/restore`, { method: 'POST', headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to restore folder');
  return true;
}

// Permanently delete a trashed folder
export async function hardDeleteFolder(token: string, id: string) {
  const res = await fetch(`/api/drive/folders/${id}/hard`, { method: 'DELETE', headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to permanently delete folder');
  return true;
}

export async function moveFile(token: string, fileId: string, targetFolderId: string): Promise<void> {
  const response = await fetch(`/api/drive/files/${fileId}/move`, {
    method: 'POST',
    body: JSON.stringify({ targetFolderId }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });

  if (!response.ok) {
    throw new Error('Failed to move file');
  }

  const data = await response.json();
  return data;
}

export async function moveFolder(token: string, folderId: string, targetParentId: string): Promise<void> {
  const response = await fetch(`/api/drive/folders/${folderId}/move`, {
    method: 'POST',
    body: JSON.stringify({ targetParentId }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });

  if (!response.ok) {
    throw new Error('Failed to move folder');
  }

  const data = await response.json();
  return data;
}

// List all permissions for a file
export async function listFilePermissions(token: string, fileId: string) {
  const res = await fetch(`/api/drive/files/${fileId}/permissions`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to list file permissions');
  const data = await res.json();
  return data.permissions;
}

// Grant permission to a user for a file
export async function grantFilePermission(token: string, fileId: string, userId: string, canRead: boolean, canWrite: boolean) {
  const res = await fetch(`/api/drive/files/${fileId}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ userId, canRead, canWrite }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to grant file permission');
  return await res.json();
}

// Update a user's permission for a file
export async function updateFilePermission(token: string, fileId: string, userId: string, canRead: boolean, canWrite: boolean) {
  const res = await fetch(`/api/drive/files/${fileId}/permissions/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ canRead, canWrite }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to update file permission');
  return await res.json();
}

// Revoke a user's permission for a file
export async function revokeFilePermission(token: string, fileId: string, userId: string) {
  const res = await fetch(`/api/drive/files/${fileId}/permissions/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to revoke file permission');
  return await res.json();
}

export async function deleteFolder(token: string, id: string) {
  const res = await fetch(`/api/drive/folders/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete folder');
  return true;
}

export async function renameFolder(token: string, id: string, name: string) {
  const res = await fetch(`/api/drive/folders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to rename folder');
  const data = await res.json();
  return data.folder;
}

export async function getSharedItems(token: string): Promise<{ files: File[], folders: Folder[] }> {
  const response = await fetch('/api/drive/shared', {
    method: 'GET',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shared items');
  }

  const data = await response.json();
  return data;
}

export async function reorderFiles(token: string, folderId: string, fileIds: string[]): Promise<void> {
  const response = await fetch(`/api/drive/files/reorder/${folderId}`, {
    method: 'POST',
    body: JSON.stringify({ fileIds }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });

  if (!response.ok) {
    throw new Error('Failed to reorder files');
  }

  const data = await response.json();
  return data;
}

export async function reorderFolders(token: string, parentId: string, folderIds: string[]): Promise<void> {
  const response = await fetch(`/api/drive/folders/reorder/${parentId}`, {
    method: 'POST',
    body: JSON.stringify({ folderIds }),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });

  if (!response.ok) {
    throw new Error('Failed to reorder folders');
  }

  const data = await response.json();
  return data;
}