/**
 * Phase 8 — Register built-in Skills at startup (code-first).
 */
import { logger } from '../../lib/logger';
import { PHASE8_PILOT_SKILLS } from './pilotSkillDefinitions';
import { registerSkillDefinition, clearSkillRegistryForTests } from './skillRegistry';
import {
  clearSkillImplementationsForTests,
  registerPilotImplementations,
} from './skillImplementations';
import {
  assertSkillFingerprintIntegrity,
  clearSkillFingerprintsForTests,
  sealCertifiedSkillFingerprints,
} from './skillFingerprints';

let registered = false;

export async function registerBuiltInSkills(): Promise<void> {
  if (registered) return;
  for (const def of PHASE8_PILOT_SKILLS) {
    registerSkillDefinition(def);
  }
  await registerPilotImplementations();
  sealCertifiedSkillFingerprints(PHASE8_PILOT_SKILLS);
  for (const def of PHASE8_PILOT_SKILLS) {
    const check = assertSkillFingerprintIntegrity(def);
    if (!check.ok) {
      throw new Error(check.error);
    }
  }
  registered = true;
  logger.info('Built-in AI Skills registered', {
    operation: 'skills.registerBuiltIn',
    count: PHASE8_PILOT_SKILLS.length,
    keys: PHASE8_PILOT_SKILLS.map((s) => `${s.key}@${s.version}`),
  });
}

/** Test helper: reset and re-register pilots. */
export async function resetAndRegisterBuiltInSkillsForTests(): Promise<void> {
  clearSkillRegistryForTests();
  clearSkillImplementationsForTests();
  clearSkillFingerprintsForTests();
  registered = false;
  await registerBuiltInSkills();
}
