import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { clearQueryCache } from './queryClient';

const ACCESS_TOKEN_KEY = 'finflow.accessToken';
const REFRESH_TOKEN_KEY = 'finflow.refreshToken';

const getApiBaseUrl = () => {
  const rawUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const trimmedUrl = rawUrl?.trim();
  const isDev = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : process.env.NODE_ENV !== 'production';

  if (!isDev) {
    if (!trimmedUrl) {
      throw new Error(
        'EXPO_PUBLIC_API_BASE_URL is not configured. Production builds require a secure HTTPS API base URL.'
      );
    }
    if (!trimmedUrl.toLowerCase().startsWith('https://')) {
      throw new Error(
        `Insecure API base URL "${trimmedUrl}". Production builds must use HTTPS to prevent cleartext credential and financial data exposure.`
      );
    }
    return trimmedUrl;
  }

  if (!trimmedUrl) {
    console.warn(
      'EXPO_PUBLIC_API_BASE_URL is not configured. Defaulting to http://localhost:5000/api for local development.'
    );
    return 'http://localhost:5000/api';
  }

  return trimmedUrl;
};

const baseURL = getApiBaseUrl();

export const api = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
const refreshClient = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' }, timeout: 20000 });

let refreshPromise = null;
let onSessionExpired = null;
export const setSessionExpiredHandler = (handler) => { onSessionExpired = handler; };

export const saveTokens = async ({ accessToken, refreshToken }) => {
  await Promise.all([SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken), SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken)]);
};
export const clearTokens = async () => Promise.all([SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY), SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)]);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config;
  if (error.response?.status !== 401 || original?._retry || original?.url?.includes('/auth/refresh')) return Promise.reject(error);
  original._retry = true;
  try {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        const response = await refreshClient.post('/auth/refresh', { refreshToken });
        const accessToken = response.data?.accessToken;
        if (!accessToken) throw new Error('No access token returned');
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        return accessToken;
      })().finally(() => { refreshPromise = null; });
    }
    const token = await refreshPromise;
    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  } catch (refreshError) {
    clearQueryCache();
    await clearTokens();
    onSessionExpired?.();
    return Promise.reject(refreshError);
  }
});
