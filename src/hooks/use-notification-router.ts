/**
 * Notification tap → expo-router navigate.
 *
 * Same handler is used for BOTH local and push notifications: expo-notifications
 * delivers every tap through the same response listener, and the payload shape
 * (`{ screen: '/habit', habitId }`) is identical for both sides.
 *
 * Handles two distinct cases:
 *   1. Cold start — app was killed; tap launched it. We look at
 *      `getLastNotificationResponseAsync` once on mount.
 *   2. Warm tap — app already running or backgrounded. The listener fires.
 *
 * Missing / malformed payloads fall back to the home screen via `resolveHref`,
 * so a bad notification never deep-links into a 404.
 */
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { resolveHref } from '@/lib/notifications/router';

export function useNotificationRouter(): void {
  const router = useRouter();
  const handledColdStart = useRef(false);

  useEffect(() => {
    if (!handledColdStart.current) {
      handledColdStart.current = true;
      (async () => {
        try {
          const last = await Notifications.getLastNotificationResponseAsync();
          if (!last) return;
          const resolved = resolveHref(last.notification.request.content.data);
          if (resolved.kind === 'habit') {
            router.push(resolved.href);
          }
        } catch {
          // ignore — cold-start lookup is best-effort
        }
      })();
    }

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const resolved = resolveHref(response.notification.request.content.data);
        if (resolved.kind === 'habit') {
          router.push(resolved.href);
        }
      },
    );

    return () => sub.remove();
  }, [router]);
}
