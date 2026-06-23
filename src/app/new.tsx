/**
 * Create / edit habit form.
 *
 * Edit mode is triggered by an `?id=` query param (link from habit detail).
 * Either way, `useHabits` orchestrates the schedule cancel/reschedule —
 * this screen owns no notification logic.
 */
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useHabit, useHabits, type HabitDraft } from '@/hooks/use-habits';
import type { Frequency, Weekday } from '@/lib/habits/types';

const WEEKDAY_LABELS: { weekday: Weekday; label: string }[] = [
  { weekday: 1, label: 'S' }, // Sun
  { weekday: 2, label: 'M' },
  { weekday: 3, label: 'T' },
  { weekday: 4, label: 'W' },
  { weekday: 5, label: 'T' },
  { weekday: 6, label: 'F' },
  { weekday: 7, label: 'S' }, // Sat
];

function clampInt(raw: string, min: number, max: number): number {
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export default function NewHabitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editing = useHabit(params.id);
  const { createHabit, updateHabit } = useHabits();

  const [name, setName] = useState(editing?.name ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? '💧');
  const [kind, setKind] = useState<Frequency['kind']>(editing?.frequency.kind ?? 'daily');
  const [hour, setHour] = useState(String(editing?.frequency.hour ?? 9));
  const [minute, setMinute] = useState(String(editing?.frequency.minute ?? 0));
  const [weekdays, setWeekdays] = useState<Weekday[]>(
    editing && editing.frequency.kind === 'weekly' ? editing.frequency.weekdays : [2, 4, 6],
  );
  const [saving, setSaving] = useState(false);

  const title = editing ? 'Edit habit' : 'New habit';

  const frequency: Frequency = useMemo(() => {
    const h = clampInt(hour, 0, 23);
    const m = clampInt(minute, 0, 59);
    if (kind === 'daily') return { kind: 'daily', hour: h, minute: m };
    return { kind: 'weekly', weekdays, hour: h, minute: m };
  }, [kind, hour, minute, weekdays]);

  const canSave =
    name.trim().length > 0 &&
    emoji.trim().length > 0 &&
    (kind === 'daily' || weekdays.length > 0);

  const toggleWeekday = (w: Weekday) => {
    setWeekdays((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort(),
    );
  };

  const onSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const draft: HabitDraft = { name, emoji, frequency };
      if (editing) {
        await updateHabit(editing.id, draft);
      } else {
        await createHabit(draft);
      }
      router.back();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>{title}</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Drink water"
          placeholderTextColor="#5C5C66"
          style={styles.input}
        />

        <Text style={styles.label}>Emoji</Text>
        <TextInput
          value={emoji}
          onChangeText={setEmoji}
          maxLength={4}
          style={[styles.input, styles.emojiInput]}
        />

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.segment}>
          {(['daily', 'weekly'] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              style={[styles.segmentBtn, kind === k && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, kind === k && styles.segmentTextActive]}>
                {k === 'daily' ? 'Daily' : 'Weekly'}
              </Text>
            </Pressable>
          ))}
        </View>

        {kind === 'weekly' && (
          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map(({ weekday, label }) => {
              const active = weekdays.includes(weekday);
              return (
                <Pressable
                  key={weekday}
                  onPress={() => toggleWeekday(weekday)}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.label}>Reminder time (24h)</Text>
        <View style={styles.timeRow}>
          <TextInput
            value={hour}
            onChangeText={setHour}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="HH"
            placeholderTextColor="#5C5C66"
            style={[styles.input, styles.timeInput]}
          />
          <Text style={styles.timeColon}>:</Text>
          <TextInput
            value={minute}
            onChangeText={setMinute}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="MM"
            placeholderTextColor="#5C5C66"
            style={[styles.input, styles.timeInput]}
          />
        </View>

        <Pressable
          style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={!canSave || saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving…' : editing ? 'Update habit' : 'Create habit'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  h1: { color: '#F5F5F7', fontSize: 24, fontWeight: '700', marginBottom: 20 },
  label: { color: '#9A9AA2', fontSize: 13, marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#16161D',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F5F5F7',
    fontSize: 16,
  },
  emojiInput: { fontSize: 28, paddingVertical: 8 },
  segment: { flexDirection: 'row', backgroundColor: '#16161D', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: '#7C5CFF' },
  segmentText: { color: '#9A9AA2', fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16161D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: { backgroundColor: '#7C5CFF' },
  dayChipText: { color: '#9A9AA2', fontWeight: '600' },
  dayChipTextActive: { color: '#fff' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, textAlign: 'center', fontSize: 20, fontVariant: ['tabular-nums'] },
  timeColon: { color: '#F5F5F7', fontSize: 22, fontWeight: '700' },
  saveBtn: {
    marginTop: 28,
    backgroundColor: '#7C5CFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#9A9AA2', fontSize: 14 },
});
