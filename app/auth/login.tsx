import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const VALUE_POINTS = [
  'Plano personalizado em poucos passos',
  'Execução diária por blocos',
  'Insights e adaptação com IA',
];

const METRICS = [
  { label: 'Próximo bloco', value: 'Matemática · 08:00' },
  { label: 'Consistência', value: '82%' },
  { label: 'Prova', value: 'Faltam 73 dias' },
];

export default function EntryScreen() {
  const handleStart = () => {
    router.push('/auth/signup');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundGlowTop} />
        <View style={styles.backgroundGlowBottom} />

        <View style={styles.heroCard}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandTitle}>Cronofy</Text>
              <Text style={styles.brandSubtitle}>
                Seu plano de estudos inteligente
              </Text>
            </View>
          </View>

          <View style={styles.headlineBlock}>
            <Text style={styles.eyebrow}>FOCO • ROTINA • EVOLUÇÃO</Text>

            <Text style={styles.headline}>
              Seu cronograma de estudos, pronto em minutos.
            </Text>

            <Text style={styles.description}>
              Organize sua preparação para concursos com um plano claro,
              execução diária e ajustes inteligentes conforme seu ritmo.
            </Text>
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewLabel}>Hoje</Text>
                <Text style={styles.previewTitle}>Plano do dia</Text>
              </View>

              <View style={styles.aiPill}>
                <Text style={styles.aiPillText}>IA ativa</Text>
              </View>
            </View>

            <View style={styles.nextBlockCard}>
              <Text style={styles.nextBlockEyebrow}>Próximo bloco</Text>
              <Text style={styles.nextBlockTitle}>Matemática</Text>
              <Text style={styles.nextBlockMeta}>08:00 • 45 min • foco total</Text>
            </View>

            <View style={styles.metricsRow}>
              {METRICS.map((item) => (
                <View key={item.label} style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{item.label}</Text>
                  <Text style={styles.metricValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStart}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Começar grátis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Sem travar no começo. Monte seu plano e ajuste depois.
            </Text>
          </View>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Por que o Cronofy?</Text>

          <View style={styles.valueList}>
            {VALUE_POINTS.map((point) => (
              <View key={point} style={styles.valueItem}>
                <View style={styles.valueDot} />
                <Text style={styles.valueText}>{point}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bottomCard}>
            <Text style={styles.bottomCardTitle}>Comece simples. Evolua com IA.</Text>
            <Text style={styles.bottomCardText}>
              Primeiro o app te entrega valor rápido. Depois ele aprende seu
              ritmo, protege sua consistência e melhora sua rotina.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071120',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    backgroundColor: '#071120',
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.16)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 100,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(21,101,192,0.14)',
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 30,
    padding: 20,
    overflow: 'hidden',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#1565C0',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  
  logoImage: {
  width: 30,
  height: 30,
},

  logoBadgeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  brandTextWrap: {
    flex: 1,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 13,
    fontWeight: '500',
  },
  headlineBlock: {
    marginBottom: 24,
  },
  eyebrow: {
    color: '#7DB7FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  description: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 340,
  },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 22,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  aiPill: {
    backgroundColor: 'rgba(125,183,255,0.12)',
    borderColor: 'rgba(125,183,255,0.24)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  aiPillText: {
    color: '#B7D7FF',
    fontSize: 12,
    fontWeight: '800',
  },
  nextBlockCard: {
    backgroundColor: '#0F1D31',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  nextBlockEyebrow: {
    color: '#7DB7FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  nextBlockTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  nextBlockMeta: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 13,
    lineHeight: 18,
  },
  metricsRow: {
    gap: 10,
  },
  metricCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  actions: {
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#0B1830',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  helperText: {
    marginTop: 12,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.52)',
    fontSize: 12,
    lineHeight: 18,
  },
  benefitsSection: {
    marginTop: 18,
    paddingHorizontal: 2,
  },
  benefitsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  valueList: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 14,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  valueDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#4DA1FF',
    marginRight: 12,
  },
  valueText: {
    flex: 1,
    color: 'rgba(255,255,255,0.84)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  bottomCard: {
    backgroundColor: 'rgba(21,101,192,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(125,183,255,0.14)',
    borderRadius: 22,
    padding: 16,
  },
  bottomCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  bottomCardText: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 14,
    lineHeight: 21,
  },
});
