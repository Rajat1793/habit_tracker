/**
 * Frequency helpers shared by screens and the badge effect.
 * Pure — no I/O, no React.
 */
import { isDaily, isWeekly, type Habit, type Weekday } from './types';

/** Today's weekday in expo-notifications convention (1=Sun..7=Sat). */
export function todayWeekday(now: Date = new Date()): Weekday {
  return ((now.getDay() + 1) as Weekday);
}

/** True if this habit is on the schedule for `now`. */
export function isDueToday(habit: Habit, now: Date = new Date()): boolean {
  if (isDaily(habit.frequency)) return true;
  if (isWeekly(habit.frequency)) {
    return habit.frequency.weekdays.includes(todayWeekday(now));
  }
  return false;
}
