import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { listAllBoletos, markPaid, uploadBoleto } from '../../api/boletos';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';
import { formatDate, formatCurrency } from '../../utils/helpers';

export function BoletosSindicoScreen() {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const qc = useQueryClient();
  const [tab, setTab] = useState<'lista' | 'novo'>('lista');
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'pagos'>('todos');
  const [form, setForm] = useState({
    apt_number: '', description: '', amount: '', due_date: '', month: '', year: String(new Date().getFullYear()),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['boletos-all', condoId],
    queryFn: () => listAllBoletos(condoId),
    enabled: !!condoId,
  });

  const paidMut = useMutation({
    mutationFn: (id: number) => markPaid(condoId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boletos-all', condoId] }),
  });

  const createMut = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('apt_number', form.apt_number);
      fd.append('description', form.description || 'Condomínio');
      fd.append('amount', form.amount);
      fd.append('due_date', form.due_date);
      fd.append('month', form.month || String(new Date().getMonth() + 1));
      fd.append('year', form.year);
      return uploadBoleto(condoId, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boletos-all', condoId] });
      setForm({ apt_number: '', description: '', amount: '', due_date: '', month: '', year: String(new Date().getFullYear()) });
      setTab('lista');
      Alert.alert('Sucesso!', 'Boleto criado.');
    },
    onError: (e: any) => Alert.alert('Erro', e?.response?.data?.detail ?? 'Não foi possível criar o boleto.'),
  });

  function handleCreate() {
    if (!form.apt_number || !form.amount || !form.due_date) {
      Alert.alert('Atenção', 'Preencha Apartamento, Valor e Vencimento.');
      return;
    }
    createMut.mutate();
  }

  const filtered = data?.filter((b) => {
    if (filter === 'pendentes') return !b.paid;
    if (filter === 'pagos') return b.paid;
    return true;
  }) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'lista' && styles.tabActive]} onPress={() => setTab('lista')}>
          <Text style={[styles.tabText, tab === 'lista' && styles.tabTextActive]}>Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'novo' && styles.tabActive]} onPress={() => setTab('novo')}>
          <Text style={[styles.tabText, tab === 'novo' && styles.tabTextActive]}>+ Novo Boleto</Text>
        </TouchableOpacity>
      </View>

      {tab === 'lista' ? (
        <>
          <View style={styles.filterRow}>
            {(['todos', 'pendentes', 'pagos'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? <LoadingSpinner /> : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={[styles.card, !item.paid && styles.cardPending]}>
                  <View style={styles.cardTop}>
                    <View>
                      <Text style={styles.desc}>{item.description || 'Condomínio'}</Text>
                      <Text style={styles.apt}>Apt {item.apt_number}</Text>
                    </View>
                    <Text style={[styles.amount, item.paid ? styles.amountPaid : styles.amountDue]}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.dueDate}>
                      {item.paid ? `✅ Pago em ${formatDate(item.paid_at!)}` : `Vence: ${formatDate(item.due_date)}`}
                    </Text>
                    {!item.paid && (
                      <TouchableOpacity
                        style={styles.paidBtn}
                        onPress={() => Alert.alert('Marcar como pago?', `Boleto de ${item.apt_number}`, [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Confirmar', onPress: () => paidMut.mutate(item.id) },
                        ])}
                      >
                        <Text style={styles.paidBtnText}>Marcar pago</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Nenhum boleto encontrado.</Text>}
            />
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.formContent}>
          <Text style={styles.formTitle}>Novo Boleto</Text>
          {[
            { key: 'apt_number', label: 'Apartamento', placeholder: 'Ex: 101' },
            { key: 'description', label: 'Descrição', placeholder: 'Ex: Cond. Maio/2026' },
            { key: 'amount', label: 'Valor (R$)', placeholder: '350.00', keyboard: 'decimal-pad' },
            { key: 'due_date', label: 'Vencimento (AAAA-MM-DD)', placeholder: '2026-07-10' },
            { key: 'month', label: 'Mês de referência', placeholder: String(new Date().getMonth() + 1) },
          ].map(({ key, label, placeholder, keyboard }) => (
            <View key={key} style={styles.field}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                value={form[key as keyof typeof form]}
                onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                placeholder={placeholder}
                placeholderTextColor={colors.textLight}
                keyboardType={(keyboard as any) ?? 'default'}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveBtn, createMut.isPending && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={createMut.isPending}
          >
            <Text style={styles.saveBtnText}>{createMut.isPending ? 'Salvando...' : 'Criar Boleto'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  filterRow: { flexDirection: 'row', gap: 8, padding: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterBtnActive: { backgroundColor: colors.sindico, borderColor: colors.sindico },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, elevation: 1 },
  cardPending: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  desc: { fontSize: 15, fontWeight: '600', color: colors.text },
  apt: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 18, fontWeight: 'bold' },
  amountDue: { color: colors.error },
  amountPaid: { color: colors.success },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueDate: { fontSize: 13, color: colors.textSecondary },
  paidBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.success },
  paidBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  formContent: { padding: 20, gap: 4 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text, backgroundColor: colors.surface },
  saveBtn: { backgroundColor: colors.sindico, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
