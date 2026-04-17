import { router, useLocalSearchParams, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PracticeResultCard from '../../components/practice/PracticeResultCard';
import SubjectPerformanceCard from '../../components/practice/SubjectPerformanceCard';
import { SubjectPerformance } from '../../apps/shared/types/practice';
import { useAppContext } from '../../context/AppContext';
import { buildSubjectPerformance } from '../../utils/practiceEngine';

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

export default function PracticeResultScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { practiceSessions, startPracticeSession } = useAppContext();

  const result =
    practiceSessions.find(
      (session) => session.id === sessionId && session.status === 'completed'
    ) ??
    practiceSessions.find((session) => session.status === 'completed') ??
    null;

  const performance = useMemo(
    () => sortSubjectPerformance(result ? buildSubjectPerformance([result]) : []),
    [result]
  );

  function handleStartAnotherSession() {
    const session = startPracticeSession({ mode: 'daily' });
    if (!session) {
      router.replace('/practice' as Href);
      return;
    }

    router.replace('/practice/session' as Href);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Resultado salvo</Text>
          <Text style={styles.title}>Sua pratica alimenta o proximo ajuste</Text>
          <Text style={styles.subtitle}>
            O AprovAI agora sabe em quais materias voce esta mais estavel e onde os
            erros ainda insistem.
          </Text>
        </View>

        <PracticeResultCard result={result} />

        <SubjectPerformanceCard
          items={performance}
          title="Desempenho desta sessao"
        />

        <View style={styles.footerActions}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.replace('/practice' as Href)}
          >
            <Text style={styles.secondaryButtonText}>Voltar para pratica</Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={handleStartAnotherSession}>
            <Text style={styles.primaryButtonText}>Nova sessao</Text>
          </Pressable>
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
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  eyebrow: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
});
