import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Define the authenticated user interface that matches what we set in the middleware
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

// Extend Express Request type to include our custom properties
// @ts-ignore - Express Request has any types in its definition
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// JWT Payload interface
interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Helper function to safely get user properties
export function getUserFromRequest(req: Request): AuthenticatedUser | null {
  return (req as AuthenticatedRequest).user || null;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth Middleware - Headers:', { 
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader,
    tokenLength: token?.length,
    method: req.method,
    path: req.path
  });

  if (!token) {
    console.log('Auth Middleware - No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JWTPayload;
    console.log('Auth Middleware - Token decoded:', { 
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role
    });
    
    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        emailVerified: true,
        image: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true,
        userNumber: true,
        countryId: true,
        regionId: true,
        townId: true,
        locationDetectedAt: true,
        locationUpdatedAt: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Set full user data
    (req as AuthenticatedRequest).user = user;
    
    next();
  } catch (error) {
    console.log('Auth Middleware - Token verification failed:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Middleware to require a specific role
 * Must be used after authenticateJWT
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (user.role !== role) {
      return res.status(403).json({ message: `Access denied. ${role} role required.` });
    }
    
    next();
  };
} 