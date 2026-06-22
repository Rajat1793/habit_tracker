/**
 * Schedule + cancel local reminders for a habit.
 *
 * Contract:
 * - `scheduleHabit` returns the notification IDs to persist on the habit.
 * - `cancelHabit` cancels ONLY the IDs stored on that habit — never
 *   `cancelAllScheduledNotificationsAsync` in product code.
 * - `rescheduleHabit` is the edit pathway: cancel old, schedule new.
 */
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { isDaily, isWeekly, type Habit, type NotificationDeepLink } from '../habits/types';
import { HABIT_CHANNEL_ID, getPermissions } from './setup';

function buildContent(habit: Habit): Notifications.NotificationContentInput {
  const data: NotificationDeepLink = { screen: '/habit', habitId: habit.id };
  return {
    title: `${habit.emoji} Time for ${habit.name}`,
    body: 'Tap to log it.',
    data,
    sound: 'default',
  };
}

/** Schedule reminders for a habit; returns IDs the caller must persist. */
export async function scheduleHabit(habit: Habit): Promise<string[]> {
  const perm = await getPermissions();
  if (!perm.granted) return [];

  const content = buildContent(habit);
  const ids: string[] = [];

  if (isDaily(habit.frequency)) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: habit.frequency.hour,
        minute: habit.frequency.minute,
        channelId: HABIT_CHANNEL_ID,
      },
    });
    ids.push(id);
  } else if (isWeekly(habit.frequency)) {
    for (const weekday of habit.frequency.weekdays) {
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: habit.frequency.hour,
          minute: habit.frequency.minute,
          channelId: HABIT_CHANNEL_ID,
        },
      });
      ids.push(id);
    }
  }

  return ids;
}

/** Cancel every notification id stored on this habit. Safe if already gone. */
export async function cancelHabit(habit: Habit): Promise<void> {
  for (const id of habit.notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // ID may already be fired/cancelled; ignore.
    }
  }
}

/**
 * Edit pathway: cancel the OLD habit's IDs, schedule the NEXT draft,
 * return the new IDs to persist.
 */
export async function rescheduleHabit(
  oldHabit: Habit,
  nextDraft: Habit,
): Promise<string[]> {
  await cancelHabit(oldHabit);
  return scheduleHabit(nextDraft);
}
