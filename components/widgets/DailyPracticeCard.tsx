import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PracticeRecommendation,
  PracticeSession,
} from '../../apps/shared/types/practice';

type DailyPracticeCardProps = {
  recommendation: PracticeRecommendation | null;
  currentSession?: PracticeSession | null;
  onPress?: () => void;
};

export default function DailyPracticeCard({
  recommendation,
  currentSession,
  onPress,
}: DailyPracticeCardProps) {
  const disabled = !recommendation || (recommendation.status === 'empty' && !currentSession);
  const headline = currentSession
    ? `Sessao em ${currentSession.subject}`
    : recommendation?.suggestedSubject ?? 'Sem materia sugerida';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Pratica do dia</Text>
        <View
          style={[
            styles.badge,
            recommendation?.status === 'completed_today' && styles.badgeCompleted,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              recommendation?.status === 'completed_today' && styles.badgeCompletedText,
            ]}
          >
            {recommendation?.status === 'completed_today'
              ? 'Feita'
              : recommendation
              ? `${recommendation.totalQuestions} questoes`
              : 'Bloqueada'}
          </Text>
        </View>
      </View>

      <Text style={styles.subjects}>{headline}</Text>
      <Text style={styles.support}>
        {currentSession
          ? 'Continue a sessao curta que ja esta em andamento.'
          : recommendation?.description ??
            'Organize as materias para liberar sua pratica diaria.'}
      </Text>

      {onPress ? (
        <Pressable
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={onPress}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>
            {currentSession
              ? 'Continuar sessao'
              : recommendation?.status === 'completed_today'
              ? 'Praticar de novo'
              : 'Abrir pratica'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 188,
    backgroundColor: '#101B2C',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    color: '#8FA1BC',
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(99,102,241,0.14)',
  },
  badgeCompleted: {
    backgroundColor: 'rgba(52,211,153,0.14)',
  },
  badgeText: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeCompletedText: {
    color: '#6EE7B7',
  },
  subjects: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginTop: 8,
  },
  support: {
    color: '#8FA1BC',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 'auto',
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#24324A',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
