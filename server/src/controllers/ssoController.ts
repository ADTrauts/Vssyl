import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  createSSOConfig,
  getSSOConfigs,
  getSSOConfig,
  updateSSOConfig,
  deleteSSOConfig,
  generateWorkCredentials,
  verifyWorkCredentials,
  getUserWorkCredentials,
  validateSSOConfig,
  SSOProviderConfig,
  WorkCredentials
} from '../services/ssoService';

// Helper function to get user from request
const getUserFromRequest = (req: Request) => {
  return req.user;
};

// Helper function to handle errors
const handleError = (res: Response, error: any, message: string = 'Internal server error') => {
  console.error('SSO Controller Error:', error);
  res.status(500).json({ success: false, error: message });
};

// Create SSO configuration
export const createSSOConfiguration = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { businessId } = req.params;
    const { provider, name, config } = req.body;

    // Check if user has permission to manage this business
    const userMembership = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId: user.id,
        isActive: true,
        canManage: true
      }
    });

    if (!userMembership) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    // Validate SSO configuration
    if (!validateSSOConfig(provider, config)) {
      return res.status(400).json({ success: false, error: 'Invalid SSO configuration' });
    }

    const ssoConfig = await createSSOConfig(businessId, provider, name, config);

    res.status(201).json({ success: true, data: ssoConfig });
  } catch (error) {
    handleError(res, error, 'Failed to create SSO configuration');
  }
};

// Get SSO configurations for a business
export const getSSOConfigurations = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { businessId } = req.params;

    // Check if user is a member of this business
    const userMembership = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId: user.id,
        isActive: true
      }
    });

    if (!userMembership) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const ssoConfigs = await getSSOConfigs(businessId);

    res.json({ success: true, data: ssoConfigs });
  } catch (error) {
    handleError(res, error, 'Failed to fetch SSO configurations');
  }
};

// Update SSO configuration
export const updateSSOConfiguration = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Get the SSO configuration
    const ssoConfig = await getSSOConfig(id);
    if (!ssoConfig) {
      return res.status(404).json({ success: false, error: 'SSO configuration not found' });
    }

    // Check if user has permission to manage this business
    const userMembership = await prisma.businessMember.findFirst({
      where: {
        businessId: ssoConfig.businessId,
        userId: user.id,
        isActive: true,
        canManage: true
      }
    });

    if (!userMembership) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    // Validate SSO configuration if config is being updated
    if (updateData.config && !validateSSOConfig(ssoConfig.provider, updateData.config)) {
      return res.status(400).json({ success: false, error: 'Invalid SSO configuration' });
    }

    const updatedConfig = await updateSSOConfig(id, updateData);

    res.json({ success: true, data: updatedConfig });
  } catch (error) {
    handleError(res, error, 'Failed to update SSO configuration');
  }
};

// Delete SSO configuration
export const deleteSSOConfiguration = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get the SSO configuration
    const ssoConfig = await getSSOConfig(id);
    if (!ssoConfig) {
      return res.status(404).json({ success: false, error: 'SSO configuration not found' });
    }

    // Check if user has permission to manage this business
    const userMembership = await prisma.businessMember.findFirst({
      where: {
        businessId: ssoConfig.businessId,
        userId: user.id,
        isActive: true,
        canManage: true
      }
    });

    if (!userMembership) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    await deleteSSOConfig(id);

    res.json({ success: true, message: 'SSO configuration deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete SSO configuration');
  }
};

// Generate work credentials for a business
export const generateWorkCredentialsForBusiness = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { businessId } = req.params;

    // Get user's work credentials
    const workCredentials = await getUserWorkCredentials(user.id, businessId);
    if (!workCredentials) {
      return res.status(403).json({ success: false, error: 'Not a member of this business' });
    }

    // Generate work credentials JWT
    const workToken = generateWorkCredentials(workCredentials);

    res.json({ 
      success: true, 
      data: {
        workToken,
        credentials: workCredentials
      }
    });
  } catch (error) {
    handleError(res, error, 'Failed to generate work credentials');
  }
};

// Verify work credentials
export const verifyWorkCredentialsToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Work token is required' });
    }

    const credentials = verifyWorkCredentials(token);
    if (!credentials) {
      return res.status(401).json({ success: false, error: 'Invalid work token' });
    }

    res.json({ success: true, data: credentials });
  } catch (error) {
    handleError(res, error, 'Failed to verify work credentials');
  }
};

// Get available SSO providers
export const getAvailableSSOProviders = async (req: Request, res: Response) => {
  try {
    const providers = [
      {
        id: 'google',
        name: 'Google Workspace',
        description: 'Sign in with Google Workspace',
        icon: 'google',
        configFields: [
          { name: 'clientId', label: 'Client ID', type: 'text', required: true },
          { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
          { name: 'redirectUri', label: 'Redirect URI', type: 'text', required: true }
        ]
      },
      {
        id: 'azure',
        name: 'Microsoft Azure AD',
        description: 'Sign in with Azure Active Directory',
        icon: 'azure',
        configFields: [
          { name: 'clientId', label: 'Client ID', type: 'text', required: true },
          { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
          { name: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
          { name: 'redirectUri', label: 'Redirect URI', type: 'text', required: true }
        ]
      },
      {
        id: 'okta',
        name: 'Okta',
        description: 'Sign in with Okta',
        icon: 'okta',
        configFields: [
          { name: 'clientId', label: 'Client ID', type: 'text', required: true },
          { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
          { name: 'domain', label: 'Okta Domain', type: 'text', required: true },
          { name: 'redirectUri', label: 'Redirect URI', type: 'text', required: true }
        ]
      },
      {
        id: 'saml',
        name: 'SAML 2.0',
        description: 'Sign in with SAML 2.0',
        icon: 'saml',
        configFields: [
          { name: 'entryPoint', label: 'SAML Entry Point', type: 'text', required: true },
          { name: 'issuer', label: 'Issuer', type: 'text', required: true },
          { name: 'cert', label: 'Certificate', type: 'textarea', required: true },
          { name: 'callbackUrl', label: 'Callback URL', type: 'text', required: true }
        ]
      }
    ];

    res.json({ success: true, data: providers });
  } catch (error) {
    handleError(res, error, 'Failed to fetch SSO providers');
  }
}; 