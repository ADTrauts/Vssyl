// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Module Types
export interface Module {
  id: string;
  name: string;
  version: string;
  description: string;
  isFree: boolean;
  price?: number;
  permissions: string[];
  dependencies: Record<string, string>;
  code: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  developerId: string;
  submittedAt: string;
  lastUpdated: string;
}

// File Types
export interface File {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  ownerId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Folder Types
export interface Folder {
  id: string;
  name: string;
  ownerId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Share Types
export interface Share {
  id: string;
  resourceId: string;
  resourceType: 'FILE' | 'FOLDER';
  permission: 'READ' | 'WRITE' | 'ADMIN';
  sharedById: string;
  sharedWithId?: string;
  expiresAt?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

// API Error Types
export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// API Endpoint Types
export interface ApiEndpoints {
  auth: {
    login: string;
    register: string;
    logout: string;
    me: string;
  };
  modules: {
    list: string;
    get: string;
    create: string;
    update: string;
    delete: string;
  };
  files: {
    list: string;
    get: string;
    upload: string;
    update: string;
    delete: string;
  };
  folders: {
    list: string;
    get: string;
    create: string;
    update: string;
    delete: string;
  };
  shares: {
    list: string;
    get: string;
    create: string;
    update: string;
    delete: string;
  };
} 