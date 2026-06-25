/**
 * JSON backup format for habits.
 *
 * Versioned (matches the storage envelope) so future migrations can detect
 * older payloads. Restore replaces the entire store atomically — we don't
 * try to merge by id because timestamps and notification IDs would conflict.
 */
import type { Habit, HabitStoreV1 } from './types';
import { isDaily, isWeekly } from './types';

export const BACKUP_FORMAT = 'streaks.backup.v1';

export type BackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  version: 1;
  exportedAt: string; // ISO date
  habits: Habit[];
};

export function buildBackup(habits: Habit[]): BackupEnvelope {
  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    habits,
  };
}

export function serializeBackup(habits: Habit[]): string {
  return JSON.stringify(buildBackup(habits), null, 2);
}

function isHabit(x: unknown): x is Habit {
  if (!x || typeof x !== 'object') return false;
  const h = x as Record<string, unknown>;
  if (typeof h.id !== 'string') return false;
  if (typeof h.name !== 'string') return false;
  if (typeof h.emoji !== 'string') return false;
  if (!Array.isArray(h.notificationIds)) return false;
  const f = h.frequency as Habit['frequency'] | undefined;
  if (!f) return false;
  if (!isDaily(f) && !isWeekly(f)) return false;
  return true;
}

/**
 * Parse a clipboard payload as a backup.
 * Returns `null` on any structural mismatch — caller shows a friendly error.
 */
export function parseBackup(raw: string): HabitStoreV1 | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const env = parsed as Partial<BackupEnvelope>;
  if (env.format !== BACKUP_FORMAT) return null;
  if (env.version !== 1) return null;
  if (!Array.isArray(env.habits)) return null;
  const habits = env.habits.filter(isHabit);
  return { version: 1, habits };
}
