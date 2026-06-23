import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, Alert } from 'react-native';
import { MoradorDashboard } from '../screens/morador/DashboardScreen';
import { AvisosScreen } from '../screens/morador/AvisosScreen';
import { ReservasScreen } from '../screens/morador/ReservasScreen';
import { BoletosScreen } from '../screens/morador/BoletosScreen';
import { CamerasScreen } from '../screens/morador/CamerasScreen';
import { DialerScreen } from '../screens/shared/DialerScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { colors } from '../utils/colors';
import { useAuthStore } from '../store/auth';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = {
  Início: '🏠',
  Avisos: '📋',
  Reservas: '📅',
  Boletos: '💰',
  Câmeras: '📹',
  Chat: '💬',
  Telefone: '📞',
};

export function MoradorNavigator() {
  const { logout } = useAuthStore();

  function confirmLogout() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name]}</Text>,
        tabBarActiveTintColor: colors.morador,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: { paddingBottom: 4 },
        headerStyle: { backgroundColor: colors.morador },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => (
          <TouchableOpacity onPress={confirmLogout} style={{ marginRight: 16 }}>
            <Text style={{ color: '#fff', fontSize: 13 }}>Sair</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Início" component={MoradorDashboard} />
      <Tab.Screen name="Avisos" component={AvisosScreen} />
      <Tab.Screen name="Reservas" component={ReservasScreen} />
      <Tab.Screen name="Boletos" component={BoletosScreen} />
      <Tab.Screen name="Câmeras" component={CamerasScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat com Síndico' }} />
      <Tab.Screen name="Telefone" component={DialerScreen} />
    </Tab.Navigator>
  );
}
