/**
 * Notification setup: foreground handler, Android channel, permission helper.
 * Filled in by todo #4.
 *
 * Why a separate module? Components must never call `Notifications.*` directly.
 * Anything that touches OS state lives here so it can be mocked + reasoned about.
 */

/** Stable channel id reused by every scheduled habit reminder. */
export const HABIT_CHANNEL_ID = 'habit-reminders';

export type PermissionState = {
  granted: boolean;
  canAskAgain: boolean;
  status: 'undetermined' | 'denied' | 'granted';
};

/**
 * Install the global foreground handler. Call once from the root layout.
 * Must be invoked before the first notification arrives.
 */
export function installForegroundHandler(): void {
  throw new Error('not implemented — see todo #4');
}

/**
 * Create the high-importance Android channel if it does not exist.
 *
 * Must run BEFORE `requestPermissionsAsync` on Android 13+:
 * the permission dialog inspects existing channels, and notifications
 * posted before the channel exists fall back to LOW importance and
 * never show as heads-up.
 */
export async function ensureAndroidChannel(): Promise<void> {
  throw new Error('not implemented — see todo #4');
}

/** Read current permission status without prompting. Never throws. */
export async function getPermissions(): Promise<PermissionState> {
  throw new Error('not implemented — see todo #4');
}

/** Prompt for permission if still askable. Never throws. */
export async function requestPermissions(): Promise<PermissionState> {
  throw new Error('not implemented — see todo #4');
}

/** Open the OS settings page for this app (denied-state CTA). */
export async function openSystemSettings(): Promise<void> {
  throw new Error('not implemented — see todo #4');
}
