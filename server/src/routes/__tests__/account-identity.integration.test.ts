import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import profileRouter from '../../routes/profile';

vi.mock('../../middleware/auth', () => ({
  authenticateJWT: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user?: { id: string; email: string; role: string; name: string } }).user = {
      id: 'user-test-1',
      email: 'test@example.com',
      role: 'USER',
      name: 'Test User',
    };
    next();
  },
}));

vi.mock('../../services/account/profileService', () => ({
  ProfileServiceError: class ProfileServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  updateProfileName: vi.fn(),
  getProfileForUser: vi.fn(),
}));

import { updateProfileName } from '../../services/account/profileService';

function mountProfileApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/profile', profileRouter);
  return app;
}

describe('profile routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/profile returns authenticated user', async () => {
    const app = mountProfileApp();
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('user-test-1');
  });

  it('PUT /api/profile updates name via profileService', async () => {
    vi.mocked(updateProfileName).mockResolvedValue({
      id: 'user-test-1',
      name: 'New Name',
      email: 'test@example.com',
      role: 'USER',
      emailVerified: null,
      image: null,
      stripeCustomerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userNumber: null,
      countryId: null,
      regionId: null,
      townId: null,
      locationDetectedAt: null,
      locationUpdatedAt: null,
      lastActiveAt: null,
    });

    const app = mountProfileApp();
    const res = await request(app).put('/api/profile').send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(updateProfileName).toHaveBeenCalledWith('user-test-1', 'New Name');
    expect(res.body.user.name).toBe('New Name');
  });
});
