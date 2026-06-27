/**
 * Typography tokens.
 *
 * Font families come from @expo-google-fonts/* — names match the exports
 * (e.g. `Inter_500Medium`). Loaded once in the root layout via `useFonts`.
 *
 * Presets are plain RN TextStyle objects so they compose with palette
 * colors at the call site:
 *
 *   <Text style={[typography.pageTitle, { color: c.text }]}>Today</Text>
 *
 * Letter-spacing values are converted from CSS em units to RN's absolute
 * points (em × fontSize). RN doesn't understand `-0.02em`.
 */
import type { TextStyle } from 'react-native';

/** Font family names registered by the Google Fonts packages. */
export const fonts = {
  // Body / UI — Inter
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',

  // Headlines / Display — Space Grotesk
  headlineRegular: 'SpaceGrotesk_400Regular',
  headlineMedium: 'SpaceGrotesk_500Medium',
  headlineSemiBold: 'SpaceGrotesk_600SemiBold',
  headlineBold: 'SpaceGrotesk_700Bold',

  // Code / mono (system stack fallback chain).
  // RN only takes a single family; iOS uses Menlo, Android falls back to
  // its monospace, web honors the full ui-monospace stack via fontFamily.
  mono: 'Menlo, Monaco, "Courier New", monospace',
} as const;

/**
 * Reusable text style presets. Match the design spec:
 *   - Body: 14px / 1.6 / Inter 400
 *   - Page title: 30px / Space Grotesk 600 / -0.02em tracking
 *   - Headline: Space Grotesk / -0.01em..-0.015em tracking
 *   - Section label: 11px / 600 / uppercase / 0.18em tracking
 *   - Badge: 10px / 600 / uppercase / wider tracking
 *   - Button: 14px / 600 / -0.005em tracking
 */
export const typography = {
  body: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    lineHeight: 22, // ~1.6
  } as TextStyle,

  bodyMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 22,
  } as TextStyle,

  bodySemiBold: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 22,
  } as TextStyle,

  pageTitle: {
    fontFamily: fonts.headlineSemiBold,
    fontSize: 30, // text-3xl
    lineHeight: 36,
    letterSpacing: -0.6, // -0.02em × 30
  } as TextStyle,

  headlineLg: {
    fontFamily: fonts.headlineSemiBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.36, // -0.015em × 24
  } as TextStyle,

  headlineMd: {
    fontFamily: fonts.headlineSemiBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2, // -0.01em × 20
  } as TextStyle,

  headlineSm: {
    fontFamily: fonts.headlineSemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.16,
  } as TextStyle,

  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.98, // 0.18em × 11
    textTransform: 'uppercase',
  } as TextStyle,

  badge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1, // "wider"
    textTransform: 'uppercase',
  } as TextStyle,

  button: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.07, // -0.005em × 14
  } as TextStyle,

  buttonLg: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.08,
  } as TextStyle,

  mono: {
    fontFamily: fonts.mono,
    fontSize: 12,
  } as TextStyle,

  meta: {
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
  } as TextStyle,
} as const;

/** Font-family map passed to `useFonts(...)` in the root layout. */
export function getFontMap() {
  // Dynamic require so jest (where these packages may be mocked or
  // unavailable) doesn't need to resolve them at module-load time.
  const inter = require('@expo-google-fonts/inter');
  const spaceGrotesk = require('@expo-google-fonts/space-grotesk');
  return {
    Inter_400Regular: inter.Inter_400Regular,
    Inter_500Medium: inter.Inter_500Medium,
    Inter_600SemiBold: inter.Inter_600SemiBold,
    Inter_700Bold: inter.Inter_700Bold,
    SpaceGrotesk_400Regular: spaceGrotesk.SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium: spaceGrotesk.SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold: spaceGrotesk.SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold: spaceGrotesk.SpaceGrotesk_700Bold,
  };
}
