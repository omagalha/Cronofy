import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';

export default function SignupScreen() {
  const { createAccount } = useAppContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  async function handleCreateAccount() {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Digite seu nome para continuar.');
      return;
    }

    await createAccount(name, email);
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>
          Comece sua jornada no Cronofy com uma conta simples.
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Seu e-mail"
            placeholderTextColor="#64748B"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={handleCreateAccount}>
          <Text style={styles.primaryButtonText}>Criar conta</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.linkText}>Ja tenho conta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071120',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  form: {
    gap: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0B1324',
    borderWidth: 1,
    borderColor: '#24324A',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#071120',
    fontSize: 15,
    fontWeight: '800',
  },
  linkText: {
    marginTop: 16,
    color: '#8FA1BC',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
