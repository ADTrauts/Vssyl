interface SharedResource {
  id: string;
  type: 'file' | 'folder';
  name: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  expiresAt?: string;
}

interface ErrorResponse {
  error: string;
}

export async function getSharedResource(shareId: string): Promise<SharedResource> {
  try {
    const response = await fetch(`/api/public/shares/${shareId}`);
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to get share information');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting shared resource:', error);
    throw error;
  }
} 