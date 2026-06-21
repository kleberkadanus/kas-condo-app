import { apiClient } from './client';
import { User } from '../types';

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get('/auth/me');
  return res.data;
}

export async function changePassword(current: string, newPass: string): Promise<void> {
  await apiClient.post('/auth/change-password', { current_password: current, new_password: newPass });
}
