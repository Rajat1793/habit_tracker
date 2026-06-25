import { isDueToday, todayWeekday } from '../frequency';
import type { Habit } from '../types';

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Workout',
    emoji: '🏋️',
    frequency: { kind: 'daily', hour: 7, minute: 30 },
    notificationIds: [],
    streak: 0,
    lastCompletedISO: null,
    createdAtISO: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// 2026-06-08 is a Monday → JS getDay()=1 → our 1-indexed Sunday-first = 2.
// 2026-06-07 is a Sunday → JS getDay()=0 → 1.
// 2026-06-13 is a Saturday → JS getDay()=6 → 7.
function d(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

describe('todayWeekday', () => {
  it('returns 1 for Sunday', () => {
    expect(todayWeekday(d('2026-06-07'))).toBe(1);
  });
  it('returns 2 for Monday', () => {
    expect(todayWeekday(d('2026-06-08'))).toBe(2);
  });
  it('returns 7 for Saturday', () => {
    expect(todayWeekday(d('2026-06-13'))).toBe(7);
  });
});

describe('isDueToday', () => {
  it('daily habits are always due', () => {
    expect(isDueToday(habit(), d('2026-06-07'))).toBe(true);
    expect(isDueToday(habit(), d('2026-06-13'))).toBe(true);
  });

  it('weekly habit due on its scheduled weekday', () => {
    const h = habit({
      frequency: { kind: 'weekly', weekdays: [2, 4, 6], hour: 7, minute: 0 },
    });
    expect(isDueToday(h, d('2026-06-08'))).toBe(true); // Mon
    expect(isDueToday(h, d('2026-06-10'))).toBe(true); // Wed
    expect(isDueToday(h, d('2026-06-12'))).toBe(true); // Fri
  });

  it('weekly habit not due on other days', () => {
    const h = habit({
      frequency: { kind: 'weekly', weekdays: [2, 4, 6], hour: 7, minute: 0 },
    });
    expect(isDueToday(h, d('2026-06-07'))).toBe(false); // Sun
    expect(isDueToday(h, d('2026-06-09'))).toBe(false); // Tue
    expect(isDueToday(h, d('2026-06-13'))).toBe(false); // Sat
  });

  it('weekly habit with empty weekdays is never due', () => {
    const h = habit({
      frequency: { kind: 'weekly', weekdays: [], hour: 7, minute: 0 },
    });
    expect(isDueToday(h, d('2026-06-08'))).toBe(false);
  });
});
