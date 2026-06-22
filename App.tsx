import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useAuthStore } from './src/store/auth';
import { sipService } from './src/services/sip';
import { registerForPushNotifications, setupNotificationListeners } from './src/services/notifications';
import { checkForUpdate } from './src/services/updater';
import { RootNavigator } from './src/navigation';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppContent() {
  const { loadFromStorage, user } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
    // Verifica atualização 3s após iniciar para não atrasar o boot
    const t = setTimeout(() => checkForUpdate(), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Inicia SIP quando usuário logado
    sipService.init(user);

    // Registra push notifications
    registerForPushNotifications();

    const unsub = setupNotificationListeners(
      (notification) => {
        console.log('[Push] Recebida:', notification.request.content.title);
      },
      (response) => {
        console.log('[Push] Ação:', response.notification.request.content.data);
      },
    );

    return () => {
      unsub();
      sipService.unregister();
    };
  }, [user?.id]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
