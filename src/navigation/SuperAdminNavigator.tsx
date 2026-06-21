import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { CondominiosScreen } from '../screens/superadmin/CondominiosScreen';
import { useAuthStore } from '../store/auth';
import { colors } from '../utils/colors';

function SuperAdminDashboard({ navigation }: any) {
  const { user, logout } = useAuthStore();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Super Admin</Text>
        <Text style={styles.sub}>{user?.name}</Text>
      </View>
      <View style={styles.menu}>
        <MenuBtn label="🏢 Condomínios" onPress={() => navigation.navigate('Condominios')} />
        <MenuBtn label="📊 Relatórios" onPress={() => {}} />
        <MenuBtn label="⚙️ Configurações" onPress={() => {}} />
        <MenuBtn label="🚪 Sair" onPress={logout} danger />
      </View>
    </View>
  );
}

function MenuBtn({ label, onPress, danger }: any) {
  return (
    <TouchableOpacity style={[styles.menuBtn, danger && styles.menuBtnDanger]} onPress={onPress}>
      <Text style={[styles.menuBtnText, danger && styles.menuBtnDangerText]}>{label}</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SuperAdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{route.name === 'Dashboard' ? '🏠' : '🏢'}</Text>,
        tabBarActiveTintColor: colors.superadmin,
        tabBarInactiveTintColor: colors.textLight,
        headerStyle: { backgroundColor: colors.superadmin },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Dashboard" component={SuperAdminDashboard} options={{ title: 'Painel' }} />
      <Tab.Screen name="Condominios" component={CondominiosScreen} options={{ title: 'Condomínios' }} />
    </Tab.Navigator>
  );
}

export function SuperAdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SuperAdminMain" component={SuperAdminTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.superadmin, padding: 24, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  sub: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  menu: { padding: 16, gap: 10 },
  menuBtn: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  menuBtnDanger: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#ffcccc' },
  menuBtnText: { fontSize: 16, color: colors.text },
  menuBtnDangerText: { color: colors.error },
  arrow: { fontSize: 22, color: colors.textSecondary },
});
