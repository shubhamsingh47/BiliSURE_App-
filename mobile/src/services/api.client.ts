import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// PC LAN IP for physical mobile devices connected to the same Wi-Fi network
const DEV_LAN_IP = '192.168.1.103';

const getBackendBaseUrl = (): string => {
  try {
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      (Constants as any)?.expoGoConfig?.debuggerHost ||
      (Constants as any)?.manifest?.debuggerHost ||
      (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:5000/api/v1`;
      }
    }
  } catch { }

  // Fallback to PC Wi-Fi IP so physical Android/iOS devices connect reliably
  return `http://${DEV_LAN_IP}:5000/api/v1`;
};

export const API_BASE_URL = getBackendBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('@bilisure_access_token');
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token || 'mock_jwt_token'}`;
      }
    } catch {
      if (config.headers) {
        config.headers.Authorization = 'Bearer mock_jwt_token';
      }
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    console.warn('[API Request Error]', error.message);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url} (Data items: ${Array.isArray(response.data?.data) ? response.data.data.length : 'ok'})`);
    return response;
  },
  async (error: AxiosError) => {
    console.warn(`[API Response Error] ${error.message} on ${error.config?.url}`);
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('@bilisure_refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data.data.accessToken;
          await AsyncStorage.setItem('@bilisure_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch { }
    }
    return Promise.reject(error);
  }
);
