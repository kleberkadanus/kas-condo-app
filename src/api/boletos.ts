import { apiClient } from './client';
import { Boleto } from '../types';

export async function listMyBoletos(condoId: number): Promise<Boleto[]> {
  const res = await apiClient.get(`/condos/${condoId}/boletos/mine`);
  return res.data;
}

export async function listAllBoletos(condoId: number, params?: { month?: number; year?: number }): Promise<Boleto[]> {
  const res = await apiClient.get(`/condos/${condoId}/boletos`, { params });
  return res.data;
}

export async function uploadBoleto(condoId: number, formData: FormData): Promise<Boleto> {
  const res = await apiClient.post(`/condos/${condoId}/boletos/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function markPaid(condoId: number, boletoId: number): Promise<Boleto> {
  const res = await apiClient.post(`/condos/${condoId}/boletos/${boletoId}/paid`);
  return res.data;
}
