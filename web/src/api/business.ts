import { businessApiCall } from '@/lib/apiUtils';
import { getSession } from 'next-auth/react';

// Helper function to make authenticated API calls
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  token?: string
): Promise<T> {
  return businessApiCall<T>(endpoint, options, token);
}

// Business API functions
export const createBusiness = async (
  businessData: {
    name: string;
    ein: string;
    industry?: string;
    size?: string;
    website?: string;
    address?: any;
    phone?: string;
    email?: string;
    description?: string;
  }, 
  token: string
): Promise<{ success: boolean; data: any }> => {
  return apiCall('/', {
    method: 'POST',
    body: JSON.stringify(businessData),
  }, token);
};

export const getUserBusinesses = async (token: string): Promise<{ success: boolean; data: any[] }> => {
  return apiCall('/', { method: 'GET' }, token);
};

export const getBusiness = async (id: string, token: string): Promise<{ success: boolean; data: any }> => {
  return apiCall(`/${id}`, { method: 'GET' }, token);
};

export const inviteMember = async (
  businessId: string,
  inviteData: {
    email: string;
    role: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
    title?: string;
    department?: string;
  },
  token: string
): Promise<{ success: boolean; data: any }> => {
  return apiCall(`/${businessId}/invite`, {
    method: 'POST',
    body: JSON.stringify(inviteData),
  }, token);
};

export const acceptInvitation = async (token: string, invitationToken: string): Promise<{ success: boolean; data: any }> => {
  return apiCall(`/invite/accept/${invitationToken}`, {
    method: 'POST',
  }, token);
};

// Business profile management functions
export const updateBusiness = async (
  id: string,
  businessData: {
    name?: string;
    industry?: string;
    size?: string;
    website?: string;
    address?: any;
    phone?: string;
    email?: string;
    description?: string;
    branding?: any;
    ssoConfig?: any;
  },
  token: string
): Promise<{ success: boolean; data: any }> => {
  return apiCall(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(businessData),
  }, token);
};

export const uploadLogo = async (
  id: string,
  logoUrl: string,
  token: string
): Promise<{ success: boolean; data: any }> => {
  return apiCall(`/${id}/logo`, {
    method: 'POST',
    body: JSON.stringify({ logoUrl }),
  }, token);
};

export const removeLogo = async (
  id: string,
  token: string
): Promise<{ success: boolean; data: any }> => {
  return apiCall(`/${id}/logo`, {
    method: 'DELETE',
  }, token);
};

// Member management functions
export const getBusinessMembers = async (
  id: string,
  token: string
): Promise<{ success: boolean; data: any[] }> => {
  return apiCall(`/${id}/members`, { method: 'GET' }, token);
};

export const updateBusinessMember = async (
  businessId: string,
  userId: string,
  memberData: {
    role?: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
    title?: string;
    department?: string;
    canInvite?: boolean;
    canManage?: boolean;
    canBilling?: boolean;
  },
  token: string
): Promise<{ success: boolean; data: any }> => {
  return apiCall(`/${businessId}/members/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(memberData),
  }, token);
};

export const removeBusinessMember = async (
  businessId: string,
  userId: string,
  token: string
): Promise<{ success: boolean; message: string }> => {
  return apiCall(`/${businessId}/members/${userId}`, {
    method: 'DELETE',
  }, token);
};

// Analytics functions
export const getBusinessAnalytics = async (
  id: string,
  token: string
): Promise<{ success: boolean; data: any }> => {
  return apiCall(`/${id}/analytics`, { method: 'GET' }, token);
};

export const getBusinessModuleAnalytics = async (
  id: string,
  token: string
): Promise<{ success: boolean; data: any }> => {
  return apiCall(`/${id}/module-analytics`, { method: 'GET' }, token);
};

export const followBusiness = async (businessId: string, token: string): Promise<{ success: boolean; message: string }> => {
  return apiCall(`/${businessId}/follow`, { method: 'POST' }, token);
};

export const unfollowBusiness = async (businessId: string, token: string): Promise<{ success: boolean; message: string }> => {
  return apiCall(`/${businessId}/follow`, { method: 'DELETE' }, token);
};

export const getBusinessFollowers = async (businessId: string, token: string): Promise<{ success: boolean; followers: any[] }> => {
  return apiCall(`/${businessId}/followers`, { method: 'GET' }, token);
};

export const getUserFollowing = async (token: string): Promise<{ success: boolean; following: any[] }> => {
  return apiCall('/user/following', { method: 'GET' }, token);
};

// Business API Client class
class BusinessAPI {
  private token?: string;

  async setToken(token: string) {
    this.token = token;
  }

  async createBusiness(businessData: {
    name: string;
    ein: string;
    industry?: string;
    size?: string;
    website?: string;
    address?: any;
    phone?: string;
    email?: string;
    description?: string;
  }) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return createBusiness(businessData, this.token!);
  }

  async getUserBusinesses() {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return getUserBusinesses(this.token!);
  }

  async getBusiness(id: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return getBusiness(id, this.token!);
  }

  async inviteMember(businessId: string, inviteData: {
    email: string;
    role: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
    title?: string;
    department?: string;
  }) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return inviteMember(businessId, inviteData, this.token!);
  }

  async acceptInvitation(invitationToken: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return acceptInvitation(this.token!, invitationToken);
  }

  // Business profile management methods
  async updateBusiness(id: string, businessData: {
    name?: string;
    industry?: string;
    size?: string;
    website?: string;
    address?: any;
    phone?: string;
    email?: string;
    description?: string;
    branding?: any;
    ssoConfig?: any;
  }) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return updateBusiness(id, businessData, this.token!);
  }

  async uploadLogo(id: string, logoUrl: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return uploadLogo(id, logoUrl, this.token!);
  }

  async removeLogo(id: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return removeLogo(id, this.token!);
  }

  // Member management methods
  async getBusinessMembers(id: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return getBusinessMembers(id, this.token!);
  }

  async updateBusinessMember(businessId: string, userId: string, memberData: {
    role?: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
    title?: string;
    department?: string;
    canInvite?: boolean;
    canManage?: boolean;
    canBilling?: boolean;
  }) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return updateBusinessMember(businessId, userId, memberData, this.token!);
  }

  async removeBusinessMember(businessId: string, userId: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return removeBusinessMember(businessId, userId, this.token!);
  }

  // Analytics methods
  async getBusinessAnalytics(id: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return getBusinessAnalytics(id, this.token!);
  }
}

export const businessAPI = new BusinessAPI(); 