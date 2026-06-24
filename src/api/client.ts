import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE = __DEV__
  ? 'http://10.0.2.2:8090'
  : 'https://interfone.suporttechcuritiba.com.br';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // O store de auth vai detectar a ausência do token e redirecionar
    }
    return Promise.reject(error);
  },
);
