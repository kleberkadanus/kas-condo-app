import { useSIPStore } from '../store/sip';
import { User } from '../types';

let Pjsip: any = null;
try {
  Pjsip = require('react-native-sip2').default;
} catch {
  console.warn('[SIP] react-native-sip2 nao disponivel');
}

const SIP_PORT = '7040';

class SIPService {
  private initialized = false;
  private accountId: number | null = null;
  private sipDomain = '';

  async init(user: User): Promise<void> {
    if (!Pjsip || !user.sip_user || !user.sip_domain || !user.sip_password) {
      console.log('[SIP] Config ausente:', { sip_user: user?.sip_user, domain: user?.sip_domain });
      return;
    }
    if (this.initialized) return;

    this.sipDomain = user.sip_domain;

    try {
      await Pjsip.start();

      Pjsip.addListener('registration_changed', (account: any) => {
        const status: string = account.getRegistrationStatus
          ? account.getRegistrationStatus()
          : (account.registrationStatus ?? '');
        useSIPStore.getState().setRegistered(status === 'Registered');
        console.log('[SIP] Registro:', status);
      });

      Pjsip.addListener('call_received', (call: any) => {
        const callId = String(call.getId ? call.getId() : call.id);
        const callerName = (call.getRemoteDisplayName ? call.getRemoteDisplayName() : '') || 'Portaria';
        useSIPStore.getState().setIncomingCall({
          callId,
          callerName,
          callerNumber: call.getRemoteUri ? call.getRemoteUri() : '',
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

      // proxy com ;lr força o REGISTER a ser enviado na porta certa (7040)
      const account = await Pjsip.createAccount({
        name: user.name || user.sip_user,
        username: user.sip_user,
        domain: user.sip_domain,
        password: user.sip_password,
        transport: 'UDP',
        proxy: `sip:${user.sip_domain}:${SIP_PORT};lr`,
        regServer: null,
        regTimeout: 300,
      });

      this.accountId = account.getId ? account.getId() : (account.id ?? null);
      this.initialized = true;
      console.log('[SIP] Registrando — conta ID=' + this.accountId + ' proxy=' + user.sip_domain + ':' + SIP_PORT);
    } catch (e) {
      console.error('[SIP] Erro:', e);
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
    if (!Pjsip || this.accountId === null) return;
    try {
      const dest = target.startsWith('sip:') ? target : `sip:${target}@${this.sipDomain}`;
      const call = await Pjsip.makeCall(this.accountId, dest);
      const callId = String(call.getId ? call.getId() : call.id);
      useSIPStore.getState().setActiveCall({ callId, callerName: target, callerNumber: target, state: 'active' });
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
