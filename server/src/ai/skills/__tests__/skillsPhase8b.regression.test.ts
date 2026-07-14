/**
 * Phase 8B — Pilot Skill regression fixtures (planner + output schema; no providers).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSkillRegistryForTests,
  getSkillDefinition,
  registerSkillDefinition,
} from '../skillRegistry';
import { createSkillExecutionPlan } from '../skillPlanner';
import { validateSkillOutput } from '../skillOutputValidation';
import { PHASE8_PILOT_SKILLS } from '../pilotSkillDefinitions';
import {
  assertSkillFingerprintIntegrity,
  clearSkillFingerprintsForTests,
  fingerprintSkillBundle,
  sealCertifiedSkillFingerprints,
} from '../skillFingerprints';

interface FixtureCase {
  id: string;
  input: Record<string, unknown>;
  expectPlanOk: boolean;
  mockOutput?: Record<string, unknown>;
  expectOutputValid?: boolean;
  assertNoMutationTools?: boolean;
}

interface FixtureFile {
  skillKey: string;
  skillVersion: string;
  cases: FixtureCase[];
}

function loadFixture(name: string): FixtureFile {
  const path = join(__dirname, '..', '__fixtures__', name);
  return JSON.parse(readFileSync(path, 'utf8')) as FixtureFile;
}

describe('Phase 8B pilot regression fixtures', () => {
  beforeEach(() => {
    clearSkillRegistryForTests();
    clearSkillFingerprintsForTests();
    for (const def of PHASE8_PILOT_SKILLS) {
      registerSkillDefinition(def);
    }
    sealCertifiedSkillFingerprints(PHASE8_PILOT_SKILLS);
  });

  for (const file of [
    'notebook_page_summary.regression.json',
    'notebook_action_extraction.regression.json',
    'structured_document_extraction.regression.json',
  ]) {
    const fixture = loadFixture(file);
    describe(fixture.skillKey, () => {
      for (const c of fixture.cases) {
        it(c.id, () => {
          const def = getSkillDefinition(fixture.skillKey, fixture.skillVersion);
          expect(def).toBeDefined();
          if (!def) return;

          if (c.assertNoMutationTools) {
            expect(def.actionPolicy.mutationsDefaultOff).toBe(true);
            expect(def.actionPolicy.maxToolRounds).toBe(0);
          }

          const planned = createSkillExecutionPlan({
            definition: def,
            input: c.input,
            userId: 'fixture-user',
          });
          expect(planned.ok).toBe(c.expectPlanOk);

          if (c.expectPlanOk && c.mockOutput && planned.ok) {
            const validation = validateSkillOutput(c.mockOutput, planned.plan.outputSchema);
            expect(validation.ok).toBe(c.expectOutputValid !== false);
          }
        });
      }
    });
  }

  it('seals fingerprints and detects unversioned mutation', () => {
    const def = getSkillDefinition('notebook_page_summary', '1.0.0');
    expect(def).toBeDefined();
    if (!def) return;
    const ok = assertSkillFingerprintIntegrity(def);
    expect(ok.ok).toBe(true);

    const mutated = { ...def, description: `${def.description} MUTATED` };
    const check = assertSkillFingerprintIntegrity(mutated);
    expect(check.ok).toBe(false);
    expect(fingerprintSkillBundle(def).bundleHash).not.toBe(
      fingerprintSkillBundle(mutated).bundleHash
    );
  });
});
