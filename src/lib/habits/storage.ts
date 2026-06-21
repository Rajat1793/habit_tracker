/**
 * Habit persistence — wraps AsyncStorage with a single JSON envelope.
 *
 * Filled in by todo #3. This skeleton exists so other modules can import
 * the API surface without circular-dep churn later.
 */
import type { Habit, HabitStoreV1 } from './types';

export const STORAGE_KEY = '@streaks/habits/v1';

export async function loadAll(): Promise<Habit[]> {
  throw new Error('not implemented — see todo #3');
}

export async function saveAll(_habits: Habit[]): Promise<void> {
  throw new Error('not implemented — see todo #3');
}

export async function getById(_id: string): Promise<Habit | null> {
  throw new Error('not implemented — see todo #3');
}

export async function upsert(_habit: Habit): Promise<void> {
  throw new Error('not implemented — see todo #3');
}

export async function remove(_id: string): Promise<void> {
  throw new Error('not implemented — see todo #3');
}

export type { Habit, HabitStoreV1 };
