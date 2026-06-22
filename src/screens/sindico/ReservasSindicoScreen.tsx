import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { listBookings, approveBooking, rejectBooking } from '../../api/bookings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';
import { formatDate, getStatusLabel, getStatusColor } from '../../utils/helpers';

export function ReservasSindicoScreen() {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'todos' | 'pending' | 'approved'>('todos');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', condoId],
    queryFn: () => listBookings(condoId),
    enabled: !!condoId,
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => approveBooking(condoId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings', condoId] }),
    onError: () => Alert.alert('Erro', 'Não foi possível aprovar a reserva.'),
  });

  const rejectMut = useMutation({
    mutationFn: (id: number) => rejectBooking(condoId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings', condoId] }),
    onError: () => Alert.alert('Erro', 'Não foi possível recusar a reserva.'),
  });

  const filtered = data?.filter((b) => {
    if (filter === 'pending') return b.status === 'pending';
    if (filter === 'approved') return b.status === 'approved';
    return true;
  }) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['todos', 'pending', 'approved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'todos' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Aprovados'}
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
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.amenityName}>{item.amenity_name}</Text>
                  <Text style={styles.residentName}>{item.user_name} · Apt {item.apt_number}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              <Text style={styles.detail}>
                📅 {formatDate(item.date)} · {item.start_time} – {item.end_time}
              </Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => Alert.alert('Recusar reserva?', '', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Recusar', style: 'destructive', onPress: () => rejectMut.mutate(item.id) },
                    ])}
                  >
                    <Text style={styles.rejectText}>Recusar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => Alert.alert('Aprovar reserva?', '', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Aprovar', onPress: () => approveMut.mutate(item.id) },
                    ])}
                  >
                    <Text style={styles.approveText}>Aprovar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma reserva encontrada.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: { flexDirection: 'row', gap: 8, padding: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterBtnActive: { backgroundColor: colors.sindico, borderColor: colors.sindico },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  amenityName: { fontSize: 15, fontWeight: '700', color: colors.text },
  residentName: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  detail: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  notes: { fontSize: 12, color: colors.textLight, fontStyle: 'italic', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: colors.error, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  rejectText: { color: colors.error, fontWeight: '600', fontSize: 13 },
  approveBtn: { flex: 1, backgroundColor: colors.success, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  approveText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
});
