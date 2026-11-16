import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBackendBaseUrl = (): string => {
  // If running via Expo development server on a physical device, resolve host machine's LAN IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    return `http://${hostIp}:5000/api/v1`;
  }

  // Android Virtual Device (AVD) emulator alias
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }

  return 'http://localhost:5000/api/v1';
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
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry) {
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
      } catch {
        await AsyncStorage.removeItem('@bilisure_access_token');
        await AsyncStorage.removeItem('@bilisure_refresh_token');
      }
    }
    return Promise.reject(error);
  }
);
