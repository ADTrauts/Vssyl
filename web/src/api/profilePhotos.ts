import { authenticatedApiCall } from '../lib/apiUtils';

export interface ProfilePhotos {
  personal: string | null;
  business: string | null;
  default: string | null;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  personalPhoto: string | null;
  businessPhoto: string | null;
  image: string | null;
}

export interface ProfilePhotosResponse {
  success: boolean;
  photos: ProfilePhotos;
  user: UserProfile;
}

export interface UploadPhotoResponse {
  success: boolean;
  message: string;
  photoUrl: string;
  user: UserProfile;
}

export interface RemovePhotoResponse {
  success: boolean;
  message: string;
  user: UserProfile;
}

/**
 * Get user's profile photos
 */
export const getProfilePhotos = async (): Promise<ProfilePhotosResponse> => {
  return authenticatedApiCall<ProfilePhotosResponse>('/api/profile-photos', {
    method: 'GET',
  });
};

/**
 * Upload a profile photo
 */
export const uploadProfilePhoto = async (
  file: File, 
  photoType: 'personal' | 'business'
): Promise<UploadPhotoResponse> => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('photoType', photoType);

  return authenticatedApiCall<UploadPhotoResponse>('/api/profile-photos/upload', {
    method: 'POST',
    body: formData,
  });
};

/**
 * Remove a profile photo
 */
export const removeProfilePhoto = async (
  photoType: 'personal' | 'business'
): Promise<RemovePhotoResponse> => {
  return authenticatedApiCall<RemovePhotoResponse>('/api/profile-photos/remove', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photoType }),
  });
};
