/**
 * App badge = number of habits due today that are not yet done.
 *
 * Pure counter + a thin side-effect helper. The hook calls
 * `syncBadgeCount(habits)` whenever the store changes.
 */
import * as Notifications from 'expo-notifications';
import type { Habit } from '../habits/types';
import { isDueToday } from '../habits/frequency';
import { isDoneToday } from '../habits/streak';

export function countPending(habits: Habit[], now: Date = new Date()): number {
  return habits.filter((h) => isDueToday(h, now) && !isDoneToday(h, now)).length;
}

/** Best-effort badge update. Swallows errors (e.g. permission revoked). */
export async function syncBadgeCount(
  habits: Habit[],
  now: Date = new Date(),
): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(countPending(habits, now));
  } catch {
    // ignore — badge isn't worth crashing for
  }
}
