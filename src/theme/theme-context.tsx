/**
 * Theme context.
 *
 * Mode: 'system' | 'light' | 'dark'. Persisted in AsyncStorage.
 * 'system' follows `useColorScheme()` and reacts live to OS changes.
 *
 * Components consume colors via `useColors()`, build styles via
 * `useThemedStyles(makeStyles)` — the factory runs once per palette change
 * and the resulting StyleSheet is cached.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dark, light, type Palette } from './colors';

export const THEME_MODE_KEY = '@streaks/themeMode';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: ResolvedScheme;
  colors: Palette;
  setMode: (next: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(
  mode: ThemeMode,
  system: ResolvedScheme,
): ResolvedScheme {
  if (mode === 'system') return system;
  return mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = (useColorScheme() ?? 'dark') as ResolvedScheme;
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Hydrate persisted mode.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (raw === 'light' || raw === 'dark' || raw === 'system') {
          setModeState(raw);
        }
      } catch {
        // ignore — fall back to 'system'
      }
    })();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(THEME_MODE_KEY, next);
  }, []);

  const scheme = resolveScheme(mode, system);
  const colors = scheme === 'dark' ? dark : light;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, colors, setMode }),
    [mode, scheme, colors, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

export function useColors(): Palette {
  return useTheme().colors;
}

/**
 * Build a StyleSheet from the active palette, memoized.
 *
 * Usage:
 *   const styles = useThemedStyles(makeStyles);
 *   function makeStyles(c: Palette) {
 *     return StyleSheet.create({ container: { backgroundColor: c.bg } });
 *   }
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (c: Palette) => T,
): T {
  const colors = useColors();
  return useMemo(() => factory(colors), [factory, colors]);
}
