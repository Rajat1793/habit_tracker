/**
 * Pure streak math. Filled in by todo #14.
 *
 * Kept pure (no React, no AsyncStorage, no Date.now() side effects in the
 * core function signatures) so it stays trivially testable.
 */
import type { Habit } from './types';

/**
 * Apply a "done today" tick to a habit and return the next snapshot.
 * Idempotent for the same day; +1 on consecutive day; reset to 1 on a miss.
 */
export function markDone(_habit: Habit, _today: Date = new Date()): Habit {
  throw new Error('not implemented — see todo #14');
}

/**
 * What the UI should show right now.
 * If the last completion is older than yesterday, the visible streak is 0
 * (the stored value lags until the next `markDone`).
 */
export function getDisplayStreak(_habit: Habit, _today: Date = new Date()): number {
  throw new Error('not implemented — see todo #14');
}

/** True if this habit has already been marked done today. */
export function isDoneToday(_habit: Habit, _today: Date = new Date()): boolean {
  throw new Error('not implemented — see todo #14');
}
