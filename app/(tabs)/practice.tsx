import { router, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PracticeHeroCard from '../../components/practice/PracticeHeroCard';
import PracticeResultCard from '../../components/practice/PracticeResultCard';
import PracticeSessionCard from '../../components/practice/PracticeSessionCard';
import SubjectPerformanceCard from '../../components/practice/SubjectPerformanceCard';
import {
  PracticeBuildMode,
  SubjectPerformance,
} from '../../apps/shared/types/practice';
import { useAppContext } from '../../context/AppContext';

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

export default function PracticeScreen() {
  const {
    practiceSummary,
    practiceSessions,
    currentPracticeSession,
    subjectPerformance,
    practiceRecommendations,
    startPracticeSession,
  } = useAppContext();

  const sortedPerformance = useMemo(
    () => sortSubjectPerformance(subjectPerformance),
    [subjectPerformance]
  );

  const lastResult =
    practiceSessions.find((session) => session.status === 'completed') ?? null;
  const dailyRecommendation =
    practiceRecommendations.find((item) => item.mode === 'daily') ?? null;

  function handleStartPractice(mode: PracticeBuildMode) {
    const session = startPracticeSession({ mode });
    if (!session) return;

    router.push('/practice/session' as Href);
  }

  function handleOpenLastResult() {
    if (!lastResult) return;

    router.push({
      pathname: '/practice/result',
      params: { sessionId: lastResult.id },
    } as unknown as Href);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PracticeHeroCard
          summary={practiceSummary}
          subtitle={
            dailyRecommendation?.description ??
            'Pratica curta orientada pelo plano do dia, pelos erros recentes e pela materia mais sensivel.'
          }
        />

        {practiceRecommendations.map((recommendation) => (
          <PracticeSessionCard
            key={recommendation.mode}
            recommendation={recommendation}
            currentSession={currentPracticeSession}
            onStart={handleStartPractice}
          />
        ))}

        <PracticeResultCard result={lastResult} onPress={handleOpenLastResult} />

        <SubjectPerformanceCard
          items={sortedPerformance.slice(0, 4)}
          title="Materias que pedem reforco"
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Como isso entra no AprovAI</Text>
          <Text style={styles.infoText}>
            A pratica agora nasce de um motivo claro: plano do dia, materia fraca
            ou revisao rapida. Isso mantem o produto simples e cria sinal util para adaptacao.
          </Text>
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
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
});
