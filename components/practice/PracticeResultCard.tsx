import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PracticeSession } from '../../apps/shared/types/practice';

type PracticeResultCardProps = {
  result: PracticeSession | null;
  onPress?: () => void;
};

function getSourceLabel(source: PracticeSession['source']) {
  switch (source) {
    case 'daily_plan':
      return 'Pratica do dia';
    case 'weak_subject':
      return 'Materia fraca';
    case 'revision_boost':
      return 'Revisao rapida';
    case 'manual':
    default:
      return 'Sessao manual';
  }
}

export default function PracticeResultCard({
  result,
  onPress,
}: PracticeResultCardProps) {
  if (!result) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Ultimo resultado</Text>
        <Text style={styles.headline}>Ainda sem sessoes concluidas</Text>
        <Text style={styles.support}>
          Sua primeira pratica vai comecar a montar historico real por materia.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ultimo resultado</Text>
      <Text style={styles.headline}>
        {result.subject} • {result.accuracy}% de acerto
      </Text>
      <Text style={styles.support}>
        {result.correctAnswers} certas • {result.wrongAnswers} erradas
      </Text>
      <Text style={styles.support}>{getSourceLabel(result.source)}</Text>

      {onPress ? (
        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>Abrir resultado</Text>
        </Pressable>
      ) : null}
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
  title: {
    color: '#CBD5F5',
    fontSize: 13,
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
    alignSelf: 'flex-start',
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
