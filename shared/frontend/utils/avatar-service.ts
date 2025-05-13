import { toast } from 'react-hot-toast';
import { API_BASE_URL } from './api';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AvatarResponse {
  avatarUrl: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'] as const;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const avatarService = {
  async upload(file: File): Promise<AvatarResponse> {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
      throw new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.');
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/me/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const error: { message: string } = await response.json();
        throw new Error(error.message || 'Failed to upload avatar');
      }

      const data: AvatarResponse = await response.json();
      toast.success('Avatar updated successfully');
      return data;
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
      throw error;
    }
  },

  async delete(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/me/avatar`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error: { message: string } = await response.json();
        throw new Error(error.message || 'Failed to delete avatar');
      }

      toast.success('Avatar deleted successfully');
      return true;
    } catch (error) {
      console.error('Avatar deletion error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete avatar');
      throw error;
    }
  },

  getAvatarUrl(user: User | null | undefined): string {
    if (!user?.avatarUrl) {
      return '/default-avatar.png';
    }
    return user.avatarUrl.startsWith('http') 
      ? user.avatarUrl 
      : `${API_BASE_URL}${user.avatarUrl}`;
  }
}; 