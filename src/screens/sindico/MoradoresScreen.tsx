import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { listResidents, createResident, deleteResident } from '../../api/condos';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';

export function MoradoresScreen() {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', apt_number: '', password: '', sip_extension: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['residents', condoId],
    queryFn: () => listResidents(condoId),
    enabled: !!condoId,
  });

  const createMut = useMutation({
    mutationFn: () => createResident(condoId, { ...form, password: form.password }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['residents', condoId] });
      setModalVisible(false);
      setForm({ name: '', email: '', phone: '', apt_number: '', password: '', sip_extension: '' });
      Alert.alert('Sucesso', 'Morador cadastrado!');
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.detail ?? 'Erro ao cadastrar morador.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteResident(condoId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['residents', condoId] }),
    onError: () => Alert.alert('Erro', 'Não foi possível remover o morador.'),
  });

  if (isLoading) return <LoadingSpinner label="Carregando moradores..." />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Novo Morador</Text>
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
              <Text style={styles.apt}>Apt {item.apt_number}</Text>
              <Text style={styles.email}>{item.email}</Text>
              {item.sip_extension && <Text style={styles.sip}>Ramal: {item.sip_extension}</Text>}
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
        ListEmptyComponent={<Text style={styles.empty}>Nenhum morador cadastrado.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo Morador</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(['name', 'email', 'phone', 'apt_number', 'sip_extension', 'password'] as const).map((field) => (
                <View key={field} style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    {field === 'name' ? 'Nome' : field === 'email' ? 'E-mail' : field === 'phone' ? 'Telefone' : field === 'apt_number' ? 'Apartamento' : field === 'sip_extension' ? 'Ramal SIP (opcional)' : 'Senha'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form[field]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
                    secureTextEntry={field === 'password'}
                    keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
                    autoCapitalize={field === 'email' ? 'none' : 'words'}
                    placeholder={field === 'apt_number' ? 'Ex: 101' : field === 'sip_extension' ? 'Ex: 8200' : ''}
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
                onPress={() => createMut.mutate()}
              >
                <Text style={styles.saveText}>Salvar</Text>
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
  deleteIcon: { fontSize: 20 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: colors.sindico, borderRadius: 10, padding: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
});
