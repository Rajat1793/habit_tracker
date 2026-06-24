import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useHabits } from '@/hooks/use-habits';
import { isDueToday } from '@/lib/habits/frequency';
import { getDisplayStreak, isDoneToday } from '@/lib/habits/streak';

function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const { habits, status, markDoneToday } = useHabits();
  const router = useRouter();

  const todays = useMemo(
    () => habits.filter((h) => isDueToday(h)),
    [habits],
  );

  if (status === 'loading' || status === 'idle') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7C5CFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Today</Text>
        <View style={styles.headerActions}>
          <Link href="/settings" asChild>
            <Pressable hitSlop={12}>
              <Text style={styles.headerLink}>Settings</Text>
            </Pressable>
          </Link>
          <Link href="/new" asChild>
            <Pressable style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ New</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptyBody}>
            Tap “+ New” to create your first habit and schedule a reminder.
          </Text>
        </View>
      ) : todays.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing due today</Text>
          <Text style={styles.emptyBody}>Your weekly habits will surface here on their day.</Text>
        </View>
      ) : (
        <FlatList
          data={todays}
          keyExtractor={(h) => h.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const done = isDoneToday(item);
            const streak = getDisplayStreak(item);
            const time = fmtTime(item.frequency.hour, item.frequency.minute);
            return (
              <View style={styles.row}>
                <Pressable
                  style={styles.rowMain}
                  onPress={() => router.push(`/habit/${item.id}`)}
                >
                  <Text style={styles.emoji}>{item.emoji || '✨'}</Text>
                  <View style={styles.rowText}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>
                      {item.frequency.kind === 'daily' ? 'Daily' : 'Weekly'} · {time}
                    </Text>
                  </View>
                  <View style={styles.streakChip}>
                    <Text style={styles.streakText}>🔥 {streak}</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.doneBtn, done && styles.doneBtnDone]}
                  onPress={() => markDoneToday(item.id)}
                  disabled={done}
                >
                  <Text style={[styles.doneBtnText, done && styles.doneBtnTextDone]}>
                    {done ? '✓ Done' : 'Mark done'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heading: { color: '#F5F5F7', fontSize: 28, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerLink: { color: '#9A9AA2', fontSize: 14 },
  addBtn: {
    backgroundColor: '#7C5CFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  list: { paddingBottom: 32 },
  separator: { height: 12 },
  row: {
    backgroundColor: '#16161D',
    borderRadius: 16,
    padding: 14,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1 },
  emoji: { fontSize: 28 },
  name: { color: '#F5F5F7', fontSize: 16, fontWeight: '600' },
  meta: { color: '#9A9AA2', fontSize: 13, marginTop: 2 },
  streakChip: {
    backgroundColor: '#26222E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  streakText: { color: '#FFB75C', fontWeight: '600' },
  doneBtn: {
    marginTop: 12,
    backgroundColor: '#7C5CFF',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnDone: { backgroundColor: '#1F2A1F' },
  doneBtnText: { color: '#fff', fontWeight: '600' },
  doneBtnTextDone: { color: '#7FD18B' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { color: '#F5F5F7', fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptyBody: { color: '#9A9AA2', textAlign: 'center', fontSize: 14 },
});
