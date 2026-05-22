import { describe, expect, it } from 'vitest';
import {
  parseContextProviders,
  validateModuleAIContextProviders,
} from '../moduleContextProviderCertification';

describe('moduleContextProviderCertification', () => {
  it('requires at least one provider', () => {
    const issues = validateModuleAIContextProviders('drive', []);
    expect(issues.some((i) => i.code === 'PROVIDERS_REQUIRED')).toBe(true);
  });

  it('accepts valid built-in style providers', () => {
    const providers = [
      {
        name: 'recent_files',
        endpoint: '/api/drive/ai/context/recent',
        cacheDuration: 900_000,
      },
    ];
    expect(parseContextProviders(providers)).toHaveLength(1);
    const issues = validateModuleAIContextProviders('drive', providers);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('rejects invalid endpoint and duplicate names', () => {
    const providers = [
      { name: 'bad', endpoint: '/not-an-api-path', cacheDuration: 900_000 },
      { name: 'bad', endpoint: '/api/drive/ai/context/recent', cacheDuration: 900_000 },
    ];
    const issues = validateModuleAIContextProviders('drive', providers);
    expect(issues.some((i) => i.code === 'PROVIDER_ENDPOINT_INVALID')).toBe(true);
    expect(issues.some((i) => i.code === 'PROVIDER_NAME_DUPLICATE')).toBe(true);
  });

  it('rejects cache duration out of range', () => {
    const issues = validateModuleAIContextProviders('drive', [
      { name: 'recent_files', endpoint: '/api/drive/ai/context/recent', cacheDuration: 1000 },
    ]);
    expect(issues.some((i) => i.code === 'PROVIDER_CACHE_OUT_OF_RANGE')).toBe(true);
  });
});
