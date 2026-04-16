import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type SuggestionImpact = 'low' | 'medium' | 'high';

export type AdaptiveSuggestionItem = {
  type:
    | 'rebalance_subject'
    | 'reduce_load'
    | 'recover_missed_blocks'
    | 'protect_consistency'
    | 'insert_review';
  title: string;
  description: string;
  impact: SuggestionImpact;
};

type AdaptiveSuggestionsCardProps = {
  suggestions: AdaptiveSuggestionItem[];
  onApply: () => void;
  isApplying?: boolean;
};

function getImpactConfig(impact: SuggestionImpact) {
  switch (impact) {
    case 'high':
      return {
        label: 'Alta prioridade',
        badgeStyle: styles.badgeHigh,
        badgeTextStyle: styles.badgeHighText,
        accentBarStyle: styles.accentHigh,
      };
    case 'medium':
      return {
        label: 'Ajuste recomendado',
        badgeStyle: styles.badgeMedium,
        badgeTextStyle: styles.badgeMediumText,
        accentBarStyle: styles.accentMedium,
      };
    case 'low':
    default:
      return {
        label: 'Plano estável',
        badgeStyle: styles.badgeLow,
        badgeTextStyle: styles.badgeLowText,
        accentBarStyle: styles.accentLow,
      };
  }
}

export default function AdaptiveSuggestionsCard({
  suggestions,
  onApply,
  isApplying = false,
}: AdaptiveSuggestionsCardProps) {
  if (!suggestions.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Ajustes automáticos</Text>
          <Text style={styles.title}>Seu plano foi recalibrado</Text>
        </View>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{suggestions.length}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        O Cronofy reorganizou sua semana para proteger constância e manter avanço
        real até a prova.
      </Text>

      <View style={styles.list}>
        {suggestions.map((suggestion, index) => {
          const impact = getImpactConfig(suggestion.impact);

          return (
            <View key={`${suggestion.type}-${index}`} style={styles.item}>
              <View style={[styles.accentBar, impact.accentBarStyle]} />

              <View style={styles.itemContent}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemTitle}>{suggestion.title}</Text>

                  <View style={[styles.impactBadge, impact.badgeStyle]}>
                    <Text style={[styles.impactBadgeText, impact.badgeTextStyle]}>
                      {impact.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemDescription}>{suggestion.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isApplying && styles.buttonDisabled,
        ]}
        onPress={onApply}
        disabled={isApplying}
      >
        <Text style={styles.buttonText}>
          {isApplying ? 'Aplicando...' : 'Aplicar ajustes'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  eyebrow: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },

  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
  },

  headerBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#312E81',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },

  headerBadgeText: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '800',
  },

  list: {
    gap: 12,
  },

  item: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  accentBar: {
    width: 4,
  },

  accentLow: {
    backgroundColor: '#22C55E',
  },

  accentMedium: {
    backgroundColor: '#818CF8',
  },

  accentHigh: {
    backgroundColor: '#F59E0B',
  },

  itemContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },

  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },

  itemTitle: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },

  itemDescription: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
  },

  impactBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  impactBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  badgeLow: {
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderColor: 'rgba(34,197,94,0.30)',
  },

  badgeLowText: {
    color: '#4ADE80',
  },

  badgeMedium: {
    backgroundColor: 'rgba(99,102,241,0.14)',
    borderColor: 'rgba(129,140,248,0.35)',
  },

  badgeMediumText: {
    color: '#A5B4FC',
  },

  badgeHigh: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.35)',
  },

  badgeHighText: {
    color: '#FBBF24',
  },

  button: {
    marginTop: 4,
    backgroundColor: '#6366F1',
    borderRadius: 18,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});