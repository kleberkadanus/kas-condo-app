import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import {
  listApartments, createApartment, listParkingSlots,
  createParkingSlot, updateParkingSlot, deleteParkingSlot,
} from '../../api/condos';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';
import { ParkingSlot } from '../../types';

export function ApartamentosScreen() {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const qc = useQueryClient();
  const [tab, setTab] = useState<'apts' | 'vagas'>('apts');

  // Apt state
  const [aptModal, setAptModal] = useState(false);
  const [aptForm, setAptForm] = useState({ number: '', block: '', floor: '' });

  // Vaga state
  const [vagaModal, setVagaModal] = useState(false);
  const [vagaEditing, setVagaEditing] = useState<ParkingSlot | null>(null);
  const [vagaForm, setVagaForm] = useState({ number: '', type: 'covered' });

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

  const createAptMut = useMutation({
    mutationFn: () => createApartment(condoId, {
      number: aptForm.number,
      block: aptForm.block || undefined,
      floor: aptForm.floor ? parseInt(aptForm.floor) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['apartments', condoId] });
      setAptModal(false);
      setAptForm({ number: '', block: '', floor: '' });
      Alert.alert('Sucesso', 'Apartamento cadastrado!');
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.detail ?? 'Erro ao cadastrar.'),
  });

  const createVagaMut = useMutation({
    mutationFn: () => createParkingSlot(condoId, { number: vagaForm.number, type: vagaForm.type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parking', condoId] });
      setVagaModal(false);
      setVagaForm({ number: '', type: 'covered' });
      Alert.alert('Sucesso', 'Vaga cadastrada!');
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.detail ?? 'Erro ao cadastrar vaga.'),
  });

  const updateVagaMut = useMutation({
    mutationFn: () => updateParkingSlot(condoId, vagaEditing!.id, {
      number: vagaForm.number, type: vagaForm.type, apt_id: vagaEditing?.apt_id ?? null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parking', condoId] });
      setVagaModal(false);
      setVagaEditing(null);
      setVagaForm({ number: '', type: 'covered' });
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.detail ?? 'Erro ao atualizar.'),
  });

  const deleteVagaMut = useMutation({
    mutationFn: (slotId: number) => deleteParkingSlot(condoId, slotId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parking', condoId] }),
    onError: () => Alert.alert('Erro', 'Não foi possível remover a vaga.'),
  });

  const openNewVaga = () => {
    setVagaEditing(null);
    setVagaForm({ number: '', type: 'covered' });
    setVagaModal(true);
  };

  const openEditVaga = (v: ParkingSlot) => {
    setVagaEditing(v);
    setVagaForm({ number: v.number, type: v.type });
    setVagaModal(true);
  };

  const confirmDeleteVaga = (v: ParkingSlot) => {
    Alert.alert('Remover vaga', `Remover vaga ${v.number}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteVagaMut.mutate(v.id) },
    ]);
  };

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
          <TouchableOpacity style={styles.addBtn} onPress={() => setAptModal(true)}>
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
        <>
          <TouchableOpacity style={styles.addBtn} onPress={openNewVaga}>
            <Text style={styles.addBtnText}>+ Nova Vaga</Text>
          </TouchableOpacity>
          {loadingV ? <LoadingSpinner /> : (
            <FlatList
              data={vagas}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.aptNumber}>Vaga {item.number}</Text>
                    <Text style={styles.aptDetail}>{item.type === 'covered' ? '🅿️ Coberta' : '🚗 Descoberta'}</Text>
                    {item.apt_id && <Text style={styles.aptDetail}>Apt vinculado</Text>}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openEditVaga(item)}>
                      <Text style={{ fontSize: 14 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#fef2f2' }]} onPress={() => confirmDeleteVaga(item)}>
                      <Text style={{ fontSize: 14 }}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Nenhuma vaga cadastrada.</Text>}
            />
          )}
        </>
      )}

      {/* Modal Apartamento */}
      <Modal visible={aptModal} animationType="slide" transparent>
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
                    value={aptForm[key as keyof typeof aptForm]}
                    onChangeText={(v) => setAptForm((f) => ({ ...f, [key]: v }))}
                    placeholder={placeholder}
                    keyboardType={(keyboard as any) ?? 'default'}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAptModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, createAptMut.isPending && { opacity: 0.6 }]}
                disabled={createAptMut.isPending}
                onPress={() => {
                  if (!aptForm.number) { Alert.alert('Informe o número'); return; }
                  createAptMut.mutate();
                }}
              >
                <Text style={styles.saveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Vaga */}
      <Modal visible={vagaModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{vagaEditing ? 'Editar Vaga' : 'Nova Vaga'}</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Número da vaga</Text>
              <TextInput
                style={styles.input}
                value={vagaForm.number}
                onChangeText={(v) => setVagaForm((f) => ({ ...f, number: v }))}
                placeholder="Ex: 01, A1"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Tipo</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                {(['covered', 'uncovered'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, vagaForm.type === t && styles.typeBtnActive]}
                    onPress={() => setVagaForm((f) => ({ ...f, type: t }))}
                  >
                    <Text style={[styles.typeBtnText, vagaForm.type === t && { color: '#fff' }]}>
                      {t === 'covered' ? '🅿️ Coberta' : '🚗 Descoberta'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setVagaModal(false); setVagaEditing(null); }}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (createVagaMut.isPending || updateVagaMut.isPending) && { opacity: 0.6 }]}
                disabled={createVagaMut.isPending || updateVagaMut.isPending}
                onPress={() => {
                  if (!vagaForm.number) { Alert.alert('Informe o número da vaga'); return; }
                  vagaEditing ? updateVagaMut.mutate() : createVagaMut.mutate();
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
  iconBtn: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#e2e8f0' },
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
  typeBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, alignItems: 'center' },
  typeBtnActive: { backgroundColor: colors.sindico, borderColor: colors.sindico },
  typeBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
});
