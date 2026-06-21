import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MoradorDashboard } from '../screens/morador/DashboardScreen';
import { AvisosScreen } from '../screens/morador/AvisosScreen';
import { ReservasScreen } from '../screens/morador/ReservasScreen';
import { BoletosScreen } from '../screens/morador/BoletosScreen';
import { CamerasScreen } from '../screens/morador/CamerasScreen';
import { colors } from '../utils/colors';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = {
  Início: '🏠',
  Avisos: '📋',
  Reservas: '📅',
  Boletos: '💰',
  Câmeras: '📹',
};

export function MoradorNavigator() {
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
      })}
    >
      <Tab.Screen name="Início" component={MoradorDashboard} />
      <Tab.Screen name="Avisos" component={AvisosScreen} />
      <Tab.Screen name="Reservas" component={ReservasScreen} />
      <Tab.Screen name="Boletos" component={BoletosScreen} />
      <Tab.Screen name="Câmeras" component={CamerasScreen} />
    </Tab.Navigator>
  );
}
