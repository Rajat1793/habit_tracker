/**
 * Notification tap → expo-router navigate.
 *
 * Same handler is used for BOTH local and push notifications: expo-notifications
 * delivers every tap through the same response listener, and the payload shape
 * (`{ screen: '/habit', habitId }`) is identical for both sides.
 *
 * Handles three response kinds:
 *   1. DONE action button   → mark the habit done (stays in current screen).
 *   2. SNOOZE_10 action      → schedule a one-shot 10 minutes out.
 *   3. Default tap           → deep-link via `resolveHref`.
 *
 * Also handles two timing cases:
 *   a. Cold start — app was killed; tap launched it. We look at
 *      `getLastNotificationResponseAsync` once on mount.
 *   b. Warm tap — app already running or backgrounded. The listener fires.
 *
 * Missing / malformed payloads fall back to the home screen via `resolveHref`,
 * so a bad notification never deep-links into a 404.
 */
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { markDoneTodayById } from '@/hooks/use-habits';
import {
  ACTION_DONE,
  ACTION_SNOOZE_10,
  snoozeHabit,
} from '@/lib/notifications/actions';
import { resolveHref } from '@/lib/notifications/router';
import { isDeepLinkPayload } from '@/lib/habits/types';

async function handleResponse(
  response: Notifications.NotificationResponse,
  navigate: (href: `/habit/${string}`) => void,
): Promise<void> {
  const data = response.notification.request.content.data;
  const habitId = isDeepLinkPayload(data) ? data.habitId : null;

  switch (response.actionIdentifier) {
    case ACTION_DONE:
      if (habitId) await markDoneTodayById(habitId);
      return;
    case ACTION_SNOOZE_10:
      if (habitId) await snoozeHabit(habitId, 10);
      return;
    default: {
      // DEFAULT_ACTION_IDENTIFIER — user tapped the body of the notification.
      const resolved = resolveHref(data);
      if (resolved.kind === 'habit') navigate(resolved.href);
      return;
    }
  }
}

export function useNotificationRouter(): void {
  const router = useRouter();
  const handledColdStart = useRef(false);

  useEffect(() => {
    const navigate = (href: `/habit/${string}`) => router.push(href);

    if (!handledColdStart.current) {
      handledColdStart.current = true;
      (async () => {
        try {
          const last = await Notifications.getLastNotificationResponseAsync();
          if (last) await handleResponse(last, navigate);
        } catch {
          // ignore — cold-start lookup is best-effort
        }
      })();
    }

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void handleResponse(response, navigate);
      },
    );

    return () => sub.remove();
  }, [router]);
}
