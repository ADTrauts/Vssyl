/**
 * Phase 8B — Version integrity fingerprints for certified Skills.
 * Detect accidental mutation of a certified Skill without version bump.
 */
import { createHash } from 'crypto';
import type { AISkillDefinition } from 'vssyl-shared';
import { getSkillInstructionAsset } from './skillInstructionAssets';
import { IMMUTABLE_AFTER } from './skillLifecycle';

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

export function fingerprintSkillDefinition(def: AISkillDefinition): string {
  const material = {
    key: def.key,
    name: def.name,
    description: def.description,
    version: def.version,
    status: def.status,
    owner: def.owner,
    scope: def.scope,
    intentTypes: def.intentTypes,
    inputSchema: def.inputSchema,
    outputSchema: def.outputSchema,
    capabilityRequest: def.capabilityRequest,
    contextRequirements: def.contextRequirements,
    knowledgeRequirements: def.knowledgeRequirements,
    groundingPolicy: def.groundingPolicy,
    allowedTools: def.allowedTools,
    actionPolicy: def.actionPolicy,
    approvalPolicy: def.approvalPolicy,
    privacyPolicy: def.privacyPolicy,
    evaluationProfile: def.evaluationProfile,
    instructionAssetKey: def.instructionAssetKey,
    implementationKey: def.implementationKey,
    systemsOfRecordRead: def.systemsOfRecordRead,
    customerVisible: def.customerVisible,
    tags: def.tags,
  };
  return createHash('sha256').update(stableStringify(material)).digest('hex');
}

export function fingerprintInstructionAsset(key: string): string | null {
  const asset = getSkillInstructionAsset(key);
  if (!asset) return null;
  return createHash('sha256').update(stableStringify(asset)).digest('hex');
}

export function fingerprintSkillBundle(def: AISkillDefinition): {
  definitionHash: string;
  instructionHash: string | null;
  implementationKey: string;
  bundleHash: string;
} {
  const definitionHash = fingerprintSkillDefinition(def);
  const instructionHash = fingerprintInstructionAsset(def.instructionAssetKey);
  const bundleHash = createHash('sha256')
    .update(
      `${definitionHash}|${instructionHash ?? 'none'}|${def.implementationKey}`
    )
    .digest('hex');
  return {
    definitionHash,
    instructionHash,
    implementationKey: def.implementationKey,
    bundleHash,
  };
}

/** Expected bundle fingerprints for Phase 8B certified pilots (update when version advances). */
export const CERTIFIED_SKILL_BUNDLE_FINGERPRINTS: Record<string, string> = {
  'notebook_page_summary@1.0.0': '',
  'notebook_action_extraction@1.0.0': '',
  'structured_document_extraction@1.0.0': '',
};

let fingerprintsSealed = false;

export function sealCertifiedSkillFingerprints(
  definitions: AISkillDefinition[]
): void {
  if (fingerprintsSealed) return;
  for (const def of definitions) {
    if (!IMMUTABLE_AFTER.has(def.status) && def.status !== 'ACTIVE') continue;
    const key = `${def.key}@${def.version}`;
    const { bundleHash } = fingerprintSkillBundle(def);
    CERTIFIED_SKILL_BUNDLE_FINGERPRINTS[key] = bundleHash;
  }
  fingerprintsSealed = true;
}

export function assertSkillFingerprintIntegrity(
  def: AISkillDefinition
): { ok: true; bundleHash: string } | { ok: false; error: string; expected?: string; actual: string } {
  const key = `${def.key}@${def.version}`;
  const { bundleHash } = fingerprintSkillBundle(def);
  const expected = CERTIFIED_SKILL_BUNDLE_FINGERPRINTS[key];
  if (!expected) {
    return { ok: true, bundleHash };
  }
  if (expected !== bundleHash) {
    return {
      ok: false,
      error: `Skill fingerprint mismatch for ${key}: certified content changed without version bump`,
      expected,
      actual: bundleHash,
    };
  }
  return { ok: true, bundleHash };
}

export function clearSkillFingerprintsForTests(): void {
  fingerprintsSealed = false;
  for (const k of Object.keys(CERTIFIED_SKILL_BUNDLE_FINGERPRINTS)) {
    CERTIFIED_SKILL_BUNDLE_FINGERPRINTS[k] = '';
  }
}
