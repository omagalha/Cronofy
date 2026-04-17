import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AIDailySignalWidgetData } from '../../widgets/types';

type AIDailySignalCardProps = {
  data: AIDailySignalWidgetData;
};

function getTone(riskLevel: AIDailySignalWidgetData['riskLevel']) {
  switch (riskLevel) {
    case 'high':
      return {
        accent: '#F97373',
        badge: 'Risco alto',
      };
    case 'medium':
      return {
        accent: '#FBBF24',
        badge: 'Atencao',
      };
    case 'low':
      return {
        accent: '#34D399',
        badge: 'Estavel',
      };
    case 'empty':
    default:
      return {
        accent: '#A78BFA',
        badge: 'Aguardando',
      };
  }
}

export default function AIDailySignalCard({ data }: AIDailySignalCardProps) {
  const tone = getTone(data.riskLevel);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Sinal da IA</Text>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: tone.accent }]}>{tone.badge}</Text>
        </View>
      </View>

      <Text style={styles.message}>{data.message}</Text>
      <Text style={styles.support}>{data.supportLabel}</Text>
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
  message: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    marginTop: 6,
  },
  support: {
    color: '#8FA1BC',
    fontSize: 14,
    lineHeight: 20,
  },
});
