import { describe, it, expect } from 'vitest';
import { validateModuleHostedUrl } from '../moduleHostedUrlValidation';

describe('validateModuleHostedUrl', () => {
  it('returns valid with warning when entryUrl is missing', () => {
    const r = validateModuleHostedUrl({
      frontend: { entryUrl: '' },
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings.some(w => w.includes('No hosted frontend.entryUrl'))).toBe(true);
  });

  it('returns valid with warning when frontend is missing', () => {
    const r = validateModuleHostedUrl({});
    expect(r.isValid).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('accepts valid HTTPS URL', () => {
    const r = validateModuleHostedUrl({
      frontend: { entryUrl: 'https://cdn.example.com/module/index.html' },
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it('rejects HTTP URL', () => {
    const r = validateModuleHostedUrl({
      frontend: { entryUrl: 'http://evil.com/x.html' },
    });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('frontend.entryUrl must use HTTPS');
  });

  it('rejects malformed URL', () => {
    const r = validateModuleHostedUrl({
      frontend: { entryUrl: 'not a url' },
    });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Invalid frontend.entryUrl format');
  });

  it('warns on localhost HTTPS', () => {
    const r = validateModuleHostedUrl({
      frontend: { entryUrl: 'https://localhost:3000/app.html' },
    });
    expect(r.isValid).toBe(true);
    expect(r.warnings.some(w => w.includes('Localhost'))).toBe(true);
  });

  it('warns on URL shorteners', () => {
    const r = validateModuleHostedUrl({
      frontend: { entryUrl: 'https://bit.ly/abc' },
    });
    expect(r.isValid).toBe(true);
    expect(r.warnings.some(w => w.includes('shortening'))).toBe(true);
  });
});
