/**
 * Notification categories + snooze handler.
 *
 * A "category" attaches action buttons (Done, Snooze 10m) to every habit
 * reminder. The OS shows them as long-press / expanded actions. Tapping an
 * action fires `addNotificationResponseReceivedListener` with a non-default
 * `actionIdentifier`, which `useNotificationRouter` then dispatches.
 */
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { getById } from '@/lib/habits/storage';
import type { NotificationDeepLink } from '@/lib/habits/types';
import { HABIT_CHANNEL_ID } from './setup';

export const HABIT_CATEGORY_ID = 'habit-actions';

export const ACTION_DONE = 'DONE';
export const ACTION_SNOOZE_10 = 'SNOOZE_10';

let categoryInstalled = false;

/**
 * Register the action buttons. Idempotent — safe to call on every mount.
 *
 * `opensAppToForeground: false` keeps the user in their previous context;
 * we handle the action in the response listener and update state silently.
 */
export async function ensureNotificationCategory(): Promise<void> {
  if (categoryInstalled) return;
  // Notification categories (action buttons) are a native-only feature;
  // expo-notifications has no web implementation, so skip on web.
  if (Platform.OS === 'web') {
    categoryInstalled = true;
    return;
  }
  await Notifications.setNotificationCategoryAsync(HABIT_CATEGORY_ID, [
    {
      identifier: ACTION_DONE,
      buttonTitle: '✓ Done',
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_SNOOZE_10,
      buttonTitle: 'Snooze 10m',
      options: { opensAppToForeground: false },
    },
  ]);
  categoryInstalled = true;
}

/**
 * Schedule a one-shot reminder for the same habit, `minutes` from now.
 * Used when the user taps the Snooze action button.
 *
 * Returns the new notification id (not persisted on the habit because
 * snoozes are transient — they fire once and vanish).
 */
export async function snoozeHabit(
  habitId: string,
  minutes: number,
): Promise<string | null> {
  const habit = await getById(habitId);
  if (!habit) return null;

  const data: NotificationDeepLink = { screen: '/habit', habitId };
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${habit.emoji} ${habit.name} (snoozed ${minutes}m)`,
      body: 'Tap to log it.',
      data,
      sound: 'default',
      categoryIdentifier: HABIT_CATEGORY_ID,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, minutes * 60),
      channelId: HABIT_CHANNEL_ID,
    },
  });
}
