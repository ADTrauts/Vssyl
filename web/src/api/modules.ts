import { authenticatedApiCall } from '../lib/apiUtils';
import {
  subscribeModule as billingSubscribeModule,
  type ModuleSubscription,
} from './billing';

// Module manifest and configuration interfaces
export interface ModuleManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  entryPoint: string;
  permissions: string[];
  dependencies: string[];
  runtime: {
    apiVersion: string;
    nodeVersion?: string;
  };
  frontend: {
    entryUrl: string;
    styles?: string[];
    scripts?: string[];
  };
  settings: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'select';
    default: unknown;
    description: string;
    required?: boolean;
    options?: string[];
  }>;
}

export interface ModuleConfiguration {
  enabled: boolean;
  settings: Record<string, unknown>;
  permissions: string[];
  customizations?: Record<string, unknown>;
}

export interface ModuleSubmission {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  reviewerId?: string;
  developer: {
    id: string;
    name: string;
    email: string;
  };
}

export type { ModuleSubscription } from './billing';

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
  manifest: ModuleManifest;
  dependencies?: string[];
  permissions?: string[];
  configured: ModuleConfiguration;
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
  // Built-in module indicator
  isBuiltIn?: boolean;
}

export interface ModuleInstallation {
  id: string;
  moduleId: string;
  userId: string;
  installedAt: string;
  configured: ModuleConfiguration;
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
  frontend: {
    entryUrl: string;
    /** Relative path inside the zip when running from artifact (no hosted entryUrl). */
    entryPath?: string;
    /** When true, load the published zip via `artifactAccess.signedUrl` and mount the HTML entry in an iframe (blob URL). */
    bundleRuntime?: boolean;
  };
  permissions: string[];
  settings: Record<string, unknown>;
  accessContext?: { scope: 'personal' | 'business'; businessId?: string };
  /** Present when the current published module version has a stored artifact (e.g. GCS zip). */
  artifactAccess?: {
    signedUrl: string;
    expiresAt: string;
    sha256: string;
    contentType: string;
  };
  runtimeResolution?: {
    source: 'artifact_version' | 'legacy_manifest';
    moduleVersionId?: string;
    semver: string;
    legacyHostedFallback?: boolean;
    bundleRuntime?: boolean;
    bundleEntryPath?: string;
  };
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
  configuration: ModuleConfiguration,
  opts?: { scope?: 'personal' | 'business'; businessId?: string }
): Promise<{ message: string; installation: ModuleInstallation }> => {
  const params = new URLSearchParams();
  if (opts?.scope) {
    params.append('scope', opts.scope);
  }
  if (opts?.businessId) {
    params.append('businessId', opts.businessId);
  }

  const url = `/api/modules/${moduleId}/configure${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await authenticatedApiCall<{ success: boolean; data: { message: string; installation: ModuleInstallation } }>(url, {
    method: 'PUT',
    body: JSON.stringify({ configuration }),
  });
  return response.data;
};

/** Response from POST /api/modules/submit (includes nested module for follow-up upload). */
export interface SubmitModuleResult {
  message: string;
  submission: {
    id: string;
    moduleId: string;
    status: string;
    module: {
      id: string;
      name: string;
      version: string;
    };
  };
  submissionPolicy?: {
    hostedUrlOnlyDeprecation: 'soft';
    message: string;
    mandatoryArtifactCutoffDays: number;
  };
}

// Submit a module
export const submitModule = async (moduleData: {
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  manifest: ModuleManifest;
  dependencies: string[];
  permissions: string[];
  readme: string;
  license: string;
}): Promise<SubmitModuleResult> => {
  const response = await authenticatedApiCall<{ success: boolean; data: SubmitModuleResult }>('/api/modules/submit', {
    method: 'POST',
    body: JSON.stringify(moduleData),
  });
  return response.data;
};

/** Hard limit aligned with server (see moduleController init upload). */
export const MAX_MODULE_ARTIFACT_BYTES = 500 * 1024 * 1024;

export interface InitModuleArtifactUploadResult {
  uploadSessionId: string;
  signedUploadUrl: string;
  method: string;
  requiredHeaders: Record<string, string>;
  objectPath: string;
  expiresAt: string;
}

/** Request GCS signed PUT URL for a module version artifact (ZIP). */
export async function initModuleArtifactUpload(
  moduleId: string,
  params: { version: string; fileName: string; contentType: string; sizeBytes: number }
): Promise<InitModuleArtifactUploadResult> {
  const response = await authenticatedApiCall<{ success: boolean; data: InitModuleArtifactUploadResult }>(
    `/api/modules/${encodeURIComponent(moduleId)}/uploads/init`,
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
  return response.data;
}

/** After direct upload to GCS, persist artifact + version rows. */
export async function finalizeModuleArtifactUpload(
  moduleId: string,
  uploadSessionId: string,
  body: {
    version: string;
    manifest: Record<string, unknown>;
    permissions: string[];
    dependencies: string[];
  }
): Promise<{ message?: string; moduleVersionId?: string; artifactId?: string; scanStatus?: string }> {
  const response = await authenticatedApiCall<{
    success: boolean;
    data: { message?: string; moduleVersionId?: string; artifactId?: string; scanStatus?: string };
  }>(
    `/api/modules/${encodeURIComponent(moduleId)}/uploads/${encodeURIComponent(uploadSessionId)}/finalize`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
  return response.data;
}

/**
 * Upload a ZIP to GCS using signed URL from init, then finalize metadata.
 * Uses a long timeout for the PUT (large bundles).
 */
export async function uploadModuleArtifactZip(
  moduleId: string,
  file: File,
  version: string,
  manifest: Record<string, unknown>,
  permissions: string[],
  dependencies: string[]
): Promise<void> {
  if (file.size > MAX_MODULE_ARTIFACT_BYTES) {
    throw new Error('Artifact exceeds 500 MB limit');
  }
  const contentType = file.type && file.type.includes('zip') ? file.type : 'application/zip';
  const init = await initModuleArtifactUpload(moduleId, {
    version,
    fileName: file.name,
    contentType,
    sizeBytes: file.size,
  });

  const controller = new AbortController();
  const putTimeout = setTimeout(() => controller.abort(), 600_000); // 10 min for large zips

  try {
    const putRes = await fetch(init.signedUploadUrl, {
      method: init.method || 'PUT',
      headers: init.requiredHeaders,
      body: file,
      signal: controller.signal,
    });
    if (!putRes.ok) {
      const t = await putRes.text().catch(() => '');
      throw new Error(`Storage upload failed (${putRes.status})${t ? `: ${t.slice(0, 200)}` : ''}`);
    }
  } finally {
    clearTimeout(putTimeout);
  }

  await finalizeModuleArtifactUpload(moduleId, init.uploadSessionId, {
    version,
    manifest,
    permissions,
    dependencies,
  });
}

// Get module submissions (admin only)
export const getModuleSubmissions = async (): Promise<ModuleSubmission[]> => {
  const response = await authenticatedApiCall<{ success: boolean; data: ModuleSubmission[] }>('/api/modules/submissions', {
    method: 'GET',
  });
  return response.data;
};

// Get user's submissions
export const getUserSubmissions = async (): Promise<ModuleSubmission[]> => {
  const response = await authenticatedApiCall<{ success: boolean; data: ModuleSubmission[] }>('/api/modules/user/submissions', {
    method: 'GET',
  });
  return response.data;
};

// Review a module submission (admin only)
export const reviewModuleSubmission = async (
  submissionId: string,
  action: 'approve' | 'reject',
  reviewNotes?: string
): Promise<{ message: string; submission: ModuleSubmission }> => {
  const response = await authenticatedApiCall<{ success: boolean; data: { message: string; submission: ModuleSubmission } }>(`/api/modules/submissions/${submissionId}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, reviewNotes }),
  });
  return response.data;
};

// Link a module to a business
export const linkModuleToBusiness = async (
  moduleId: string,
  businessId: string
): Promise<{ message: string; module: Module }> => {
  const response = await authenticatedApiCall<{ success: boolean; data: { message: string; module: Module } }>('/api/modules/link-business', {
    method: 'POST',
    body: JSON.stringify({ moduleId, businessId }),
  });
  return response.data;
};

// Get modules for a specific business
export const getBusinessModules = async (businessId: string): Promise<Module[]> => {
  const response = await authenticatedApiCall<{ success: boolean; data: Module[] }>(`/api/modules/business/${businessId}`, {
    method: 'GET',
  });
  return response.data;
}; 

// Create module subscription for paid modules (canonical billing API)
export const createModuleSubscription = async (
  moduleId: string,
  tier: 'premium' | 'enterprise'
): Promise<{ message: string; subscription: ModuleSubscription }> => {
  const { subscription } = await billingSubscribeModule(moduleId, tier);
  return { message: 'Subscription created', subscription };
};

// Get module subscription by subscription record id
export const getModuleSubscription = async (subscriptionId: string): Promise<ModuleSubscription | null> => {
  const response = await authenticatedApiCall<{ subscription: ModuleSubscription }>(
    `/api/billing/modules/subscriptions/${subscriptionId}`,
    { method: 'GET' }
  );
  return response.subscription;
}; 