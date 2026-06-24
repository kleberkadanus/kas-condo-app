import { useSIPStore } from '../store/sip';
import { User } from '../types';

let endpoint: any = null;

function getEndpoint() {
  if (endpoint) return endpoint;
  try {
    const { Endpoint } = require('react-native-sip2');
    endpoint = new Endpoint();
  } catch (e) {
    console.warn('[SIP] react-native-sip2 nao disponivel:', e);
  }
  return endpoint;
}

class SIPService {
  private initialized = false;
  private account: any = null;
  private calls: Map<string, any> = new Map();
  private sipDomain = '';

  async init(user: User): Promise<void> {
    if (!user.sip_user || !user.sip_domain || !user.sip_password) {
      console.log('[SIP] Config ausente:', { sip_user: user?.sip_user, domain: user?.sip_domain });
      return;
    }
    if (this.initialized) return;

    const ep = getEndpoint();
    if (!ep) {
      console.warn('[SIP] Endpoint nao disponivel');
      return;
    }

    this.sipDomain = user.sip_domain;

    try {
      await ep.start({});
      console.log('[SIP] Endpoint iniciado');

      ep.on('registration_changed', (acc: any) => {
        const reg = acc.getRegistration();
        const active = reg ? reg.isActive() : false;
        const status = reg ? reg.getStatusText() : '';
        useSIPStore.getState().setRegistered(active);
        console.log('[SIP] Registro:', active ? 'REGISTRADO' : 'nao registrado', status);
      });

      ep.on('call_received', (call: any) => {
        const callId = String(call.getId());
        this.calls.set(callId, call);
        const remoteName = call.getRemoteName ? call.getRemoteName() : '';
        const remoteNumber = call.getRemoteNumber ? call.getRemoteNumber() : '';
        useSIPStore.getState().setIncomingCall({
          callId,
          callerName: remoteName || remoteNumber || 'Portaria',
          callerNumber: remoteNumber,
          state: 'incoming',
        });
        console.log('[SIP] Chamada recebida de:', remoteName || remoteNumber);
      });

      ep.on('call_changed', (call: any) => {
        const callId = String(call.getId());
        this.calls.set(callId, call);
        const state: string = call.getState ? call.getState() : '';
        console.log('[SIP] Chamada alterada:', state);
        if (state === 'PJSIP_INV_STATE_DISCONNECTED') {
          this.calls.delete(callId);
          useSIPStore.getState().setIncomingCall(null);
          useSIPStore.getState().setActiveCall(null);
        }
      });

      ep.on('call_terminated', (call: any) => {
        const callId = String(call.getId());
        this.calls.delete(callId);
        useSIPStore.getState().setIncomingCall(null);
        useSIPStore.getState().setActiveCall(null);
        console.log('[SIP] Chamada encerrada:', callId);
      });

      this.account = await ep.createAccount({
        name: user.name || user.sip_user,
        username: user.sip_user,
        domain: user.sip_domain,
        password: user.sip_password,
        transport: 'UDP',
        proxy: `${user.sip_domain}:5060`,
        regServer: user.sip_domain,
        regTimeout: 300,
      });

      this.initialized = true;
      console.log('[SIP] Conta criada, ID=' + this.account.getId() + ', registrando em ' + user.sip_domain + ':5060');
    } catch (e) {
      console.error('[SIP] Erro ao iniciar:', e);
    }
  }

  async answer(callId: string): Promise<void> {
    const ep = getEndpoint();
    if (!ep) return;
    const call = this.calls.get(callId);
    if (!call) {
      console.warn('[SIP] Chamada nao encontrada para atender:', callId);
      return;
    }
    await ep.answerCall(call);
    const incoming = useSIPStore.getState().incomingCall;
    if (incoming) {
      useSIPStore.getState().setActiveCall({ ...incoming, state: 'active' });
      useSIPStore.getState().setIncomingCall(null);
    }
  }

  async reject(callId: string): Promise<void> {
    const ep = getEndpoint();
    if (!ep) return;
    const call = this.calls.get(callId);
    if (!call) return;
    await ep.declineCall(call);
    this.calls.delete(callId);
    useSIPStore.getState().setIncomingCall(null);
  }

  async hangup(callId: string): Promise<void> {
    const ep = getEndpoint();
    if (!ep) return;
    const call = this.calls.get(callId);
    if (!call) return;
    await ep.hangupCall(call);
    this.calls.delete(callId);
    useSIPStore.getState().setActiveCall(null);
  }

  async makeCall(target: string): Promise<void> {
    const ep = getEndpoint();
    if (!ep || !this.account) return;
    try {
      const dest = target.startsWith('sip:') ? target : `sip:${target}@${this.sipDomain}`;
      const call = await ep.makeCall(this.account, dest);
      const callId = String(call.getId());
      this.calls.set(callId, call);
      useSIPStore.getState().setActiveCall({ callId, callerName: target, callerNumber: target, state: 'active' });
    } catch (e) {
      console.error('[SIP] Erro ao ligar:', e);
    }
  }

  async unregister(): Promise<void> {
    const ep = getEndpoint();
    if (!ep) return;
    if (this.account) {
      try { await ep.deleteAccount(this.account); } catch {}
      this.account = null;
    }
    this.calls.clear();
    this.initialized = false;
    useSIPStore.getState().setRegistered(false);
  }
}

export const sipService = new SIPService();
