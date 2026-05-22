import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { validateModuleAIContextProviders } from '../../ai/services/moduleContextProviderCertification';
import { validateModuleCertification } from '../moduleCertificationValidator';

const MODULE_ID = 'demo-ai-partner';

function loadFullAiContractManifest(): Record<string, unknown> {
  const filePath = path.resolve(
    __dirname,
    '../../../../docs/test-modules/full-ai-contract-module.json'
  );
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
    manifest: Record<string, unknown>;
  };
  return raw.manifest;
}

describe('full-ai-contract-module.json (Phase 4D)', () => {
  it('passes structural module certification for third-party marketplace', () => {
    const manifest = loadFullAiContractManifest();
    const result = validateModuleCertification({
      moduleId: MODULE_ID,
      manifest,
      permissions: ['demo-ai-partner:read', 'demo-ai-partner:write'],
      isThirdParty: true,
    });

    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.checklist.find((c) => c.id === 'ai_context')?.status).toBe('pass');
    expect(result.checklist.find((c) => c.id === 'notifications_meta')?.status).toBe('pass');
  });

  it('passes AI context provider structural validation (G1/G2)', () => {
    const manifest = loadFullAiContractManifest();
    const aiContext = manifest.aiContext as Record<string, unknown>;
    const issues = validateModuleAIContextProviders(MODULE_ID, aiContext.contextProviders);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('declares webhook executor with signing secret (G3)', () => {
    const manifest = loadFullAiContractManifest();
    const executor = manifest.aiActionExecutor as Record<string, unknown>;
    expect(typeof executor.executorUrl).toBe('string');
    expect(typeof executor.signingSecret).toBe('string');
    expect(Array.isArray(executor.supportedOperations)).toBe(true);
    expect((executor.supportedOperations as string[]).length).toBeGreaterThan(0);
  });

  it('does not declare in-process capabilities (G4)', () => {
    const manifest = loadFullAiContractManifest();
    const caps = [
      ...(Array.isArray(manifest.capabilities) ? manifest.capabilities : []),
      ...(Array.isArray(manifest.permissions) ? manifest.permissions : []),
    ].map((c) => String(c).toLowerCase());

    expect(caps.some((c) => c.includes('in-process') || c.includes('in_process'))).toBe(false);
  });
});
