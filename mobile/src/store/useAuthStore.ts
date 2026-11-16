import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null, token: string | null) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'usr_nurse_1',
    email: 'nurse@bilisure.org',
    name: 'Nurse A',
    role: 'nurse',
    department: 'NICU',
    facility: 'Central Children Hospital',
  },
  token: 'mock_jwt_token',
  isAuthenticated: true,
  isLoading: false,

  setUser: (user, token) => {
    set({ user, token, isAuthenticated: !!token });
    if (token) {
      AsyncStorage.setItem('@bilisure_access_token', token);
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('@bilisure_access_token');
    await AsyncStorage.removeItem('@bilisure_refresh_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initializeAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('@bilisure_access_token');
      if (token) {
        set({ token, isAuthenticated: true });
      }
    } catch {}
  },
}));
