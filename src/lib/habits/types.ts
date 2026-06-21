/**
 * Domain types for the habit tracker.
 *
 * Single source of truth — every module (storage, schedule, hooks, screens)
 * imports `Habit` and `Frequency` from here. Do not redeclare these elsewhere.
 */

/**
 * Weekday numbers follow the expo-notifications convention:
 *   1 = Sunday, 2 = Monday, ... 7 = Saturday
 *
 * This matches `Notifications.WeeklyTriggerInput.weekday` so the array
 * can be passed straight through to the trigger builder.
 */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type DailyFrequency = {
  kind: 'daily';
  hour: number; // 0–23
  minute: number; // 0–59
};

export type WeeklyFrequency = {
  kind: 'weekly';
  weekdays: Weekday[]; // at least one
  hour: number;
  minute: number;
};

export type Frequency = DailyFrequency | WeeklyFrequency;

export type Habit = {
  /** Stable uuid; never reused, never re-keyed. */
  id: string;
  name: string;
  /** Single grapheme emoji or short icon string. */
  emoji: string;
  frequency: Frequency;
  /**
   * Notification IDs returned by expo-notifications when this habit was
   * last scheduled. Cancelled one-by-one on edit/delete — never cancel all.
   * For weekly frequencies, length === weekdays.length.
   */
  notificationIds: string[];
  /** Consecutive-day count; reset to 0 when a day is missed. */
  streak: number;
  /** ISO date (YYYY-MM-DD) of the last completion, or null if never done. */
  lastCompletedISO: string | null;
  /** ISO timestamp of creation; used for sorting / analytics. */
  createdAtISO: string;
};

/**
 * Payload carried inside `Notifications.NotificationContent.data`.
 * Same shape is used by local schedules and push payloads so the tap
 * handler can be reused unchanged.
 */
export type NotificationDeepLink = {
  screen: '/habit';
  habitId: string;
};

/** Storage envelope — wrap the array so we can migrate by bumping `version`. */
export type HabitStoreV1 = {
  version: 1;
  habits: Habit[];
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Type guards                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export function isDaily(f: Frequency): f is DailyFrequency {
  return f.kind === 'daily';
}

export function isWeekly(f: Frequency): f is WeeklyFrequency {
  return f.kind === 'weekly';
}

export function isDeepLinkPayload(
  data: unknown,
): data is NotificationDeepLink {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return d.screen === '/habit' && typeof d.habitId === 'string' && d.habitId.length > 0;
}
