import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NextBlockWidgetData } from '../../widgets/types';

type NextBlockCardProps = {
  data: NextBlockWidgetData;
  onPress?: () => void;
};

function getTone(state: NextBlockWidgetData['state']) {
  switch (state) {
    case 'ideal':
      return {
        accent: '#34D399',
        badge: 'Hora ideal',
        button: 'Comecar bloco',
      };
    case 'done':
      return {
        accent: '#A78BFA',
        badge: 'Concluido',
        button: null,
      };
    case 'empty':
      return {
        accent: '#94A3B8',
        badge: 'Sem bloco',
        button: null,
      };
    case 'now':
      return {
        accent: '#60A5FA',
        badge: 'Agora',
        button: 'Concluir bloco',
      };
    case 'upcoming':
    default:
      return {
        accent: '#60A5FA',
        badge: 'Em breve',
        button: 'Concluir bloco',
      };
  }
}

export default function NextBlockCard({ data, onPress }: NextBlockCardProps) {
  const tone = getTone(data.state);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Proximo bloco</Text>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: tone.accent }]}>{tone.badge}</Text>
        </View>
      </View>

      <Text style={styles.subject}>{data.subject}</Text>
      <Text style={styles.meta}>{data.timeLabel}</Text>

      {tone.button && onPress ? (
        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>{tone.button}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#101B2C',
    borderRadius: 24,
    padding: 18,
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
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subject: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  meta: {
    color: '#8FA1BC',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 6,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
