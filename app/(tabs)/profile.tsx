import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';

export default function ProfileScreen() {
  const {
    setupData,
    streak,
    aiAnalysis,
    resetAll,
  } = useAppContext();

  const handleResetAll = () => {
    Alert.alert(
      'Resetar aplicativo',
      'Isso vai apagar seu setup, cronograma e dados de progresso. Deseja continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: () => {
            resetAll();
            router.replace('/setup');
          },
        },
      ]
    );
  };

  const handleRedoSetup = () => {
    Alert.alert(
      'Refazer setup',
      'Você será levado novamente para a configuração inicial do plano.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Continuar',
          onPress: () => {
            router.replace('/setup');
          },
        },
      ]
    );
  };

  const consistency = Math.max(
    0,
    Math.min(100, Math.round((aiAnalysis?.consistencyScore || 0) * 100))
  );

  const completionRate = Math.max(
    0,
    Math.min(100, Math.round((aiAnalysis?.completionRate || 0) * 100))
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Perfil</Text>
          </View>

          <Text style={styles.heroTitle}>
            {setupData?.concurso || 'Seu plano no AprovAI'}
          </Text>

          <Text style={styles.heroSubtitle}>
            Gerencie seu plano, acompanhe sua evolução e controle o app por aqui.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak?.currentStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Streak atual</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak?.bestStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Melhor streak</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo do plano</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Concurso</Text>
            <Text style={styles.infoValue}>
              {setupData?.concurso || 'Não definido'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nível</Text>
            <Text style={styles.infoValue}>
              {setupData?.nivel || 'Não definido'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Foco</Text>
            <Text style={styles.infoValue}>
              {setupData?.foco || 'Não definido'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Disponibilidade</Text>
            <Text style={styles.infoValue}>
              {setupData?.disponibilidade || 'Não definida'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data da prova</Text>
            <Text style={styles.infoValue}>
              {setupData?.examDate || 'Não definida'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Matérias</Text>
            <Text style={styles.infoValue}>
              {Array.isArray(setupData?.materias)
                ? setupData.materias.length
                : 0}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Desempenho</Text>

          <View style={styles.metricBlock}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Consistência</Text>
              <Text style={styles.metricValue}>{consistency}%</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${consistency}%` }]}
              />
            </View>
          </View>

          <View style={styles.metricBlock}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Conclusão</Text>
              <Text style={styles.metricValue}>{completionRate}%</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFillSecondary, { width: `${completionRate}%` }]}
              />
            </View>
          </View>

          <View style={styles.metricInfoBox}>
            <Text style={styles.metricInfoLabel}>Melhor horário</Text>
            <Text style={styles.metricInfoValue}>
              {aiAnalysis?.bestStudyPeriod || '---'}
            </Text>
          </View>

          <View style={styles.metricInfoBox}>
            <Text style={styles.metricInfoLabel}>Matéria crítica</Text>
            <Text style={styles.metricInfoValue}>
              {aiAnalysis?.hardestSubject || '---'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ações</Text>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/schedule')}
          >
            <Text style={styles.actionButtonText}>Ver cronograma</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={handleRedoSetup}
          >
            <Text style={styles.secondaryButtonText}>Refazer setup</Text>
          </Pressable>

          <Pressable
            style={styles.dangerButton}
            onPress={handleResetAll}
          >
            <Text style={styles.dangerButtonText}>Resetar tudo</Text>
          </Pressable>
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
    paddingBottom: 32,
    gap: 16,
  },

  hero: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 22,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99,102,241,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  heroSubtitle: {
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 20,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },

  card: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 18,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },

  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  metricBlock: {
    marginBottom: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    color: '#CBD5F5',
    fontSize: 14,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 12,
    backgroundColor: '#6366F1',
    borderRadius: 999,
  },
  progressFillSecondary: {
    height: 12,
    backgroundColor: '#22C55E',
    borderRadius: 999,
  },

  metricInfoBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  metricInfoLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 6,
  },
  metricInfoValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  actionButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  secondaryButton: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  dangerButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
