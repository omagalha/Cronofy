import { router, type Href } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdaptiveSuggestionsCard from '../../components/ui/AdaptiveSuggestionsCard';
import AIDailySignalCard from '../../components/widgets/AIDailySignalCard';
import CountdownRingCard from '../../components/widgets/CountdownRingCard';
import DailyPracticeCard from '../../components/widgets/DailyPracticeCard';
import NextBlockCard from '../../components/widgets/NextBlockCard';
import WeakSubjectCard from '../../components/widgets/WeakSubjectCard';
import {
  PracticeRecommendation,
  SubjectPerformance,
} from '../../apps/shared/types/practice';
import { useAppContext } from '../../context/AppContext';
import { buildWidgetSnapshotFromAppContext } from '../../widgets/fromAppContext';
import { saveWidgetSnapshot } from '../../widgets/storage';

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

const WEEKDAY_LABELS_PT: Record<number, string> = {
  0: 'domingo',
  1: 'segunda-feira',
  2: 'terca-feira',
  3: 'quarta-feira',
  4: 'quinta-feira',
  5: 'sexta-feira',
  6: 'sabado',
};

const WEEKDAY_LABELS_EN: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

function normalizeText(value?: string | null) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDuration(duration?: string | number) {
  if (typeof duration === 'number') return `${duration} min`;
  if (typeof duration === 'string' && duration.trim().length > 0) return duration;
  return 'Sessao';
}

function sortSubjectPerformance(items: SubjectPerformance[]) {
  return [...items].sort((a, b) => {
    if (a.accuracy !== b.accuracy) {
      return a.accuracy - b.accuracy;
    }

    if (a.recentAccuracy !== b.recentAccuracy) {
      return a.recentAccuracy - b.recentAccuracy;
    }

    return a.subject.localeCompare(b.subject);
  });
}

export default function HomeScreen() {
  const {
    schedule,
    persistedSchedule,
    setupData,
    aiAnalysis,
    streak,
    completeBlockById,
    adaptiveSuggestions,
    applyAdaptivePlan,
    practiceSummary,
    subjectPerformance,
    practiceRecommendations,
    currentPracticeSession,
  } = useAppContext();

  const [adaptiveFeedback, setAdaptiveFeedback] = useState<string | null>(null);

  const widgetSnapshot = useMemo(
    () =>
      buildWidgetSnapshotFromAppContext({
        setupData,
        schedule,
        persistedSchedule,
        aiAnalysis,
      }),
    [setupData, schedule, persistedSchedule, aiAnalysis]
  );

  useEffect(() => {
    saveWidgetSnapshot(widgetSnapshot);
  }, [widgetSnapshot]);

  useEffect(() => {
    if (!adaptiveFeedback) return;

    const timeout = setTimeout(() => {
      setAdaptiveFeedback(null);
    }, 2400);

    return () => clearTimeout(timeout);
  }, [adaptiveFeedback]);

  const scheduleDays = useMemo<ScheduleDay[]>(() => {
    if (Array.isArray(schedule)) return schedule as ScheduleDay[];
    if (schedule && Array.isArray((schedule as { days?: ScheduleDay[] }).days)) {
      return (schedule as { days: ScheduleDay[] }).days;
    }
    return [];
  }, [schedule]);

  const todayIndex = new Date().getDay();
  const todayDate = getLocalDateKey();

  const todaySchedule = useMemo(() => {
    const todayPt = WEEKDAY_LABELS_PT[todayIndex];
    const todayEn = WEEKDAY_LABELS_EN[todayIndex];

    return (
      scheduleDays.find((day) => normalizeText(day.date) === todayDate) ??
      scheduleDays.find((day) => Number(day.day) === todayIndex) ??
      scheduleDays.find((day) => normalizeText(String(day.day)) === todayPt) ??
      scheduleDays.find((day) => normalizeText(day.weekday) === todayEn) ??
      null
    );
  }, [scheduleDays, todayDate, todayIndex]);

  const todayBlocks = todaySchedule?.blocks ?? [];
  const nextBlock = todayBlocks.find((block) => !block.completed) ?? null;

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
      ? 'Atencao alta'
      : aiAnalysis?.currentRiskLevel === 'medium'
      ? 'Risco moderado'
      : 'Plano estavel';

  const riskMessage =
    aiAnalysis?.currentRiskLevel === 'high'
      ? 'Hoje vale proteger a constancia e reduzir carga se necessario.'
      : aiAnalysis?.currentRiskLevel === 'medium'
      ? 'Seu ritmo esta bom, mas ainda pede cuidado com continuidade.'
      : 'Seu plano esta estavel. Continue no ritmo que esta funcionando.';

  const weakestPracticeEntry = useMemo(() => {
    return sortSubjectPerformance(subjectPerformance)[0] ?? null;
  }, [subjectPerformance]);
  const dailyRecommendation = useMemo<PracticeRecommendation | null>(() => {
    return (
      practiceRecommendations.find((recommendation) => recommendation.mode === 'daily') ??
      null
    );
  }, [practiceRecommendations]);

  const weakSubject = weakestPracticeEntry?.subject ?? aiAnalysis?.hardestSubject ?? null;
  const weakSubjectAccuracy = weakestPracticeEntry?.accuracy ?? null;

  function handleApplyAdaptivePlan() {
    applyAdaptivePlan();
    setAdaptiveFeedback('Ajustes aplicados ao seu cronograma.');
  }

  function handleGoToPractice() {
    router.push('/practice' as Href);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>AprovAI</Text>
            </View>

            <View style={styles.riskBadge}>
              <Text style={styles.riskBadgeText}>{riskLabel}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {setupData?.concurso || 'Seu painel inteligente'}
          </Text>
          <Text style={styles.heroSubtitle}>{riskMessage}</Text>
        </View>

        {adaptiveSuggestions?.length > 0 ? (
          <View style={styles.adaptiveSlot}>
            <AdaptiveSuggestionsCard
              suggestions={adaptiveSuggestions}
              onApply={handleApplyAdaptivePlan}
            />

            {adaptiveFeedback ? (
              <Text style={styles.adaptiveFeedback}>{adaptiveFeedback}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.widgetRow}>
          <CountdownRingCard data={widgetSnapshot.countdownRing} />
          <DailyPracticeCard
            recommendation={dailyRecommendation}
            currentSession={currentPracticeSession}
            onPress={handleGoToPractice}
          />
        </View>

        <NextBlockCard
          data={widgetSnapshot.nextBlock}
          onPress={nextBlock ? () => completeBlockById(nextBlock.id) : undefined}
        />

        <AIDailySignalCard data={widgetSnapshot.aiDailySignal} />

        <WeakSubjectCard
          subject={weakSubject}
          accuracy={weakSubjectAccuracy}
          helperText={
            weakestPracticeEntry
              ? 'Materia com pior precisao recente nas sessoes curtas.'
              : aiAnalysis?.hardestSubject
              ? 'Ainda sem pratica suficiente. Usando leitura do comportamento.'
              : 'A pratica vai mostrar qual materia esta precisando de reforco.'
          }
          onPress={handleGoToPractice}
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{consistency}%</Text>
            <Text style={styles.statLabel}>Consistencia</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Conclusao</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{practiceSummary.accuracy}%</Text>
            <Text style={styles.statLabel}>Acerto em pratica</Text>
          </View>
        </View>

        <View style={styles.streakCard}>
          <View>
            <Text style={styles.streakValue}>{streak?.currentStreak ?? 0}</Text>
            <Text style={styles.streakLabel}>dias seguidos</Text>
          </View>

          <View style={styles.streakDivider} />

          <View>
            <Text style={styles.streakValue}>{dailyRecommendation?.totalQuestions ?? 0}</Text>
            <Text style={styles.streakLabel}>questoes sugeridas</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Hoje</Text>

            <Pressable onPress={() => router.push('/schedule' as Href)}>
              <Text style={styles.linkText}>Abrir cronograma</Text>
            </Pressable>
          </View>

          {todayBlocks.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum bloco programado para hoje.</Text>
          ) : (
            todayBlocks.map((block) => (
              <View key={block.id} style={styles.blockRow}>
                <View style={styles.blockLeft}>
                  <Text style={styles.blockSubject}>
                    {block.subject || 'Bloco de estudo'}
                  </Text>
                  <Text style={styles.blockMeta}>
                    {block.time ? `${block.time} • ` : ''}
                    {formatDuration(block.duration)}
                  </Text>
                </View>

                {block.completed ? (
                  <View style={styles.doneBadge}>
                    <Text style={styles.doneBadgeText}>Concluido</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.completeButton}
                    onPress={() => completeBlockById(block.id)}
                  >
                    <Text style={styles.completeButtonText}>Marcar</Text>
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
  hero: {
    backgroundColor: '#6366F1',
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  riskBadge: {
    backgroundColor: 'rgba(15,23,42,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  riskBadgeText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  heroSubtitle: {
    color: '#E0E7FF',
    fontSize: 14,
    lineHeight: 20,
  },
  adaptiveSlot: {
    gap: 8,
  },
  adaptiveFeedback: {
    color: '#A5B4FC',
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  widgetRow: {
    flexDirection: 'row',
    gap: 12,
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
    fontWeight: '800',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  streakCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  streakLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  streakDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  linkText: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
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
    fontWeight: '700',
  },
  blockMeta: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  doneBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  doneBadgeText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
