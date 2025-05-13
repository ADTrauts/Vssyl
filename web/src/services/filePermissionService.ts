import { FileAccess, Permission } from '@/types/api';

export interface FilePermissionService {
  grantAccess: (fileId: string, userId: string, permission: Permission) => Promise<FileAccess>;
  revokeAccess: (fileId: string, userId: string) => Promise<void>;
  getFileAccess: (fileId: string) => Promise<FileAccess[]>;
  transferOwnership: (fileId: string, newOwnerId: string) => Promise<void>;
}

class FilePermissionServiceImpl implements FilePermissionService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }

  async grantAccess(
    fileId: string,
    userId: string,
    permission: Permission
  ): Promise<FileAccess> {
    const response = await fetch(
      `${this.baseUrl}/api/files/${fileId}/access`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, permission }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to grant file access');
    }

    return response.json();
  }

  async revokeAccess(fileId: string, userId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/files/${fileId}/access/${userId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to revoke file access');
    }
  }

  async getFileAccess(fileId: string): Promise<FileAccess[]> {
    const response = await fetch(
      `${this.baseUrl}/api/files/${fileId}/access`,
      {
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get file access');
    }

    return response.json();
  }

  async transferOwnership(fileId: string, newOwnerId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/files/${fileId}/transfer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ newOwnerId }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to transfer file ownership');
    }
  }
}

export const filePermissionService = new FilePermissionServiceImpl(); 