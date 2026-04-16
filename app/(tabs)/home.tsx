import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdaptiveSuggestionsCard from '../../components/ui/AdaptiveSuggestionsCard';
import { useAppContext } from '../../context/AppContext';

type BlockItem = {
  id: string;
  subject?: string;
  completed?: boolean;
  duration?: string | number;
  time?: string;
};

type ScheduleDay = {
  day?: number | string;
  weekday?: string;
  date?: string;
  blocks?: BlockItem[];
};

const weekDayMapPt: Record<number, string> = {
  0: 'domingo',
  1: 'segunda-feira',
  2: 'terça-feira',
  3: 'quarta-feira',
  4: 'quinta-feira',
  5: 'sexta-feira',
  6: 'sábado',
};

const weekDayMapEn: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

function normalizeText(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDuration(duration?: string | number) {
  if (typeof duration === 'number') return `${duration} min`;
  if (typeof duration === 'string' && duration.trim().length > 0) return duration;
  return 'Sessão';
}

export default function HomeScreen() {
  const {
    schedule,
    setupData,
    aiAnalysis,
    streak,
    completeBlockById,
    adaptiveSuggestions,
    applyAdaptivePlan,
  } = useAppContext();

  const todayIndex = new Date().getDay();
  const todayPt = weekDayMapPt[todayIndex];
  const todayEn = weekDayMapEn[todayIndex];
  const todayDate = getTodayDateKey();

  const scheduleDays = useMemo<ScheduleDay[]>(() => {
    if (Array.isArray(schedule)) return schedule as ScheduleDay[];
    if (schedule && Array.isArray((schedule as any).days)) {
      return (schedule as any).days as ScheduleDay[];
    }
    return [];
  }, [schedule]);

  const todaySchedule = useMemo(() => {
    return (
      scheduleDays.find((d) => normalizeText(String(d.date)) === todayDate) ||
      scheduleDays.find((d) => Number(d.day) === todayIndex) ||
      scheduleDays.find((d) => normalizeText(String(d.day)) === todayPt) ||
      scheduleDays.find((d) => normalizeText(d.weekday) === todayEn) ||
      null
    );
  }, [scheduleDays, todayDate, todayIndex, todayPt, todayEn]);

  const todayBlocks = useMemo<BlockItem[]>(() => {
    return todaySchedule?.blocks ?? [];
  }, [todaySchedule]);

  const nextBlock = useMemo(() => {
    return todayBlocks.find((b) => !b.completed) ?? null;
  }, [todayBlocks]);

  const consistency = Math.max(
    0,
    Math.min(100, Math.round((aiAnalysis?.consistencyScore || 0) * 100))
  );

  const completionRate = Math.max(
    0,
    Math.min(100, Math.round((aiAnalysis?.completionRate || 0) * 100))
  );

  const riskLabel =
    aiAnalysis?.currentRiskLevel === 'high'
      ? 'Atenção alta'
      : aiAnalysis?.currentRiskLevel === 'medium'
      ? 'Risco moderado'
      : 'Bom ritmo';

  const riskMessage =
    aiAnalysis?.currentRiskLevel === 'high'
      ? 'Hoje vale reduzir a carga para manter a constância.'
      : aiAnalysis?.currentRiskLevel === 'medium'
      ? 'Você está bem, mas precisa manter o ritmo.'
      : 'Seu plano está estável. Continue assim.';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBig}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Cronofy</Text>
            </View>

            <View style={styles.riskPill}>
              <Text style={styles.riskPillText}>{riskLabel}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {setupData?.concurso || 'Seu plano inteligente'}
          </Text>

          <Text style={styles.heroSubtitle}>{riskMessage}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{consistency}%</Text>
            <Text style={styles.statLabel}>Consistência</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Conclusão</Text>
          </View>
        </View>

        <View style={styles.cardHighlight}>
          <Text style={styles.cardTitleLight}>Agora</Text>

          {nextBlock ? (
            <>
              <Text style={styles.bigText}>
                {nextBlock.subject || 'Bloco de estudo'}
              </Text>

              <Text style={styles.smallText}>
                {nextBlock.time ? `${nextBlock.time} • ` : ''}
                {formatDuration(nextBlock.duration)}
              </Text>

              <Pressable
                style={styles.ctaButton}
                onPress={() => completeBlockById(nextBlock.id)}
              >
                <Text style={styles.ctaText}>Concluir bloco</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.bigText}>Dia concluído 🎯</Text>
              <Text style={styles.smallText}>
                Você finalizou tudo que estava previsto para hoje.
              </Text>
            </>
          )}
        </View>

        <AdaptiveSuggestionsCard
          suggestions={adaptiveSuggestions}
          onApply={applyAdaptivePlan}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progresso de consistência</Text>

          <View style={styles.barContainer}>
            <View style={[styles.bar, { width: `${consistency}%` }]} />
          </View>

          <Text style={styles.percent}>{consistency}% da sua consistência ideal</Text>
        </View>

        <View style={styles.streakBox}>
          <View>
            <Text style={styles.streakBig}>🔥 {streak?.currentStreak ?? 0}</Text>
            <Text style={styles.streakLabel}>dias seguidos</Text>
          </View>

          <View style={styles.streakDivider} />

          <View>
            <Text style={styles.streakSideValue}>{streak?.bestStreak ?? 0}</Text>
            <Text style={styles.streakSideLabel}>melhor sequência</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Insights</Text>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Melhor horário</Text>
            <Text style={styles.insightValue}>
              {aiAnalysis?.bestStudyPeriod || '---'}
            </Text>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Matéria crítica</Text>
            <Text style={styles.insightValue}>
              {aiAnalysis?.hardestSubject || '---'}
            </Text>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Carga sugerida</Text>
            <Text style={styles.insightValue}>
              {aiAnalysis?.suggestedLoadFactor
                ? `${Math.round(aiAnalysis.suggestedLoadFactor * 100)}%`
                : '---'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hoje</Text>

          {todayBlocks.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum bloco programado para hoje.</Text>
          ) : (
            todayBlocks.map((b) => (
              <View key={b.id} style={styles.blockRow}>
                <View style={styles.blockLeft}>
                  <Text style={styles.blockSubject}>
                    {b.subject || 'Bloco de estudo'}
                  </Text>
                  <Text style={styles.blockMeta}>
                    {b.time ? `${b.time} • ` : ''}
                    {formatDuration(b.duration)}
                  </Text>
                </View>

                {b.completed ? (
                  <View style={styles.doneBadge}>
                    <Text style={styles.doneBadgeText}>Concluído</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.completeMiniButton}
                    onPress={() => completeBlockById(b.id)}
                  >
                    <Text style={styles.completeMiniButtonText}>Marcar</Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },

  heroBig: {
    backgroundColor: '#6366F1',
    padding: 20,
    borderRadius: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  riskPill: {
    backgroundColor: 'rgba(15,23,42,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  riskPillText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  heroSubtitle: {
    color: '#E0E7FF',
    marginTop: 8,
    lineHeight: 20,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },

  card: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 18,
  },
  cardHighlight: {
    backgroundColor: '#4F46E5',
    padding: 18,
    borderRadius: 20,
  },
  cardTitle: {
    color: '#CBD5F5',
    marginBottom: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  cardTitleLight: {
    color: '#E0E7FF',
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  bigText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  smallText: {
    color: '#E0E7FF',
    marginTop: 8,
    lineHeight: 20,
  },

  ctaButton: {
    marginTop: 14,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  barContainer: {
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 999,
    overflow: 'hidden',
  },
  bar: {
    height: 12,
    backgroundColor: '#6366F1',
    borderRadius: 999,
  },
  percent: {
    color: '#CBD5F5',
    marginTop: 10,
    fontSize: 13,
  },

  streakBox: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakBig: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  streakLabel: {
    color: '#94A3B8',
    marginTop: 4,
  },
  streakDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  streakSideValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  streakSideLabel: {
    color: '#94A3B8',
    marginTop: 4,
  },

  insightItem: {
    marginBottom: 12,
  },
  insightLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 4,
  },
  insightValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  emptyText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  blockLeft: {
    flex: 1,
    paddingRight: 12,
  },
  blockSubject: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  blockMeta: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  doneBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  doneBadgeText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },
  completeMiniButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  completeMiniButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
