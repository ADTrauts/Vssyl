import { ApiEndpoints } from '../types/api';

export const API_ENDPOINTS: ApiEndpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  modules: {
    list: '/api/modules',
    get: '/api/modules/:id',
    create: '/api/modules',
    update: '/api/modules/:id',
    delete: '/api/modules/:id',
  },
  files: {
    list: '/api/files',
    get: '/api/files/:id',
    upload: '/api/files/upload',
    update: '/api/files/:id',
    delete: '/api/files/:id',
  },
  folders: {
    list: '/api/folders',
    get: '/api/folders/:id',
    create: '/api/folders',
    update: '/api/folders/:id',
    delete: '/api/folders/:id',
  },
  shares: {
    list: '/api/shares',
    get: '/api/shares/:id',
    create: '/api/shares',
    update: '/api/shares/:id',
    delete: '/api/shares/:id',
  },
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const API_ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not Found',
  BAD_REQUEST: 'Bad Request',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
};

export const API_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  ERROR: 'An error occurred',
  VALIDATION_ERROR: 'Validation error',
  AUTH_ERROR: 'Authentication error',
}; 