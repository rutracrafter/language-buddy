import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Auto-detect local dev machine IP from Expo host URI when possible
function getDefaultApiUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8081`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8081';
  }

  return 'http://localhost:8081';
}

let cachedApiUrl: string | null = null;
const API_URL_KEY = 'lb_api_url_override';

export async function getApiBaseUrl(): Promise<string> {
  if (cachedApiUrl) return cachedApiUrl;
  try {
    const saved = await SecureStore.getItemAsync(API_URL_KEY);
    if (saved) {
      cachedApiUrl = saved;
      return saved;
    }
  } catch {
    // ignore
  }

  const fallback = getDefaultApiUrl();
  cachedApiUrl = fallback;
  return fallback;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  cachedApiUrl = url.trim().replace(/\/+$/, '');
  await SecureStore.setItemAsync(API_URL_KEY, cachedApiUrl);
}
