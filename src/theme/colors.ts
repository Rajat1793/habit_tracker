/**
 * Color palettes + semantic tokens.
 *
 * Each palette exposes the same keys so callers can switch between them
 * without knowing the literal values. Add new tokens here — never inline
 * hex codes in components.
 */

export type Palette = {
  bg: string;
  card: string;
  cardAlt: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentText: string;
  success: string;
  warning: string;
  danger: string;
  streak: string;
  switchTrackOff: string;
};

export const dark: Palette = {
  bg: '#0B0B0F',
  card: '#16161D',
  cardAlt: '#26222E',
  surface: '#0B0B0F',
  border: '#26222E',
  text: '#F5F5F7',
  textMuted: '#9A9AA2',
  textFaint: '#5C5C66',
  accent: '#7C5CFF',
  accentText: '#FFFFFF',
  success: '#7FD18B',
  warning: '#FFB75C',
  danger: '#FF6F6F',
  streak: '#FFB75C',
  switchTrackOff: '#26222E',
};

export const light: Palette = {
  bg: '#F7F7FB',
  card: '#FFFFFF',
  cardAlt: '#EEEAF5',
  surface: '#EFEFF4',
  border: '#E0E0E7',
  text: '#1A1A1F',
  textMuted: '#6B6B73',
  textFaint: '#A8A8B0',
  accent: '#6442E0',
  accentText: '#FFFFFF',
  success: '#3F9D55',
  warning: '#D17B0E',
  danger: '#D24545',
  streak: '#D17B0E',
  switchTrackOff: '#D0D0D8',
};
