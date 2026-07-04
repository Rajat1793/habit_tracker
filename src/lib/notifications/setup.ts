/**
 * Notification setup: foreground handler, Android channel, permission helper.
 *
 * Components must never call `Notifications.*` directly — everything that
 * touches OS state lives here so it can be mocked and reasoned about.
 */
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/** Stable channel id reused by every scheduled habit reminder. */
export const HABIT_CHANNEL_ID = 'habit-reminders';

export type PermissionState = {
  granted: boolean;
  canAskAgain: boolean;
  status: 'undetermined' | 'denied' | 'granted';
};

let handlerInstalled = false;

/**
 * Install the global foreground handler. Idempotent — safe to call from
 * the root layout on every mount.
 */
export function installForegroundHandler(): void {
  if (handlerInstalled) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  handlerInstalled = true;
}

/**
 * Create the high-importance Android channel if it does not exist.
 *
 * Must run BEFORE `requestPermissionsAsync` on Android 13+: the permission
 * dialog inspects existing channels, and notifications posted before the
 * channel exists fall back to LOW importance and never show as heads-up.
 * No-op on iOS.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(HABIT_CHANNEL_ID, {
    name: 'Habit reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#E94B35',
    // Omit `sound` so the channel uses the system default notification
    // sound. Passing the string 'default' makes the native module look for
    // a CUSTOM bundled sound file named 'default' and throw when missing.
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableVibrate: true,
    showBadge: true,
  });
}

function mapStatus(
  res: Notifications.NotificationPermissionsStatus,
): PermissionState {
  return {
    granted: res.status === 'granted',
    canAskAgain: res.canAskAgain ?? false,
    status: res.status as PermissionState['status'],
  };
}

/** Read current permission status without prompting. Never throws. */
export async function getPermissions(): Promise<PermissionState> {
  try {
    const res = await Notifications.getPermissionsAsync();
    return mapStatus(res);
  } catch {
    return { granted: false, canAskAgain: false, status: 'denied' };
  }
}

/** Prompt for permission if still askable; otherwise return current state. */
export async function requestPermissions(): Promise<PermissionState> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return mapStatus(current);
    if (current.status === 'denied' && !current.canAskAgain) {
      return mapStatus(current);
    }
    const next = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowProvisional: false,
      },
    });
    return mapStatus(next);
  } catch {
    return { granted: false, canAskAgain: false, status: 'denied' };
  }
}

/** Open the OS settings page for this app (denied-state CTA). */
export async function openSystemSettings(): Promise<void> {
  await Linking.openSettings();
}
