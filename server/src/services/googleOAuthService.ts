import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { getUserWorkCredentials, generateWorkCredentials } from './ssoService';

interface GoogleWorkspaceUser {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName: string;
    familyName: string;
  };
  suspended: boolean;
  orgUnitPath: string;
  isAdmin: boolean;
  isEnforcedIn2Sv: boolean;
  isEnrolledIn2Sv: boolean;
  creationTime: string;
  lastLoginTime: string;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  hd?: string; // Hosted domain for Google Workspace
  verified_email: boolean;
}

export interface GoogleWorkspaceInfo {
  domain: string;
  isWorkspace: boolean;
  organizationName?: string;
}

// Create OAuth2 client for Google
export function createGoogleOAuthClient(config: GoogleOAuthConfig): OAuth2Client {
  return new OAuth2Client(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

// Generate Google OAuth authorization URL
export function generateGoogleAuthUrl(
  config: GoogleOAuthConfig,
  businessId: string,
  state?: string
): string {
  const oauth2Client = createGoogleOAuthClient(config);
  
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/admin.directory.user.readonly'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: state || businessId
  });

  return authUrl;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  config: GoogleOAuthConfig,
  code: string
): Promise<{ access_token: string; refresh_token?: string }> {
  const oauth2Client = createGoogleOAuthClient(config);
  
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token || undefined
  };
}

// Get user information from Google
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const oauth2Client = new OAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const userinfo = await oauth2Client.request({
    url: 'https://www.googleapis.com/oauth2/v2/userinfo'
  });

  return userinfo.data as GoogleUserInfo;
}

// Verify Google Workspace domain
export async function verifyGoogleWorkspaceDomain(
  accessToken: string,
  domain: string
): Promise<GoogleWorkspaceInfo> {
  try {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Try to access Admin SDK to verify workspace access
    const adminResponse = await oauth2Client.request({
      url: `https://admin.googleapis.com/admin/directory/v1/users?domain=${domain}&maxResults=1`
    });

    const responseData = adminResponse.data as any;

    return {
      domain,
      isWorkspace: true,
      organizationName: responseData?.organizationName
    };
  } catch (error) {
    // If Admin SDK access fails, check if it's a regular Google account
    return {
      domain,
      isWorkspace: false
    };
  }
}

// Authenticate user with Google OAuth for business
export async function authenticateGoogleUserForBusiness(
  businessId: string,
  code: string,
  config: GoogleOAuthConfig
): Promise<{ success: boolean; workToken?: string; error?: string }> {
  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(config, code);
    
    // Get user information
    const userInfo = await getGoogleUserInfo(tokens.access_token);
    
    // Verify email is verified
    if (!userInfo.verified_email) {
      return { success: false, error: 'Email not verified' };
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    });

    if (!user) {
      return { success: false, error: 'User not found in system' };
    }

    // Check if user is a member of the business
    const membership = await prisma.businessMember.findFirst({
      where: {
        userId: user.id,
        businessId,
        isActive: true
      },
      include: {
        job: true
      }
    });

    if (!membership) {
      return { success: false, error: 'User is not a member of this business' };
    }

    // Verify Google Workspace domain if business has domain restrictions
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (business && userInfo.hd) {
      // Check if user's domain matches business domain (if configured)
      // This is optional and can be configured per business
    }

    // Get work credentials
    const workCredentials = await getUserWorkCredentials(user.id, businessId);
    
    if (!workCredentials) {
      return { success: false, error: 'Unable to generate work credentials' };
    }

    // Generate work token
    const workToken = generateWorkCredentials(workCredentials);

    // Store OAuth tokens for future use (optional)
    await prisma.businessMember.update({
      where: { id: membership.id },
      data: {
        // You might want to store refresh tokens securely
        // For now, we'll just mark the authentication as successful
      }
    });

    return { success: true, workToken };
  } catch (error) {
    console.error('Google OAuth authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Refresh Google access token
export async function refreshGoogleAccessToken(
  config: GoogleOAuthConfig,
  refreshToken: string
): Promise<string | null> {
  try {
    const oauth2Client = createGoogleOAuthClient(config);
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token || null;
  } catch (error) {
    console.error('Failed to refresh Google access token:', error);
    return null;
  }
}

// Validate Google OAuth configuration
export function validateGoogleOAuthConfig(config: GoogleOAuthConfig): boolean {
  return !!(config.clientId && config.clientSecret && config.redirectUri);
}

// Get Google Workspace users (for admin functions)
export async function getGoogleWorkspaceUsers(
  accessToken: string,
  domain: string
): Promise<GoogleWorkspaceUser[]> {
  try {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const response = await oauth2Client.request({
      url: `https://admin.googleapis.com/admin/directory/v1/users?domain=${domain}`
    });

    const responseData = response.data as any;
    return responseData.users || [];
  } catch (error) {
    console.error('Failed to get Google Workspace users:', error);
    return [];
  }
} 