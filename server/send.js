/**
 * Send a single Expo push notification to one device.
 *
 * Usage (from repo root):
 *   cd server && npm install
 *   TOKEN='ExponentPushToken[xxxxxxxx]' HABIT_ID='abc-123' npm run send
 *
 * Optional env:
 *   TITLE='Custom title'
 *   BODY='Custom body'
 *
 * Saves the returned ticket IDs to ./tickets.json so `npm run receipts`
 * can later report delivery (and detect DeviceNotRegistered).
 */
import { Expo } from 'expo-server-sdk';
import { writeFile } from 'node:fs/promises';

const token = process.env.TOKEN;
const habitId = process.env.HABIT_ID ?? '';
const title = process.env.TITLE ?? '🔥 Streak nudge';
const body = process.env.BODY ?? 'Tap to log your habit.';

if (!token) {
  console.error('Missing TOKEN env. Get it from the Settings screen → Copy token.');
  process.exit(1);
}
if (!Expo.isExpoPushToken(token)) {
  console.error(`"${token}" is not a valid Expo push token.`);
  process.exit(1);
}

const expo = new Expo();

// Same payload shape the local notifications use → same tap handler in-app.
const messages = [
  {
    to: token,
    sound: 'default',
    title,
    body,
    channelId: 'habit-reminders',
    data: habitId ? { screen: '/habit', habitId } : { screen: '/' },
  },
];

const chunks = expo.chunkPushNotifications(messages);
const tickets = [];

for (const chunk of chunks) {
  try {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  } catch (err) {
    console.error('Chunk send failed:', err);
  }
}

console.log('Tickets:');
console.dir(tickets, { depth: null });

const ids = tickets
  .filter((t) => t.status === 'ok')
  .map((t) => /** @type {{ id: string }} */ (t).id);
await writeFile('./tickets.json', JSON.stringify(ids, null, 2));
console.log(`\nSaved ${ids.length} ticket id(s) to tickets.json`);
console.log('Run `npm run receipts` in ~5–15 minutes to check delivery.');
