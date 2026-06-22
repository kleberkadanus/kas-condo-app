import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { SindicoDashboard } from '../screens/sindico/DashboardScreen';
import { MoradoresScreen } from '../screens/sindico/MoradoresScreen';
import { AvisosScreen } from '../screens/morador/AvisosScreen';
import { CamerasScreen } from '../screens/morador/CamerasScreen';
import { NovoAvisoScreen } from '../screens/sindico/NovoAvisoScreen';
import { BoletosSindicoScreen } from '../screens/sindico/BoletosSindicoScreen';
import { ReservasSindicoScreen } from '../screens/sindico/ReservasSindicoScreen';
import { ApartamentosScreen } from '../screens/sindico/ApartamentosScreen';
import { DialerScreen } from '../screens/shared/DialerScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { colors } from '../utils/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS: Record<string, string> = {
  Painel: '📊',
  Avisos: '📋',
  Moradores: '👥',
  Câmeras: '📹',
  Chat: '💬',
  Telefone: '📞',
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
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat com Moradores' }} />
      <Tab.Screen name="Telefone" component={DialerScreen} />
    </Tab.Navigator>
  );
}

export function SindicoNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.sindico },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="SindicoMain" component={SindicoTabs} options={{ headerShown: false }} />
      <Stack.Screen name="NovoAviso" component={NovoAvisoScreen} options={{ title: 'Publicar Aviso' }} />
      <Stack.Screen name="BoletosSindico" component={BoletosSindicoScreen} options={{ title: 'Boletos' }} />
      <Stack.Screen name="ReservasSindico" component={ReservasSindicoScreen} options={{ title: 'Reservas' }} />
      <Stack.Screen name="Apartamentos" component={ApartamentosScreen} options={{ title: 'Apartamentos e Vagas' }} />
    </Stack.Navigator>
  );
}
