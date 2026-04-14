import { router } from 'expo-router';
import React, { useMemo } from 'react';
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

const weekDayMap: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  0: 'Domingo',
};

export default function HomeScreen() {
  const {
    setupData,
    schedule,
    persistedSchedule,
    isScheduleStale,
    refreshSchedule,
    completeBlockById,
  } = useAppContext();

  const todayName = useMemo(() => {
    const todayNumber = new Date().getDay();
    return weekDayMap[todayNumber];
  }, []);

  const todaySchedule = useMemo(() => {
    return schedule.find((day) => day.day === todayName) ?? null;
  }, [schedule, todayName]);

  const totalBlocks = useMemo(() => {
    return schedule.reduce((acc, day) => acc + day.blocks.length, 0);
  }, [schedule]);

  const completedBlocks = useMemo(() => {
    return schedule.reduce(
      (acc, day) => acc + day.blocks.filter((block) => block.completed).length,
      0
    );
  }, [schedule]);

  const nextBlock = useMemo(() => {
    if (!todaySchedule?.blocks?.length) return null;
    return todaySchedule.blocks.find((block) => !block.completed) ?? null;
  }, [todaySchedule]);

  const subjectProgressEntries = useMemo(() => {
    const progressMap = getSubjectProgressMap(persistedSchedule);
    return Object.entries(progressMap).sort((a, b) => a[0].localeCompare(b[0]));
  }, [persistedSchedule]);

  const countdownLabel = useMemo(() => {
    return getCountdownLabel(setupData.examDate);
  }, [setupData.examDate]);

  const formattedExamDate = useMemo(() => {
    return formatExamDate(setupData.examDate);
  }, [setupData.examDate]);

  const countdownTone = useMemo(() => {
    return getCountdownTone(setupData.examDate);
  }, [setupData.examDate]);

  const handleRefreshSchedule = () => {
    const result = refreshSchedule();

    if (!result.success) {
      Alert.alert(
        'Não foi possível atualizar',
        result.errors?.join('\n') || 'Revise seu setup antes de atualizar.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá 👋</Text>
          <Text style={styles.title}>Seu plano de estudos</Text>
          <Text style={styles.subtitle}>
            Organize seu foco e avance com consistência.
          </Text>
        </View>

        <CountdownWidget
          label={countdownLabel}
          formattedDate={formattedExamDate}
          tone={countdownTone}
        />

        {isScheduleStale && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Cronograma desatualizado</Text>
            <Text style={styles.warningText}>
              Seu plano não corresponde mais às configurações mais recentes.
            </Text>

            <Pressable
              style={styles.warningButton}
              onPress={handleRefreshSchedule}
            >
              <Text style={styles.warningButtonText}>Atualizar cronograma</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Hoje</Text>
            </View>
            <Text style={styles.heroDay}>{todayName}</Text>
          </View>

          {todaySchedule && todaySchedule.blocks.length > 0 ? (
            <>
              <Text style={styles.heroMain}>
                {nextBlock
                  ? `Próximo bloco: ${nextBlock.subject}`
                  : 'Tudo concluído hoje'}
              </Text>
              <Text style={styles.heroSub}>
                {nextBlock
                  ? `${nextBlock.time} • ${nextBlock.duration}`
                  : 'Bom trabalho. Seu dia está completo. ✨'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.heroMain}>Nenhum bloco para hoje</Text>
              <Text style={styles.heroSub}>
                Você pode revisar ou ajustar seu cronograma.
              </Text>
            </>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{setupData.materias.length}</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo rápido</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              Concurso:{' '}
              <Text style={styles.summaryStrong}>
                {setupData.concurso || 'Não definido'}
              </Text>
            </Text>

            <Text style={styles.summaryText}>
              Prova:{' '}
              <Text style={styles.summaryStrong}>{formattedExamDate}</Text>
            </Text>

            <Text style={styles.summaryText}>
              Nível:{' '}
              <Text style={styles.summaryStrong}>
                {setupData.nivel || 'Não definido'}
              </Text>
            </Text>

            <Text style={styles.summaryText}>
              Foco:{' '}
              <Text style={styles.summaryStrong}>
                {setupData.foco || 'Não definido'}
              </Text>
            </Text>

            <Text style={styles.summaryText}>
              Disponibilidade:{' '}
              <Text style={styles.summaryStrong}>
                {setupData.disponibilidade || 'Não definida'}
              </Text>
            </Text>
          </View>
        </View>

        {subjectProgressEntries.length > 0 && (
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
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocos de hoje</Text>

          {!todaySchedule || todaySchedule.blocks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Nenhum bloco programado para hoje.
              </Text>
            </View>
          ) : (
            todaySchedule.blocks.map((block) => (
              <View
                key={block.id}
                style={[
                  styles.blockCard,
                  block.completed && styles.blockCompleted,
                ]}
              >
                <View style={styles.blockHeader}>
                  <Text style={styles.blockSubject}>{block.subject}</Text>
                  <Text style={styles.blockTime}>{block.time}</Text>
                </View>

                <Text style={styles.blockMeta}>
                  {block.duration}
                  {block.type ? ` • ${block.type}` : ''}
                </Text>

                {!!block.tip && (
                  <Text style={styles.blockTip}>💡 {block.tip}</Text>
                )}

                {block.completed ? (
                  <Text style={styles.completedText}>✅ Concluído</Text>
                ) : (
                  <Pressable
                    style={styles.completeButton}
                    onPress={() => completeBlockById(block.id)}
                  >
                    <Text style={styles.completeButtonText}>Concluir</Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>

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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
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