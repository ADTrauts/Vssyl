import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { id: string; role: string };
    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      role: decoded.role,
      name: '', // These will be populated from the database in a real implementation
      email: ''
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAuthenticated = authenticate; // Alias for backward compatibility 