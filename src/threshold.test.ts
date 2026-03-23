import { describe, it, expect } from 'vitest';
import { shouldFail } from './threshold.js';

describe('shouldFail', () => {
  const make = (severity: Record<string, number>) => ({
    toolsBySeverity: { Low: 0, Medium: 0, High: 0, Critical: 0, ...severity },
  });

  it('returns false when no threshold configured (empty string)', () => {
    expect(shouldFail(make({ High: 3 }), '')).toBe(false);
  });

  it('returns false when no findings at or above threshold', () => {
    expect(shouldFail(make({ Low: 5, Medium: 2 }), 'High')).toBe(false);
  });

  it('returns true when findings exist at threshold severity', () => {
    expect(shouldFail(make({ High: 1 }), 'High')).toBe(true);
  });

  it('returns true when findings exist above threshold severity', () => {
    expect(shouldFail(make({ Critical: 2 }), 'High')).toBe(true);
  });

  it('shouldFail("High", { High: 0, Critical: 2 }) returns true', () => {
    expect(shouldFail(make({ High: 0, Critical: 2 }), 'High')).toBe(true);
  });

  it('shouldFail("Critical", { High: 5, Critical: 0 }) returns false', () => {
    expect(shouldFail(make({ High: 5, Critical: 0 }), 'Critical')).toBe(false);
  });

  it('handles invalid threshold string gracefully (returns false)', () => {
    expect(shouldFail(make({ High: 3 }), 'NotASeverity')).toBe(false);
  });
});
