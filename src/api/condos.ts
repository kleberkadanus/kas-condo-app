import { apiClient } from './client';
import { Condo, Apartment, ParkingSlot, Resident, Camera } from '../types';

// ─── Condominios (superadmin) ─────────────────────────────────────
export async function listCondos(): Promise<Condo[]> {
  const res = await apiClient.get('/admin/condos');
  return res.data;
}

export async function createCondo(data: Partial<Condo>): Promise<Condo> {
  const res = await apiClient.post('/admin/condos', data);
  return res.data;
}

export async function updateCondo(id: number, data: Partial<Condo>): Promise<Condo> {
  const res = await apiClient.put(`/admin/condos/${id}`, data);
  return res.data;
}

export async function deleteCondo(id: number): Promise<void> {
  await apiClient.delete(`/admin/condos/${id}`);
}

// ─── Moradores ────────────────────────────────────────────────────
export async function listResidents(condoId: number): Promise<Resident[]> {
  const res = await apiClient.get(`/condos/${condoId}/residents`);
  return res.data;
}

export async function createResident(condoId: number, data: Partial<Resident> & { password: string }): Promise<Resident> {
  const res = await apiClient.post(`/condos/${condoId}/residents`, data);
  return res.data;
}

export async function updateResident(condoId: number, id: number, data: Partial<Resident>): Promise<Resident> {
  const res = await apiClient.put(`/condos/${condoId}/residents/${id}`, data);
  return res.data;
}

export async function deleteResident(condoId: number, id: number): Promise<void> {
  await apiClient.delete(`/condos/${condoId}/residents/${id}`);
}

// ─── Apartamentos ─────────────────────────────────────────────────
export async function listApartments(condoId: number): Promise<Apartment[]> {
  const res = await apiClient.get(`/condos/${condoId}/apartments`);
  return res.data;
}

export async function createApartment(condoId: number, data: Partial<Apartment>): Promise<Apartment> {
  const res = await apiClient.post(`/condos/${condoId}/apartments`, data);
  return res.data;
}

// ─── Vagas ────────────────────────────────────────────────────────
export async function listParkingSlots(condoId: number): Promise<ParkingSlot[]> {
  const res = await apiClient.get(`/condos/${condoId}/parking`);
  return res.data;
}

export async function createParkingSlot(condoId: number, data: { number: string; type: string; apt_id?: number }): Promise<ParkingSlot> {
  const res = await apiClient.post(`/condos/${condoId}/parking`, data);
  return res.data;
}

export async function updateParkingSlot(condoId: number, slotId: number, data: { number: string; type: string; apt_id?: number | null }): Promise<ParkingSlot> {
  const res = await apiClient.put(`/condos/${condoId}/parking/${slotId}`, data);
  return res.data;
}

export async function deleteParkingSlot(condoId: number, slotId: number): Promise<void> {
  await apiClient.delete(`/condos/${condoId}/parking/${slotId}`);
}

// ─── Cameras ─────────────────────────────────────────────────────
export async function listCameras(condoId: number): Promise<Camera[]> {
  const res = await apiClient.get(`/condos/${condoId}/cameras`);
  return res.data;
}

// ─── Usuarios (superadmin) ────────────────────────────────────────
export async function createUser(condoId: number, data: {
  name: string;
  email: string;
  password?: string;
  role?: string;
  apt_number?: string;
  sip_user?: string;
  sip_password?: string;
  phone?: string;
}): Promise<Resident> {
  const res = await apiClient.post(`/admin/condos/${condoId}/users`, data);
  return res.data;
}
