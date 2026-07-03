/**
 * Cross-platform user-facing alerts / confirms.
 *
 * `react-native-web@0.21`'s Alert is a no-op:
 *   class Alert { static alert() {} }
 * so any code that calls `Alert.alert(...)` on the web silently does nothing —
 * users see no feedback, and buttons never fire. These helpers route through
 * `window.alert` / `window.confirm` on web while keeping the native
 * `Alert.alert` path (with real button callbacks) on iOS/Android.
 *
 * Use `notify` for one-way messages ("saved", "failed…").
 * Use `confirmDestructive` when you need explicit user consent before doing
 * something irreversible (delete, restore-from-backup, …).
 */
import { Alert, Platform } from 'react-native';

export function notify(title: string, body?: string): void {
  if (Platform.OS === 'web') {
    const msg = body ? `${title}\n\n${body}` : title;
    // eslint-disable-next-line no-alert
    window.alert(msg);
    return;
  }
  Alert.alert(title, body);
}

export interface ConfirmDestructiveOptions {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
}

export function confirmDestructive(opts: ConfirmDestructiveOptions): void {
  const { title, body, confirmLabel, cancelLabel, onConfirm } = opts;
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`${title}\n\n${body}`);
    if (ok) void onConfirm();
    return;
  }
  Alert.alert(title, body, [
    { text: cancelLabel, style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
