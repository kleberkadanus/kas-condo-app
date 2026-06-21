import { apiClient } from './client';
import { Amenity, Booking } from '../types';

export async function listAmenities(condoId: number): Promise<Amenity[]> {
  const res = await apiClient.get(`/condos/${condoId}/amenities`);
  return res.data;
}

export async function listBookings(condoId: number, params?: { date?: string; amenity_id?: number }): Promise<Booking[]> {
  const res = await apiClient.get(`/condos/${condoId}/bookings`, { params });
  return res.data;
}

export async function myBookings(condoId: number): Promise<Booking[]> {
  const res = await apiClient.get(`/condos/${condoId}/bookings/mine`);
  return res.data;
}

export async function createBooking(condoId: number, data: {
  amenity_id: number;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}): Promise<Booking> {
  const res = await apiClient.post(`/condos/${condoId}/bookings`, data);
  return res.data;
}

export async function cancelBooking(condoId: number, bookingId: number): Promise<void> {
  await apiClient.delete(`/condos/${condoId}/bookings/${bookingId}`);
}

export async function approveBooking(condoId: number, bookingId: number): Promise<Booking> {
  const res = await apiClient.post(`/condos/${condoId}/bookings/${bookingId}/approve`);
  return res.data;
}

export async function rejectBooking(condoId: number, bookingId: number, reason?: string): Promise<Booking> {
  const res = await apiClient.post(`/condos/${condoId}/bookings/${bookingId}/reject`, { reason });
  return res.data;
}
