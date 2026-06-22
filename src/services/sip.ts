/**
 * Serviço SIP usando react-native-sip2 (PJSIP nativo para Android).
 * Registra o ramal do usuário e gerencia chamadas recebidas da portaria.
 */
import { useSIPStore } from '../store/sip';
import { User } from '../types';

// react-native-sip2 é um módulo nativo — importado condicionalmente
let SipModule: any = null;
try {
  SipModule = require('react-native-sip2').default;
} catch {
  console.warn('[SIP] react-native-sip2 não disponível — modo sem SIP');
}

class SIPService {
  private initialized = false;

  async init(user: User): Promise<void> {
    if (!SipModule || !user.sip_user || !user.sip_domain || !user.sip_password) {
      console.log('[SIP] Configuração SIP ausente — sem registro');
      return;
    }
    if (this.initialized) return;

    try {
      await SipModule.start({
        domain: user.sip_domain,
        username: user.sip_user,
        password: user.sip_password,
        displayName: user.name,
        transport: 'UDP',
        port: '5060',
      });

      SipModule.addListener('registration', (event: any) => {
        const registered = event.registrationState === 'OK';
        useSIPStore.getState().setRegistered(registered);
        console.log('[SIP] Registro:', event.registrationState);
      });

      SipModule.addListener('callReceived', (event: any) => {
        useSIPStore.getState().setIncomingCall({
          callId: event.callId,
          callerName: event.displayName || 'Portaria',
          callerNumber: event.remoteUri,
          state: 'incoming',
        });
      });

      SipModule.addListener('callStateChanged', (event: any) => {
        if (event.callState === 'PJSIP_INV_STATE_DISCONNECTED') {
          useSIPStore.getState().setIncomingCall(null);
          useSIPStore.getState().setActiveCall(null);
        }
      });

      this.initialized = true;
    } catch (e) {
      console.error('[SIP] Erro ao inicializar:', e);
    }
  }

  async answer(callId: string): Promise<void> {
    if (!SipModule) return;
    const incoming = useSIPStore.getState().incomingCall;
    if (!incoming) return;
    await SipModule.answerCall(callId);
    useSIPStore.getState().setActiveCall({ ...incoming, state: 'active' });
    useSIPStore.getState().setIncomingCall(null);
  }

  async reject(callId: string): Promise<void> {
    if (!SipModule) return;
    await SipModule.hangupCall(callId);
    useSIPStore.getState().setIncomingCall(null);
  }

  async hangup(callId: string): Promise<void> {
    if (!SipModule) return;
    await SipModule.hangupCall(callId);
    useSIPStore.getState().setActiveCall(null);
  }

  async makeCall(target: string): Promise<void> {
    if (!SipModule || !this.initialized) {
      console.warn('[SIP] Não registrado — não é possível ligar');
      return;
    }
    try {
      const callId = await SipModule.makeCall(target);
      useSIPStore.getState().setActiveCall({
        callId,
        callerName: target,
        callerNumber: target,
        state: 'active',
      });
    } catch (e) {
      console.error('[SIP] Erro ao ligar:', e);
    }
  }

  async unregister(): Promise<void> {
    if (!SipModule || !this.initialized) return;
    await SipModule.stop();
    this.initialized = false;
    useSIPStore.getState().setRegistered(false);
  }
}

export const sipService = new SIPService();
