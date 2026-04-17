import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SubjectPerformance } from '../../apps/shared/types/practice';

type SubjectPerformanceCardProps = {
  title?: string;
  items: SubjectPerformance[];
};

function getTrendLabel(trend: SubjectPerformance['trend']) {
  switch (trend) {
    case 'up':
      return 'subindo';
    case 'down':
      return 'caindo';
    case 'stable':
    default:
      return 'estavel';
  }
}

export default function SubjectPerformanceCard({
  title = 'Desempenho por materia',
  items,
}: SubjectPerformanceCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>
          Resolva uma sessao curta para montar o mapa de desempenho por materia.
        </Text>
      ) : (
        items.map((item) => (
          <View key={item.subject} style={styles.row}>
            <View style={styles.left}>
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.meta}>
                {item.correctAnswers}/{item.totalQuestions} corretas • recente {item.recentAccuracy}%
              </Text>
            </View>

            <View style={styles.rateBlock}>
              <Text style={styles.rateValue}>{item.accuracy}%</Text>
              <Text style={styles.rateLabel}>{getTrendLabel(item.trend)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
  },
  left: {
    flex: 1,
  },
  subject: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  rateBlock: {
    minWidth: 72,
    alignItems: 'center',
  },
  rateValue: {
    color: '#C7D2FE',
    fontSize: 14,
    fontWeight: '800',
  },
  rateLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
});
