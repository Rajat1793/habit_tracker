/**
 * Reactive habit store hook.
 *
 * A module-level cache + `useSyncExternalStore` gives every screen a live
 * view of the habits list without a Provider. Mutations always replace the
 * array reference so React notifies subscribers correctly.
 *
 * Notification side effects live in `lib/notifications/schedule`; this
 * hook only orchestrates them.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { makeId } from '@/lib/habits/id';
import * as storage from '@/lib/habits/storage';
import { markDone as applyMarkDone } from '@/lib/habits/streak';
import type { Frequency, Habit } from '@/lib/habits/types';
import { syncBadgeCount } from '@/lib/notifications/badge';
import {
  cancelHabit,
  rescheduleHabit,
  scheduleHabit,
} from '@/lib/notifications/schedule';

type Status = 'idle' | 'loading' | 'ready' | 'error';

let cache: Habit[] = [];
let status: Status = 'idle';
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => cache;
const getStatusSnapshot = () => status;

async function ensureLoaded(): Promise<void> {
  if (status === 'ready' || status === 'loading') return;
  status = 'loading';
  emit();
  try {
    cache = await storage.loadAll();
    status = 'ready';
    // Sync badge on initial load too (e.g. day rolled over while app was closed).
    void syncBadgeCount(cache);
  } catch {
    cache = [];
    status = 'error';
  }
  emit();
}

async function commit(next: Habit[]): Promise<void> {
  cache = next;
  await storage.saveAll(cache);
  // Keep the app icon badge in sync with pending habits.
  void syncBadgeCount(cache);
  emit();
}

/**
 * Module-level "mark done" for use outside React (notification action handler).
 * Mirrors the hook action but doesn't require a component context.
 */
export async function markDoneTodayById(id: string): Promise<Habit | null> {
  // Make sure cache is hydrated — action taps can arrive before any screen mounts.
  if (status === 'idle') await ensureLoaded();
  const existing = cache.find((h) => h.id === id);
  if (!existing) return null;
  const next = applyMarkDone(existing);
  if (next === existing) return existing;
  await commit(cache.map((h) => (h.id === id ? next : h)));
  return next;
}

export type HabitDraft = {
  name: string;
  emoji: string;
  frequency: Frequency;
};

export type UseHabitsApi = {
  habits: Habit[];
  status: Status;
  refresh: () => Promise<void>;
  createHabit: (draft: HabitDraft) => Promise<Habit>;
  updateHabit: (id: string, patch: Partial<HabitDraft>) => Promise<Habit | null>;
  deleteHabit: (id: string) => Promise<void>;
  markDoneToday: (id: string) => Promise<Habit | null>;
};

export function useHabits(): UseHabitsApi {
  const habits = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const currentStatus = useSyncExternalStore(
    subscribe,
    getStatusSnapshot,
    getStatusSnapshot,
  );

  useEffect(() => {
    void ensureLoaded();
  }, []);

  const refresh = useCallback(async () => {
    status = 'idle';
    await ensureLoaded();
  }, []);

  const createHabit = useCallback(async (draft: HabitDraft) => {
    const base: Habit = {
      id: makeId(),
      name: draft.name.trim(),
      emoji: draft.emoji,
      frequency: draft.frequency,
      notificationIds: [],
      streak: 0,
      lastCompletedISO: null,
      createdAtISO: new Date().toISOString(),
    };
    const ids = await scheduleHabit(base);
    const habit: Habit = { ...base, notificationIds: ids };
    await commit([...cache, habit]);
    return habit;
  }, []);

  const updateHabit = useCallback(
    async (id: string, patch: Partial<HabitDraft>) => {
      const existing = cache.find((h) => h.id === id);
      if (!existing) return null;
      const draft: Habit = {
        ...existing,
        name: patch.name?.trim() ?? existing.name,
        emoji: patch.emoji ?? existing.emoji,
        frequency: patch.frequency ?? existing.frequency,
      };
      const ids = await rescheduleHabit(existing, draft);
      const next: Habit = { ...draft, notificationIds: ids };
      await commit(cache.map((h) => (h.id === id ? next : h)));
      return next;
    },
    [],
  );

  const deleteHabit = useCallback(async (id: string) => {
    const existing = cache.find((h) => h.id === id);
    if (!existing) return;
    await cancelHabit(existing);
    await commit(cache.filter((h) => h.id !== id));
  }, []);

  const markDoneToday = useCallback(async (id: string) => {
    const existing = cache.find((h) => h.id === id);
    if (!existing) return null;
    const next = applyMarkDone(existing);
    if (next === existing) return existing; // already done today (idempotent)
    await commit(cache.map((h) => (h.id === id ? next : h)));
    return next;
  }, []);

  return {
    habits,
    status: currentStatus,
    refresh,
    createHabit,
    updateHabit,
    deleteHabit,
    markDoneToday,
  };
}

/** Convenience selector for a single habit by id. */
export function useHabit(id: string | undefined): Habit | null {
  const { habits } = useHabits();
  if (!id) return null;
  return habits.find((h) => h.id === id) ?? null;
}
