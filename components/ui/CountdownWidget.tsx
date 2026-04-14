import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type CountdownWidgetProps = {
  label: string;
  formattedDate: string;
  tone?: 'neutral' | 'warning' | 'urgent';
};

export default function CountdownWidget({
  label,
  formattedDate,
  tone = 'neutral',
}: CountdownWidgetProps) {
  const toneStyles = {
    neutral: {
      card: styles.cardNeutral,
      badge: styles.badgeNeutral,
      badgeText: styles.badgeTextNeutral,
      title: styles.titleNeutral,
      label: styles.labelNeutral,
      date: styles.dateNeutral,
    },
    warning: {
      card: styles.cardWarning,
      badge: styles.badgeWarning,
      badgeText: styles.badgeTextWarning,
      title: styles.titleWarning,
      label: styles.labelWarning,
      date: styles.dateWarning,
    },
    urgent: {
      card: styles.cardUrgent,
      badge: styles.badgeUrgent,
      badgeText: styles.badgeTextUrgent,
      title: styles.titleUrgent,
      label: styles.labelUrgent,
      date: styles.dateUrgent,
    },
  };

  const currentTone = toneStyles[tone];

  return (
    <View style={[styles.card, currentTone.card]}>
      <View style={[styles.badge, currentTone.badge]}>
        <Text style={[styles.badgeText, currentTone.badgeText]}>
          Contagem regressiva
        </Text>
      </View>

      <Text style={[styles.title, currentTone.title]}>{label}</Text>
      <Text style={[styles.date, currentTone.date]}>{formattedDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
  },

  cardNeutral: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6EEF9',
  },
  badgeNeutral: {
    backgroundColor: '#EEF4FF',
  },
  badgeTextNeutral: {
    color: '#315EA8',
  },
  titleNeutral: {
    color: '#123B7A',
  },
  labelNeutral: {},
  dateNeutral: {
    color: '#6B7A8B',
  },

  cardWarning: {
    backgroundColor: '#FFF9F0',
    borderColor: '#F5D7A7',
  },
  badgeWarning: {
    backgroundColor: '#FFF1D6',
  },
  badgeTextWarning: {
    color: '#A16207',
  },
  titleWarning: {
    color: '#92400E',
  },
  labelWarning: {},
  dateWarning: {
    color: '#A16207',
  },

  cardUrgent: {
    backgroundColor: '#FFF4F2',
    borderColor: '#F4C7BF',
  },
  badgeUrgent: {
    backgroundColor: '#FDE2DD',
  },
  badgeTextUrgent: {
    color: '#B42318',
  },
  titleUrgent: {
    color: '#912018',
  },
  labelUrgent: {},
  dateUrgent: {
    color: '#B42318',
  },
});