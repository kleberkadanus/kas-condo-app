import { useSIPStore } from '../store/sip';
import { User } from '../types';

let Pjsip: any = null;
try {
  Pjsip = require('react-native-sip2').default;
} catch {
  console.warn('[SIP] react-native-sip2 não disponível — modo sem SIP');
}

class SIPService {
  private initialized = false;
  private accountId: number | null = null;
  private sipDomain = '';

  async init(user: User): Promise<void> {
    if (!Pjsip || !user.sip_user || !user.sip_domain || !user.sip_password) {
      console.log('[SIP] Config ausente, sip_user=' + user?.sip_user + ' domain=' + user?.sip_domain);
      return;
    }
    if (this.initialized) return;

    this.sipDomain = user.sip_domain;

    try {
      // Inicia o engine PJSIP (não recebe config de conta — apenas inicializa)
      await Pjsip.start();

      // Eventos corretos da API react-native-sip2 v3
      Pjsip.addListener('registration_changed', (account: any) => {
        const status: string = account.getRegistrationStatus
          ? account.getRegistrationStatus()
          : (account.registrationStatus ?? '');
        const registered = status === 'Registered';
        useSIPStore.getState().setRegistered(registered);
        console.log('[SIP] Status registro:', status);
      });

      Pjsip.addListener('call_received', (call: any) => {
        const callId = call.getId ? call.getId() : call.id;
        const callerName = call.getRemoteDisplayName ? call.getRemoteDisplayName() : 'Portaria';
        const callerNumber = call.getRemoteUri ? call.getRemoteUri() : '';
        useSIPStore.getState().setIncomingCall({
          callId: String(callId),
          callerName: callerName || 'Portaria',
          callerNumber,
          state: 'incoming',
        });
      });

      Pjsip.addListener('call_changed', (call: any) => {
        const state: string = call.getState ? call.getState() : (call.state ?? '');
        if (state === 'PJSIP_INV_STATE_DISCONNECTED') {
          useSIPStore.getState().setIncomingCall(null);
          useSIPStore.getState().setActiveCall(null);
        }
      });

      // Registra conta SIP — porta 7040 inclusa no domain para PJSIP rotear corretamente
      const account = await Pjsip.createAccount({
        name: user.name || user.sip_user,
        username: user.sip_user,
        domain: `${user.sip_domain}:7040`,
        password: user.sip_password,
        transport: 'UDP',
        regServer: null,
        regTimeout: 300,
        proxy: null,
      });

      this.accountId = account.getId ? account.getId() : (account.id ?? null);
      this.initialized = true;
      console.log('[SIP] Conta criada, ID=' + this.accountId + ' domain=' + user.sip_domain + ':7040');
    } catch (e) {
      console.error('[SIP] Erro ao inicializar:', e);
    }
  }

  async answer(callId: string): Promise<void> {
    if (!Pjsip) return;
    const incoming = useSIPStore.getState().incomingCall;
    if (!incoming) return;
    await Pjsip.answerCall(Number(callId));
    useSIPStore.getState().setActiveCall({ ...incoming, state: 'active' });
    useSIPStore.getState().setIncomingCall(null);
  }

  async reject(callId: string): Promise<void> {
    if (!Pjsip) return;
    await Pjsip.hangupCall(Number(callId));
    useSIPStore.getState().setIncomingCall(null);
  }

  async hangup(callId: string): Promise<void> {
    if (!Pjsip) return;
    await Pjsip.hangupCall(Number(callId));
    useSIPStore.getState().setActiveCall(null);
  }

  async makeCall(target: string): Promise<void> {
    if (!Pjsip || this.accountId === null) {
      console.warn('[SIP] Não registrado — impossível ligar');
      return;
    }
    try {
      const dest = target.startsWith('sip:') ? target : `sip:${target}@${this.sipDomain}`;
      const call = await Pjsip.makeCall(this.accountId, dest);
      const callId = call.getId ? call.getId() : call.id;
      useSIPStore.getState().setActiveCall({
        callId: String(callId),
        callerName: target,
        callerNumber: target,
        state: 'active',
      });
    } catch (e) {
      console.error('[SIP] Erro ao ligar:', e);
    }
  }

  async unregister(): Promise<void> {
    if (!Pjsip) return;
    if (this.accountId !== null) {
      try { await Pjsip.deleteAccount(this.accountId); } catch {}
      this.accountId = null;
    }
    this.initialized = false;
    useSIPStore.getState().setRegistered(false);
  }
}

export const sipService = new SIPService();
