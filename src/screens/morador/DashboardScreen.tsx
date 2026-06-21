import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { useSIPStore } from '../../store/sip';
import { listAnnouncements } from '../../api/announcements';
import { listMyBoletos } from '../../api/boletos';
import { myBookings } from '../../api/bookings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';
import { formatDate, formatCurrency } from '../../utils/helpers';

export function MoradorDashboard({ navigation }: any) {
  const { user } = useAuthStore();
  const { registered } = useSIPStore();
  const condoId = user?.condo_id!;

  const { data: avisos, refetch: refetchAvisos, isLoading: loadingAvisos } = useQuery({
    queryKey: ['announcements', condoId],
    queryFn: () => listAnnouncements(condoId),
    enabled: !!condoId,
  });

  const { data: boletos, refetch: refetchBoletos } = useQuery({
    queryKey: ['boletos-mine', condoId],
    queryFn: () => listMyBoletos(condoId),
    enabled: !!condoId,
  });

  const { data: reservas, refetch: refetchReservas } = useQuery({
    queryKey: ['bookings-mine', condoId],
    queryFn: () => myBookings(condoId),
    enabled: !!condoId,
  });

  const [refreshing, setRefreshing] = React.useState(false);
  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refetchAvisos(), refetchBoletos(), refetchReservas()]);
    setRefreshing(false);
  }

  const boletosPendentes = boletos?.filter((b) => !b.paid) ?? [];
  const proximasReservas = reservas?.filter((r) => r.status === 'approved').slice(0, 3) ?? [];
  const avisosRecentes = avisos?.slice(0, 3) ?? [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.apt}>Apartamento {user?.apt_number}</Text>
        </View>
        <View style={[styles.sipBadge, registered ? styles.sipOk : styles.sipOff]}>
          <Text style={styles.sipText}>{registered ? '📞 Online' : '📵 Offline'}</Text>
        </View>
      </View>

      {/* Cards rápidos */}
      <View style={styles.quickCards}>
        <QuickCard
          emoji="📋"
          label="Avisos"
          value={`${avisos?.length ?? 0} novos`}
          color={colors.info}
          onPress={() => navigation.navigate('Avisos')}
        />
        <QuickCard
          emoji="💰"
          label="Boletos"
          value={boletosPendentes.length > 0 ? `${boletosPendentes.length} pendente(s)` : 'Em dia ✓'}
          color={boletosPendentes.length > 0 ? colors.warning : colors.success}
          onPress={() => navigation.navigate('Boletos')}
        />
        <QuickCard
          emoji="📅"
          label="Reservas"
          value={`${reservas?.length ?? 0} ativa(s)`}
          color={colors.primary}
          onPress={() => navigation.navigate('Reservas')}
        />
        <QuickCard
          emoji="📹"
          label="Câmeras"
          value="Ao vivo"
          color={colors.secondary}
          onPress={() => navigation.navigate('Cameras')}
        />
      </View>

      {/* Avisos recentes */}
      {avisosRecentes.length > 0 && (
        <Section title="Avisos recentes" onMore={() => navigation.navigate('Avisos')}>
          {avisosRecentes.map((a) => (
            <View key={a.id} style={styles.avisoCard}>
              {a.pinned && <Text style={styles.pinned}>📌 Fixado</Text>}
              <Text style={styles.avisoTitle}>{a.title}</Text>
              <Text style={styles.avisoDate}>{formatDate(a.created_at)}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Boletos pendentes */}
      {boletosPendentes.length > 0 && (
        <Section title="Boletos pendentes" onMore={() => navigation.navigate('Boletos')}>
          {boletosPendentes.slice(0, 2).map((b) => (
            <View key={b.id} style={[styles.boletoCard, styles.boletoAlert]}>
              <Text style={styles.boletoDesc}>{b.description ?? `Condomínio ${b.month}/${b.year}`}</Text>
              <Text style={styles.boletoAmount}>{formatCurrency(b.amount)}</Text>
              <Text style={styles.boletoDate}>Vence: {formatDate(b.due_date)}</Text>
            </View>
          ))}
        </Section>
      )}
    </ScrollView>
  );
}

function QuickCard({ emoji, label, value, color, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.quickCard, { borderLeftColor: color }]} onPress={onPress}>
      <Text style={styles.quickEmoji}>{emoji}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={[styles.quickValue, { color }]}>{value}</Text>
    </TouchableOpacity>
  );
}

function Section({ title, onMore, children }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onMore && (
          <TouchableOpacity onPress={onMore}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.primary,
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  apt: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sipBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  sipOk: { backgroundColor: 'rgba(46,125,50,0.8)' },
  sipOff: { backgroundColor: 'rgba(198,40,40,0.7)' },
  sipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  quickCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  quickCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    width: '47%',
    borderLeftWidth: 4,
    elevation: 1,
  },
  quickEmoji: { fontSize: 22, marginBottom: 4 },
  quickLabel: { fontSize: 12, color: colors.textSecondary },
  quickValue: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: 13, color: colors.primary },
  avisoCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
  },
  pinned: { fontSize: 11, color: colors.warning, marginBottom: 4 },
  avisoTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  avisoDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  boletoCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
  },
  boletoAlert: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  boletoDesc: { fontSize: 14, fontWeight: '600', color: colors.text },
  boletoAmount: { fontSize: 18, fontWeight: 'bold', color: colors.error, marginTop: 4 },
  boletoDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
