import {
  getDisplayStreak,
  isDoneToday,
  markDone,
  toLocalDateISO,
} from '../streak';
import type { Habit } from '../types';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Drink water',
    emoji: '💧',
    frequency: { kind: 'daily', hour: 9, minute: 0 },
    notificationIds: [],
    streak: 0,
    lastCompletedISO: null,
    createdAtISO: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// Local-noon Date avoids any timezone day-boundary flakiness.
function d(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

describe('toLocalDateISO', () => {
  it('formats year/month/day with zero-padding in local tz', () => {
    expect(toLocalDateISO(d('2026-01-09'))).toBe('2026-01-09');
    expect(toLocalDateISO(d('2026-12-31'))).toBe('2026-12-31');
  });
});

describe('markDone', () => {
  it('seeds streak to 1 on first completion ever', () => {
    const next = markDone(makeHabit(), d('2026-06-10'));
    expect(next.streak).toBe(1);
    expect(next.lastCompletedISO).toBe('2026-06-10');
  });

  it('is idempotent within the same local day', () => {
    const seeded = makeHabit({ streak: 4, lastCompletedISO: '2026-06-10' });
    const next = markDone(seeded, d('2026-06-10'));
    expect(next).toBe(seeded); // same reference — no rewrite
    expect(next.streak).toBe(4);
  });

  it('increments streak when completed on the next day', () => {
    const seeded = makeHabit({ streak: 4, lastCompletedISO: '2026-06-10' });
    const next = markDone(seeded, d('2026-06-11'));
    expect(next.streak).toBe(5);
    expect(next.lastCompletedISO).toBe('2026-06-11');
  });

  it('resets streak to 1 when a day is skipped', () => {
    const seeded = makeHabit({ streak: 12, lastCompletedISO: '2026-06-10' });
    const next = markDone(seeded, d('2026-06-12'));
    expect(next.streak).toBe(1);
    expect(next.lastCompletedISO).toBe('2026-06-12');
  });

  it('resets when the gap is large', () => {
    const seeded = makeHabit({ streak: 99, lastCompletedISO: '2026-01-01' });
    const next = markDone(seeded, d('2026-06-01'));
    expect(next.streak).toBe(1);
  });
});

describe('isDoneToday', () => {
  it('true when lastCompletedISO matches today', () => {
    const h = makeHabit({ lastCompletedISO: '2026-06-10' });
    expect(isDoneToday(h, d('2026-06-10'))).toBe(true);
  });
  it('false when lastCompletedISO is yesterday', () => {
    const h = makeHabit({ lastCompletedISO: '2026-06-09' });
    expect(isDoneToday(h, d('2026-06-10'))).toBe(false);
  });
  it('false when never completed', () => {
    expect(isDoneToday(makeHabit(), d('2026-06-10'))).toBe(false);
  });
});

describe('getDisplayStreak', () => {
  it('returns 0 when never completed', () => {
    expect(getDisplayStreak(makeHabit(), d('2026-06-10'))).toBe(0);
  });
  it('returns stored streak when last completion is today', () => {
    const h = makeHabit({ streak: 7, lastCompletedISO: '2026-06-10' });
    expect(getDisplayStreak(h, d('2026-06-10'))).toBe(7);
  });
  it('returns stored streak when last completion was yesterday', () => {
    const h = makeHabit({ streak: 7, lastCompletedISO: '2026-06-09' });
    expect(getDisplayStreak(h, d('2026-06-10'))).toBe(7);
  });
  it('returns 0 when last completion is older than yesterday', () => {
    const h = makeHabit({ streak: 7, lastCompletedISO: '2026-06-08' });
    expect(getDisplayStreak(h, d('2026-06-10'))).toBe(0);
  });
});
