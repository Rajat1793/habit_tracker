/**
 * English locale — source of truth. All other languages must use the same keys.
 */
const en = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading…',
    back: 'Back',
  },

  home: {
    title: 'Today',
    settings: 'Settings',
    newHabit: '+ New',
    empty: {
      noHabitsTitle: 'No habits yet',
      noHabitsBody: 'Tap “+ New” to create your first habit and schedule a reminder.',
      nothingDueTitle: 'Nothing due today',
      nothingDueBody: 'Your weekly habits will surface here on their day.',
    },
    daily: 'Daily',
    weekly: 'Weekly',
    streak: '🔥 {{count}}',
    markDone: 'Mark done',
    done: '✓ Done',
  },

  detail: {
    schedule: 'Schedule',
    scheduleDaily: 'Every day at {{time}}',
    scheduleWeekly: '{{days}} at {{time}}',
    lastCompleted: 'Last completed',
    scheduledIds: 'Scheduled notification IDs',
    noIds: '(none — permission may be denied)',
    markToday: 'Mark done for today',
    doneToday: '✓ Done today',
    editBtn: 'Edit habit',
    deleteBtn: 'Delete habit',
    notFoundTitle: 'Habit not found',
    notFoundBody: 'This reminder may belong to a habit that was deleted.',
    backToToday: 'Back to today',
    deleteConfirmTitle: 'Delete habit',
    deleteConfirmBody: '“{{name}}” will be removed and its reminders cancelled.',
    streakDays: '🔥 {{count}} day streak',
  },

  form: {
    titleNew: 'New habit',
    titleEdit: 'Edit habit',
    name: 'Name',
    namePlaceholder: 'Drink water',
    emoji: 'Emoji',
    frequency: 'Frequency',
    reminderTime: 'Reminder time (24h)',
    create: 'Create habit',
    update: 'Update habit',
    saving: 'Saving…',
    saveError: 'Could not save',
  },

  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    appearanceSystem: 'System',
    appearanceLight: 'Light',
    appearanceDark: 'Dark',
    appearanceHint: '“System” follows your device’s light/dark setting in real time.',
    language: 'Language',
    languageSystem: 'System',
    permission: 'Notification permission',
    permissionGranted: 'Reminders and push notifications can arrive.',
    permissionDenied:
      'Notifications are off for Streaks. You can re-enable them from system settings.',
    enable: 'Enable notifications',
    requesting: 'Requesting…',
    openSystemSettings: 'Open system settings',
    refresh: 'I changed it — refresh',
    pushToken: 'Expo push token',
    noTokenGranted: 'No token yet. Tap below to register this device.',
    noTokenDenied: 'Grant permission first, then register.',
    register: 'Register for push',
    copyToken: 'Copy token',
    copied: '✓ Copied',
    pushFineprint:
      'Push requires a dev/standalone build — it does not work in Expo Go on SDK 53+.',
    testTitle: 'Test foreground + deep link',
    testHint:
      'Schedules a local notification in 3 seconds.\nKeep the app open to see the foreground banner; lock the screen to see background.',
    testBtn: 'Send test reminder in 3s',
    scheduling: 'Scheduling…',
    scheduledMsg: 'A test notification will arrive in 3 seconds.',
    permissionNeeded: 'Permission needed',
    permissionNeededBody: 'Enable notifications first.',
    quietTitle: 'Quiet hours',
    quietHint:
      'Reminders scheduled inside this window arrive silently (no sound, lower priority). Wraps across midnight — e.g. 22 → 7 covers 22, 23, 0, 1…6.',
    quietStart: 'Start hour (0–23)',
    quietEnd: 'End hour (0–23)',
    quietSaveBtn: 'Save quiet hours',
    quietSaved: '✓ Saved',
    quietFineprint:
      'New habits picked up the setting automatically. Existing reminders apply it on the next reschedule (edit / mark done).',
    backupTitle: 'Backup',
    backupHint:
      'Export your habits as JSON to the clipboard, or paste a backup to restore.',
    backupExport: 'Copy backup to clipboard',
    backupExported: '✓ Copied JSON',
    backupImport: 'Paste & restore from clipboard',
    backupImportConfirmTitle: 'Restore from clipboard',
    backupImportConfirmBody:
      'This will replace your current habits. Are you sure?',
    backupImportSuccess: 'Restored {{count}} habits.',
    backupImportFail: 'Could not parse clipboard as a valid Streaks backup.',
    backupEmpty: 'Clipboard is empty.',
    backupFineprint:
      'Restore reschedules notifications from scratch so reminders keep working after import.',
    advancedTitle: 'Advanced',
    onboardingReset: 'Show onboarding again',
    failed: 'Failed',
  },

  onboarding: {
    skip: 'Skip',
    next: 'Next',
    done: 'Get started',
    s1Title: 'Build streaks',
    s1Body: 'Create habits, mark them done daily, and watch the 🔥 grow.',
    s2Title: 'Reminders that work',
    s2Body:
      'Local notifications fire on schedule. Android uses a high-importance channel so they actually buzz.',
    s3Title: 'One tap, one habit',
    s3Body:
      'Tapping a reminder deep-links straight to that habit — even from the lock screen.',
  },

  a11y: {
    weekdaySun: 'Sunday',
    weekdayMon: 'Monday',
    weekdayTue: 'Tuesday',
    weekdayWed: 'Wednesday',
    weekdayThu: 'Thursday',
    weekdayFri: 'Friday',
    weekdaySat: 'Saturday',
    hintCopyToken: 'Copies your Expo push token to the clipboard.',
    hintBackupExport: 'Copies a JSON backup of all your habits to the clipboard.',
    hintBackupImport: 'Reads JSON from the clipboard and replaces your habits.',
    hintTestReminder: 'Schedules a notification three seconds from now.',
    hintDelete: 'Deletes this habit and cancels its reminders.',
    hintMarkDone: 'Marks this habit complete for today.',
    hintOnboardingReset: 'Shows the welcome carousel the next time you launch.',
    allDoneCelebration: 'All habits done for today. Great work.',
  },
};

// No `as const` here on purpose: `LocaleStrings` must have `string` leaves so
// translated locale files (hi, es) are assignable. Keys/structure are still
// enforced; only the literal values are widened.
export type LocaleStrings = typeof en;
export default en;
