import { buildBackup, parseBackup, serializeBackup, BACKUP_FORMAT } from '../backup';
import type { Habit } from '../types';

function habit(id: string): Habit {
  return {
    id,
    name: `Habit ${id}`,
    emoji: '✨',
    frequency: { kind: 'daily', hour: 8, minute: 0 },
    notificationIds: ['n1'],
    streak: 3,
    lastCompletedISO: '2026-06-10',
    createdAtISO: '2026-01-01T00:00:00.000Z',
  };
}

describe('buildBackup', () => {
  it('stamps format, version and exportedAt', () => {
    const env = buildBackup([habit('a')]);
    expect(env.format).toBe(BACKUP_FORMAT);
    expect(env.version).toBe(1);
    expect(env.habits).toHaveLength(1);
    expect(() => new Date(env.exportedAt).toISOString()).not.toThrow();
  });
});

describe('serializeBackup → parseBackup roundtrip', () => {
  it('preserves all habits', () => {
    const habits = [habit('a'), habit('b'), habit('c')];
    const parsed = parseBackup(serializeBackup(habits));
    expect(parsed).not.toBeNull();
    expect(parsed!.habits).toHaveLength(3);
    expect(parsed!.habits.map((h) => h.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('parseBackup rejects malformed input', () => {
  it('returns null for non-JSON', () => {
    expect(parseBackup('not json')).toBeNull();
  });
  it('returns null for wrong format string', () => {
    expect(
      parseBackup(
        JSON.stringify({ format: 'something.else', version: 1, exportedAt: '', habits: [] }),
      ),
    ).toBeNull();
  });
  it('returns null for wrong version', () => {
    expect(
      parseBackup(
        JSON.stringify({ format: BACKUP_FORMAT, version: 2, exportedAt: '', habits: [] }),
      ),
    ).toBeNull();
  });
  it('returns null when habits is not an array', () => {
    expect(
      parseBackup(
        JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: '', habits: 'oops' }),
      ),
    ).toBeNull();
  });
  it('drops entries that fail the shape check', () => {
    const env = {
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: '',
      habits: [habit('ok'), { id: 'bad' }],
    };
    const parsed = parseBackup(JSON.stringify(env));
    expect(parsed).not.toBeNull();
    expect(parsed!.habits.map((h) => h.id)).toEqual(['ok']);
  });
});
