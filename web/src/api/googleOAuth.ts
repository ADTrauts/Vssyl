import { authenticatedApiCall } from '@/lib/apiUtils';
import { getSession } from 'next-auth/react';

// Base API call function
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  token?: string
): Promise<T> {
  return authenticatedApiCall<T>(endpoint, options, token);
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  [key: string]: unknown;
}

export interface GoogleOAuthStatus {
  configured: boolean;
  valid: boolean;
  config?: {
    name: string;
    provider: string;
    isActive: boolean;
  };
  message: string;
}

// Get Google OAuth authorization URL for business
export const getGoogleAuthUrl = async (
  businessId: string,
  state?: string,
  token?: string
): Promise<{ success: boolean; authUrl: string }> => {
  if (!token) {
    const session = await getSession();
    if (!session?.accessToken) {
      throw new Error('No authentication token available');
    }
    token = session.accessToken;
  }

  const params = new URLSearchParams();
  if (state) {
    params.append('state', state);
  }

  return apiCall(`/google-oauth/business/${businessId}/auth-url?${params.toString()}`, {
    method: 'GET',
  }, token);
};

// Handle Google OAuth callback
export const handleGoogleCallback = async (
  businessId: string,
  code: string,
  state?: string
): Promise<{ success: boolean; workToken?: string; message: string }> => {
  const params = new URLSearchParams();
  params.append('code', code);
  if (state) {
    params.append('state', state);
  }

  return apiCall(`/google-oauth/business/${businessId}/callback?${params.toString()}`, {
    method: 'GET',
  });
};

// Test Google OAuth configuration
export const testGoogleConfig = async (
  businessId: string,
  config: GoogleOAuthConfig,
  token?: string
): Promise<{ success: boolean; authUrl?: string; message: string }> => {
  if (!token) {
    const session = await getSession();
    if (!session?.accessToken) {
      throw new Error('No authentication token available');
    }
    token = session.accessToken;
  }

  return apiCall(`/google-oauth/business/${businessId}/test-config`, {
    method: 'POST',
    body: JSON.stringify(config),
  }, token);
};

// Get Google OAuth status for business
export const getGoogleOAuthStatus = async (
  businessId: string,
  token?: string
): Promise<{ success: boolean; data: GoogleOAuthStatus }> => {
  if (!token) {
    const session = await getSession();
    if (!session?.accessToken) {
      throw new Error('No authentication token available');
    }
    token = session.accessToken;
  }

  return apiCall(`/google-oauth/business/${businessId}/status`, {
    method: 'GET',
  }, token);
};

// Google OAuth API Client class
class GoogleOAuthAPI {
  private token?: string;

  async setToken(token: string) {
    this.token = token;
  }

  async getAuthUrl(businessId: string, state?: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return getGoogleAuthUrl(businessId, state, this.token);
  }

  async handleCallback(businessId: string, code: string, state?: string) {
    return handleGoogleCallback(businessId, code, state);
  }

  async testConfig(businessId: string, config: GoogleOAuthConfig) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return testGoogleConfig(businessId, config, this.token);
  }

  async getStatus(businessId: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return getGoogleOAuthStatus(businessId, this.token);
  }
}

// Export singleton instance
export const googleOAuthAPI = new GoogleOAuthAPI(); 