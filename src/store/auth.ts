import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import * as authApi from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isReady: false,

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        const user = await authApi.getMe();
        set({ user, token, isReady: true });
      } else {
        set({ isReady: true });
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
      set({ user: null, token: null, isReady: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { token, user } = await authApi.login(email, password);
      await SecureStore.setItemAsync('auth_token', token);
      set({ user, token, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, token: null });
  },

  updateUser: (user) => set({ user }),
}));
