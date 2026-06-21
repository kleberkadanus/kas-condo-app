import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCondos, createCondo, deleteCondo } from '../../api/condos';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';
import { Condo } from '../../types';

const PLAN_LABELS: Record<string, string> = { basic: 'Básico', pro: 'Pro', enterprise: 'Enterprise' };
const PLAN_COLORS: Record<string, string> = { basic: colors.info, pro: colors.primary, enterprise: colors.secondary };

export function CondominiosScreen({ navigation }: any) {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', address: '', city: '', state: 'SP', plan: 'basic',
  });

  const { data, isLoading } = useQuery({ queryKey: ['condos'], queryFn: listCondos });

  const createMut = useMutation({
    mutationFn: () => createCondo(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['condos'] });
      setModalVisible(false);
      setForm({ name: '', slug: '', address: '', city: '', state: 'SP', plan: 'basic' });
      Alert.alert('Sucesso', 'Condomínio criado!');
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.detail ?? 'Erro ao criar condomínio.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCondo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['condos'] }),
  });

  if (isLoading) return <LoadingSpinner label="Carregando condomínios..." />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Novo Condomínio</Text>
      </TouchableOpacity>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('DetalhesCondominio', { condo: item })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.condoName}>{item.name}</Text>
              <View style={[styles.planBadge, { backgroundColor: PLAN_COLORS[item.plan] }]}>
                <Text style={styles.planText}>{PLAN_LABELS[item.plan]}</Text>
              </View>
            </View>
            <Text style={styles.condoSlug}>@{item.slug}</Text>
            <Text style={styles.condoAddr}>{item.address}, {item.city}/{item.state}</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.activeBadge, { color: item.active ? colors.success : colors.error }]}>
                {item.active ? '● Ativo' : '● Inativo'}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Remover', `Remover ${item.name}?`, [
                    { text: 'Não', style: 'cancel' },
                    { text: 'Sim', style: 'destructive', onPress: () => deleteMut.mutate(item.id) },
                  ])
                }
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum condomínio cadastrado.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo Condomínio</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'Nome' },
                { key: 'slug', label: 'Slug (ID único, ex: residencial-flores)' },
                { key: 'address', label: 'Endereço' },
                { key: 'city', label: 'Cidade' },
                { key: 'state', label: 'Estado (UF)' },
              ].map(({ key, label }) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={(form as any)[key]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [key]: key === 'slug' ? v.toLowerCase().replace(/\s/g, '-') : v }))}
                    autoCapitalize={key === 'state' ? 'characters' : key === 'slug' ? 'none' : 'words'}
                    maxLength={key === 'state' ? 2 : undefined}
                  />
                </View>
              ))}
              <Text style={styles.fieldLabel}>Plano</Text>
              <View style={styles.planPicker}>
                {(['basic', 'pro', 'enterprise'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.planOption, form.plan === p && { backgroundColor: PLAN_COLORS[p] }]}
                    onPress={() => setForm((f) => ({ ...f, plan: p }))}
                  >
                    <Text style={[styles.planOptionText, form.plan === p && { color: '#fff' }]}>
                      {PLAN_LABELS[p]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, createMut.isPending && { opacity: 0.6 }]}
                disabled={createMut.isPending}
                onPress={() => createMut.mutate()}
              >
                <Text style={styles.saveText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addBtn: { margin: 16, backgroundColor: colors.superadmin, borderRadius: 10, padding: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  condoName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  planBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  planText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  condoSlug: { fontSize: 12, color: colors.primary, marginBottom: 2 },
  condoAddr: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeBadge: { fontSize: 13, fontWeight: '600' },
  deleteIcon: { fontSize: 20 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text },
  planPicker: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  planOption: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, alignItems: 'center' },
  planOptionText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: colors.superadmin, borderRadius: 10, padding: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
});
