import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../utils/colors';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();

  useEffect(() => {
    prefillFromDeepLink();
  }, []);

  async function prefillFromDeepLink() {
    try {
      const url = await Linking.getInitialURL();
      if (!url) return;
      const { queryParams } = Linking.parse(url);
      if (queryParams?.email) setEmail(String(queryParams.email));
      if (queryParams?.password) setPassword(String(queryParams.password));
    } catch {
      // ignore deep link errors
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Informe email e senha.');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Erro ao conectar. Verifique suas credenciais.';
      Alert.alert('Acesso negado', msg);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🏢</Text>
        </View>
        <Text style={styles.appName}>KAS Condomínio</Text>
        <Text style={styles.subtitle}>Gestão inteligente para seu condomínio</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.fieldLabel}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="seu@email.com"
          placeholderTextColor={colors.textLight}
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>Senha</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.textLight}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>KAS SuportTech © {new Date().getFullYear()}</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 40 },
  appName: { fontSize: 26, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  form: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: 32 },
});
