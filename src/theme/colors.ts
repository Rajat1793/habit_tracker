/**
 * Color palettes + semantic tokens.
 *
 * Each palette exposes the same keys so callers can switch between them
 * without knowing the literal values. Add new tokens here — never inline
 * hex codes in components.
 *
 * Theme spec:
 *   Light = warm cream / ink-black
 *   Dark  = near-black ink / cream
 *
 * Token mapping notes:
 *   - `accent` / `accentText` are the high-emphasis CTA (= spec `primary` /
 *     `onPrimary`: ink-black filled button on light, cream on dark). They
 *     are kept as aliases for `primary` / `onPrimary` for back-compat with
 *     existing components.
 *   - `streak` / `warning` use the brand coral (= spec `tertiary`).
 *   - `border` is the subtle outline (= spec `outline-variant`); `outline`
 *     is the stronger outline.
 */

export type Palette = {
  // Surfaces
  bg: string;
  card: string;
  cardAlt: string;
  surface: string;

  // Borders
  border: string;
  outline: string;

  // Text
  text: string;
  textMuted: string;
  textFaint: string;

  // CTA (spec: primary / onPrimary)
  accent: string;
  accentText: string;
  primary: string;
  onPrimary: string;

  // Secondary text/role color (spec: secondary)
  secondary: string;

  // Brand accent (spec: tertiary)
  tertiary: string;
  onTertiary: string;

  // Status
  success: string;
  warning: string;
  danger: string;
  error: string;

  // Brand extras
  peach: string;
  cream: string;

  // Misc
  streak: string;
  switchTrackOff: string;
};

export const light: Palette = {
  // Surfaces — warm cream
  bg: '#F7F6F2',
  card: '#FFFFFF',
  cardAlt: '#EFEDE5',
  surface: '#F7F6F2',

  // Borders
  border: '#E5E0D6', // outline-variant (subtle)
  outline: '#B8B2A4', // outline (strong)

  // Text
  text: '#0F1115', // on-surface
  textMuted: '#5A5F68', // on-surface-variant
  textFaint: '#8A8F98',

  // CTA = ink-black on cream
  accent: '#0F1115',
  accentText: '#FFFFFF',
  primary: '#0F1115',
  onPrimary: '#FFFFFF',

  // Secondary
  secondary: '#4A4F58',

  // Coral accent
  tertiary: '#E94B35',
  onTertiary: '#FFFFFF',

  // Status
  success: '#1F7A4D',
  warning: '#E94B35',
  danger: '#DC2626',
  error: '#DC2626',

  // Brand extras
  peach: '#FFEBCC',
  cream: '#FFF9D2',

  streak: '#E94B35',
  switchTrackOff: '#D9D4C7',
};

export const dark: Palette = {
  // Surfaces — near-black ink
  bg: '#0A0B0E',
  card: '#15171C',
  cardAlt: '#1E2128',
  surface: '#0A0B0E',

  // Borders
  border: '#262A33',
  outline: '#3A3F4A',

  // Text
  text: '#F2EFE7', // on-surface (cream)
  textMuted: '#9CA3AF', // on-surface-variant
  textFaint: '#6B7280',

  // CTA = cream on near-black
  accent: '#F2EFE7',
  accentText: '#0F1115',
  primary: '#F2EFE7',
  onPrimary: '#0F1115',

  // Secondary
  secondary: '#9CA3AF',

  // Coral accent (brighter in dark)
  tertiary: '#FF6B52',
  onTertiary: '#0F1115',

  // Status
  success: '#34D399',
  warning: '#FF6B52',
  danger: '#FF6B6B',
  error: '#FF6B6B',

  // Brand extras
  peach: '#FFEBCC',
  cream: '#FFF9D2',

  streak: '#FF6B52',
  switchTrackOff: '#262A33',
};

