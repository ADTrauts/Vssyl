import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { logger } from '../lib/logger';
import { promoteSessionSoftPreferences } from '../ai/preferences/persistSoftPreferences';
import type { SessionSoftPreferenceOverrides } from '../ai/preferences/preferenceTypes';

const router: express.Router = express.Router();

const SOFT_KEYS = new Set([
  'tone',
  'verbosity',
  'recommendationRichness',
  'structurePreference',
  'summary',
]);

function parseOverrides(body: unknown): SessionSoftPreferenceOverrides | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const raw = body as Record<string, unknown>;
  const overrides: SessionSoftPreferenceOverrides = {};
  for (const key of Object.keys(raw)) {
    if (!SOFT_KEYS.has(key)) continue;
    const v = raw[key];
    if (typeof v === 'string' && v.trim()) {
      (overrides as Record<string, string>)[key] = v.trim();
    }
  }
  return Object.keys(overrides).filter((k) => k !== 'summary').length > 0 ? overrides : null;
}

/**
 * POST /api/ai/preferences/promote-session
 * Persist current session style adjustments to the personality profile (make default).
 */
router.post('/promote-session', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const overrides = parseOverrides(req.body);
    if (!overrides) {
      return res.status(400).json({
        success: false,
        error: 'Provide at least one of: tone, verbosity, recommendationRichness, structurePreference',
      });
    }

    await promoteSessionSoftPreferences(userId, overrides);

    res.json({
      success: true,
      message: 'Communication style saved to your profile',
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to promote session preferences', {
      operation: 'ai_promote_session_preferences_error',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({
      success: false,
      error: 'Failed to save preferences',
    });
  }
});

export default router;
