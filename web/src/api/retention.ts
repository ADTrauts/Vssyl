import { authenticatedApiCall } from '../lib/apiUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Types for retention policies
export interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  resourceType: string;
  retentionPeriod: number;
  archiveAfter?: number;
  deleteAfter?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RetentionPolicyResponse {
  success: boolean;
  data: RetentionPolicy[];
}

export interface RetentionPolicyCreateRequest {
  name: string;
  description?: string;
  resourceType: string;
  retentionPeriod: number;
  archiveAfter?: number;
  deleteAfter?: number;
  isActive?: boolean;
}

export interface RetentionPolicyUpdateRequest extends Partial<RetentionPolicyCreateRequest> {}

// Types for data classification
export interface DataClassification {
  id: string;
  resourceType: string;
  resourceId: string;
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  classifiedBy: string;
  classifiedAt: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataClassificationResponse {
  success: boolean;
  data: {
    classifications: DataClassification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface DataClassificationCreateRequest {
  resourceType: string;
  resourceId: string;
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  expiresAt?: string;
  notes?: string;
}

// Types for backup records
export interface BackupRecord {
  id: string;
  backupType: string;
  backupPath: string;
  backupSize: number;
  checksum: string;
  status: string;
  notes?: string;
  createdAt: string;
  expiresAt: string;
  createdBy: string;
}

export interface BackupRecordResponse {
  success: boolean;
  data: {
    backups: BackupRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface BackupCreateRequest {
  backupType: string;
  notes?: string;
}

// Types for retention status
export interface RetentionStatus {
  policies: RetentionPolicy[];
  resourceCounts: {
    files: number;
    messages: number;
    conversations: number;
    auditLogs: number;
    classifications: number;
  };
}

export interface RetentionStatusResponse {
  success: boolean;
  data: RetentionStatus;
}

// Types for cleanup results
export interface CleanupResult {
  policyId: string;
  policyName: string;
  resourceType: string;
  deletedCount: number;
  cutoffDate: string;
}

export interface CleanupResponse {
  success: boolean;
  data: {
    message: string;
    results: CleanupResult[];
  };
}

// Types for classification rules
export interface ClassificationRule {
  id: string;
  name: string;
  description?: string;
  pattern: string;
  resourceType: string;
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  priority: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassificationRuleResponse {
  success: boolean;
  data: ClassificationRule[];
}

export interface ClassificationRuleCreateRequest {
  name: string;
  description?: string;
  pattern: string;
  resourceType: string;
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  priority?: number;
  isActive?: boolean;
}

export interface ClassificationRuleUpdateRequest extends Partial<ClassificationRuleCreateRequest> {}

// Types for classification templates
export interface ClassificationTemplate {
  id: string;
  name: string;
  description?: string;
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  expiresIn?: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassificationTemplateResponse {
  success: boolean;
  data: ClassificationTemplate[];
}

export interface ClassificationTemplateCreateRequest {
  name: string;
  description?: string;
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  expiresIn?: number;
  notes?: string;
}

// Types for bulk classification
export interface BulkClassificationItem {
  resourceType: string;
  resourceId: string;
}

export interface BulkClassificationRequest {
  items: BulkClassificationItem[];
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  expiresAt?: string;
  notes?: string;
}

export interface BulkClassificationResult {
  successful: DataClassification[];
  failed: Array<{
    resourceType: string;
    resourceId: string;
    error: string;
  }>;
  total: number;
  successfulCount: number;
  failedCount: number;
}

export interface BulkClassificationResponse {
  success: boolean;
  data: BulkClassificationResult;
}

// Types for expiring classifications
export interface ExpiringClassificationsResponse {
  success: boolean;
  data: {
    classifications: DataClassification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Types for auto-classification
export interface AutoClassifyRequest {
  resourceType: string;
  resourceId: string;
  content?: string;
}

export interface AutoClassifyResult {
  classification: DataClassification | null;
  matchedRule: ClassificationRule | null;
  autoClassified: boolean;
}

export interface AutoClassifyResponse {
  success: boolean;
  data: AutoClassifyResult;
}

// Retention Policy API calls
export const getRetentionPolicies = async (accessToken: string): Promise<RetentionPolicyResponse> => {
  return authenticatedApiCall<RetentionPolicyResponse>('/api/retention/policies', {}, accessToken);
};

export const createRetentionPolicy = async (
  accessToken: string,
  data: RetentionPolicyCreateRequest
): Promise<{ success: boolean; data: RetentionPolicy }> => {
  return authenticatedApiCall<{ success: boolean; data: RetentionPolicy }>(
    '/api/retention/policies',
    {
      method: 'POST',
      body: JSON.stringify(data)
    },
    accessToken
  );
};

export const updateRetentionPolicy = async (
  accessToken: string,
  id: string,
  data: RetentionPolicyUpdateRequest
): Promise<{ success: boolean; data: RetentionPolicy }> => {
  return authenticatedApiCall<{ success: boolean; data: RetentionPolicy }>(
    `/api/retention/policies/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data)
    },
    accessToken
  );
};

export const deleteRetentionPolicy = async (
  accessToken: string,
  id: string
): Promise<{ success: boolean; message: string }> => {
  return authenticatedApiCall<{ success: boolean; message: string }>(
    `/api/retention/policies/${id}`,
    { method: 'DELETE' },
    accessToken
  );
};

// Retention Status API calls
export const getRetentionStatus = async (
  accessToken: string,
  resourceType?: string
): Promise<RetentionStatusResponse> => {
  const queryParams = resourceType ? `?resourceType=${resourceType}` : '';
  return authenticatedApiCall<RetentionStatusResponse>(
    `/api/retention/status${queryParams}`,
    {},
    accessToken
  );
};

export const triggerCleanup = async (
  accessToken: string,
  resourceType: string
): Promise<CleanupResponse> => {
  return authenticatedApiCall<CleanupResponse>(
    '/api/retention/cleanup',
    {
      method: 'POST',
      body: JSON.stringify({ resourceType })
    },
    accessToken
  );
};

// Data Classification API calls
export const getDataClassifications = async (
  accessToken: string,
  params?: {
    resourceType?: string;
    sensitivity?: string;
    page?: number;
    limit?: number;
  }
): Promise<DataClassificationResponse> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  return authenticatedApiCall<DataClassificationResponse>(
    `/api/retention/classifications?${queryParams.toString()}`,
    {},
    accessToken
  );
};

export const classifyData = async (
  accessToken: string,
  data: DataClassificationCreateRequest
): Promise<{ success: boolean; data: DataClassification }> => {
  return authenticatedApiCall<{ success: boolean; data: DataClassification }>(
    '/api/retention/classifications',
    {
      method: 'POST',
      body: JSON.stringify(data)
    },
    accessToken
  );
};

// Backup API calls
export const getBackupRecords = async (
  accessToken: string,
  params?: {
    backupType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<BackupRecordResponse> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  return authenticatedApiCall<BackupRecordResponse>(
    `/api/retention/backups?${queryParams.toString()}`,
    {},
    accessToken
  );
};

export const createBackup = async (
  accessToken: string,
  data: BackupCreateRequest
): Promise<{ success: boolean; data: BackupRecord }> => {
  return authenticatedApiCall<{ success: boolean; data: BackupRecord }>(
    '/api/retention/backups',
    {
      method: 'POST',
      body: JSON.stringify(data)
    },
    accessToken
  );
};

// Classification Rules API calls
export const getClassificationRules = async (
  accessToken: string,
  params?: {
    resourceType?: string;
    isActive?: boolean;
  }
): Promise<ClassificationRuleResponse> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  return authenticatedApiCall<ClassificationRuleResponse>(
    `/api/retention/classification-rules?${queryParams.toString()}`,
    {},
    accessToken
  );
};

export const createClassificationRule = async (
  accessToken: string,
  data: ClassificationRuleCreateRequest
): Promise<{ success: boolean; data: ClassificationRule }> => {
  return authenticatedApiCall<{ success: boolean; data: ClassificationRule }>(
    '/api/retention/classification-rules',
    {
      method: 'POST',
      body: JSON.stringify(data)
    },
    accessToken
  );
};

export const updateClassificationRule = async (
  accessToken: string,
  id: string,
  data: ClassificationRuleUpdateRequest
): Promise<{ success: boolean; data: ClassificationRule }> => {
  return authenticatedApiCall<{ success: boolean; data: ClassificationRule }>(
    `/api/retention/classification-rules/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data)
    },
    accessToken
  );
};

export const deleteClassificationRule = async (
  accessToken: string,
  id: string
): Promise<{ success: boolean; message: string }> => {
  return authenticatedApiCall<{ success: boolean; message: string }>(
    `/api/retention/classification-rules/${id}`,
    { method: 'DELETE' },
    accessToken
  );
};

// Classification Templates API calls
export const getClassificationTemplates = async (
  accessToken: string
): Promise<ClassificationTemplateResponse> => {
  return authenticatedApiCall<ClassificationTemplateResponse>(
    '/api/retention/classification-templates',
    {},
    accessToken
  );
};

export const createClassificationTemplate = async (
  accessToken: string,
  data: ClassificationTemplateCreateRequest
): Promise<{ success: boolean; data: ClassificationTemplate }> => {
  return authenticatedApiCall<{ success: boolean; data: ClassificationTemplate }>(
    '/api/retention/classification-templates',
    {
      method: 'POST',
      body: JSON.stringify(data)
    },
    accessToken
  );
};

// Bulk Classification API calls
export const bulkClassifyData = async (
  accessToken: string,
  data: BulkClassificationRequest
): Promise<BulkClassificationResponse> => {
  return authenticatedApiCall<BulkClassificationResponse>(
    '/api/retention/bulk-classify',
    {
      method: 'POST',
      body: JSON.stringify(data)
    },
    accessToken
  );
};

// Expiring Classifications API calls
export const getExpiringClassifications = async (
  accessToken: string,
  params?: {
    days?: number;
    page?: number;
    limit?: number;
  }
): Promise<ExpiringClassificationsResponse> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }

  return authenticatedApiCall<ExpiringClassificationsResponse>(
    `/api/retention/expiring-classifications?${queryParams.toString()}`,
    {},
    accessToken
  );
};

// Auto Classification API calls
export const autoClassifyData = async (
  accessToken: string,
  data: AutoClassifyRequest
): Promise<AutoClassifyResponse> => {
  return authenticatedApiCall<AutoClassifyResponse>(
    '/api/retention/auto-classify',
    {
      method: 'POST',
      body: JSON.stringify(data)
    },
    accessToken
  );
}; 