export type UserRole = 'superadmin' | 'sindico' | 'zelador' | 'morador' | 'portaria';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  condo_id?: number;
  condo_slug?: string;
  apt_number?: string;
  avatar_url?: string;
  sip_user?: string;
  sip_password?: string;
  sip_domain?: string;
}

export interface Condo {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  plan: 'basic' | 'pro' | 'enterprise';
  active: boolean;
  logo_url?: string;
  cameras: Camera[];
  amenities: Amenity[];
}

export interface Apartment {
  id: number;
  number: string;
  block?: string;
  floor?: number;
  condo_id: number;
  owner_name?: string;
  owner_id?: number;
  parking_slots: ParkingSlot[];
}

export interface ParkingSlot {
  id: number;
  number: string;
  apt_id?: number;
  type: 'covered' | 'uncovered';
  condo_id: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  category: 'aviso' | 'manutencao' | 'evento' | 'financeiro';
  author_name: string;
  created_at: string;
  condo_id: number;
  attachments?: string[];
}

export interface Amenity {
  id: number;
  name: string;
  type: 'salao_festas' | 'piscina' | 'churrasqueira' | 'academia' | 'quadra' | 'outro';
  capacity: number;
  rules?: string;
  available_start: string;
  available_end: string;
  max_hours: number;
  requires_approval: boolean;
  condo_id: number;
  images?: string[];
}

export interface Booking {
  id: number;
  amenity_id: number;
  amenity_name: string;
  user_id: number;
  user_name: string;
  apt_number: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface Boleto {
  id: number;
  apt_id: number;
  apt_number: string;
  month: number;
  year: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_at?: string;
  pdf_url?: string;
  description?: string;
  condo_id: number;
}

export interface Camera {
  id: number;
  name: string;
  location: string;
  hls_url: string;
  condo_id: number;
  active: boolean;
}

export interface Resident {
  id: number;
  name: string;
  email: string;
  phone?: string;
  apt_number: string;
  condo_id: number;
  active: boolean;
  sip_extension?: string;
  role?: 'morador' | 'sindico' | 'zelador';
  sip_password?: string;
}

export interface SIPCall {
  callId: string;
  callerName: string;
  callerNumber: string;
  state: 'incoming' | 'active' | 'ended';
}
