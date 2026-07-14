/**
 * Phase 8 — Customer-facing Skill API (list/read/execute).
 * Mount: /api/ai/skills
 */
import express from 'express';
import type { Request } from 'express';
import {
  AI_SKILLS_POLICY_VERSION,
  type AISkillExecutionRequest,
} from 'vssyl-shared';
import {
  getSkillDefinition,
  listSkillRegistryItems,
  listVersionsForKey,
} from '../ai/skills/skillRegistry';
import { executeSkill } from '../ai/skills/skillRunner';
import { summarizeSkillMetrics } from '../ai/skills/skillMetrics';

const router: express.Router = express.Router();

function userIdOf(req: Request): string | undefined {
  const u = req.user as { id?: string; userId?: string } | undefined;
  return u?.id ?? u?.userId;
}

function businessIdOf(req: Request): string | null {
  const bodyBiz =
    req.body && typeof req.body === 'object' && typeof (req.body as { businessId?: unknown }).businessId === 'string'
      ? (req.body as { businessId: string }).businessId
      : undefined;
  const q = req.query.businessId;
  const qBiz = typeof q === 'string' ? q : undefined;
  return bodyBiz ?? qBiz ?? null;
}

/** List customer-visible active Skills. */
router.get('/', (_req, res) => {
  const items = listSkillRegistryItems({ customerVisibleOnly: true }).filter(
    (i) => i.status === 'ACTIVE' || i.status === 'CERTIFIED'
  );
  return res.json({
    success: true,
    data: {
      policyVersion: AI_SKILLS_POLICY_VERSION,
      items,
    },
  });
});

/** Read Skill metadata (customer-visible only). */
router.get('/:key', (req, res) => {
  const def = getSkillDefinition(req.params.key);
  if (!def || !def.customerVisible || def.internalOnly) {
    return res.status(404).json({ success: false, error: 'Skill not found' });
  }
  if (def.status === 'DRAFT' || def.status === 'REVIEW' || def.status === 'RETIRED') {
    return res.status(404).json({ success: false, error: 'Skill not found' });
  }
  return res.json({
    success: true,
    data: {
      key: def.key,
      name: def.name,
      description: def.description,
      version: def.version,
      status: def.status,
      scope: def.scope,
      intentTypes: def.intentTypes,
      inputSchema: def.inputSchema,
      outputSchema: def.outputSchema,
      capabilityRequest: def.capabilityRequest,
      tags: def.tags,
      customerVisible: def.customerVisible,
    },
  });
});

/** Execute an authorized active Skill. */
router.post('/:key/execute', async (req, res) => {
  const userId = userIdOf(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const def = getSkillDefinition(req.params.key);
  if (!def || !def.customerVisible) {
    return res.status(404).json({ success: false, error: 'Skill not found' });
  }

  const version =
    typeof req.body?.version === 'string' ? req.body.version : undefined;
  const input =
    req.body?.input && typeof req.body.input === 'object' && !Array.isArray(req.body.input)
      ? (req.body.input as Record<string, unknown>)
      : {};
  const moduleId =
    typeof req.body?.moduleId === 'string' ? req.body.moduleId : undefined;
  const conversationId =
    typeof req.body?.conversationId === 'string' ? req.body.conversationId : undefined;

  const payload: AISkillExecutionRequest = {
    skillKey: req.params.key,
    version,
    input,
    userId,
    businessId: businessIdOf(req),
    moduleId,
    conversationId,
  };

  const result = await executeSkill(payload);
  const statusCode = result.status === 'REJECTED' ? 400 : result.ok ? 200 : 502;
  return res.status(statusCode).json({
    success: result.ok,
    data: result,
    error: result.error,
  });
});

/** Lightweight execution/quality summary for a visible Skill (no draft internals). */
router.get('/:key/quality', (req, res) => {
  const def = getSkillDefinition(req.params.key);
  if (!def || !def.customerVisible) {
    return res.status(404).json({ success: false, error: 'Skill not found' });
  }
  return res.json({
    success: true,
    data: {
      skillKey: def.key,
      activeVersion: def.version,
      metrics: summarizeSkillMetrics(def.key),
    },
  });
});

/** Versions list — customer sees active only (not draft). Operator uses admin API. */
router.get('/:key/versions', (req, res) => {
  const versions = listVersionsForKey(req.params.key).filter(
    (d) => d.customerVisible && (d.status === 'ACTIVE' || d.status === 'CERTIFIED' || d.status === 'DEPRECATED')
  );
  if (versions.length === 0) {
    return res.status(404).json({ success: false, error: 'Skill not found' });
  }
  return res.json({
    success: true,
    data: {
      items: versions.map((d) => ({
        key: d.key,
        version: d.version,
        status: d.status,
        activatedAt: d.activatedAt,
        deprecatedAt: d.deprecatedAt,
      })),
    },
  });
});

export default router;
