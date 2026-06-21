/**
 * Pure deep-link resolver shared by local + push notification tap handlers.
 *
 * Kept side-effect-free so it can be unit-tested without expo-router. The
 * actual navigation lives in `hooks/use-notification-router.ts` (todo #9).
 */
import { isDeepLinkPayload, type NotificationDeepLink } from '../habits/types';

export type ResolvedHref =
  | { kind: 'habit'; habitId: string; href: `/habit/${string}` }
  | { kind: 'fallback'; href: '/' };

/**
 * Convert a notification `data` payload into a router href.
 * Returns a fallback to the home screen for missing / malformed payloads
 * so the caller can still navigate somewhere sane.
 */
export function resolveHref(data: unknown): ResolvedHref {
  if (isDeepLinkPayload(data)) {
    return {
      kind: 'habit',
      habitId: data.habitId,
      href: `/habit/${data.habitId}`,
    };
  }
  return { kind: 'fallback', href: '/' };
}

export type { NotificationDeepLink };
