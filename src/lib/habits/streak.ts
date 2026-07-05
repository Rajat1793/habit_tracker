/**
 * Pure streak math. No React, no AsyncStorage, no Date.now() — every entry
 * point takes `today` so tests can pin the clock.
 *
 * Dates are compared as LOCAL `YYYY-MM-DD` strings (never UTC), because a
 * user completing a habit at 11:55 PM local on Monday and again at 12:05 AM
 * Tuesday should count as two separate days regardless of timezone.
 */
import type { Habit } from './types';

const MS_PER_DAY = 86_400_000;

/** Format a Date as `YYYY-MM-DD` in the device's LOCAL timezone. */
export function toLocalDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Whole-day gap between two local-date ISO strings (b - a). */
function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(`${aISO}T00:00:00`);
  const b = new Date(`${bISO}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/**
 * Apply a "done today" tick and return the next snapshot.
 *
 * Rules:
 *   - same day  → no-op (idempotent; double-tap is safe)
 *   - +1 day    → streak += 1
 *   - otherwise → streak reset to 1 (first completion or missed a day)
 */
export function markDone(habit: Habit, today: Date = new Date()): Habit {
  const todayISO = toLocalDateISO(today);
  if (habit.lastCompletedISO === todayISO) return habit;

  let streak = 1;
  if (habit.lastCompletedISO) {
    const gap = daysBetween(habit.lastCompletedISO, todayISO);
    if (gap === 1) streak = habit.streak + 1;
  }

  return { ...habit, streak, lastCompletedISO: todayISO };
}

/**
 * Revert today's completion — for an accidental tap.
 *
 * With no full completion history we reconstruct the prior state:
 *   - streak ≥ 2 → yesterday was part of the run, so step back to yesterday
 *     with `streak − 1`.
 *   - streak ≤ 1 → today was a fresh/reset completion, so there is no known
 *     earlier date; clear it (streak 0, never-completed).
 * No-op if the habit isn't currently marked done today.
 */
export function undoDone(habit: Habit, today: Date = new Date()): Habit {
  const todayISO = toLocalDateISO(today);
  if (habit.lastCompletedISO !== todayISO) return habit;

  if (habit.streak >= 2) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      ...habit,
      streak: habit.streak - 1,
      lastCompletedISO: toLocalDateISO(yesterday),
    };
  }
  return { ...habit, streak: 0, lastCompletedISO: null };
}

/**
 * What the UI should show right now.
 *
 * If the last completion is older than yesterday, the visible streak is 0 —
 * the stored value lags until the next `markDone` actually resets it. This
 * means the home screen always shows the truth without a background job.
 */
export function getDisplayStreak(habit: Habit, today: Date = new Date()): number {
  if (!habit.lastCompletedISO) return 0;
  const todayISO = toLocalDateISO(today);
  const gap = daysBetween(habit.lastCompletedISO, todayISO);
  return gap <= 1 ? habit.streak : 0;
}

/** True if this habit has already been marked done today. */
export function isDoneToday(habit: Habit, today: Date = new Date()): boolean {
  return habit.lastCompletedISO === toLocalDateISO(today);
}
