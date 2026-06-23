import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, Alert, View, StyleSheet } from 'react-native';
import { AvisosScreen } from '../screens/morador/AvisosScreen';
import { CamerasScreen } from '../screens/morador/CamerasScreen';
import { DialerScreen } from '../screens/shared/DialerScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { colors } from '../utils/colors';
import { useAuthStore } from '../store/auth';

function ZeladorDashboard() {
  const { user } = useAuthStore();
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}!</Text>
      <Text style={styles.sub}>Bem-vindo ao painel do zelador.</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();
const ICONS: Record<string, string> = { Início: '🏠', Avisos: '📋', Câmeras: '📹', Chat: '💬', Telefone: '📞' };

export function ZeladorNavigator() {
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
        tabBarActiveTintColor: colors.zelador,
        tabBarInactiveTintColor: colors.textLight,
        headerStyle: { backgroundColor: colors.zelador },
        headerTintColor: '#fff',
        headerRight: () => (
          <TouchableOpacity onPress={confirmLogout} style={{ marginRight: 16 }}>
            <Text style={{ color: '#fff', fontSize: 13 }}>Sair</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Início" component={ZeladorDashboard} />
      <Tab.Screen name="Avisos" component={AvisosScreen} />
      <Tab.Screen name="Câmeras" component={CamerasScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat com Síndico' }} />
      <Tab.Screen name="Telefone" component={DialerScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  greeting: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
});
