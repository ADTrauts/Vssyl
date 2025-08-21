import { authenticatedApiCall } from '../lib/apiUtils';

export interface UserPrivacySettings {
  id: string;
  userId: string;
  profileVisibility: 'PUBLIC' | 'PRIVATE' | 'BUSINESS_ONLY';
  activityVisibility: 'PUBLIC' | 'PRIVATE' | 'BUSINESS_ONLY';
  allowDataProcessing: boolean;
  allowMarketingEmails: boolean;
  allowAnalytics: boolean;
  allowAuditLogs: boolean;
  dataRetentionPeriod: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserConsent {
  id: string;
  userId: string;
  consentType: string;
  version: string;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDataExport {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    createdAt: string;
    updatedAt: string;
  }>;
  conversations: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  }>;
  dashboards: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  }>;
  modules: Array<{
    id: string;
    module: {
      id: string;
      name: string;
      description: string;
      version: string;
    };
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    timestamp: string;
  }>;
  consents: UserConsent[];
  privacySettings?: UserPrivacySettings;
  exportedAt: string;
}

// Get user privacy settings
export const getUserPrivacySettings = async (
  accessToken: string
): Promise<{ success: boolean; data: UserPrivacySettings }> => {
  return authenticatedApiCall<{ success: boolean; data: UserPrivacySettings }>(
    '/privacy/settings',
    {},
    accessToken
  );
};

// Update user privacy settings
export const updateUserPrivacySettings = async (
  accessToken: string,
  settings: Partial<UserPrivacySettings>
): Promise<{ success: boolean; data: UserPrivacySettings }> => {
  return authenticatedApiCall<{ success: boolean; data: UserPrivacySettings }>(
    '/privacy/settings',
    {
      method: 'PUT',
      body: JSON.stringify(settings)
    },
    accessToken
  );
};

// Get user consent history
export const getUserConsents = async (
  accessToken: string
): Promise<{ success: boolean; data: UserConsent[] }> => {
  return authenticatedApiCall<{ success: boolean; data: UserConsent[] }>(
    '/privacy/consents',
    {},
    accessToken
  );
};

// Grant consent
export const grantConsent = async (
  accessToken: string,
  consentType: string,
  version: string
): Promise<{ success: boolean; data: UserConsent }> => {
  return authenticatedApiCall<{ success: boolean; data: UserConsent }>(
    '/privacy/consents/grant',
    {
      method: 'POST',
      body: JSON.stringify({ consentType, version })
    },
    accessToken
  );
};

// Revoke consent
export const revokeConsent = async (
  accessToken: string,
  consentType: string,
  version: string
): Promise<{ success: boolean; data: UserConsent }> => {
  return authenticatedApiCall<{ success: boolean; data: UserConsent }>(
    '/privacy/consents/revoke',
    {
      method: 'POST',
      body: JSON.stringify({ consentType, version })
    },
    accessToken
  );
};

// Request data deletion
export const requestDataDeletion = async (
  accessToken: string,
  reason?: string
): Promise<{ success: boolean; data: DataDeletionRequest }> => {
  return authenticatedApiCall<{ success: boolean; data: DataDeletionRequest }>(
    '/privacy/deletion-request',
    {
      method: 'POST',
      body: JSON.stringify({ reason })
    },
    accessToken
  );
};

// Get user's data deletion requests
export const getUserDeletionRequests = async (
  accessToken: string
): Promise<{ success: boolean; data: DataDeletionRequest[] }> => {
  return authenticatedApiCall<{ success: boolean; data: DataDeletionRequest[] }>(
    '/privacy/deletion-requests',
    {},
    accessToken
  );
};

// Export user data
export const exportUserData = async (
  accessToken: string
): Promise<{ success: boolean; data: UserDataExport }> => {
  return authenticatedApiCall<{ success: boolean; data: UserDataExport }>(
    '/privacy/export',
    {},
    accessToken
  );
}; 