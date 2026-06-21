import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { MoradorNavigator } from './MoradorNavigator';
import { SindicoNavigator } from './SindicoNavigator';
import { ZeladorNavigator } from './ZeladorNavigator';
import { SuperAdminNavigator } from './SuperAdminNavigator';
import { IncomingCallModal } from '../components/portaria/IncomingCallModal';

const Root = createNativeStackNavigator();

function AppNavigator() {
  const { user } = useAuthStore();

  if (!user) return <LoginScreen />;

  switch (user.role) {
    case 'superadmin': return <SuperAdminNavigator />;
    case 'sindico': return <SindicoNavigator />;
    case 'zelador': return <ZeladorNavigator />;
    default: return <MoradorNavigator />;
  }
}

export function RootNavigator() {
  const { isReady } = useAuthStore();
  if (!isReady) return <LoadingSpinner label="Carregando..." />;

  return (
    <NavigationContainer>
      <AppNavigator />
      <IncomingCallModal />
    </NavigationContainer>
  );
}
