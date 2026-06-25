/**
 * i18n provider.
 *
 * Resolution order on first launch:
 *   1. AsyncStorage user override (set via Settings).
 *   2. `expo-localization` device locale (matched to one of our supported codes).
 *   3. Fallback: en.
 *
 * `i18n-js` handles `{{var}}` interpolation. Strings are typed via
 * `LocaleStrings` so the `t(key)` helper can be wrapped with an autocomplete
 * façade in a future refactor (kept loose here to avoid TS gymnastics).
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n, type TranslateOptions } from 'i18n-js';
import en from './locales/en';
import hi from './locales/hi';
import es from './locales/es';

export const SUPPORTED_LOCALES = ['en', 'hi', 'es'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocalePref = 'system' | SupportedLocale;

export const LOCALE_PREF_KEY = '@streaks/locale';

const i18n = new I18n({ en, hi, es });
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

function detectSystemLocale(): SupportedLocale {
  const tags = Localization.getLocales();
  for (const t of tags) {
    const code = t.languageCode as string | null;
    if (code && (SUPPORTED_LOCALES as readonly string[]).includes(code)) {
      return code as SupportedLocale;
    }
  }
  return 'en';
}

type I18nContextValue = {
  /** User preference: 'system' | one of SUPPORTED_LOCALES. */
  pref: LocalePref;
  /** Resolved locale actually in use right now. */
  locale: SupportedLocale;
  t: (key: string, options?: TranslateOptions) => string;
  setPref: (next: LocalePref) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<LocalePref>('system');
  const [system, setSystem] = useState<SupportedLocale>(() => detectSystemLocale());

  // Hydrate persisted pref.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LOCALE_PREF_KEY);
        if (
          raw === 'system' ||
          (raw && (SUPPORTED_LOCALES as readonly string[]).includes(raw))
        ) {
          setPrefState(raw as LocalePref);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Re-detect system locale on mount in case the user changed it while we slept.
  useEffect(() => {
    setSystem(detectSystemLocale());
  }, []);

  const locale: SupportedLocale = pref === 'system' ? system : pref;
  i18n.locale = locale;

  const setPref = useCallback((next: LocalePref) => {
    setPrefState(next);
    void AsyncStorage.setItem(LOCALE_PREF_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, options?: TranslateOptions) => i18n.t(key, options),
    // re-create when locale changes so memoized consumers refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ pref, locale, t, setPref }),
    [pref, locale, t, setPref],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

/** Convenience hook for components that only need the translator. */
export function useT(): I18nContextValue['t'] {
  return useI18n().t;
}
