import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { listCameras } from '../../api/condos';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../utils/colors';
import { Camera } from '../../types';

// react-native-video é importado condicionalmente
let VideoPlayer: any = null;
try { VideoPlayer = require('react-native-video').default; } catch {}

const { width } = Dimensions.get('window');

export function CamerasScreen() {
  const { user } = useAuthStore();
  const condoId = user?.condo_id!;
  const [selected, setSelected] = useState<Camera | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cameras', condoId],
    queryFn: () => listCameras(condoId),
    enabled: !!condoId,
  });

  if (isLoading) return <LoadingSpinner label="Carregando câmeras..." />;

  if (selected) {
    return (
      <View style={styles.playerContainer}>
        <TouchableOpacity style={styles.back} onPress={() => setSelected(null)}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.camTitle}>{selected.name}</Text>
        <Text style={styles.camLocation}>{selected.location}</Text>
        {VideoPlayer ? (
          <VideoPlayer
            source={{ uri: selected.hls_url }}
            style={styles.player}
            resizeMode="contain"
            repeat
            paused={false}
          />
        ) : (
          <View style={styles.noPlayer}>
            <Text style={styles.noPlayerText}>📹</Text>
            <Text style={styles.noPlayerMsg}>Player de vídeo não disponível nesta versão.</Text>
            <Text style={styles.noPlayerUrl}>{selected.hls_url}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={data}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.cameraCard}
          onPress={() => setSelected(item)}
          disabled={!item.active}
        >
          <View style={styles.cameraThumbnail}>
            <Text style={styles.cameraIcon}>📹</Text>
            {!item.active && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
          <Text style={styles.cameraName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cameraLoc} numberOfLines={1}>{item.location}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Nenhuma câmera cadastrada.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  grid: { padding: 12, gap: 10 },
  cameraCard: {
    width: (width - 36) / 2,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    marginBottom: 4,
  },
  cameraThumbnail: {
    height: 110,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: { fontSize: 36 },
  offlineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offlineText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cameraName: { fontSize: 13, fontWeight: '600', color: colors.text, padding: 8, paddingBottom: 2 },
  cameraLoc: { fontSize: 11, color: colors.textSecondary, paddingHorizontal: 8, paddingBottom: 8 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  playerContainer: { flex: 1, backgroundColor: '#000' },
  back: { padding: 16 },
  backText: { color: '#fff', fontSize: 16 },
  camTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16 },
  camLocation: { color: '#aaa', fontSize: 13, paddingHorizontal: 16, marginBottom: 12 },
  player: { width: '100%', height: 220, backgroundColor: '#000' },
  noPlayer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  noPlayerText: { fontSize: 48 },
  noPlayerMsg: { color: '#fff', textAlign: 'center', fontSize: 14 },
  noPlayerUrl: { color: '#aaa', fontSize: 11, textAlign: 'center' },
});
