import { authenticatedApiCall } from '../lib/apiUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vssyl-server-235369681725.us-central1.run.app';

// Types
export interface GovernancePolicyRule {
  type: 'classification' | 'retention' | 'access' | 'encryption';
  conditions: {
    resourceType?: string;
    sensitivity?: string;
    age?: number;
    userRole?: string;
  };
  actions: {
    type: 'block' | 'warn' | 'log' | 'auto_classify' | 'auto_delete';
    message?: string;
    classification?: string;
    retentionDays?: number;
  };
}

export interface GovernancePolicy {
  id: string;
  name: string;
  description?: string;
  policyType: string;
  rules: GovernancePolicyRule[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  policyName: string;
  resourceType: string;
  resourceId: string;
  violationType: 'content' | 'access' | 'compliance' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  status: 'open' | 'resolved' | 'ignored';
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface GovernancePolicyCreateRequest {
  name: string;
  description?: string;
  policyType: string;
  rules: GovernancePolicyRule[];
  isActive?: boolean;
}

export interface GovernancePolicyUpdateRequest {
  name?: string;
  description?: string;
  policyType?: string;
  rules?: GovernancePolicyRule[];
  isActive?: boolean;
}

export interface PolicyEnforcementRequest {
  resourceType: string;
  resourceId: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  policyName: string;
  resourceType: string;
  resourceId: string;
  violationType: 'content' | 'access' | 'compliance' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  status: 'open' | 'resolved' | 'ignored';
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface PolicyAction {
  id: string;
  policyId: string;
  actionType: 'block' | 'warn' | 'log' | 'notify' | 'quarantine';
  description: string;
  executedAt: string;
  status: 'pending' | 'executed' | 'failed';
  result?: string;
  errorMessage?: string;
}

export interface PolicyEnforcementResponse {
  violations: PolicyViolation[];
  actions: PolicyAction[];
  totalPolicies: number;
  totalViolations: number;
}

export interface PolicyViolationResponse {
  violations: PolicyViolation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Governance Policy API Functions

export const getGovernancePolicies = async (
  accessToken: string,
  params?: {
    policyType?: string;
    isActive?: boolean;
  }
): Promise<{ success: boolean; data: GovernancePolicy[] }> => {
  const queryParams = new URLSearchParams();
  if (params?.policyType) queryParams.append('policyType', params.policyType);
  if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

  const url = `/governance/policies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return authenticatedApiCall<{ success: boolean; data: GovernancePolicy[] }>(url, {}, accessToken);
};

export const createGovernancePolicy = async (
  accessToken: string,
  policy: GovernancePolicyCreateRequest
): Promise<{ success: boolean; data: GovernancePolicy }> => {
  return authenticatedApiCall<{ success: boolean; data: GovernancePolicy }>(
    '/governance/policies',
    {
      method: 'POST',
      body: JSON.stringify(policy)
    },
    accessToken
  );
};

export const updateGovernancePolicy = async (
  accessToken: string,
  policyId: string,
  policy: GovernancePolicyUpdateRequest
): Promise<{ success: boolean; data: GovernancePolicy }> => {
  return authenticatedApiCall<{ success: boolean; data: GovernancePolicy }>(
    `/governance/policies/${policyId}`,
    {
      method: 'PUT',
      body: JSON.stringify(policy)
    },
    accessToken
  );
};

export const deleteGovernancePolicy = async (
  accessToken: string,
  policyId: string
): Promise<{ success: boolean; message: string }> => {
  return authenticatedApiCall<{ success: boolean; message: string }>(
    `/governance/policies/${policyId}`,
    { method: 'DELETE' },
    accessToken
  );
};

// Policy Enforcement API Functions

export const enforceGovernancePolicies = async (
  accessToken: string,
  request: PolicyEnforcementRequest
): Promise<{ success: boolean; data: PolicyEnforcementResponse }> => {
  return authenticatedApiCall<{ success: boolean; data: PolicyEnforcementResponse }>(
    '/governance/enforce',
    {
      method: 'POST',
      body: JSON.stringify(request)
    },
    accessToken
  );
};

// Policy Violation API Functions

export const getPolicyViolations = async (
  accessToken: string,
  params?: {
    policyId?: string;
    resourceType?: string;
    severity?: string;
    resolved?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<{ success: boolean; data: PolicyViolationResponse }> => {
  const queryParams = new URLSearchParams();
  if (params?.policyId) queryParams.append('policyId', params.policyId);
  if (params?.resourceType) queryParams.append('resourceType', params.resourceType);
  if (params?.severity) queryParams.append('severity', params.severity);
  if (params?.resolved !== undefined) queryParams.append('resolved', params.resolved.toString());
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `/governance/violations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return authenticatedApiCall<{ success: boolean; data: PolicyViolationResponse }>(url, {}, accessToken);
};

export const resolvePolicyViolation = async (
  accessToken: string,
  violationId: string,
  resolutionNotes?: string
): Promise<{ success: boolean; data: PolicyViolation }> => {
  return authenticatedApiCall<{ success: boolean; data: PolicyViolation }>(
    `/governance/violations/${violationId}/resolve`,
    {
      method: 'PUT',
      body: JSON.stringify({ resolutionNotes })
    },
    accessToken
  );
}; 