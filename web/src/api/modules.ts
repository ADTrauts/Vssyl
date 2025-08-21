import { authenticatedApiCall } from '../lib/apiUtils';

export interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  developer: string;
  rating: number;
  reviewCount: number;
  downloads: number;
  status: 'installed' | 'available' | 'pending';
  icon?: string;
  screenshots?: string[];
  tags?: string[];
  manifest?: any;
  dependencies?: string[];
  permissions?: string[];
  configured?: any;
  installedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // Pricing fields
  pricingTier?: 'free' | 'premium' | 'enterprise';
  basePrice?: number;
  enterprisePrice?: number;
  isProprietary?: boolean;
  revenueSplit?: number;
  // Subscription status for installed modules
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  subscriptionAmount?: number;
}

export interface ModuleInstallation {
  id: string;
  moduleId: string;
  userId: string;
  installedAt: string;
  configured: any;
  enabled: boolean;
}

export interface ModuleReview {
  id: string;
  moduleId: string;
  reviewerId: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
  };
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ModuleDetails extends Module {
  isInstalled: boolean;
  installation: ModuleInstallation | null;
  reviews: ModuleReview[];
}

export interface ModuleRuntimeConfig {
  id: string;
  name: string;
  version: string;
  runtime: { apiVersion: string };
  frontend: { entryUrl: string };
  permissions: string[];
  settings: Record<string, any>;
  accessContext?: { scope: 'personal' | 'business'; businessId?: string };
}

// Get installed modules for current user
export const getInstalledModules = async (opts?: { scope?: 'personal' | 'business'; businessId?: string }): Promise<Module[]> => {
  const params = new URLSearchParams();
  if (opts?.scope) params.append('scope', opts.scope);
  if (opts?.businessId) params.append('businessId', opts.businessId);
  const url = `/api/modules/installed${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await authenticatedApiCall<{ success: boolean; data: Module[] }>(url, { method: 'GET' });
  return response.data;
};

// Get marketplace modules
export const getMarketplaceModules = async (params?: {
  search?: string;
  category?: string;
  sortBy?: 'rating' | 'downloads' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  scope?: 'personal' | 'business';
  businessId?: string;
}): Promise<Module[]> => {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.category) searchParams.append('category', params.category);
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  if (params?.scope) searchParams.append('scope', params.scope);
  if (params?.businessId) searchParams.append('businessId', params.businessId);

  const url = `/api/modules/marketplace${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await authenticatedApiCall<{ success: boolean; data: Module[] }>(url, {
    method: 'GET',
  });
  return response.data;
};

// Get module categories
export const getModuleCategories = async (): Promise<string[]> => {
  const response = await authenticatedApiCall<{ success: boolean; data: string[] }>('/api/modules/categories', {
    method: 'GET',
  });
  return response.data;
};

// Get module details
export const getModuleDetails = async (moduleId: string): Promise<ModuleDetails> => {
  const response = await authenticatedApiCall<{ success: boolean; data: ModuleDetails }>(`/api/modules/${moduleId}`, {
    method: 'GET',
  });
  return response.data;
};

// Get module runtime config
export const getModuleRuntime = async (moduleId: string, opts?: { scope?: 'personal' | 'business'; businessId?: string }): Promise<ModuleRuntimeConfig> => {
  const params = new URLSearchParams();
  if (opts?.scope) params.append('scope', opts.scope);
  if (opts?.businessId) params.append('businessId', opts.businessId);
  const url = `/api/modules/${moduleId}/runtime${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await authenticatedApiCall<{ success: boolean; data: ModuleRuntimeConfig }>(url, { method: 'GET' });
  return response.data;
};

// Install a module
export const installModule = async (moduleId: string, opts?: { scope?: 'personal' | 'business'; businessId?: string }): Promise<{ message: string; installation: ModuleInstallation }> => {
  const params = new URLSearchParams();
  if (opts?.scope) params.append('scope', opts.scope);
  if (opts?.businessId) params.append('businessId', opts.businessId);
  const url = `/api/modules/${moduleId}/install${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await authenticatedApiCall<{ success: boolean; data: { message: string; installation: ModuleInstallation } }>(url, { method: 'POST' });
  return response.data;
};

// Uninstall a module
export const uninstallModule = async (moduleId: string, opts?: { scope?: 'personal' | 'business'; businessId?: string }): Promise<{ message: string }> => {
  const params = new URLSearchParams();
  if (opts?.scope) params.append('scope', opts.scope);
  if (opts?.businessId) params.append('businessId', opts.businessId);
  const url = `/api/modules/${moduleId}/uninstall${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await authenticatedApiCall<{ success: boolean; data: { message: string } }>(url, { method: 'DELETE' });
  return response.data;
};

// Configure a module
export const configureModule = async (
  moduleId: string, 
  configuration: any
): Promise<{ message: string; installation: ModuleInstallation }> => {
  const response = await authenticatedApiCall<{ success: boolean; data: { message: string; installation: ModuleInstallation } }>(`/api/modules/${moduleId}/configure`, {
    method: 'PUT',
    body: JSON.stringify({ configuration }),
  });
  return response.data;
};

// Submit a module
export const submitModule = async (moduleData: {
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  manifest: any;
  dependencies: string[];
  permissions: string[];
  readme: string;
  license: string;
}): Promise<{ message: string; submission: any }> => {
  const response = await authenticatedApiCall<{ success: boolean; data: { message: string; submission: any } }>('/api/modules/submit', {
    method: 'POST',
    body: JSON.stringify(moduleData),
  });
  return response.data;
};

// Get module submissions (admin only)
export const getModuleSubmissions = async (): Promise<any[]> => {
  const response = await authenticatedApiCall<{ success: boolean; data: any[] }>('/api/modules/submissions', {
    method: 'GET',
  });
  return response.data;
};

// Get user's submissions
export const getUserSubmissions = async (): Promise<any[]> => {
  const response = await authenticatedApiCall<{ success: boolean; data: any[] }>('/api/modules/user/submissions', {
    method: 'GET',
  });
  return response.data;
};

// Review a module submission (admin only)
export const reviewModuleSubmission = async (
  submissionId: string,
  action: 'approve' | 'reject',
  reviewNotes?: string
): Promise<{ message: string; submission: any }> => {
  const response = await authenticatedApiCall<{ success: boolean; data: { message: string; submission: any } }>(`/api/modules/submissions/${submissionId}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, reviewNotes }),
  });
  return response.data;
};

// Link a module to a business
export const linkModuleToBusiness = async (
  moduleId: string,
  businessId: string
): Promise<{ message: string; module: any }> => {
  const response = await authenticatedApiCall<{ success: boolean; data: { message: string; module: any } }>('/api/modules/link-business', {
    method: 'POST',
    body: JSON.stringify({ moduleId, businessId }),
  });
  return response.data;
};

// Get modules for a specific business
export const getBusinessModules = async (businessId: string): Promise<any[]> => {
  const response = await authenticatedApiCall<{ success: boolean; data: any[] }>(`/api/modules/business/${businessId}`, {
    method: 'GET',
  });
  return response.data;
}; 

// Create module subscription for paid modules
export const createModuleSubscription = async (moduleId: string, tier: 'premium' | 'enterprise'): Promise<{ message: string; subscription: any }> => {
  const response = await authenticatedApiCall<{ message: string; subscription: any }>('/api/billing/modules/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      moduleId,
      tier,
    }),
  });
  return response;
};

// Get module subscription status
export const getModuleSubscription = async (moduleId: string): Promise<any> => {
  const response = await authenticatedApiCall<{ subscription: any }>(`/api/billing/modules/subscriptions/${moduleId}`, {
    method: 'GET',
  });
  return response.subscription;
}; 