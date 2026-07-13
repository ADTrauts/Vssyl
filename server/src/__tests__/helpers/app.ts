import express from 'express';
import adminPortalRouter from '../../routes/admin-portal';
import adminPortalTestingRouter from '../../routes/admin-portal-testing';
import adminAiOperationsRouter from '../../routes/adminAiOperations';

/**
 * Create a test Express app with admin portal routes
 * This allows us to test routes in isolation
 * Note: The admin portal router already includes authenticateJWT middleware
 * on individual routes, so we don't need to add it globally here
 */
export function createTestApp(): express.Application {
  const app = express();
  
  // Add middleware that the real app uses
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Mount admin portal routes
  // The routes already have authenticateJWT middleware applied
  app.use('/api/admin-portal', adminPortalRouter);
  app.use('/api/admin/ai/operations', adminAiOperationsRouter);
  
  return app;
}

export function createAdminPortalTestingApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/admin-portal/testing', adminPortalTestingRouter);
  return app;
}

