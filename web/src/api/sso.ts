import { authenticatedApiCall } from '@/lib/apiUtils';
import { getSession } from 'next-auth/react';

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  token?: string
): Promise<T> {
  return authenticatedApiCall<T>(`/api/sso${endpoint}`, options, token);
}

// SSO Provider interface
export interface SSOProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  configFields: {
    name: string;
    label: string;
    type: string;
    required: boolean;
  }[];
}

// SSO Provider Configuration interface
export interface SSOProviderConfig {
  google?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  azure?: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    redirectUri: string;
  };
  okta?: {
    clientId: string;
    clientSecret: string;
    domain: string;
    redirectUri: string;
  };
  saml?: {
    entryPoint: string;
    issuer: string;
    cert: string;
    callbackUrl: string;
  };
}

// SSO Configuration interface
export interface SSOConfiguration {
  id: string;
  businessId: string;
  provider: string;
  name: string;
  config: SSOProviderConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Work Credentials interface
export interface WorkCredentials {
  businessId: string;
  userId: string;
  role: string;
  jobId?: string;
  permissions: string[];
}

// Get available SSO providers
export const getAvailableSSOProviders = async (token?: string): Promise<{ success: boolean; data: SSOProvider[] }> => {
  return apiCall('/providers', { method: 'GET' }, token);
};

// Get SSO configurations for a business
export const getSSOConfigurations = async (
  businessId: string,
  token?: string
): Promise<{ success: boolean; data: SSOConfiguration[] }> => {
  return apiCall(`/business/${businessId}`, { method: 'GET' }, token);
};

// Create SSO configuration
export const createSSOConfiguration = async (
  businessId: string,
  provider: string,
  name: string,
  config: SSOProviderConfig,
  token?: string
): Promise<{ success: boolean; data: SSOConfiguration }> => {
  return apiCall(`/business/${businessId}`, {
    method: 'POST',
    body: JSON.stringify({ provider, name, config }),
  }, token);
};

// Update SSO configuration
export const updateSSOConfiguration = async (
  id: string,
  data: Partial<SSOConfiguration>,
  token?: string
): Promise<{ success: boolean; data: SSOConfiguration }> => {
  return apiCall(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};

// Delete SSO configuration
export const deleteSSOConfiguration = async (
  id: string,
  token?: string
): Promise<{ success: boolean; message: string }> => {
  return apiCall(`/${id}`, {
    method: 'DELETE',
  }, token);
};

// Generate work credentials for a business
export const generateWorkCredentials = async (
  businessId: string,
  token?: string
): Promise<{ success: boolean; data: { workToken: string; credentials: WorkCredentials } }> => {
  return apiCall(`/business/${businessId}/work-credentials`, {
    method: 'POST',
  }, token);
};

// Verify work credentials
export const verifyWorkCredentials = async (
  workToken: string,
  token?: string
): Promise<{ success: boolean; data: WorkCredentials }> => {
  return apiCall('/verify-work-credentials', {
    method: 'POST',
    body: JSON.stringify({ token: workToken }),
  }, token);
};

// SSO API Client class
class SSOAPI {
  private token?: string;

  async setToken(token: string) {
    this.token = token;
  }

  async getAvailableProviders() {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return getAvailableSSOProviders(this.token);
  }

  async getSSOConfigurations(businessId: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return getSSOConfigurations(businessId, this.token);
  }

  async createSSOConfiguration(businessId: string, provider: string, name: string, config: SSOProviderConfig) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return createSSOConfiguration(businessId, provider, name, config, this.token);
  }

  async updateSSOConfiguration(id: string, data: Partial<SSOConfiguration>) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return updateSSOConfiguration(id, data, this.token);
  }

  async deleteSSOConfiguration(id: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return deleteSSOConfiguration(id, this.token);
  }

  async generateWorkCredentials(businessId: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return generateWorkCredentials(businessId, this.token);
  }

  async verifyWorkCredentials(workToken: string) {
    if (!this.token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }
      this.token = session.accessToken;
    }

    return verifyWorkCredentials(workToken, this.token);
  }
}

// Export singleton instance
export const ssoAPI = new SSOAPI(); 