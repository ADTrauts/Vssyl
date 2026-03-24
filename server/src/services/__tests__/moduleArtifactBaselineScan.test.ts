import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { runBaselineZipScan } from '../moduleArtifactBaselineScan';

function zipToBuffer(files: Record<string, Uint8Array>): Buffer {
  return Buffer.from(zipSync(files));
}

describe('runBaselineZipScan', () => {
  it('passes for minimal zip with .html entry', () => {
    const buf = zipToBuffer({
      'index.html': new TextEncoder().encode('<!doctype html><html><body>ok</body></html>'),
    });
    const r = runBaselineZipScan(buf);
    expect(r.scanStatus).toBe('PASSED');
    expect(r.scanSummary).toMatchObject({ fileCount: 1 });
  });

  it('fails when no html file present', () => {
    const buf = zipToBuffer({
      'readme.txt': new TextEncoder().encode('hello'),
    });
    const r = runBaselineZipScan(buf);
    expect(r.scanStatus).toBe('FAILED');
    expect(r.scanSummary).toMatchObject({ reason: 'no_html_entry' });
  });

  it('fails on unsafe path segments', () => {
    const buf = zipToBuffer({
      '../evil.html': new TextEncoder().encode('<!doctype html><html></html>'),
    });
    const r = runBaselineZipScan(buf);
    expect(r.scanStatus).toBe('FAILED');
    expect(r.scanSummary).toMatchObject({ reason: 'unsafe_path' });
  });

  it('fails on empty zip', () => {
    const buf = zipToBuffer({});
    const r = runBaselineZipScan(buf);
    expect(r.scanStatus).toBe('FAILED');
    expect(r.scanSummary).toMatchObject({ reason: 'empty_zip' });
  });
});
