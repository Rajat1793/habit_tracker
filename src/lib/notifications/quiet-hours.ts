/**
 * Quiet hours — a user-configured do-not-disturb window.
 *
 * When a habit reminder would fire inside the window, we still schedule it
 * (so the user sees it in the list / can tap into the app), but with `sound`
 * suppressed and Android priority lowered so it doesn't interrupt.
 *
 * Window is inclusive of `startHour` and exclusive of `endHour`. Wrap-around
 * across midnight is supported (e.g. 22 → 7 covers 22, 23, 0, 1, 2, 3, 4, 5, 6).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const QUIET_HOURS_KEY = '@streaks/quietHours';

export type QuietHours = {
  enabled: boolean;
  startHour: number; // 0–23
  endHour: number;   // 0–23
};

export const DEFAULT_QUIET_HOURS: QuietHours = {
  enabled: false,
  startHour: 22,
  endHour: 7,
};

export async function loadQuietHours(): Promise<QuietHours> {
  const raw = await AsyncStorage.getItem(QUIET_HOURS_KEY);
  if (!raw) return DEFAULT_QUIET_HOURS;
  try {
    const parsed = JSON.parse(raw) as QuietHours;
    if (
      typeof parsed.enabled === 'boolean' &&
      Number.isInteger(parsed.startHour) &&
      Number.isInteger(parsed.endHour)
    ) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return DEFAULT_QUIET_HOURS;
}

export async function saveQuietHours(q: QuietHours): Promise<void> {
  await AsyncStorage.setItem(QUIET_HOURS_KEY, JSON.stringify(q));
}

/** True if `hour` falls inside the configured window. */
export function isInQuietHours(hour: number, q: QuietHours): boolean {
  if (!q.enabled) return false;
  if (q.startHour === q.endHour) return false;
  if (q.startHour < q.endHour) {
    return hour >= q.startHour && hour < q.endHour;
  }
  // wrap-around (e.g. 22 → 7)
  return hour >= q.startHour || hour < q.endHour;
}
