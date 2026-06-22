/**
 * Push registration + token handling.
 *
 * Push does NOT work in Expo Go on SDK 53+. Use a dev client.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { ensureAndroidChannel, requestPermissions } from './setup';

export const PUSH_TOKEN_KEY = '@streaks/pushToken';

function resolveProjectId(): string | null {
  const fromExtra =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
      ?.eas?.projectId;
  const fromEas = (Constants as unknown as { easConfig?: { projectId?: string } })
    .easConfig?.projectId;
  const id = fromExtra ?? fromEas ?? null;
  if (!id || id === 'REPLACE_WITH_EAS_PROJECT_ID') return null;
  return id;
}

/**
 * Register this device for Expo push notifications.
 * Returns the Expo Push Token or null if the device cannot receive push
 * (simulator, denied permission, missing projectId, Expo Go on SDK 53+).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[push] running on simulator/emulator — push tokens unavailable');
    return null;
  }

  await ensureAndroidChannel();

  const perm = await requestPermissions();
  if (!perm.granted) return null;

  const projectId = resolveProjectId();
  if (!projectId) {
    console.warn('[push] missing EAS projectId — run `eas init` and update app.json');
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return token;
  } catch (err) {
    console.warn('[push] getExpoPushTokenAsync failed', err);
    return null;
  }
}

/** Read the last persisted token without re-registering. */
export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

/** Copy a token to the system clipboard. */
export async function copyTokenToClipboard(token: string): Promise<void> {
  await Clipboard.setStringAsync(token);
}
