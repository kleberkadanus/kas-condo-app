import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { listApartments, createApartment, listParkingSlots } from '../../api/condos';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';

export function ApartamentosScreen() {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const qc = useQueryClient();
  const [tab, setTab] = useState<'apts' | 'vagas'>('apts');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ number: '', block: '', floor: '' });

  const { data: apts, isLoading: loadingA } = useQuery({
    queryKey: ['apartments', condoId],
    queryFn: () => listApartments(condoId),
    enabled: !!condoId,
  });

  const { data: vagas, isLoading: loadingV } = useQuery({
    queryKey: ['parking', condoId],
    queryFn: () => listParkingSlots(condoId),
    enabled: !!condoId,
  });

  const createMut = useMutation({
    mutationFn: () => createApartment(condoId, {
      number: form.number,
      block: form.block || undefined,
      floor: form.floor ? parseInt(form.floor) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['apartments', condoId] });
      setModalVisible(false);
      setForm({ number: '', block: '', floor: '' });
      Alert.alert('Sucesso', 'Apartamento cadastrado!');
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.detail ?? 'Erro ao cadastrar apartamento.'),
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'apts' && styles.tabActive]} onPress={() => setTab('apts')}>
          <Text style={[styles.tabText, tab === 'apts' && styles.tabTextActive]}>🏠 Apartamentos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'vagas' && styles.tabActive]} onPress={() => setTab('vagas')}>
          <Text style={[styles.tabText, tab === 'vagas' && styles.tabTextActive]}>🚗 Vagas</Text>
        </TouchableOpacity>
      </View>

      {tab === 'apts' ? (
        <>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Novo Apartamento</Text>
          </TouchableOpacity>
          {loadingA ? <LoadingSpinner /> : (
            <FlatList
              data={apts}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.aptNumber}>Apt {item.number}</Text>
                    {item.block && <Text style={styles.aptDetail}>Bloco {item.block}</Text>}
                    {item.floor != null && <Text style={styles.aptDetail}>{item.floor}º andar</Text>}
                  </View>
                  {item.owner_name && (
                    <View style={styles.cardRight}>
                      <Text style={styles.ownerName}>{item.owner_name}</Text>
                      <Text style={styles.ownerLabel}>Proprietário</Text>
                    </View>
                  )}
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Nenhum apartamento cadastrado.</Text>}
            />
          )}
        </>
      ) : (
        loadingV ? <LoadingSpinner /> : (
          <FlatList
            data={vagas}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.aptNumber}>Vaga {item.number}</Text>
                <Text style={styles.aptDetail}>{item.type === 'covered' ? '🅿️ Coberta' : '🚗 Descoberta'}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Nenhuma vaga cadastrada.</Text>}
          />
        )
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo Apartamento</Text>
            <ScrollView>
              {[
                { key: 'number', label: 'Número', placeholder: 'Ex: 101' },
                { key: 'block', label: 'Bloco (opcional)', placeholder: 'Ex: A' },
                { key: 'floor', label: 'Andar (opcional)', placeholder: 'Ex: 1', keyboard: 'numeric' },
              ].map(({ key, label, placeholder, keyboard }) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={form[key as keyof typeof form]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                    placeholder={placeholder}
                    keyboardType={(keyboard as any) ?? 'default'}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, createMut.isPending && { opacity: 0.6 }]}
                disabled={createMut.isPending}
                onPress={() => {
                  if (!form.number) { Alert.alert('Informe o número'); return; }
                  createMut.mutate();
                }}
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
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, elevation: 2 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.sindico },
  tabText: { fontSize: 14, color: colors.textSecondary },
  tabTextActive: { color: colors.sindico, fontWeight: '600' },
  addBtn: { margin: 16, backgroundColor: colors.sindico, borderRadius: 10, padding: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  cardLeft: {},
  cardRight: { alignItems: 'flex-end' },
  aptNumber: { fontSize: 16, fontWeight: '700', color: colors.text },
  aptDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  ownerName: { fontSize: 13, color: colors.text, fontWeight: '600' },
  ownerLabel: { fontSize: 11, color: colors.textLight },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: colors.sindico, borderRadius: 10, padding: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
});
