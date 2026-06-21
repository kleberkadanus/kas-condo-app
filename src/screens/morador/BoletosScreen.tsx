import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { listMyBoletos } from '../../api/boletos';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';
import { formatDate, formatCurrency, formatMonth } from '../../utils/helpers';

export function BoletosScreen() {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;

  const { data, isLoading } = useQuery({
    queryKey: ['boletos-mine', condoId],
    queryFn: () => listMyBoletos(condoId),
    enabled: !!condoId,
  });

  if (isLoading) return <LoadingSpinner label="Carregando boletos..." />;

  const pendentes = data?.filter((b) => !b.paid) ?? [];
  const pagos = data?.filter((b) => b.paid) ?? [];

  return (
    <FlatList
      style={styles.container}
      data={[
        ...(pendentes.length > 0 ? [{ type: 'header', label: `⚠️ Pendentes (${pendentes.length})` }] : []),
        ...pendentes.map((b) => ({ type: 'boleto', ...b })),
        ...(pagos.length > 0 ? [{ type: 'header', label: `✅ Pagos (${pagos.length})` }] : []),
        ...pagos.map((b) => ({ type: 'boleto', ...b })),
      ]}
      keyExtractor={(item: any) => item.type === 'header' ? item.label : String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }: any) => {
        if (item.type === 'header') {
          return <Text style={styles.sectionHeader}>{item.label}</Text>;
        }
        return (
          <View style={[styles.card, !item.paid && styles.cardPending]}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.desc}>{item.description ?? formatMonth(item.month, item.year)}</Text>
                <Text style={styles.apt}>Apt {item.apt_number}</Text>
              </View>
              <Text style={[styles.amount, item.paid ? styles.amountPaid : styles.amountDue]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.dueDate}>
                {item.paid
                  ? `✅ Pago em ${formatDate(item.paid_at!)}`
                  : `Vence: ${formatDate(item.due_date)}`}
              </Text>
              {item.pdf_url && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(item.pdf_url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o boleto.'))}
                >
                  <Text style={styles.pdfLink}>📄 Ver boleto</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      }}
      ListEmptyComponent={<Text style={styles.empty}>Nenhum boleto disponível.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 10 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 8, marginBottom: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, elevation: 1 },
  cardPending: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  desc: { fontSize: 15, fontWeight: '600', color: colors.text },
  apt: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 20, fontWeight: 'bold' },
  amountDue: { color: colors.error },
  amountPaid: { color: colors.success },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueDate: { fontSize: 13, color: colors.textSecondary },
  pdfLink: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
});
