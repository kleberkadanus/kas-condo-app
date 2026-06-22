import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { listResidents, createUser, deleteResident } from '../../api/condos';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';

const ROLES = [
  { value: 'morador', label: 'Morador' },
  { value: 'zelador', label: 'Zelador' },
  { value: 'sindico', label: 'Síndico' },
];

const EMPTY_FORM = {
  name: '', email: '', phone: '', apt_number: '',
  sip_user: '', sip_password: '', password: '', role: 'morador',
};

export function MoradoresScreen() {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['residents', condoId],
    queryFn: () => listResidents(condoId),
    enabled: !!condoId,
  });

  const createMut = useMutation({
    mutationFn: () => createUser(condoId, {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      apt_number: form.apt_number || undefined,
      sip_user: form.sip_user || undefined,
      sip_password: form.sip_password || undefined,
      phone: form.phone || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['residents', condoId] });
      setModalVisible(false);
      setForm(EMPTY_FORM);
      Alert.alert('Sucesso', 'Usuário cadastrado!');
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.detail ?? 'Erro ao cadastrar.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteResident(condoId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['residents', condoId] }),
    onError: () => Alert.alert('Erro', 'Não foi possível remover.'),
  });

  if (isLoading) return <LoadingSpinner label="Carregando moradores..." />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Novo Usuário</Text>
      </TouchableOpacity>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              {item.apt_number && <Text style={styles.apt}>Apt {item.apt_number}</Text>}
              <Text style={styles.email}>{item.email}</Text>
              {item.sip_extension && <Text style={styles.sip}>Ramal: {item.sip_extension}</Text>}
              {item.role && item.role !== 'morador' && (
                <Text style={[styles.rolePill, item.role === 'sindico' ? styles.pillSindico : styles.pillZelador]}>
                  {item.role === 'sindico' ? '👑 Síndico' : '🔧 Zelador'}
                </Text>
              )}
            </View>
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
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum usuário cadastrado.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo Usuário</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Função / Role */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Função</Text>
                <View style={styles.roleRow}>
                  {ROLES.map((r) => (
                    <TouchableOpacity
                      key={r.value}
                      style={[styles.roleBtn, form.role === r.value && styles.roleBtnActive]}
                      onPress={() => setForm((f) => ({ ...f, role: r.value }))}
                    >
                      <Text style={[styles.roleText, form.role === r.value && styles.roleTextActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {[
                { key: 'name', label: 'Nome completo', placeholder: '' },
                { key: 'email', label: 'E-mail', placeholder: '', keyboard: 'email-address', cap: 'none' },
                { key: 'phone', label: 'Telefone (opcional)', placeholder: '', keyboard: 'phone-pad' },
                { key: 'apt_number', label: 'Apartamento', placeholder: 'Ex: 101' },
                { key: 'sip_user', label: 'Ramal SIP (opcional)', placeholder: 'Ex: 8200', keyboard: 'numeric' },
                { key: 'sip_password', label: 'Senha SIP (opcional)', placeholder: 'Senha do ramal' },
                { key: 'password', label: 'Senha de acesso ao app', placeholder: 'Mínimo 6 caracteres', secure: true },
              ].map(({ key, label, placeholder, keyboard, cap, secure }) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={form[key as keyof typeof form]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                    secureTextEntry={secure}
                    keyboardType={(keyboard as any) ?? 'default'}
                    autoCapitalize={(cap as any) ?? 'words'}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, createMut.isPending && { opacity: 0.6 }]}
                disabled={createMut.isPending}
                onPress={() => {
                  if (!form.name || !form.email || !form.password) {
                    Alert.alert('Atenção', 'Nome, e-mail e senha são obrigatórios.');
                    return;
                  }
                  createMut.mutate();
                }}
              >
                <Text style={styles.saveText}>{createMut.isPending ? 'Salvando...' : 'Salvar'}</Text>
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
  addBtn: { margin: 16, backgroundColor: colors.sindico, borderRadius: 10, padding: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.sindico, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  apt: { fontSize: 12, color: colors.textSecondary },
  email: { fontSize: 12, color: colors.textLight },
  sip: { fontSize: 11, color: colors.primary, marginTop: 2 },
  rolePill: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  pillSindico: { color: colors.sindico },
  pillZelador: { color: colors.zelador },
  deleteIcon: { fontSize: 20 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface },
  roleBtnActive: { backgroundColor: colors.sindico, borderColor: colors.sindico },
  roleText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  roleTextActive: { color: '#fff', fontWeight: '700' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: colors.sindico, borderRadius: 10, padding: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
});
