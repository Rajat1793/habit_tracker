/**
 * Clock-format preference (12h vs 24h).
 *
 * A tiny module-level store + `useSyncExternalStore` gives every screen a
 * live, provider-free view of the preference (same pattern as use-habits).
 * Persisted in AsyncStorage. Defaults to 24h to match prior behavior.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ClockFormat } from '@/lib/time';

export const CLOCK_FORMAT_KEY = '@streaks/clockFormat';

let format: ClockFormat = '24h';
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const getSnapshot = () => format;

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(CLOCK_FORMAT_KEY);
    if (raw === '12h' || raw === '24h') {
      format = raw;
      emit();
    }
  } catch {
    // ignore — keep default
  }
}

export function useClockFormat(): {
  format: ClockFormat;
  setFormat: (next: ClockFormat) => void;
} {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    void hydrate();
  }, []);
  const setFormat = useCallback((next: ClockFormat) => {
    format = next;
    emit();
    void AsyncStorage.setItem(CLOCK_FORMAT_KEY, next);
  }, []);
  return { format: value, setFormat };
}
