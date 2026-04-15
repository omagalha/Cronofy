import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';

export default function InsightsScreen() {
  const { aiAnalysis, streak } = useAppContext();

  const consistency = Math.round((aiAnalysis?.consistencyScore || 0) * 100);
  const completionRate = Math.round((aiAnalysis?.completionRate || 0) * 100);

  const riskLevel = aiAnalysis?.currentRiskLevel || 'low';

  const riskColor =
    riskLevel === 'high'
      ? '#EF4444'
      : riskLevel === 'medium'
      ? '#F59E0B'
      : '#22C55E';

  const riskLabel =
    riskLevel === 'high'
      ? 'Risco alto'
      : riskLevel === 'medium'
      ? 'Risco moderado'
      : 'Risco baixo';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Insights da IA</Text>
          <Text style={styles.heroSubtitle}>
            Acompanhe sua evolução e comportamento de estudo
          </Text>
        </View>

        {/* STATUS GERAL */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status atual</Text>

          <View style={styles.statusRow}>
            <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
            <Text style={styles.statusText}>{riskLabel}</Text>
          </View>

          <Text style={styles.statusDescription}>
            {riskLevel === 'high'
              ? 'Você está próximo de quebrar a rotina. Reduza a carga.'
              : riskLevel === 'medium'
              ? 'Seu ritmo está ok, mas precisa manter consistência.'
              : 'Seu plano está equilibrado. Continue assim.'}
          </Text>
        </View>

        {/* MÉTRICAS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Desempenho</Text>

          {/* Consistência */}
          <Text style={styles.metricLabel}>Consistência</Text>
          <View style={styles.barContainer}>
            <View style={[styles.bar, { width: `${consistency}%` }]} />
          </View>
          <Text style={styles.metricValue}>{consistency}%</Text>

          {/* Conclusão */}
          <Text style={[styles.metricLabel, { marginTop: 16 }]}>
            Conclusão
          </Text>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.barSecondary,
                { width: `${completionRate}%` },
              ]}
            />
          </View>
          <Text style={styles.metricValue}>{completionRate}%</Text>
        </View>

        {/* STREAK */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sequência</Text>

          <Text style={styles.streakBig}>
            🔥 {streak.currentStreak}
          </Text>

          <Text style={styles.streakLabel}>
            melhor: {streak.bestStreak}
          </Text>
        </View>

        {/* INSIGHTS DETALHADOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Análise inteligente</Text>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Melhor horário</Text>
            <Text style={styles.insightValue}>
              {aiAnalysis?.bestStudyPeriod || '---'}
            </Text>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Matéria crítica</Text>
            <Text style={styles.insightValue}>
              {aiAnalysis?.hardestSubject || '---'}
            </Text>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Carga sugerida</Text>
            <Text style={styles.insightValue}>
              {aiAnalysis?.suggestedLoadFactor
                ? `${Math.round(aiAnalysis.suggestedLoadFactor * 100)}%`
                : '---'}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    gap: 16,
  },

  hero: {
    backgroundColor: '#6366F1',
    padding: 20,
    borderRadius: 20,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#E0E7FF',
    marginTop: 6,
  },

  card: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 18,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
  },
  statusDescription: {
    color: '#94A3B8',
    marginTop: 6,
  },

  metricLabel: {
    color: '#94A3B8',
  },
  metricValue: {
    color: '#fff',
    marginTop: 4,
  },

  barContainer: {
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 10,
    marginTop: 6,
  },
  bar: {
    height: 10,
    backgroundColor: '#6366F1',
    borderRadius: 10,
  },
  barSecondary: {
    height: 10,
    backgroundColor: '#22C55E',
    borderRadius: 10,
  },

  streakBig: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
  },
  streakLabel: {
    color: '#94A3B8',
    marginTop: 4,
  },

  insightItem: {
    marginBottom: 12,
  },
  insightLabel: {
    color: '#94A3B8',
  },
  insightValue: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
});