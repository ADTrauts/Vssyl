import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { getUserPreference, setUserPreference } from '../services/userPreferenceService';
import { getModel } from '../ai/providers/modelCatalog';
import { logger } from '../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}


const router: express.Router = express.Router();

const MODEL_KEYS = {
  openai: 'ai_preferred_model_openai',
  anthropic: 'ai_preferred_model_anthropic',
} as const;

/**
 * GET /api/ai/preferences
 * Get user's AI preferences (provider and per-provider model)
 */
router.get('/preferences', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const preferredProvider = await getUserPreference(userId, 'ai_preferred_provider') || 'auto';
    const rawOpenai = await getUserPreference(userId, MODEL_KEYS.openai);
    const rawAnthropic = await getUserPreference(userId, MODEL_KEYS.anthropic);

    res.json({
      success: true,
      data: {
        preferredProvider: preferredProvider as 'auto' | 'openai' | 'anthropic',
        preferredModelOpenai: rawOpenai && rawOpenai.trim() ? rawOpenai : null,
        preferredModelAnthropic: rawAnthropic && rawAnthropic.trim() ? rawAnthropic : null,
      }
    });
  } catch (error) {
    logSrvErr('ai_preferences_get_ai_preferences_error', 'Get AI preferences error:', error);
    res.status(500).json({
      error: 'Failed to get AI preferences',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * PUT /api/ai/preferences
 * Update user's AI preferences (provider and per-provider model)
 */
router.put('/preferences', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { preferredProvider, preferredModelOpenai, preferredModelAnthropic } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (preferredProvider && !['auto', 'openai', 'anthropic'].includes(preferredProvider)) {
      return res.status(400).json({
        error: 'Invalid provider. Must be auto, openai, or anthropic'
      });
    }

    if (preferredModelOpenai != null) {
      const value = typeof preferredModelOpenai === 'string' ? preferredModelOpenai.trim() : '';
      if (value) {
        const model = getModel(value);
        if (!model || model.provider !== 'openai') {
          return res.status(400).json({ error: 'Invalid model for OpenAI. Use a model from GET /api/ai/models.' });
        }
        await setUserPreference(userId, MODEL_KEYS.openai, value);
      } else {
        await setUserPreference(userId, MODEL_KEYS.openai, '');
      }
    }
    if (preferredModelAnthropic != null) {
      const value = typeof preferredModelAnthropic === 'string' ? preferredModelAnthropic.trim() : '';
      if (value) {
        const model = getModel(value);
        if (!model || model.provider !== 'anthropic') {
          return res.status(400).json({ error: 'Invalid model for Anthropic. Use a model from GET /api/ai/models.' });
        }
        await setUserPreference(userId, MODEL_KEYS.anthropic, value);
      } else {
        await setUserPreference(userId, MODEL_KEYS.anthropic, '');
      }
    }

    if (preferredProvider) {
      await setUserPreference(userId, 'ai_preferred_provider', preferredProvider);
    }

    const resolvedProvider = preferredProvider ?? (await getUserPreference(userId, 'ai_preferred_provider')) ?? 'auto';
    const rawOpenaiResolved = preferredModelOpenai !== undefined ? preferredModelOpenai : await getUserPreference(userId, MODEL_KEYS.openai);
    const rawAnthropicResolved = preferredModelAnthropic !== undefined ? preferredModelAnthropic : await getUserPreference(userId, MODEL_KEYS.anthropic);

    res.json({
      success: true,
      data: {
        preferredProvider: resolvedProvider as 'auto' | 'openai' | 'anthropic',
        preferredModelOpenai: rawOpenaiResolved && String(rawOpenaiResolved).trim() ? String(rawOpenaiResolved).trim() : null,
        preferredModelAnthropic: rawAnthropicResolved && String(rawAnthropicResolved).trim() ? String(rawAnthropicResolved).trim() : null,
      },
      message: 'AI preferences updated successfully'
    });
  } catch (error) {
    logSrvErr('ai_preferences_update_ai_preferences_error', 'Update AI preferences error:', error);
    res.status(500).json({
      error: 'Failed to update AI preferences',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
