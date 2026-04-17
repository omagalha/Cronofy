import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CountdownRingWidgetData } from '../../widgets/types';
import ProgressRing from '../ui/ProgressRing';

type CountdownRingCardProps = {
  data: CountdownRingWidgetData;
};

function getTone(status: CountdownRingWidgetData['status']) {
  switch (status) {
    case 'today':
      return {
        accent: '#F97373',
        badge: 'Hoje',
      };
    case 'expired':
      return {
        accent: '#94A3B8',
        badge: 'Encerrado',
      };
    case 'empty':
      return {
        accent: '#A78BFA',
        badge: 'Sem data',
      };
    case 'active':
    default:
      return {
        accent: '#60A5FA',
        badge: 'Prova',
      };
  }
}

export default function CountdownRingCard({ data }: CountdownRingCardProps) {
  const tone = getTone(data.status);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Contagem</Text>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: tone.accent }]}>{tone.badge}</Text>
        </View>
      </View>

      <View style={styles.center}>
        <ProgressRing
          progress={data.progress / 100}
          size={74}
          strokeWidth={7}
          trackColor="rgba(255,255,255,0.08)"
          progressColor={tone.accent}
        />

        <View style={styles.ringCenter}>
          <Text style={styles.daysValue}>{data.daysLeft === null ? '--' : data.daysLeft}</Text>
          <Text style={styles.daysLabel}>
            {data.daysLeft === 0 ? 'hoje' : 'dias'}
          </Text>
        </View>
      </View>

      <Text style={styles.examTitle} numberOfLines={1}>
        {data.examTitle}
      </Text>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 14,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  daysLabel: {
    color: '#7E8CA4',
    fontSize: 11,
    marginTop: 2,
  },
  examTitle: {
    color: '#D8E1F0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 'auto',
  },
});
