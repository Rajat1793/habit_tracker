/**
 * Push registration + token handling. Filled in by todo #6.
 *
 * Push does NOT work in Expo Go on SDK 53+. Use a dev client.
 */

export const PUSH_TOKEN_KEY = '@streaks/pushToken';

/**
 * Register this device for Expo push notifications.
 * Returns the Expo Push Token (`ExponentPushToken[...]`) or null if the
 * device cannot receive push (simulator, denied permission, missing projectId).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  throw new Error('not implemented — see todo #6');
}

/** Read the last persisted token without re-registering. */
export async function getStoredPushToken(): Promise<string | null> {
  throw new Error('not implemented — see todo #6');
}

/** Copy a token to the system clipboard. */
export async function copyTokenToClipboard(_token: string): Promise<void> {
  throw new Error('not implemented — see todo #6');
}
