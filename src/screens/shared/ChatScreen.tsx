import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/auth';
import { listMessages, sendMessage, markRead, Message } from '../../api/chat';
import { colors } from '../../utils/colors';

export function ChatScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const condoId = user?.condo_id;

  const load = useCallback(async () => {
    if (!condoId) return;
    try {
      const msgs = await listMessages(condoId);
      setMessages(msgs);
      await markRead(condoId);
    } catch {}
    finally { setLoading(false); }
  }, [condoId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !condoId || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await sendMessage(condoId, content);
      setMessages(prev => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {}
    finally { setSending(false); }
  };

  const isSindico = user?.role === 'sindico' || user?.role === 'superadmin';

  const renderItem = ({ item }: { item: Message }) => {
    const isMine = item.mine;
    return (
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {!isMine && (
          <Text style={styles.senderName}>
            {item.sender_name}
            {item.sender_role === 'sindico' ? ' 👑' : item.sender_role === 'zelador' ? ' 🔧' : ''}
          </Text>
        )}
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.content}</Text>
        <Text style={[styles.time, isMine && styles.timeMine]}>
          {(() => {
            const raw = item.created_at;
            const ts = raw && !raw.endsWith('Z') && !raw.includes('+') ? raw + 'Z' : raw;
            return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          })()}
        </Text>
      </View>
    );
  };

  if (!condoId) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Chat disponível apenas para moradores cadastrados em um condomínio.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => String(m.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {isSindico
                  ? 'Nenhuma mensagem ainda. Os moradores podem iniciar uma conversa pelo app.'
                  : 'Nenhuma mensagem ainda. Envie uma mensagem para o síndico.'}
              </Text>
            </View>
          }
        />
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={isSindico ? 'Responder aos moradores...' : 'Mensagem para o síndico...'}
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendBtnText}>{sending ? '...' : '➤'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  list: { padding: 12, paddingBottom: 4 },
  bubble: {
    maxWidth: '80%', marginVertical: 4, padding: 10, borderRadius: 14,
  },
  bubbleMine: {
    alignSelf: 'flex-end', backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start', backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  senderName: { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  bubbleText: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  time: { fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: 'right' },
  timeMine: { color: 'rgba(255,255,255,0.7)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 8,
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: '#1e293b',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
