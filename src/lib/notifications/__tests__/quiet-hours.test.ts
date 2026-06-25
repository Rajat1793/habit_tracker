import { DEFAULT_QUIET_HOURS, isInQuietHours, type QuietHours } from '../quiet-hours';

function q(overrides: Partial<QuietHours>): QuietHours {
  return { ...DEFAULT_QUIET_HOURS, ...overrides };
}

describe('isInQuietHours', () => {
  it('returns false when disabled, regardless of hour', () => {
    const cfg = q({ enabled: false, startHour: 22, endHour: 7 });
    for (let h = 0; h < 24; h++) {
      expect(isInQuietHours(h, cfg)).toBe(false);
    }
  });

  it('returns false when start === end (empty window)', () => {
    const cfg = q({ enabled: true, startHour: 5, endHour: 5 });
    expect(isInQuietHours(5, cfg)).toBe(false);
    expect(isInQuietHours(12, cfg)).toBe(false);
  });

  it('non-wrapping window includes start, excludes end', () => {
    const cfg = q({ enabled: true, startHour: 13, endHour: 17 });
    expect(isInQuietHours(12, cfg)).toBe(false);
    expect(isInQuietHours(13, cfg)).toBe(true);
    expect(isInQuietHours(16, cfg)).toBe(true);
    expect(isInQuietHours(17, cfg)).toBe(false);
    expect(isInQuietHours(23, cfg)).toBe(false);
  });

  it('wrap-around window (22 → 7) covers late evening and early morning', () => {
    const cfg = q({ enabled: true, startHour: 22, endHour: 7 });
    expect(isInQuietHours(21, cfg)).toBe(false);
    expect(isInQuietHours(22, cfg)).toBe(true);
    expect(isInQuietHours(23, cfg)).toBe(true);
    expect(isInQuietHours(0, cfg)).toBe(true);
    expect(isInQuietHours(6, cfg)).toBe(true);
    expect(isInQuietHours(7, cfg)).toBe(false);
    expect(isInQuietHours(12, cfg)).toBe(false);
  });

  it('wrap-around with end at midnight rollover handled', () => {
    const cfg = q({ enabled: true, startHour: 23, endHour: 1 });
    expect(isInQuietHours(22, cfg)).toBe(false);
    expect(isInQuietHours(23, cfg)).toBe(true);
    expect(isInQuietHours(0, cfg)).toBe(true);
    expect(isInQuietHours(1, cfg)).toBe(false);
  });
});
