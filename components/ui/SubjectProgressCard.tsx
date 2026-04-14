import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ProgressRing from './ProgressRing';

type SubjectProgressCardProps = {
  subject: string;
  progress: number;
};

export default function SubjectProgressCard({
  subject,
  progress,
}: SubjectProgressCardProps) {
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.subject} numberOfLines={1}>
          {subject}
        </Text>
        <Text style={styles.subtitle}>
          {percentage}% concluído
        </Text>
      </View>

      <View style={styles.right}>
        <ProgressRing progress={progress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E6EEF9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  left: {
    flex: 1,
    paddingRight: 14,
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
  },
});