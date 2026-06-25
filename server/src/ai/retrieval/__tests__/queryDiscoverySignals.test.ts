import { describe, expect, it } from 'vitest';
import { detectQueryDiscoverySignals } from '../queryDiscoverySignals';

describe('detectQueryDiscoverySignals', () => {
  it('detects file find queries', () => {
    const result = detectQueryDiscoverySignals('find my budget spreadsheet');
    expect(result.eligible).toBe(true);
    expect(result.signals).toContain('find_verb');
    expect(result.domainHints).toContain('drive');
  });

  it('detects task assistance queries', () => {
    const result = detectQueryDiscoverySignals('where is my todo about onboarding');
    expect(result.eligible).toBe(true);
    expect(result.domainHints).toContain('todo');
  });

  it('detects HR and scheduling queries', () => {
    const hr = detectQueryDiscoverySignals('find employee Alice time off');
    expect(hr.eligible).toBe(true);
    expect(hr.domainHints).toContain('hr');

    const sched = detectQueryDiscoverySignals('find my Tuesday shift schedule');
    expect(sched.eligible).toBe(true);
    expect(sched.domainHints).toContain('scheduling');
  });

  it('rejects generic chat without find verb', () => {
    const result = detectQueryDiscoverySignals('hello how are you');
    expect(result.eligible).toBe(false);
  });
});
