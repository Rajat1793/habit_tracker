/**
 * Tiny RFC4122-v4-ish id generator.
 *
 * Not cryptographically strong — adequate for local-only habit ids that
 * are never exposed to a third party. Avoids pulling in `expo-crypto`
 * just for one call site.
 */
export function makeId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
