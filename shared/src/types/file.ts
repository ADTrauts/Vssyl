// File API types

export interface File {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: FilePermission[];
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  children?: Folder[];
  files?: File[];
  createdAt: string;
  updatedAt: string;
}

export interface FilePermission {
  id: string;
  fileId: string;
  userId: string;
  canRead: boolean;
  canWrite: boolean;
  createdAt: string;
}

// Requests
export interface CreateFileRequest {
  name: string;
  type: string;
  size: number;
  folderId?: string;
}

export interface UpdateFileRequest {
  name?: string;
  folderId?: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string;
}

// Responses
export interface FileResponse {
  file: File;
}

export interface FilesResponse {
  files: File[];
}

export interface FolderResponse {
  folder: Folder;
}

export interface FoldersResponse {
  folders: Folder[];
} 