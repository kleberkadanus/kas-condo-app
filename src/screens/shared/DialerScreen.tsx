import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Vibration,
} from 'react-native';
import { useSIPStore } from '../../store/sip';
import { sipService } from '../../services/sip';
import { colors } from '../../utils/colors';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

export function DialerScreen() {
  const { registered, activeCall } = useSIPStore();
  const [number, setNumber] = useState('');

  function pressKey(k: string) {
    Vibration.vibrate(30);
    setNumber((n) => n + k);
  }

  function backspace() {
    setNumber((n) => n.slice(0, -1));
  }

  async function dial() {
    if (!number.trim()) { Alert.alert('Digite um ramal para ligar'); return; }
    if (!registered) { Alert.alert('SIP não registrado', 'Verifique sua conexão e ramal SIP.'); return; }
    await sipService.makeCall(number.trim());
  }

  async function hangup() {
    if (activeCall) {
      await sipService.hangup(activeCall.callId);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: registered ? colors.success : colors.error }]} />
        <Text style={styles.statusText}>
          {registered ? 'SIP Registrado' : 'SIP não registrado'}
        </Text>
      </View>

      {activeCall ? (
        <View style={styles.activeCallBox}>
          <Text style={styles.activeCallLabel}>Em chamada</Text>
          <Text style={styles.activeCallNumber}>{activeCall.callerName}</Text>
          <Text style={styles.activeCallSub}>{activeCall.callerNumber}</Text>
          <TouchableOpacity style={styles.hangupBtn} onPress={hangup}>
            <Text style={styles.hangupBtnText}>📵 Encerrar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.display}>
            <Text style={styles.displayNumber} numberOfLines={1}>{number || ' '}</Text>
            {number.length > 0 && (
              <TouchableOpacity style={styles.backspaceBtn} onPress={backspace} onLongPress={() => setNumber('')}>
                <Text style={styles.backspaceBtnText}>⌫</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.keypad}>
            {KEYS.map((row, ri) => (
              <View key={ri} style={styles.keyRow}>
                {row.map((k) => (
                  <TouchableOpacity key={k} style={styles.key} onPress={() => pressKey(k)}>
                    <Text style={styles.keyText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.dialBtn, !registered && styles.dialBtnDisabled]}
            onPress={dial}
          >
            <Text style={styles.dialBtnText}>📞 Ligar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingTop: 20 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    elevation: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, color: colors.textSecondary },
  display: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 70,
  },
  displayNumber: { fontSize: 32, fontWeight: '300', color: colors.text, letterSpacing: 4, flex: 1, textAlign: 'center' },
  backspaceBtn: { padding: 8 },
  backspaceBtnText: { fontSize: 22, color: colors.textSecondary },
  keypad: { gap: 12, marginBottom: 32 },
  keyRow: { flexDirection: 'row', gap: 20 },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  keyText: { fontSize: 26, fontWeight: '300', color: colors.text },
  dialBtn: {
    backgroundColor: colors.success,
    borderRadius: 36,
    paddingHorizontal: 48,
    paddingVertical: 18,
    elevation: 2,
  },
  dialBtnDisabled: { backgroundColor: colors.textLight },
  dialBtnText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  activeCallBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  activeCallLabel: { fontSize: 14, color: colors.textSecondary },
  activeCallNumber: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  activeCallSub: { fontSize: 14, color: colors.textLight },
  hangupBtn: {
    backgroundColor: colors.error,
    borderRadius: 36,
    paddingHorizontal: 48,
    paddingVertical: 18,
    marginTop: 32,
  },
  hangupBtnText: { fontSize: 18, fontWeight: '600', color: '#fff' },
});
