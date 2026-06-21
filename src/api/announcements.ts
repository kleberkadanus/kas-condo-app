import { apiClient } from './client';
import { Announcement } from '../types';

export async function listAnnouncements(condoId: number): Promise<Announcement[]> {
  const res = await apiClient.get(`/condos/${condoId}/announcements`);
  return res.data;
}

export async function createAnnouncement(
  condoId: number,
  data: Partial<Announcement>,
): Promise<Announcement> {
  const res = await apiClient.post(`/condos/${condoId}/announcements`, data);
  return res.data;
}

export async function updateAnnouncement(
  condoId: number,
  id: number,
  data: Partial<Announcement>,
): Promise<Announcement> {
  const res = await apiClient.put(`/condos/${condoId}/announcements/${id}`, data);
  return res.data;
}

export async function deleteAnnouncement(condoId: number, id: number): Promise<void> {
  await apiClient.delete(`/condos/${condoId}/announcements/${id}`);
}
