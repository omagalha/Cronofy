import { router, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildPracticeQuestionIds } from '../../utils/practiceEngine';
import { useAppContext } from '../../context/AppContext';

export default function PracticeSessionScreen() {
  const {
    currentPracticeSession,
    answerPracticeQuestion,
    finishPracticeSession,
    abandonCurrentPracticeSession,
  } = useAppContext();

  const session = currentPracticeSession;
  const questionIds = useMemo(
    () => (session ? buildPracticeQuestionIds(session) : []),
    [session]
  );
  const answersById = useMemo(() => {
    return new Map(
      (session?.questionResults ?? []).map((result) => [result.questionId, result])
    );
  }, [session]);

  const answeredCount = useMemo(() => {
    return session?.questionResults.length ?? 0;
  }, [session]);

  const canFinish = session ? questionIds.every((questionId) => answersById.has(questionId)) : false;

  function handleFinishSession() {
    const result = finishPracticeSession();
    if (!result) return;

    router.replace({
      pathname: '/practice/result',
      params: { sessionId: result.id },
    } as unknown as Href);
  }

  function handleLeaveSession() {
    Alert.alert(
      'Sair da sessao',
      'Se voce sair agora, esta sessao curta sera descartada.',
      [
        {
          text: 'Continuar',
          style: 'cancel',
        },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            abandonCurrentPracticeSession();
            router.replace('/practice' as Href);
          },
        },
      ]
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhuma sessao em andamento</Text>
          <Text style={styles.emptyText}>
            Comece uma pratica curta na aba Pratica para registrar seu desempenho.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/practice' as Href)}
          >
            <Text style={styles.primaryButtonText}>Voltar para pratica</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Sessao curta</Text>
          <Text style={styles.title}>{session.totalQuestions} questoes</Text>
          <Text style={styles.subtitle}>{session.subject}</Text>

          <View style={styles.progressBox}>
            <Text style={styles.progressValue}>
              {answeredCount}/{session.totalQuestions}
            </Text>
            <Text style={styles.progressLabel}>respondidas</Text>
          </View>
        </View>

        <View style={styles.subjectRow}>
          <View style={styles.subjectChip}>
            <Text style={styles.subjectChipText}>{session.subject}</Text>
          </View>
          <View style={styles.subjectChip}>
            <Text style={styles.subjectChipText}>
              {session.relatedBlockIds.length} blocos relacionados
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {questionIds.map((questionId, index) => {
            const answer = answersById.get(questionId);

            return (
              <View key={questionId} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionIndex}>Questao {index + 1}</Text>
                  <Text style={styles.questionSubject}>{session.subject}</Text>
                </View>

                <Text style={styles.questionHelp}>
                  Resolva a questao no seu material e marque o resultado aqui.
                </Text>

                <View style={styles.actionRow}>
                  <Pressable
                    style={[
                      styles.answerButton,
                      answer?.correct === false && styles.answerButtonIncorrect,
                    ]}
                    onPress={() => answerPracticeQuestion(questionId, false)}
                  >
                    <Text style={styles.answerButtonText}>Errei</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.answerButton,
                      answer?.correct === true && styles.answerButtonCorrect,
                    ]}
                    onPress={() => answerPracticeQuestion(questionId, true)}
                  >
                    <Text style={styles.answerButtonText}>Acertei</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.secondaryButton} onPress={handleLeaveSession}>
          <Text style={styles.secondaryButtonText}>Descartar</Text>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, !canFinish && styles.primaryButtonDisabled]}
          onPress={handleFinishSession}
          disabled={!canFinish}
        >
          <Text style={styles.primaryButtonText}>Finalizar pratica</Text>
        </Pressable>
      </View>
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
    paddingBottom: 120,
    gap: 16,
  },
  hero: {
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  eyebrow: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#E0E7FF',
    fontSize: 14,
    lineHeight: 20,
  },
  progressBox: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15,23,42,0.26)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  progressValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  progressLabel: {
    color: '#C7D2FE',
    fontSize: 12,
    marginTop: 2,
  },
  subjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectChip: {
    backgroundColor: '#1E293B',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectChipText: {
    color: '#CBD5F5',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  questionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  questionIndex: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  questionSubject: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '700',
  },
  questionHelp: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  answerButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  answerButtonIncorrect: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderColor: 'rgba(239,68,68,0.32)',
  },
  answerButtonCorrect: {
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderColor: 'rgba(34,197,94,0.32)',
  },
  answerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1.4,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#334155',
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
  emptyState: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
});
