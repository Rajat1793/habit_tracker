/**
 * Schedule + cancel local reminders for a habit. Filled in by todo #5.
 *
 * Contract:
 * - `scheduleHabit` returns the notification IDs to persist on the habit.
 * - `cancelHabit` cancels ONLY the IDs stored on that habit — never
 *   `cancelAllScheduledNotificationsAsync` in product code.
 * - `rescheduleHabit` is the edit pathway: cancel old, schedule new.
 */
import type { Habit } from '../habits/types';

/** Schedule reminders for a habit; returns IDs the caller must persist. */
export async function scheduleHabit(_habit: Habit): Promise<string[]> {
  throw new Error('not implemented — see todo #5');
}

/** Cancel every notification id stored on this habit. Safe if already gone. */
export async function cancelHabit(_habit: Habit): Promise<void> {
  throw new Error('not implemented — see todo #5');
}

/**
 * Edit pathway: cancel the OLD habit's IDs, schedule the NEXT draft,
 * return the new IDs to persist.
 */
export async function rescheduleHabit(
  _oldHabit: Habit,
  _nextDraft: Habit,
): Promise<string[]> {
  throw new Error('not implemented — see todo #5');
}
