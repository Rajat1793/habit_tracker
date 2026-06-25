/**
 * Persisted "user has seen onboarding" flag.
 * Stored in AsyncStorage; reset via Settings → Show onboarding again.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDED_KEY = '@streaks/onboarded';

export async function isOnboarded(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDED_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, '1');
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDED_KEY);
}
