/**
 * Check push receipts for previously sent tickets.
 *
 * Usage:
 *   cd server && npm run receipts
 *
 * Reads ticket IDs from ./tickets.json (written by send.js) and prints the
 * receipt for each. Flags `DeviceNotRegistered` so the calling system knows
 * to drop the token from its database — APNs/FCM has signalled that the
 * device will never receive notifications on this token again.
 *
 * Why receipts matter (and tickets aren't enough):
 *   - A ticket only confirms Expo's push service ACCEPTED the message.
 *   - The receipt confirms it was successfully handed to APNs/FCM (or not).
 *   - Errors like DeviceNotRegistered, MessageTooBig, InvalidCredentials,
 *     and MessageRateExceeded only surface in receipts, never in tickets.
 *   - Expo recommends polling receipts ~15 minutes after sending.
 */
import { Expo } from 'expo-server-sdk';
import { readFile } from 'node:fs/promises';

let ids;
try {
  ids = JSON.parse(await readFile('./tickets.json', 'utf8'));
} catch {
  console.error('No tickets.json found — run `npm run send` first.');
  process.exit(1);
}

if (!Array.isArray(ids) || ids.length === 0) {
  console.error('tickets.json is empty.');
  process.exit(1);
}

const expo = new Expo();
const chunks = expo.chunkPushNotificationReceiptIds(ids);

for (const chunk of chunks) {
  try {
    const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
    for (const [receiptId, receipt] of Object.entries(receipts)) {
      if (receipt.status === 'ok') {
        console.log(`✓ ${receiptId} delivered`);
        continue;
      }

      console.warn(`✗ ${receiptId} failed:`, receipt.message);
      const code = receipt.details?.error;
      if (code) console.warn('  error code:', code);

      if (code === 'DeviceNotRegistered') {
        // In a real server, look up the token associated with this ticket
        // and DELETE it from your DB. The device has uninstalled the app,
        // revoked permission, or reinstalled (which rotates the token).
        console.warn('  → token must be removed from server DB');
      }
    }
  } catch (err) {
    console.error('Receipt fetch failed:', err);
  }
}
