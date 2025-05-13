import { api } from './api-client';
import { API_ENDPOINTS } from '../../constants/api';
import { User, Module, File, Folder, Share } from '../../types/api';

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api.post<User>(API_ENDPOINTS.auth.login, { email, password }),
  
  register: (data: { email: string; password: string; name: string }) => 
    api.post<User>(API_ENDPOINTS.auth.register, data),
  
  logout: () => 
    api.post<void>(API_ENDPOINTS.auth.logout),
  
  me: () => 
    api.get<User>(API_ENDPOINTS.auth.me),
};

// Module API
export const moduleApi = {
  list: () => 
    api.get<Module[]>(API_ENDPOINTS.modules.list),
  
  get: (id: string) => 
    api.get<Module>(API_ENDPOINTS.modules.get.replace(':id', id)),
  
  create: (data: Omit<Module, 'id' | 'status' | 'developerId' | 'submittedAt' | 'lastUpdated'>) => 
    api.post<Module>(API_ENDPOINTS.modules.create, data),
  
  update: (id: string, data: Partial<Module>) => 
    api.put<Module>(API_ENDPOINTS.modules.update.replace(':id', id), data),
  
  delete: (id: string) => 
    api.delete<void>(API_ENDPOINTS.modules.delete.replace(':id', id)),
};

// File API
export const fileApi = {
  list: (folderId?: string) => 
    api.get<File[]>(API_ENDPOINTS.files.list, { folderId }),
  
  get: (id: string) => 
    api.get<File>(API_ENDPOINTS.files.get.replace(':id', id)),
  
  upload: (file: File, folderId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    return api.post<File>(API_ENDPOINTS.files.upload, formData);
  },
  
  update: (id: string, data: Partial<File>) => 
    api.put<File>(API_ENDPOINTS.files.update.replace(':id', id), data),
  
  delete: (id: string) => 
    api.delete<void>(API_ENDPOINTS.files.delete.replace(':id', id)),
};

// Folder API
export const folderApi = {
  list: (parentId?: string) => 
    api.get<Folder[]>(API_ENDPOINTS.folders.list, { parentId }),
  
  get: (id: string) => 
    api.get<Folder>(API_ENDPOINTS.folders.get.replace(':id', id)),
  
  create: (data: { name: string; parentId?: string }) => 
    api.post<Folder>(API_ENDPOINTS.folders.create, data),
  
  update: (id: string, data: Partial<Folder>) => 
    api.put<Folder>(API_ENDPOINTS.folders.update.replace(':id', id), data),
  
  delete: (id: string) => 
    api.delete<void>(API_ENDPOINTS.folders.delete.replace(':id', id)),
};

// Share API
export const shareApi = {
  list: (resourceId?: string) => 
    api.get<Share[]>(API_ENDPOINTS.shares.list, { resourceId }),
  
  get: (id: string) => 
    api.get<Share>(API_ENDPOINTS.shares.get.replace(':id', id)),
  
  create: (data: Omit<Share, 'id' | 'createdAt'>) => 
    api.post<Share>(API_ENDPOINTS.shares.create, data),
  
  update: (id: string, data: Partial<Share>) => 
    api.put<Share>(API_ENDPOINTS.shares.update.replace(':id', id), data),
  
  delete: (id: string) => 
    api.delete<void>(API_ENDPOINTS.shares.delete.replace(':id', id)),
}; 