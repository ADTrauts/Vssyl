import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  generateGoogleAuthUrl,
  authenticateGoogleUserForBusiness,
  validateGoogleOAuthConfig,
  GoogleOAuthConfig
} from '../services/googleOAuthService';

// Helper function to get user from request
const getUserFromRequest = (req: Request) => {
  return (req as any).user;
};

// Helper function to handle errors
const handleError = (res: Response, error: any, message: string = 'Internal server error') => {
  console.error(message, error);
  res.status(500).json({ success: false, error: message });
};

// Get Google OAuth authorization URL for business
export const getGoogleAuthUrl = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { businessId } = req.params;
    const { state } = req.query;

    // Check if user has permission to access this business
    const membership = await prisma.businessMember.findFirst({
      where: {
        userId: user.id,
        businessId,
        isActive: true
      }
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get Google OAuth configuration for the business
    const ssoConfig = await prisma.sSOConfig.findFirst({
      where: {
        businessId,
        provider: 'google',
        isActive: true
      }
    });

    if (!ssoConfig) {
      return res.status(404).json({ success: false, error: 'Google OAuth not configured for this business' });
    }

    const config = ssoConfig.config as unknown as GoogleOAuthConfig;
    
    if (!validateGoogleOAuthConfig(config)) {
      return res.status(400).json({ success: false, error: 'Invalid Google OAuth configuration' });
    }

    // Generate authorization URL
    const authUrl = generateGoogleAuthUrl(config, businessId, state as string);

    res.json({ success: true, authUrl });
  } catch (error) {
    handleError(res, error, 'Failed to generate Google OAuth URL');
  }
};

// Handle Google OAuth callback
export const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({ success: false, error: `OAuth error: ${error}` });
    }

    if (!code) {
      return res.status(400).json({ success: false, error: 'Authorization code required' });
    }

    // Get Google OAuth configuration
    const ssoConfig = await prisma.sSOConfig.findFirst({
      where: {
        businessId,
        provider: 'google',
        isActive: true
      }
    });

    if (!ssoConfig) {
      return res.status(404).json({ success: false, error: 'Google OAuth not configured' });
    }

    const config = ssoConfig.config as unknown as GoogleOAuthConfig;
    
    if (!validateGoogleOAuthConfig(config)) {
      return res.status(400).json({ success: false, error: 'Invalid Google OAuth configuration' });
    }

    // Authenticate user with Google OAuth
    const result = await authenticateGoogleUserForBusiness(
      businessId,
      code as string,
      config
    );

    if (!result.success) {
      return res.status(401).json({ success: false, error: result.error });
    }

    // Return work token for frontend
    res.json({
      success: true,
      workToken: result.workToken,
      message: 'Google OAuth authentication successful'
    });
  } catch (error) {
    handleError(res, error, 'Failed to process Google OAuth callback');
  }
};

// Test Google OAuth configuration
export const testGoogleConfig = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { businessId } = req.params;
    const config: GoogleOAuthConfig = req.body;

    // Check if user has permission to manage this business
    const membership = await prisma.businessMember.findFirst({
      where: {
        userId: user.id,
        businessId,
        isActive: true,
        canManage: true
      }
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    // Validate configuration
    if (!validateGoogleOAuthConfig(config)) {
      return res.status(400).json({ success: false, error: 'Invalid Google OAuth configuration' });
    }

    // Test the configuration by generating an auth URL
    try {
      const authUrl = generateGoogleAuthUrl(config, businessId);
      res.json({ success: true, authUrl, message: 'Configuration is valid' });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Failed to generate auth URL with provided configuration' });
    }
  } catch (error) {
    handleError(res, error, 'Failed to test Google OAuth configuration');
  }
};

// Get Google OAuth status for business
export const getGoogleOAuthStatus = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { businessId } = req.params;

    // Check if user has access to this business
    const membership = await prisma.businessMember.findFirst({
      where: {
        userId: user.id,
        businessId,
        isActive: true
      }
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get Google OAuth configuration
    const ssoConfig = await prisma.sSOConfig.findFirst({
      where: {
        businessId,
        provider: 'google',
        isActive: true
      }
    });

    if (!ssoConfig) {
      return res.json({
        success: true,
        configured: false,
        message: 'Google OAuth not configured'
      });
    }

    const config = ssoConfig.config as unknown as GoogleOAuthConfig;
    const isValid = validateGoogleOAuthConfig(config);

    res.json({
      success: true,
      configured: true,
      valid: isValid,
      config: {
        name: ssoConfig.name,
        provider: ssoConfig.provider,
        isActive: ssoConfig.isActive
      },
      message: isValid ? 'Google OAuth is properly configured' : 'Google OAuth configuration is invalid'
    });
  } catch (error) {
    handleError(res, error, 'Failed to get Google OAuth status');
  }
}; 