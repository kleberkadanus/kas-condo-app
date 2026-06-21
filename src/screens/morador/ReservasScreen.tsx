import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Alert, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { listAmenities, myBookings, createBooking, cancelBooking } from '../../api/bookings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';
import { formatDate, getAmenityLabel, getStatusLabel, getStatusColor } from '../../utils/helpers';
import { Amenity } from '../../types';

export function ReservasScreen() {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const qc = useQueryClient();
  const [tab, setTab] = useState<'minhas' | 'nova'>('minhas');
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');

  const { data: amenities, isLoading: loadingA } = useQuery({
    queryKey: ['amenities', condoId],
    queryFn: () => listAmenities(condoId),
    enabled: !!condoId,
  });

  const { data: minhasReservas, isLoading: loadingR } = useQuery({
    queryKey: ['bookings-mine', condoId],
    queryFn: () => myBookings(condoId),
    enabled: !!condoId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createBooking(condoId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings-mine', condoId] });
      Alert.alert('Sucesso!', 'Reserva solicitada com sucesso.');
      setTab('minhas');
      setSelectedAmenity(null);
    },
    onError: (e: any) => {
      Alert.alert('Erro', e?.response?.data?.detail ?? 'Não foi possível realizar a reserva.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelBooking(condoId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings-mine', condoId] });
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'minhas' && styles.tabActive]}
          onPress={() => setTab('minhas')}
        >
          <Text style={[styles.tabText, tab === 'minhas' && styles.tabTextActive]}>Minhas Reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'nova' && styles.tabActive]}
          onPress={() => setTab('nova')}
        >
          <Text style={[styles.tabText, tab === 'nova' && styles.tabTextActive]}>Nova Reserva</Text>
        </TouchableOpacity>
      </View>

      {tab === 'minhas' ? (
        loadingR ? <LoadingSpinner /> : (
          <FlatList
            data={minhasReservas}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.amenityName}>{item.amenity_name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                  </View>
                </View>
                <Text style={styles.cardDetail}>📅 {formatDate(item.date)} · {item.start_time} – {item.end_time}</Text>
                {item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
                {item.status === 'pending' || item.status === 'approved' ? (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() =>
                      Alert.alert('Cancelar reserva', 'Confirma o cancelamento?', [
                        { text: 'Não', style: 'cancel' },
                        { text: 'Sim', onPress: () => cancelMutation.mutate(item.id) },
                      ])
                    }
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Você não tem reservas.</Text>}
          />
        )
      ) : (
        loadingA ? <LoadingSpinner /> : (
          <ScrollView contentContainerStyle={styles.list}>
            <Text style={styles.sectionLabel}>Escolha o espaço:</Text>
            {amenities?.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.amenityCard, selectedAmenity?.id === a.id && styles.amenitySelected]}
                onPress={() => setSelectedAmenity(a)}
              >
                <Text style={styles.amenityTitle}>{a.name}</Text>
                <Text style={styles.amenityMeta}>{getAmenityLabel(a.type)} · até {a.capacity} pessoas</Text>
                <Text style={styles.amenityHours}>🕐 {a.available_start} – {a.available_end}</Text>
              </TouchableOpacity>
            ))}

            {selectedAmenity && (
              <View style={styles.bookingForm}>
                <Text style={styles.sectionLabel}>Data (AAAA-MM-DD):</Text>
                <View style={styles.inputRow}>
                  <TouchableOpacity style={styles.timeInput} onPress={() => {}}>
                    <Text style={styles.timeInputText}>{bookingDate || 'Ex: 2026-07-01'}</Text>
                  </TouchableOpacity>
                </View>
                {/* Simplificado: campos de texto para data/hora */}
                <Text style={styles.hint}>
                  ℹ️ Horário disponível: {selectedAmenity.available_start} – {selectedAmenity.available_end}
                  {'\n'}Máximo: {selectedAmenity.max_hours}h · Capacidade: {selectedAmenity.capacity} pessoas
                </Text>
                {selectedAmenity.rules && (
                  <View style={styles.rules}>
                    <Text style={styles.rulesTitle}>Regras de uso:</Text>
                    <Text style={styles.rulesText}>{selectedAmenity.rules}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.confirmBtn, createMutation.isPending && { opacity: 0.6 }]}
                  disabled={createMutation.isPending}
                  onPress={() => {
                    if (!bookingDate) { Alert.alert('Informe a data'); return; }
                    createMutation.mutate({
                      amenity_id: selectedAmenity.id,
                      date: bookingDate,
                      start_time: startTime,
                      end_time: endTime,
                    });
                  }}
                >
                  <Text style={styles.confirmBtnText}>Confirmar Reserva</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, elevation: 2 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  amenityName: { fontSize: 16, fontWeight: '700', color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardDetail: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  cardNotes: { fontSize: 13, color: colors.textLight, fontStyle: 'italic' },
  cancelBtn: { marginTop: 10, alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.error },
  cancelBtnText: { color: colors.error, fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  amenityCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 2, borderColor: 'transparent', elevation: 1 },
  amenitySelected: { borderColor: colors.primary },
  amenityTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  amenityMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  amenityHours: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  bookingForm: { marginTop: 16, backgroundColor: colors.surface, borderRadius: 12, padding: 16, elevation: 1 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  timeInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12 },
  timeInputText: { color: colors.text, fontSize: 14 },
  hint: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 12 },
  rules: { backgroundColor: colors.background, borderRadius: 8, padding: 12, marginBottom: 12 },
  rulesTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  rulesText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  confirmBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
