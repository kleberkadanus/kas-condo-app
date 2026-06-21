import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Modal,
} from 'react-native';
import { useSIPStore } from '../../store/sip';
import { sipService } from '../../services/sip';
import { colors } from '../../utils/colors';

export function IncomingCallModal() {
  const { incomingCall } = useSIPStore();

  React.useEffect(() => {
    if (incomingCall) {
      Vibration.vibrate([500, 500, 500, 500], true);
    } else {
      Vibration.cancel();
    }
    return () => Vibration.cancel();
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <Modal transparent animationType="slide" visible>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.callerIcon}>
            <Text style={styles.callerEmoji}>🏢</Text>
          </View>
          <Text style={styles.label}>Chamada da Portaria</Text>
          <Text style={styles.caller}>{incomingCall.callerName}</Text>
          <Text style={styles.callerNumber}>{incomingCall.callerNumber}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnReject]}
              onPress={() => sipService.reject(incomingCall.callId)}
            >
              <Text style={styles.btnIcon}>📵</Text>
              <Text style={styles.btnLabel}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnAnswer]}
              onPress={() => sipService.answer(incomingCall.callId)}
            >
              <Text style={styles.btnIcon}>📞</Text>
              <Text style={styles.btnLabel}>Atender</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    width: '85%',
    alignItems: 'center',
    elevation: 10,
  },
  callerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  callerEmoji: { fontSize: 36 },
  label: { color: colors.textSecondary, fontSize: 14, marginBottom: 4 },
  caller: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  callerNumber: { fontSize: 14, color: colors.textSecondary, marginBottom: 32 },
  buttons: { flexDirection: 'row', gap: 24 },
  btn: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    minWidth: 100,
  },
  btnReject: { backgroundColor: colors.error },
  btnAnswer: { backgroundColor: colors.success },
  btnIcon: { fontSize: 28, marginBottom: 4 },
  btnLabel: { color: '#fff', fontWeight: '600' },
});
