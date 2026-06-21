import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { SindicoDashboard } from '../screens/sindico/DashboardScreen';
import { MoradoresScreen } from '../screens/sindico/MoradoresScreen';
import { AvisosScreen } from '../screens/morador/AvisosScreen';
import { CamerasScreen } from '../screens/morador/CamerasScreen';
import { colors } from '../utils/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS: Record<string, string> = {
  Painel: '📊',
  Avisos: '📋',
  Moradores: '👥',
  Câmeras: '📹',
};

function SindicoTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name]}</Text>,
        tabBarActiveTintColor: colors.sindico,
        tabBarInactiveTintColor: colors.textLight,
        headerStyle: { backgroundColor: colors.sindico },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Painel" component={SindicoDashboard} />
      <Tab.Screen name="Avisos" component={AvisosScreen} />
      <Tab.Screen name="Moradores" component={MoradoresScreen} />
      <Tab.Screen name="Câmeras" component={CamerasScreen} />
    </Tab.Navigator>
  );
}

export function SindicoNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SindicoMain" component={SindicoTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
