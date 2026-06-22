import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { listAnnouncements } from '../../api/announcements';
import { listResidents } from '../../api/condos';
import { listAllBoletos } from '../../api/boletos';
import { listBookings } from '../../api/bookings';
import { colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';

export function SindicoDashboard({ navigation }: any) {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: avisos, refetch: r1 } = useQuery({ queryKey: ['announcements', condoId], queryFn: () => listAnnouncements(condoId), enabled: !!condoId });
  const { data: moradores, refetch: r2 } = useQuery({ queryKey: ['residents', condoId], queryFn: () => listResidents(condoId), enabled: !!condoId });
  const { data: boletos, refetch: r3 } = useQuery({ queryKey: ['boletos-all', condoId], queryFn: () => listAllBoletos(condoId), enabled: !!condoId });
  const { data: reservas, refetch: r4 } = useQuery({ queryKey: ['bookings', condoId], queryFn: () => listBookings(condoId), enabled: !!condoId });

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([r1(), r2(), r3(), r4()]);
    setRefreshing(false);
  }

  const inadimplentes = boletos?.filter((b) => !b.paid).length ?? 0;
  const pendentesReservas = reservas?.filter((r) => r.status === 'pending').length ?? 0;
  const totalReceber = boletos?.filter((b) => !b.paid).reduce((acc, b) => acc + b.amount, 0) ?? 0;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Painel do Síndico</Text>
        <Text style={styles.subtitle}>{user?.name}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Moradores" value={String(moradores?.length ?? 0)} icon="👥" color={colors.primary} onPress={() => navigation.navigate('Moradores')} />
        <StatCard label="Inadimplentes" value={String(inadimplentes)} icon="⚠️" color={inadimplentes > 0 ? colors.warning : colors.success} onPress={() => navigation.navigate('BoletosSindico')} />
        <StatCard label="A receber" value={formatCurrency(totalReceber)} icon="💰" color={colors.error} onPress={() => navigation.navigate('BoletosSindico')} />
        <StatCard label="Reservas pendentes" value={String(pendentesReservas)} icon="📅" color={colors.info} onPress={() => navigation.navigate('ReservasSindico')} />
      </View>

      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>Ações rápidas</Text>
        <ActionButton label="📋 Publicar aviso" onPress={() => navigation.navigate('NovoAviso')} />
        <ActionButton label="💰 Boletos" onPress={() => navigation.navigate('BoletosSindico')} />
        <ActionButton label="📅 Reservas" onPress={() => navigation.navigate('ReservasSindico')} />
        <ActionButton label="👥 Gerenciar moradores" onPress={() => navigation.navigate('Moradores')} />
        <ActionButton label="🏠 Apartamentos e vagas" onPress={() => navigation.navigate('Apartamentos')} />
        <ActionButton label="📹 Câmeras" onPress={() => navigation.navigate('Câmeras')} />
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, icon, color, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.statCard, { borderTopColor: color }]} onPress={onPress}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionButton({ label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <Text style={styles.actionBtnText}>{label}</Text>
      <Text style={styles.actionArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.sindico, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderTopWidth: 3,
    elevation: 1,
    alignItems: 'center',
  },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  actions: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  actionBtn: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  actionBtnText: { fontSize: 15, color: colors.text },
  actionArrow: { fontSize: 20, color: colors.textSecondary },
});
