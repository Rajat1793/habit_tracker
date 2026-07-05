import { formatTime, to12h, to24h } from '../time';

describe('to12h', () => {
  it('maps midnight and noon correctly', () => {
    expect(to12h(0)).toEqual({ hour12: 12, period: 'AM' });
    expect(to12h(12)).toEqual({ hour12: 12, period: 'PM' });
  });
  it('maps morning and evening hours', () => {
    expect(to12h(9)).toEqual({ hour12: 9, period: 'AM' });
    expect(to12h(13)).toEqual({ hour12: 1, period: 'PM' });
    expect(to12h(23)).toEqual({ hour12: 11, period: 'PM' });
  });
});

describe('to24h', () => {
  it('inverts to12h across all hours', () => {
    for (let h = 0; h < 24; h++) {
      const { hour12, period } = to12h(h);
      expect(to24h(hour12, period)).toBe(h);
    }
  });
  it('handles 12 AM → 0 and 12 PM → 12', () => {
    expect(to24h(12, 'AM')).toBe(0);
    expect(to24h(12, 'PM')).toBe(12);
  });
});

describe('formatTime', () => {
  it('renders 24h with zero-padding', () => {
    expect(formatTime(9, 5, '24h')).toBe('09:05');
    expect(formatTime(0, 0, '24h')).toBe('00:00');
    expect(formatTime(23, 59, '24h')).toBe('23:59');
  });
  it('renders 12h with AM/PM', () => {
    expect(formatTime(9, 5, '12h')).toBe('9:05 AM');
    expect(formatTime(0, 0, '12h')).toBe('12:00 AM');
    expect(formatTime(12, 30, '12h')).toBe('12:30 PM');
    expect(formatTime(13, 0, '12h')).toBe('1:00 PM');
  });
});
