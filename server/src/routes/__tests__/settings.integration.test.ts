import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import settingsRouter from '../../routes/settings';

vi.mock('../../middleware/auth', () => ({
  authenticateJWT: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user?: { id: string } }).user = { id: 'user-settings-1' };
    next();
  },
}));

vi.mock('../../services/account/settingsService', () => ({
  SettingsServiceError: class SettingsServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  resolveSettings: vi.fn(),
  updateSettings: vi.fn(),
  resolveSettingsSections: vi.fn(),
  resolvePreference: vi.fn(),
  updatePreference: vi.fn(),
  deletePreference: vi.fn(),
}));

import {
  resolveSettings,
  updateSettings,
  resolveSettingsSections,
  deletePreference,
} from '../../services/account/settingsService';

function mountSettingsApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/settings', settingsRouter);
  return app;
}

describe('/api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/settings returns bulk settings', async () => {
    vi.mocked(resolveSettings).mockResolvedValue({
      settings: { 'appearance.theme': 'dark' },
      registry: [],
    });

    const res = await request(mountSettingsApp()).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.settings['appearance.theme']).toBe('dark');
  });

  it('PUT /api/settings updates via settingsService', async () => {
    vi.mocked(updateSettings).mockResolvedValue({
      settings: { 'appearance.theme': 'light' },
      registry: [],
    });

    const res = await request(mountSettingsApp())
      .put('/api/settings')
      .send({ key: 'appearance.theme', value: 'light' });

    expect(res.status).toBe(200);
    expect(updateSettings).toHaveBeenCalledWith('user-settings-1', {
      key: 'appearance.theme',
      value: 'light',
    });
  });

  it('GET /api/settings/sections returns navigation contract', async () => {
    vi.mocked(resolveSettingsSections).mockResolvedValue({
      sections: [{ id: 'appearance', label: 'Appearance', owner: 'settings', keys: [], readOnly: false }],
      navigation: [{ id: 'appearance', label: 'Appearance', href: '/profile/settings?tab=appearance', owner: 'settings', section: 'appearance', description: 'Theme', disposition: 'in_hub', order: 40 }],
      canonicalSections: [{ id: 'appearance', label: 'Appearance' }],
      hubInventory: [{ id: 'personal-settings-hub', label: 'Personal Settings Hub', path: '/profile/settings', disposition: 'canonical', owner: 'settings', scope: 'personal' }],
      hubSummary: { total: 16, canonical: 4, duplicate: 3, deprecated: 1, reference: 8, personalBefore: 6, personalAfter: 2 },
    });

    const res = await request(mountSettingsApp()).get('/api/settings/sections');
    expect(res.status).toBe(200);
    expect(res.body.navigation).toHaveLength(1);
    expect(res.body.hubSummary.personalAfter).toBe(2);
  });

  it('DELETE /api/settings/preferences/:key delegates to service', async () => {
    vi.mocked(deletePreference).mockResolvedValue(undefined);

    const res = await request(mountSettingsApp()).delete('/api/settings/preferences/appearance.theme');
    expect(res.status).toBe(200);
    expect(deletePreference).toHaveBeenCalledWith('user-settings-1', 'appearance.theme');
  });
});
