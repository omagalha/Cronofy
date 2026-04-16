import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppContext } from '../context/AppContext';

export default function LoginScreen() {
  const { loginWithApple, loginWithGoogle } = useAppContext();

  async function handleGoogleLogin() {
    try {
      await loginWithGoogle();
      router.replace('/');
    } catch (error) {
      Alert.alert('Nao foi possivel entrar', 'Tente novamente em instantes.');
    }
  }

  async function handleAppleLogin() {
    try {
      await loginWithApple();
      router.replace('/');
    } catch (error) {
      Alert.alert('Nao foi possivel entrar', 'Tente novamente em instantes.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>Entrar</Text>
            <Text style={styles.brandSubtitle}>
              Acesse sua conta para continuar seu plano de estudos.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Continue de onde parou</Text>
          <Text style={styles.infoText}>
            Por enquanto, o acesso esta disponivel pelos provedores sociais ja
            configurados no app.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleButtonText}>Continuar com Google</Text>
          </Pressable>

          <Pressable style={styles.appleButton} onPress={handleAppleLogin}>
            <Text style={styles.appleButtonText}>Continuar com Apple</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/auth/signup')}>
          <Text style={styles.linkText}>Ainda nao tem conta? Criar conta</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/auth/login')}>
          <Text style={styles.secondaryLinkText}>Voltar para a tela inicial</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#071120',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28,
    padding: 22,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  brandCopy: {
    flex: 1,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    lineHeight: 21,
  },
  infoCard: {
    backgroundColor: '#0B1324',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#24324A',
    marginBottom: 18,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: '#BFD0E6',
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    gap: 12,
    marginBottom: 18,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#071120',
    fontSize: 15,
    fontWeight: '800',
  },
  appleButton: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3C56',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  linkText: {
    color: '#7DB7FF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  secondaryLinkText: {
    color: '#8FA1BC',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
