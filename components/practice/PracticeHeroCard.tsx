import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PracticeSummary } from '../../apps/shared/types/practice';

type PracticeHeroCardProps = {
  summary: PracticeSummary;
  subtitle: string;
};

export default function PracticeHeroCard({
  summary,
  subtitle,
}: PracticeHeroCardProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Pratica</Text>
      </View>

      <Text style={styles.title}>Sessões curtas para consolidar e corrigir erro</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{summary.accuracy}%</Text>
          <Text style={styles.statLabel}>acerto medio</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{summary.totalSessions}</Text>
          <Text style={styles.statLabel}>sessoes completas</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginTop: 8,
  },
  subtitle: {
    color: '#E0E7FF',
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.24)',
    borderRadius: 18,
    padding: 14,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#C7D2FE',
    fontSize: 12,
    marginTop: 4,
  },
});
