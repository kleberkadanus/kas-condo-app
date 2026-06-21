import { create } from 'zustand';
import { SIPCall } from '../types';

interface SIPState {
  registered: boolean;
  incomingCall: SIPCall | null;
  activeCall: SIPCall | null;
  setRegistered: (v: boolean) => void;
  setIncomingCall: (call: SIPCall | null) => void;
  setActiveCall: (call: SIPCall | null) => void;
}

export const useSIPStore = create<SIPState>((set) => ({
  registered: false,
  incomingCall: null,
  activeCall: null,
  setRegistered: (registered) => set({ registered }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),
  setActiveCall: (activeCall) => set({ activeCall }),
}));
