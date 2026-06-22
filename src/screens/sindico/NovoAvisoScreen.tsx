import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Switch,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { createAnnouncement } from '../../api/announcements';
import { colors } from '../../utils/colors';

const CATEGORIES = [
  { value: 'aviso', label: 'Aviso Geral' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'evento', label: 'Evento' },
  { value: 'financeiro', label: 'Financeiro' },
];

export function NovoAvisoScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('aviso');
  const [pinned, setPinned] = useState(false);

  const mut = useMutation({
    mutationFn: () => createAnnouncement(condoId, { title, content, category: category as any, pinned }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements', condoId] });
      Alert.alert('Sucesso!', 'Aviso publicado.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.detail ?? 'Não foi possível publicar o aviso.'),
  });

  function handleSave() {
    if (!title.trim()) { Alert.alert('Atenção', 'Informe o título do aviso.'); return; }
    if (!content.trim()) { Alert.alert('Atenção', 'Informe o conteúdo do aviso.'); return; }
    mut.mutate();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Título do aviso"
        placeholderTextColor={colors.textLight}
        maxLength={120}
      />

      <Text style={styles.label}>Conteúdo</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={content}
        onChangeText={setContent}
        placeholder="Descreva o aviso em detalhes..."
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Categoria</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.categoryBtn, category === c.value && styles.categoryBtnActive]}
            onPress={() => setCategory(c.value)}
          >
            <Text style={[styles.categoryText, category === c.value && styles.categoryTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>📌 Fixar aviso no topo</Text>
        <Switch
          value={pinned}
          onValueChange={setPinned}
          trackColor={{ true: colors.sindico }}
          thumbColor={pinned ? '#fff' : colors.textLight}
        />
      </View>

      <TouchableOpacity
        style={[styles.publishBtn, mut.isPending && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={mut.isPending}
      >
        <Text style={styles.publishBtnText}>
          {mut.isPending ? 'Publicando...' : '📢 Publicar Aviso'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: colors.text,
  },
  textarea: { height: 140, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryBtnActive: { backgroundColor: colors.sindico, borderColor: colors.sindico },
  categoryText: { fontSize: 13, color: colors.textSecondary },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: { fontSize: 15, color: colors.text },
  publishBtn: {
    backgroundColor: colors.sindico,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  publishBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
