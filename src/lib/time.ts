/**
 * Time formatting shared across the app.
 *
 * Habits always store `hour` as 0–23 internally; this module renders it in
 * the user's chosen 12h/24h style. Keep this dependency-free so it can be
 * reused from any screen (and unit-tested).
 */

export type ClockFormat = '12h' | '24h';

/** Convert a 0–23 hour into a { hour12, period } pair. */
export function to12h(hour24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period = hour24 < 12 ? 'AM' : 'PM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, period };
}

/** Convert a 12h hour + period back into 0–23. */
export function to24h(hour12: number, period: 'AM' | 'PM'): number {
  const base = hour12 % 12; // 12 → 0
  return period === 'PM' ? base + 12 : base;
}

/** Render a stored (hour, minute) in the chosen format, e.g. "9:05 AM" / "09:05". */
export function formatTime(
  hour: number,
  minute: number,
  fmt: ClockFormat,
): string {
  const mm = String(minute).padStart(2, '0');
  if (fmt === '24h') return `${String(hour).padStart(2, '0')}:${mm}`;
  const { hour12, period } = to12h(hour);
  return `${hour12}:${mm} ${period}`;
}
