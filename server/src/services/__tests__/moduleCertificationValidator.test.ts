import { describe, expect, it } from 'vitest';
import { validateModuleCertification } from '../moduleCertificationValidator';

function validManifest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Test Module',
    version: '1.0.0',
    supportedContexts: ['personal', 'business'],
    permissions: ['test-module:read'],
    runtime: { apiVersion: '1.0' },
    frontend: { entryUrl: 'https://cdn.example.com/test/index.html' },
    entryPoint: '/test-module',
    ...overrides,
  };
}

describe('moduleCertificationValidator', () => {
  it('passes a valid minimal third-party manifest', () => {
    const result = validateModuleCertification({
      moduleId: 'test-module',
      manifest: validManifest(),
      permissions: ['test-module:read'],
      isThirdParty: true,
    });
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when required fields are missing', () => {
    const result = validateModuleCertification({
      moduleId: 'Bad_ID',
      manifest: { permissions: [] },
      isThirdParty: true,
    });
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('moduleId'))).toBe(true);
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    expect(result.errors.some((e) => e.includes('version'))).toBe(true);
  });

  it('fails for unsupported dangerous third-party capability', () => {
    const result = validateModuleCertification({
      moduleId: 'test-module',
      manifest: validManifest({
        capabilities: ['in-process', 'read'],
      }),
      isThirdParty: true,
    });
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('in-process'))).toBe(true);
  });

  it('fails when notifications are declared without metadata', () => {
    const result = validateModuleCertification({
      moduleId: 'test-module',
      manifest: validManifest({
        capabilities: ['notifications'],
      }),
      isThirdParty: true,
    });
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('notifications'))).toBe(true);
  });

  it('fails when AI exposure is declared without aiContext', () => {
    const result = validateModuleCertification({
      moduleId: 'test-module',
      manifest: validManifest({
        capabilities: ['ai-assistant'],
      }),
      isThirdParty: true,
    });
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('aiContext'))).toBe(true);
  });

  it('allows warnings without failing validation', () => {
    const result = validateModuleCertification({
      moduleId: 'test-module',
      manifest: validManifest({
        runtime: {},
        entryPoint: undefined,
        routes: undefined,
      }),
      permissions: [],
      isThirdParty: true,
    });
    expect(result.passed).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('passes bundle runtime when entryPath is set without https entryUrl', () => {
    const result = validateModuleCertification({
      moduleId: 'bundle-module',
      manifest: validManifest({
        frontend: { entryUrl: '', entryPath: 'index.html' },
        runtimeType: 'bundle',
      }),
      isThirdParty: true,
    });
    expect(result.passed).toBe(true);
    expect(result.checklist.find((c) => c.id === 'runtime_type')?.message).toBe('bundle');
  });
});
