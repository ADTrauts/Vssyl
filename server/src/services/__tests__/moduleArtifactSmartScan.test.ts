import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { runSmartModuleScan } from '../moduleArtifactSmartScan';

function zipToBuffer(files: Record<string, Uint8Array>): Buffer {
  return Buffer.from(zipSync(files));
}

describe('runSmartModuleScan', () => {
  it('returns PASS for simple benign bundle', () => {
    const buf = zipToBuffer({
      'index.html': new TextEncoder().encode('<!doctype html><html><body>ok</body></html>'),
      'main.js': new TextEncoder().encode('console.log("safe");'),
    });
    const result = runSmartModuleScan(buf);
    expect(result.verdict).toBe('PASS');
    expect(result.riskScore).toBe(0);
  });

  it('returns FAIL when executable artifact is present', () => {
    const buf = zipToBuffer({
      'payload.exe': new TextEncoder().encode('MZ'),
      'main.js': new TextEncoder().encode('console.log("x");'),
    });
    const result = runSmartModuleScan(buf);
    expect(result.verdict).toBe('FAIL');
    expect(result.findings.some(f => f.code === 'executable_artifact')).toBe(true);
  });

});
