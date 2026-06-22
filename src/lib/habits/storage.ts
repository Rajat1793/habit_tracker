/**
 * Habit persistence — wraps AsyncStorage with a single JSON envelope.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit, HabitStoreV1 } from './types';

export const STORAGE_KEY = '@streaks/habits/v1';

async function readEnvelope(): Promise<HabitStoreV1> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { version: 1, habits: [] };
  try {
    const parsed = JSON.parse(raw) as HabitStoreV1;
    if (parsed?.version === 1 && Array.isArray(parsed.habits)) return parsed;
    return { version: 1, habits: [] };
  } catch {
    return { version: 1, habits: [] };
  }
}

async function writeEnvelope(habits: Habit[]): Promise<void> {
  const envelope: HabitStoreV1 = { version: 1, habits };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export async function loadAll(): Promise<Habit[]> {
  const env = await readEnvelope();
  return env.habits;
}

export async function saveAll(habits: Habit[]): Promise<void> {
  await writeEnvelope(habits);
}

export async function getById(id: string): Promise<Habit | null> {
  const all = await loadAll();
  return all.find((h) => h.id === id) ?? null;
}

export async function upsert(habit: Habit): Promise<void> {
  const all = await loadAll();
  const idx = all.findIndex((h) => h.id === habit.id);
  if (idx === -1) all.push(habit);
  else all[idx] = habit;
  await saveAll(all);
}

export async function remove(id: string): Promise<void> {
  const all = await loadAll();
  await saveAll(all.filter((h) => h.id !== id));
}

export type { Habit, HabitStoreV1 };
