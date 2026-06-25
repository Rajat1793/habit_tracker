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
import { useColors, useThemedStyles } from '@/theme/theme-context';
import { useT } from '@/i18n';
import type { Palette } from '@/theme/colors';

const WEEKDAY_LABELS: { weekday: Weekday; label: string; a11yKey: string }[] = [
  { weekday: 1, label: 'S', a11yKey: 'a11y.weekdaySun' },
  { weekday: 2, label: 'M', a11yKey: 'a11y.weekdayMon' },
  { weekday: 3, label: 'T', a11yKey: 'a11y.weekdayTue' },
  { weekday: 4, label: 'W', a11yKey: 'a11y.weekdayWed' },
  { weekday: 5, label: 'T', a11yKey: 'a11y.weekdayThu' },
  { weekday: 6, label: 'F', a11yKey: 'a11y.weekdayFri' },
  { weekday: 7, label: 'S', a11yKey: 'a11y.weekdaySat' },
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
  const colors = useColors();
  const t = useT();
  const styles = useThemedStyles(makeStyles);

  const [name, setName] = useState(editing?.name ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? '💧');
  const [kind, setKind] = useState<Frequency['kind']>(editing?.frequency.kind ?? 'daily');
  const [hour, setHour] = useState(String(editing?.frequency.hour ?? 9));
  const [minute, setMinute] = useState(String(editing?.frequency.minute ?? 0));
  const [weekdays, setWeekdays] = useState<Weekday[]>(
    editing && editing.frequency.kind === 'weekly' ? editing.frequency.weekdays : [2, 4, 6],
  );
  const [saving, setSaving] = useState(false);

  const title = editing ? t('form.titleEdit') : t('form.titleNew');

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
      Alert.alert(t('form.saveError'), err instanceof Error ? err.message : String(err));
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
        <Text style={styles.h1} accessibilityRole="header">
          {title}
        </Text>

        <Text style={styles.label}>{t('form.name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('form.namePlaceholder')}
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          accessibilityLabel={t('form.name')}
        />

        <Text style={styles.label}>{t('form.emoji')}</Text>
        <TextInput
          value={emoji}
          onChangeText={setEmoji}
          maxLength={4}
          style={[styles.input, styles.emojiInput]}
          accessibilityLabel={t('form.emoji')}
        />

        <Text style={styles.label}>{t('form.frequency')}</Text>
        <View style={styles.segment}>
          {(['daily', 'weekly'] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              style={[styles.segmentBtn, kind === k && styles.segmentBtnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: kind === k }}
              accessibilityLabel={k === 'daily' ? t('home.daily') : t('home.weekly')}
            >
              <Text style={[styles.segmentText, kind === k && styles.segmentTextActive]}>
                {k === 'daily' ? t('home.daily') : t('home.weekly')}
              </Text>
            </Pressable>
          ))}
        </View>

        {kind === 'weekly' && (
          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map(({ weekday, label, a11yKey }) => {
              const active = weekdays.includes(weekday);
              return (
                <Pressable
                  key={weekday}
                  onPress={() => toggleWeekday(weekday)}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t(a11yKey)}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.label}>{t('form.reminderTime')}</Text>
        <View style={styles.timeRow}>
          <TextInput
            value={hour}
            onChangeText={setHour}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="HH"
            placeholderTextColor={colors.textFaint}
            style={[styles.input, styles.timeInput]}
            accessibilityLabel="Reminder hour"
          />
          <Text style={styles.timeColon}>:</Text>
          <TextInput
            value={minute}
            onChangeText={setMinute}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="MM"
            placeholderTextColor={colors.textFaint}
            style={[styles.input, styles.timeInput]}
            accessibilityLabel="Reminder minute"
          />
        </View>

        <Pressable
          style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={!canSave || saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave || saving }}
          accessibilityLabel={editing ? t('form.update') : t('form.create')}
        >
          <Text style={styles.saveBtnText}>
            {saving ? t('form.saving') : editing ? t('form.update') : t('form.create')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={styles.cancelBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        >
          <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    flex: { flex: 1 },
    container: { padding: 20, paddingBottom: 40 },
    h1: { color: c.text, fontSize: 24, fontWeight: '700', marginBottom: 20 },
    label: { color: c.textMuted, fontSize: 13, marginTop: 16, marginBottom: 8 },
    input: {
      backgroundColor: c.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.text,
      fontSize: 16,
    },
    emojiInput: { fontSize: 28, paddingVertical: 8 },
    segment: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 12, padding: 4 },
    segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    segmentBtnActive: { backgroundColor: c.accent },
    segmentText: { color: c.textMuted, fontWeight: '600' },
    segmentTextActive: { color: c.accentText },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    dayChip: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayChipActive: { backgroundColor: c.accent },
    dayChipText: { color: c.textMuted, fontWeight: '600' },
    dayChipTextActive: { color: c.accentText },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timeInput: { flex: 1, textAlign: 'center', fontSize: 20, fontVariant: ['tabular-nums'] },
    timeColon: { color: c.text, fontSize: 22, fontWeight: '700' },
    saveBtn: {
      marginTop: 28,
      backgroundColor: c.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { color: c.accentText, fontSize: 16, fontWeight: '700' },
    cancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { color: c.textMuted, fontSize: 14 },
  });
}
