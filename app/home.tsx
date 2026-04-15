import { router } from 'expo-router';
import React, { memo, useMemo } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CountdownWidget from '../components/ui/CountdownWidget';
import SubjectProgressCard from '../components/ui/SubjectProgressCard';
import { useAppContext } from '../context/AppContext';
import {
  formatExamDate,
  getCountdownLabel,
  getCountdownTone,
} from '../utils/examDate';
import { getSubjectProgressMap } from '../utils/scheduleEngine';

type HomeBlock = {
  id: string;
  subject: string;
  completed: boolean;
  duration?: string | number;
  time?: string;
  type?: string;
  tip?: string;
};

type HomeScheduleDay = {
  date?: string;
  day?: string;
  weekday?: string;
  blocks: HomeBlock[];
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

function getTodayLabels() {
  const dayIndex = new Date().getDay();

  return {
    pt: weekDayMapPt[dayIndex],
    en: weekDayMapEn[dayIndex],
  };
}

function findTodaySchedule(days: HomeScheduleDay[]): HomeScheduleDay | null {
  const todayDate = getTodayDateKey();
  const { pt, en } = getTodayLabels();

  return (
    days.find((day) => normalizeText(day.date) === todayDate) ??
    days.find((day) => normalizeText(day.day) === pt) ??
    days.find((day) => normalizeText(day.weekday) === en) ??
    null
  );
}

function formatBlockDuration(duration?: string | number) {
  if (typeof duration === 'number') {
    return `${duration} min`;
  }

  if (typeof duration === 'string' && duration.trim().length > 0) {
    return duration;
  }

  return 'Duração não definida';
}

function getSafeMateriasCount(setupData: any) {
  if (Array.isArray(setupData?.materias)) return setupData.materias.length;
  if (Array.isArray(setupData?.subjects)) return setupData.subjects.length;
  return 0;
}

const HomeHeader = memo(function HomeHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.greeting}>Olá 👋</Text>
      <Text style={styles.title}>Seu plano de estudos</Text>
      <Text style={styles.subtitle}>
        Organize seu foco, mantenha consistência e ajuste a rota com inteligência.
      </Text>
    </View>
  );
});

const ScheduleStaleCard = memo(function ScheduleStaleCard({
  visible,
  onRefresh,
}: {
  visible: boolean;
  onRefresh: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.warningCard}>
      <Text style={styles.warningTitle}>⚠️ Cronograma desatualizado</Text>
      <Text style={styles.warningText}>
        Seu plano não corresponde mais às configurações mais recentes.
      </Text>

      <Pressable style={styles.warningButton} onPress={onRefresh}>
        <Text style={styles.warningButtonText}>Atualizar cronograma</Text>
      </Pressable>
    </View>
  );
});

const TodayHeroCard = memo(function TodayHeroCard({
  todayLabel,
  todaySchedule,
  nextBlock,
}: {
  todayLabel: string;
  todaySchedule: HomeScheduleDay | null;
  nextBlock: HomeBlock | null;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Hoje</Text>
        </View>
        <Text style={styles.heroDay}>{todayLabel}</Text>
      </View>

      {todaySchedule && todaySchedule.blocks.length > 0 ? (
        <>
          <Text style={styles.heroMain}>
            {nextBlock ? `Próximo bloco: ${nextBlock.subject}` : 'Tudo concluído hoje'}
          </Text>
          <Text style={styles.heroSub}>
            {nextBlock
              ? `${nextBlock.time ?? 'Horário livre'} • ${formatBlockDuration(
                  nextBlock.duration
                )}`
              : 'Bom trabalho. Seu dia está completo. ✨'}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.heroMain}>Nenhum bloco para hoje</Text>
          <Text style={styles.heroSub}>
            Você pode revisar conteúdos ou aplicar ajustes inteligentes.
          </Text>
        </>
      )}
    </View>
  );
});

const StatsRow = memo(function StatsRow({
  materiasCount,
  completedBlocks,
  totalBlocks,
  currentStreak,
}: {
  materiasCount: number;
  completedBlocks: number;
  totalBlocks: number;
  currentStreak: number;
}) {
  return (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{materiasCount}</Text>
        <Text style={styles.statLabel}>Matérias</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{completedBlocks}</Text>
        <Text style={styles.statLabel}>Concluídos</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{totalBlocks}</Text>
        <Text style={styles.statLabel}>Blocos</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{currentStreak}</Text>
        <Text style={styles.statLabel}>Streak</Text>
      </View>
    </View>
  );
});

const SummarySection = memo(function SummarySection({
  setupData,
  formattedExamDate,
}: {
  setupData: any;
  formattedExamDate: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Resumo rápido</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          Concurso:{' '}
          <Text style={styles.summaryStrong}>
            {setupData?.concurso || 'Não definido'}
          </Text>
        </Text>

        <Text style={styles.summaryText}>
          Prova: <Text style={styles.summaryStrong}>{formattedExamDate}</Text>
        </Text>

        <Text style={styles.summaryText}>
          Nível:{' '}
          <Text style={styles.summaryStrong}>{setupData?.nivel || 'Não definido'}</Text>
        </Text>

        <Text style={styles.summaryText}>
          Foco:{' '}
          <Text style={styles.summaryStrong}>{setupData?.foco || 'Não definido'}</Text>
        </Text>

        <Text style={styles.summaryText}>
          Disponibilidade:{' '}
          <Text style={styles.summaryStrong}>
            {setupData?.disponibilidade || 'Não definida'}
          </Text>
        </Text>
      </View>
    </View>
  );
});

const StreakCard = memo(function StreakCard({
  currentStreak,
  bestStreak,
  lastStudyDate,
}: {
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Consistência</Text>
      <Text style={styles.sectionSubtitle}>
        Pequenas vitórias diárias constroem resultado composto.
      </Text>

      <View style={styles.streakCard}>
        <View style={styles.streakMainRow}>
          <View>
            <Text style={styles.streakValue}>🔥 {currentStreak} dias</Text>
            <Text style={styles.streakLabel}>Sequência atual</Text>
          </View>

          <View style={styles.streakDivider} />

          <View>
            <Text style={styles.streakSecondaryValue}>{bestStreak} dias</Text>
            <Text style={styles.streakLabel}>Melhor sequência</Text>
          </View>
        </View>

        <Text style={styles.streakFootnote}>
          Último estudo: {lastStudyDate ?? 'Ainda sem registros'}
        </Text>
      </View>
    </View>
  );
});

const AdaptiveSuggestionsSection = memo(function AdaptiveSuggestionsSection({
  adaptiveSuggestions,
  onApply,
}: {
  adaptiveSuggestions: Array<{
    type: string;
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  onApply: () => void;
}) {
  if (!adaptiveSuggestions.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ajustes inteligentes</Text>
      <Text style={styles.sectionSubtitle}>
        Recomendações geradas a partir do seu comportamento recente.
      </Text>

      <View style={styles.suggestionsWrapper}>
        {adaptiveSuggestions.map((item) => (
          <View key={`${item.type}-${item.title}`} style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionTitle}>{item.title}</Text>
              <View
                style={[
                  styles.impactBadge,
                  item.impact === 'high' && styles.impactHigh,
                  item.impact === 'medium' && styles.impactMedium,
                  item.impact === 'low' && styles.impactLow,
                ]}
              >
                <Text style={styles.impactBadgeText}>{item.impact}</Text>
              </View>
            </View>

            <Text style={styles.suggestionDescription}>{item.description}</Text>
          </View>
        ))}

        <Pressable style={styles.applyAdaptiveButton} onPress={onApply}>
          <Text style={styles.applyAdaptiveButtonText}>Aplicar ajustes</Text>
        </Pressable>
      </View>
    </View>
  );
});

const SubjectProgressSection = memo(function SubjectProgressSection({
  subjectProgressEntries,
}: {
  subjectProgressEntries: [string, any][];
}) {
  if (!subjectProgressEntries.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Progresso por matéria</Text>
      <Text style={styles.sectionSubtitle}>
        Visão discreta e contínua do seu avanço.
      </Text>

      <View style={styles.subjectsWrapper}>
        {subjectProgressEntries.map(([subject, progress]) => (
          <SubjectProgressCard
            key={subject}
            subject={subject}
            progress={progress}
          />
        ))}
      </View>
    </View>
  );
});

const TodayBlocksSection = memo(function TodayBlocksSection({
  todaySchedule,
  onComplete,
}: {
  todaySchedule: HomeScheduleDay | null;
  onComplete: (blockId: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Blocos de hoje</Text>

      {!todaySchedule || todaySchedule.blocks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhum bloco programado para hoje.</Text>
        </View>
      ) : (
        todaySchedule.blocks.map((block) => (
          <View
            key={block.id}
            style={[styles.blockCard, block.completed && styles.blockCompleted]}
          >
            <View style={styles.blockHeader}>
              <Text style={styles.blockSubject}>{block.subject}</Text>
              <Text style={styles.blockTime}>{block.time ?? 'Sem horário'}</Text>
            </View>

            <Text style={styles.blockMeta}>
              {formatBlockDuration(block.duration)}
              {block.type ? ` • ${block.type}` : ''}
            </Text>

            {!!block.tip && <Text style={styles.blockTip}>💡 {block.tip}</Text>}

            {block.completed ? (
              <Text style={styles.completedText}>✅ Concluído</Text>
            ) : (
              <Pressable
                style={styles.completeButton}
                onPress={() => onComplete(block.id)}
              >
                <Text style={styles.completeButtonText}>Concluir</Text>
              </Pressable>
            )}
          </View>
        ))
      )}
    </View>
  );
});

export default function HomeScreen() {
  const {
    setupData,
    schedule,
    persistedSchedule,
    isScheduleStale,
    refreshSchedule,
    completeBlockById,
    previewAdaptiveSchedule,
    adaptiveSuggestions,
    applyAdaptivePlan,
    streak,
  } = useAppContext();

  const renderedSchedule = useMemo<HomeScheduleDay[]>(() => {
    return (previewAdaptiveSchedule?.length
      ? previewAdaptiveSchedule
      : schedule) as HomeScheduleDay[];
  }, [previewAdaptiveSchedule, schedule]);

  const todayLabel = useMemo(() => {
    const { pt } = getTodayLabels();
    return pt.charAt(0).toUpperCase() + pt.slice(1);
  }, []);

  const todaySchedule = useMemo(() => {
    return findTodaySchedule(renderedSchedule);
  }, [renderedSchedule]);

  const totalBlocks = useMemo(() => {
    return renderedSchedule.reduce((acc, day) => acc + day.blocks.length, 0);
  }, [renderedSchedule]);

  const completedBlocks = useMemo(() => {
    return renderedSchedule.reduce(
      (acc, day) => acc + day.blocks.filter((block) => block.completed).length,
      0
    );
  }, [renderedSchedule]);

  const nextBlock = useMemo(() => {
    if (!todaySchedule?.blocks?.length) return null;
    return todaySchedule.blocks.find((block) => !block.completed) ?? null;
  }, [todaySchedule]);

  const subjectProgressEntries = useMemo(() => {
    const progressMap = getSubjectProgressMap(persistedSchedule);
    return Object.entries(progressMap).sort((a, b) => a[0].localeCompare(b[0]));
  }, [persistedSchedule]);

  const countdownLabel = useMemo(() => {
    return getCountdownLabel(setupData?.examDate);
  }, [setupData?.examDate]);

  const formattedExamDate = useMemo(() => {
    return formatExamDate(setupData?.examDate);
  }, [setupData?.examDate]);

  const countdownTone = useMemo(() => {
    return getCountdownTone(setupData?.examDate);
  }, [setupData?.examDate]);

  const materiasCount = useMemo(() => {
    return getSafeMateriasCount(setupData);
  }, [setupData]);

  const handleRefreshSchedule = () => {
    const result = refreshSchedule();

    if (!result.success) {
      Alert.alert(
        'Não foi possível atualizar',
        result.errors?.join('\n') || 'Revise seu setup antes de atualizar.'
      );
    }
  };

  const handleApplyAdaptivePlan = () => {
    applyAdaptivePlan();
    Alert.alert(
      'Ajustes aplicados',
      'O cronograma foi atualizado com base nas recomendações inteligentes.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />

        <CountdownWidget
          label={countdownLabel}
          formattedDate={formattedExamDate}
          tone={countdownTone}
        />

        <ScheduleStaleCard
          visible={isScheduleStale}
          onRefresh={handleRefreshSchedule}
        />

        <TodayHeroCard
          todayLabel={todayLabel}
          todaySchedule={todaySchedule}
          nextBlock={nextBlock}
        />

        <StatsRow
          materiasCount={materiasCount}
          completedBlocks={completedBlocks}
          totalBlocks={totalBlocks}
          currentStreak={streak.currentStreak}
        />

        <StreakCard
          currentStreak={streak.currentStreak}
          bestStreak={streak.bestStreak}
          lastStudyDate={streak.lastStudyDate}
        />

        <AdaptiveSuggestionsSection
          adaptiveSuggestions={adaptiveSuggestions}
          onApply={handleApplyAdaptivePlan}
        />

        <SummarySection
          setupData={setupData}
          formattedExamDate={formattedExamDate}
        />

        <SubjectProgressSection subjectProgressEntries={subjectProgressEntries} />

        <TodayBlocksSection
          todaySchedule={todaySchedule}
          onComplete={completeBlockById}
        />

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/schedule')}
        >
          <Text style={styles.primaryButtonText}>Ver cronograma</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace('/setup')}
        >
          <Text style={styles.secondaryButtonText}>Refazer setup</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9FC',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 15,
    color: '#7A8798',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#123B7A',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: '#536273',
    lineHeight: 22,
  },
  warningCard: {
    backgroundColor: '#FFF5E9',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B8',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#7C2D12',
    lineHeight: 20,
    marginBottom: 12,
  },
  warningButton: {
    backgroundColor: '#F4A024',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#123B7A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  heroTopRow: {
    marginBottom: 14,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  heroBadgeText: {
    color: '#D9E8FF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroDay: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroMain: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  heroSub: {
    color: '#D7E6FF',
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E8EEF7',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#123B7A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7A8B',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#7A8798',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EEF7',
  },
  summaryText: {
    fontSize: 15,
    color: '#536273',
    marginBottom: 10,
  },
  summaryStrong: {
    color: '#0F172A',
    fontWeight: '600',
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EEF7',
  },
  streakMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#E8EEF7',
    marginHorizontal: 16,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#123B7A',
    marginBottom: 4,
  },
  streakSecondaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 13,
    color: '#6B7A8B',
  },
  streakFootnote: {
    marginTop: 14,
    fontSize: 13,
    color: '#7A8798',
  },
  suggestionsWrapper: {
    gap: 10,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EEF7',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  suggestionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#163968',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#536273',
    lineHeight: 20,
  },
  impactBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  impactHigh: {
    backgroundColor: '#FDE2E2',
  },
  impactMedium: {
    backgroundColor: '#FEF3C7',
  },
  impactLow: {
    backgroundColor: '#DCFCE7',
  },
  impactBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
  },
  applyAdaptiveButton: {
    backgroundColor: '#123B7A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyAdaptiveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subjectsWrapper: {
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EEF7',
  },
  emptyText: {
    fontSize: 14,
    color: '#7A8798',
    fontStyle: 'italic',
  },
  blockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E8EEF7',
    marginBottom: 10,
  },
  blockCompleted: {
    opacity: 0.62,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  blockSubject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#163968',
  },
  blockTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3D6FE3',
  },
  blockMeta: {
    fontSize: 13,
    color: '#6B7A8B',
    marginBottom: 8,
  },
  blockTip: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  completeButton: {
    marginTop: 12,
    backgroundColor: '#1E8E5A',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  completedText: {
    marginTop: 12,
    color: '#1E8E5A',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#123B7A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#EAF1FB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#123B7A',
    fontSize: 15,
    fontWeight: '600',
  },
});