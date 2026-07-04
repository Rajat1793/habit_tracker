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
  // Surfaces — warm green-cream
  bg: '#EFF1E6',
  card: '#FBFBF3',
  cardAlt: '#E4E7D5',
  surface: '#EFF1E6',

  // Borders
  border: '#DFE2CE', // outline-variant (subtle)
  outline: '#B9C0A3', // outline (strong)

  // Text
  text: '#16251A', // on-surface (dark green-ink)
  textMuted: '#5D6B57', // on-surface-variant
  textFaint: '#8B9682',

  // CTA = deep forest green on cream
  accent: '#2F6B36',
  accentText: '#FFFFFF',
  primary: '#2F6B36',
  onPrimary: '#FFFFFF',

  // Secondary
  secondary: '#4A5A46',

  // Leaf-green accent (brand)
  tertiary: '#4FA857',
  onTertiary: '#FFFFFF',

  // Status
  success: '#3E8C46',
  warning: '#E4A33B',
  danger: '#D2513F',
  error: '#D2513F',

  // Brand extras
  peach: '#FDE9C7',
  cream: '#F1F0E4',

  streak: '#E9843B',
  switchTrackOff: '#D5D8C4',
};

export const dark: Palette = {
  // Surfaces — dark green-ink
  bg: '#0E140D',
  card: '#1A2016',
  cardAlt: '#232B1D',
  surface: '#0E140D',

  // Borders
  border: '#29331E',
  outline: '#3C4A30',

  // Text
  text: '#EEF0E1', // on-surface (cream)
  textMuted: '#A2AE95', // on-surface-variant
  textFaint: '#6E7A63',

  // CTA = bright green on near-black
  accent: '#57B562',
  accentText: '#0E140D',
  primary: '#57B562',
  onPrimary: '#0E140D',

  // Secondary
  secondary: '#A2AE95',

  // Leaf-green accent (brighter in dark)
  tertiary: '#62C06E',
  onTertiary: '#0E140D',

  // Status
  success: '#57B562',
  warning: '#F0B454',
  danger: '#F0715C',
  error: '#F0715C',

  // Brand extras
  peach: '#FDE9C7',
  cream: '#EEF0E1',

  streak: '#F0954B',
  switchTrackOff: '#29331E',
};

