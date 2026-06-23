/**
 * Push token + permission hook.
 *
 * Wraps `lib/notifications/push` so screens never call expo-notifications
 * directly. Reads any persisted token on mount; `register` is opt-in
 * (don't auto-prompt — the Settings screen owns that decision).
 */
import { useCallback, useEffect, useState } from 'react';
import {
  getStoredPushToken,
  registerForPushNotificationsAsync,
} from '@/lib/notifications/push';
import {
  getPermissions,
  openSystemSettings,
  type PermissionState,
} from '@/lib/notifications/setup';

const INITIAL_PERMISSION: PermissionState = {
  granted: false,
  canAskAgain: true,
  status: 'undetermined',
};

export type UsePushNotificationsApi = {
  token: string | null;
  permission: PermissionState;
  loading: boolean;
  /** Trigger the permission prompt and fetch an Expo push token. */
  register: () => Promise<string | null>;
  /** Re-read permission status (e.g. after returning from Settings). */
  refreshPermission: () => Promise<void>;
  /** Open the OS settings page so the user can re-enable notifications. */
  openSettings: () => Promise<void>;
};

export function usePushNotifications(): UsePushNotificationsApi {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>(INITIAL_PERMISSION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [perm, stored] = await Promise.all([
        getPermissions(),
        getStoredPushToken(),
      ]);
      if (cancelled) return;
      setPermission(perm);
      setToken(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async () => {
    setLoading(true);
    try {
      const next = await registerForPushNotificationsAsync();
      const perm = await getPermissions();
      setToken(next);
      setPermission(perm);
      return next;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPermission = useCallback(async () => {
    setPermission(await getPermissions());
  }, []);

  return {
    token,
    permission,
    loading,
    register,
    refreshPermission,
    openSettings: openSystemSettings,
  };
}
