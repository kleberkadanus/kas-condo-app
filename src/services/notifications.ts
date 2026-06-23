import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Push] Não é um dispositivo físico — push desabilitado');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permissão negada');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('portaria', {
      name: 'Portaria',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B4F8A',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Geral',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '00000000-0000-0000-0000-000000000000',
    }).catch(() => null);
    if (!tokenData) {
      // Fallback: FCM token nativo
      const fcm = await Notifications.getDevicePushTokenAsync().catch(() => null);
      if (!fcm) return null;
      await apiClient.post('/notifications/register', { token: fcm.data, platform: Platform.OS });
      return fcm.data;
    }
    const token = tokenData.data;
    console.log('[Push] Token:', token);
    await apiClient.post('/notifications/register', { token, platform: Platform.OS });
    return token;
  } catch (e) {
    console.error('[Push] Erro ao registrar token:', e);
    return null;
  }
}

export function setupNotificationListeners(
  onNotification: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void,
) {
  const sub1 = Notifications.addNotificationReceivedListener(onNotification);
  const sub2 = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => {
    sub1.remove();
    sub2.remove();
  };
}
