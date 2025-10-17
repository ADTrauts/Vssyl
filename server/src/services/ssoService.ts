import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

export interface SSOConfig {
  id: string;
  businessId: string;
  provider: string;
  name: string;
  config: SSOProviderConfig; // Use proper interface instead of unknown
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkCredentials {
  businessId: string;
  userId: string;
  role: string;
  jobId?: string;
  permissions: string[];
}

export interface JWTWorkPayload {
  type: string;
  businessId: string;
  userId: string;
  role: string;
  jobId?: string;
  permissions: string[];
  exp: number;
}

export interface JobPermissions {
  permissions: string[];
}

// Create SSO configuration for a business
export async function createSSOConfig(
  businessId: string,
  provider: string,
  name: string,
  config: SSOProviderConfig
): Promise<SSOConfig> {
  const result = await prisma.sSOConfig.create({
    data: {
      businessId,
      provider,
      name,
      // TODO: Prisma JSON compatibility issue - using any temporarily
      config: config as Prisma.InputJsonValue,
      isActive: true
    }
  });
  
  return result as SSOConfig;
}

// Get SSO configurations for a business
export async function getSSOConfigs(businessId: string): Promise<SSOConfig[]> {
  const results = await prisma.sSOConfig.findMany({
    where: {
      businessId,
      isActive: true
    }
  });
  
  return results as SSOConfig[];
}

// Get specific SSO configuration
export async function getSSOConfig(id: string): Promise<SSOConfig | null> {
  const result = await prisma.sSOConfig.findUnique({
    where: { id }
  });
  
  return result as SSOConfig | null;
}

// Update SSO configuration
export async function updateSSOConfig(
  id: string,
  data: {
    provider?: string;
    name?: string;
    config?: SSOProviderConfig;
    isActive?: boolean;
  }
): Promise<SSOConfig | null> {
  const updateData: Record<string, unknown> = { ...data };
  
  // Handle config separately for JSON compatibility
  if (data.config) {
    // TODO: Prisma JSON compatibility issue - using any temporarily
    updateData.config = data.config as Prisma.InputJsonValue;
  }
  
  const result = await prisma.sSOConfig.update({
    where: { id },
    data: updateData
  });
  
  return result as SSOConfig;
}

// Delete SSO configuration
export async function deleteSSOConfig(id: string): Promise<void> {
  await prisma.sSOConfig.delete({
    where: { id }
  });
}

// Generate work credentials JWT
export function generateWorkCredentials(credentials: WorkCredentials): string {
  const payload: JWTWorkPayload = {
    type: 'work',
    businessId: credentials.businessId,
    userId: credentials.userId,
    role: credentials.role,
    jobId: credentials.jobId,
    permissions: credentials.permissions,
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
}

// Verify work credentials JWT
export function verifyWorkCredentials(token: string): WorkCredentials | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTWorkPayload;
    
    if (decoded.type !== 'work') {
      return null;
    }

    return {
      businessId: decoded.businessId,
      userId: decoded.userId,
      role: decoded.role,
      jobId: decoded.jobId,
      permissions: decoded.permissions || []
    };
  } catch (error) {
    return null;
  }
}

// Get user's work credentials for a business
export async function getUserWorkCredentials(
  userId: string,
  businessId: string
): Promise<WorkCredentials | null> {
  const membership = await prisma.businessMember.findFirst({
    where: {
      userId,
      businessId,
      isActive: true
    },
    include: {
      job: true
    }
  });

  if (!membership) {
    return null;
  }

  // Get permissions from job or default role permissions
  let permissions: string[] = [];
  
  if (membership.job?.permissions) {
    // TODO: Prisma JSON compatibility issue - using any temporarily
    permissions = membership.job.permissions as unknown as string[];
  } else {
    // Default role-based permissions
    switch (membership.role) {
      case 'ADMIN':
        permissions = ['*']; // All permissions
        break;
      case 'MANAGER':
        permissions = ['chat', 'drive', 'analytics', 'members'];
        break;
      case 'EMPLOYEE':
        permissions = ['chat', 'drive'];
        break;
    }
  }

  return {
    businessId: membership.businessId,
    userId: membership.userId,
    role: membership.role,
    jobId: membership.jobId || undefined,
    permissions
  };
}

// Validate SSO provider configuration
export function validateSSOConfig(provider: string, config: SSOProviderConfig): boolean {
  switch (provider) {
    case 'google':
      return !!(config.google?.clientId && config.google?.clientSecret && config.google?.redirectUri);
    case 'azure':
      return !!(config.azure?.clientId && config.azure?.clientSecret && config.azure?.tenantId && config.azure?.redirectUri);
    case 'okta':
      return !!(config.okta?.clientId && config.okta?.clientSecret && config.okta?.domain && config.okta?.redirectUri);
    case 'saml':
      return !!(config.saml?.entryPoint && config.saml?.issuer && config.saml?.cert && config.saml?.callbackUrl);
    default:
      return false;
  }
} 