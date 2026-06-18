import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CONTEXT_PATH = join(
  __dirname,
  '../../contexts/BusinessConfigurationContext.tsx',
);

describe('BusinessConfigurationContext realtime contract (BA-1D)', () => {
  const source = readFileSync(CONTEXT_PATH, 'utf8');

  it('subscribes to business:config:updated socket event', () => {
    expect(source).toContain("socket.on('business:config:updated'");
    expect(source).toMatch(/payload\?\.businessId/);
  });

  it('uses shared realtime client with dedicated holder id', () => {
    expect(source).toContain('acquireRealtimeConnection');
    expect(source).toContain('releaseRealtimeConnection');
    expect(source).toContain('business-config-ws');
  });

  it('joins business room after socket connects', () => {
    expect(source).toContain("socket.emit('join_business', businessId)");
  });

  it('reloads configuration when matching businessId is broadcast', () => {
    expect(source).toMatch(/loadConfigurationRef\.current\(activeBusinessId\)/);
  });

  it('retains polling fallback when realtime is unavailable', () => {
    expect(source).toContain('startPolling');
    expect(source).toContain('stopPolling');
    expect(source).toContain('setUsePolling(true)');
    expect(source).toMatch(/pollingInterval\s*=\s*30000/);
  });

  it('auto-subscribes on business context mount and cleans up on unmount', () => {
    expect(source).toContain('subscribeToUpdates(targetBusinessId)');
    expect(source).toContain('unsubscribeFromUpdates()');
  });
});
