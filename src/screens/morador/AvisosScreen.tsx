import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { listAnnouncements } from '../../api/announcements';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';
import { formatDate, getCategoryLabel } from '../../utils/helpers';
import { Announcement } from '../../types';

const CATEGORY_COLORS: Record<string, string> = {
  aviso: colors.info,
  manutencao: colors.warning,
  evento: colors.success,
  financeiro: colors.error,
};

export function AvisosScreen() {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const [selected, setSelected] = useState<Announcement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', condoId],
    queryFn: () => listAnnouncements(condoId),
    enabled: !!condoId,
  });

  if (isLoading) return <LoadingSpinner label="Carregando avisos..." />;

  const pinned = data?.filter((a) => a.pinned) ?? [];
  const others = data?.filter((a) => !a.pinned) ?? [];
  const sorted = [...pinned, ...others];

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: CATEGORY_COLORS[item.category] ?? colors.info }]}>
                <Text style={styles.badgeText}>{getCategoryLabel(item.category)}</Text>
              </View>
              {item.pinned && <Text style={styles.pin}>📌</Text>}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.preview} numberOfLines={2}>{item.content}</Text>
            <Text style={styles.meta}>
              {item.author_name} · {formatDate(item.created_at)}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum aviso disponível.</Text>}
      />

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selected && (
                <>
                  <View style={[styles.badge, { backgroundColor: CATEGORY_COLORS[selected.category] ?? colors.info, alignSelf: 'flex-start' }]}>
                    <Text style={styles.badgeText}>{getCategoryLabel(selected.category)}</Text>
                  </View>
                  <Text style={styles.modalTitle}>{selected.title}</Text>
                  <Text style={styles.modalMeta}>
                    {selected.author_name} · {formatDate(selected.created_at)}
                  </Text>
                  <Text style={styles.modalContent}>{selected.content}</Text>
                </>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  pin: { fontSize: 16 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  preview: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  meta: { fontSize: 11, color: colors.textLight },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 12, marginBottom: 4 },
  modalMeta: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  modalContent: { fontSize: 15, color: colors.text, lineHeight: 22 },
  closeBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
