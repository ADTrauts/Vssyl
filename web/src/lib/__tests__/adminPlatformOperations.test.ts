import { describe, expect, it } from 'vitest';
import {
  formatUptime,
  OPERATOR_STATUS_LABEL,
  operatorStatusDotClass,
  operatorStatusTextClass,
} from '../adminPlatformOperations';

describe('adminPlatformOperations', () => {
  it('maps operator status labels', () => {
    expect(OPERATOR_STATUS_LABEL.healthy).toBe('Healthy');
    expect(OPERATOR_STATUS_LABEL.offline).toBe('Offline');
    expect(OPERATOR_STATUS_LABEL.warning).toBe('Warning');
    expect(OPERATOR_STATUS_LABEL.unknown).toBe('Unknown');
  });

  it('returns dot classes per status', () => {
    expect(operatorStatusDotClass('healthy')).toContain('green');
    expect(operatorStatusDotClass('offline')).toContain('red');
    expect(operatorStatusDotClass('unknown')).toContain('gray');
  });

  it('returns text classes per status', () => {
    expect(operatorStatusTextClass('healthy')).toContain('green');
    expect(operatorStatusTextClass('offline')).toContain('red');
  });

  it('formats uptime for operators', () => {
    expect(formatUptime(45)).toBe('45s');
    expect(formatUptime(120)).toBe('2m');
    expect(formatUptime(3700)).toMatch(/1h/);
  });
});
