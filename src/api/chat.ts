import { apiClient } from './client';

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  created_at: string;
  read_at: string | null;
  mine: boolean;
}

export async function listMessages(condoId: number, limit = 60): Promise<Message[]> {
  const res = await apiClient.get(`/condos/${condoId}/chat?limit=${limit}`);
  return res.data;
}

export async function sendMessage(condoId: number, content: string): Promise<Message> {
  const res = await apiClient.post(`/condos/${condoId}/chat`, { content });
  return res.data;
}

export async function markRead(condoId: number): Promise<void> {
  await apiClient.put(`/condos/${condoId}/chat/read`);
}
