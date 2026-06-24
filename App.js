import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/store/auth';
import { sipService } from './src/services/sip';
import { registerForPushNotifications, setupNotificationListeners } from './src/services/notifications';
import { checkForUpdate } from './src/services/updater';
import { RootNavigator } from './src/navigation';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function AppContent() {
  const { loadFromStorage, user } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!user) return;
    sipService.init(user);
    registerForPushNotifications();
    checkForUpdate();
  }, [user?.id]);

  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => console.log('[Push] recebida:', notification.request.identifier),
      (response) => console.log('[Push] resposta:', response.notification.request.identifier),
    );
    return cleanup;
  }, []);

  return <RootNavigator />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
