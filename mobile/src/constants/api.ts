import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const MAC_WIFI_IP = '10.30.10.24';

function getDefaultApiUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && !hostUri.includes('exp.direct') && !hostUri.includes('ngrok')) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8088`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8088';
  }

  // Physical iOS devices on local Wi-Fi connect to the Mac's IP
  return `http://${MAC_WIFI_IP}:8088`;
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
