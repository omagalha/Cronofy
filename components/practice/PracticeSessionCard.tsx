import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PracticeBuildMode,
  PracticeRecommendation,
  PracticeSession,
} from '../../apps/shared/types/practice';

type PracticeSessionCardProps = {
  recommendation: PracticeRecommendation;
  currentSession: PracticeSession | null;
  onStart: (mode: PracticeBuildMode) => void;
};

function getBadgeLabel(recommendation: PracticeRecommendation) {
  if (recommendation.status === 'completed_today') {
    return 'Feita hoje';
  }

  if (recommendation.status === 'empty') {
    return 'Aguardando';
  }

  return `${recommendation.totalQuestions} questoes`;
}

export default function PracticeSessionCard({
  recommendation,
  currentSession,
  onStart,
}: PracticeSessionCardProps) {
  const disabled = recommendation.status === 'empty' && !currentSession;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{recommendation.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getBadgeLabel(recommendation)}</Text>
        </View>
      </View>

      <Text style={styles.headline}>
        {currentSession
          ? `Sessao em andamento: ${currentSession.subject}`
          : recommendation.suggestedSubject ?? 'Sem sugestao agora'}
      </Text>

      <Text style={styles.support}>
        {currentSession
          ? 'Continue de onde parou para consolidar o resultado desta materia.'
          : recommendation.description}
      </Text>

      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={() => onStart(recommendation.mode)}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>
          {currentSession ? 'Continuar sessao' : 'Comecar pratica'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#CBD5F5',
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: 'rgba(99,102,241,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '700',
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  support: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 6,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#334155',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
