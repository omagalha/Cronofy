import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PRO_FEATURES = [
  {
    icon: '🧩',
    title: 'Widgets Pro',
    description: 'Organize sua rotina com widgets úteis na tela inicial.',
  },
  {
    icon: '🧠',
    title: 'Cronograma Inteligente',
    description: 'Tenha uma distribuição de matérias mais estratégica.',
  },
  {
    icon: '📊',
    title: 'Insights de Progresso',
    description: 'Acompanhe sua evolução com métricas claras.',
  },
  {
    icon: '🔥',
    title: 'Revisão Inteligente',
    description: 'Receba revisões automáticas com base no seu desempenho.',
  },
  {
    icon: '⚡',
    title: 'Experiência Avançada',
    description: 'Estude com mais controle e produtividade.',
  },
];

export default function EntryScreen() {
  const handleStart = () => {
    router.replace('/setup');
  };

  const handleLogin = () => {
    router.push('/auth/signin');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Cronofy</Text>
          <Text style={styles.subtitle}>
            Seu plano de estudos inteligente com recursos avançados para quem
            quer estudar melhor.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStart}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryButtonText}>Começar</Text>
          </TouchableOpacity>

          <Text style={styles.freeHint}>Comece gratuitamente</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Já tem conta? Entrar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.proSection}>
          <Text style={styles.proBadge}>PRO</Text>

          <Text style={styles.proDescription}>
            Desbloqueie recursos avançados para personalizar sua rotina,
            visualizar seu progresso e estudar com mais estratégia.
          </Text>

          <View style={styles.grid}>
            {PRO_FEATURES.map((feature, index) => {
              const isLastOdd =
                PRO_FEATURES.length % 2 !== 0 &&
                index === PRO_FEATURES.length - 1;

              return (
                <View
                  key={feature.title}
                  style={[styles.featureCard, isLastOdd && styles.lastOddCard]}
                >
                  <Text style={styles.icon}>{feature.icon}</Text>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureText}>{feature.description}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 8,
    maxWidth: 300,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.84)',
  },
  actions: {
    alignItems: 'center',
    marginBottom: 26,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#1565C0',
    fontWeight: '800',
    fontSize: 15,
  },
  freeHint: {
    marginTop: 10,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  proSection: {
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  proBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  proDescription: {
    alignSelf: 'center',
    maxWidth: 310,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    minHeight: 128,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  lastOddCard: {
    width: '68%',
    alignSelf: 'center',
  },
  icon: {
    fontSize: 18,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 6,
  },
  featureText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'left',
  },
});