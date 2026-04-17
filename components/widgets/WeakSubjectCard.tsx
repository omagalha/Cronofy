import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type WeakSubjectCardProps = {
  subject: string | null;
  accuracy?: number | null;
  helperText: string;
  onPress?: () => void;
};

export default function WeakSubjectCard({
  subject,
  accuracy,
  helperText,
  onPress,
}: WeakSubjectCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Ponto fraco</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {typeof accuracy === 'number' ? `${accuracy}%` : 'Monitorando'}
          </Text>
        </View>
      </View>

      <Text style={styles.subject}>{subject || 'Ainda sem historico de pratica'}</Text>
      <Text style={styles.support}>{helperText}</Text>

      {onPress ? (
        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>Ver pratica</Text>
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
    backgroundColor: 'rgba(249,115,115,0.12)',
  },
  badgeText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '700',
  },
  subject: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginTop: 6,
  },
  support: {
    color: '#8FA1BC',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#18263B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#D8E1F0',
    fontSize: 13,
    fontWeight: '700',
  },
});
