import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  PracticeBuildMode,
  PracticeRecommendation,
  PracticeSession,
  PracticeSummary,
  SubjectPerformance,
} from '../apps/shared/types/practice';
import { useAIContext } from './AIContext';
import { useScheduleContext } from './ScheduleContext';
import {
  abandonPracticeSession,
  buildPracticeRecommendations,
  buildPracticeSession,
  buildPracticeSummary,
  buildSubjectPerformance,
  createPracticeSessionFromSuggestion,
  getTodayScheduleDays,
  isPracticeSession,
  migrateLegacyPracticeSession,
  registerQuestionResult,
} from '../utils/practiceEngine';
import type { SubjectPracticeSignal } from '../utils/adaptivePlanningEngine';

type StartPracticeSessionOptions = {
  mode?: PracticeBuildMode;
  questionCount?: 5 | 10;
};

type PracticeContextData = {
  practiceSessions: PracticeSession[];
  currentPracticeSession: PracticeSession | null;
  subjectPerformance: SubjectPerformance[];
  practiceSummary: PracticeSummary;
  practiceRecommendations: PracticeRecommendation[];
  isPracticeLoaded: boolean;
  startPracticeSession: (options?: StartPracticeSessionOptions) => PracticeSession | null;
  answerPracticeQuestion: (
    questionId: string,
    correct: boolean,
    difficulty?: number | null
  ) => void;
  finishPracticeSession: () => PracticeSession | null;
  abandonCurrentPracticeSession: () => PracticeSession | null;
  resetPractice: () => void;
};

const STORAGE_KEYS = {
  SESSIONS: '@aprovai/practice_sessions_v2',
  LEGACY_SESSIONS: '@aprovai/practice_sessions_v1',
  CURRENT_SESSION: '@aprovai/practice_current_session_v2',
  LEGACY_CURRENT_SESSION: '@aprovai/practice_current_session_v1',
};

const EMPTY_PRACTICE_SUMMARY: PracticeSummary = {
  totalSessions: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  accuracy: 0,
  weakestSubject: null,
  strongestSubject: null,
  lastPracticedAt: null,
};

const EMPTY_RECOMMENDATIONS: PracticeRecommendation[] = [
  {
    mode: 'daily',
    title: 'Pratica do dia',
    description: 'A pratica do dia usa materias pendentes ou estudadas hoje.',
    suggestedSubject: null,
    suggestedBlockIds: [],
    totalQuestions: 5,
    source: null,
    status: 'empty',
  },
  {
    mode: 'weak_subject',
    title: 'Reforcar materia fraca',
    description: 'A sugestao aparece quando existir historico suficiente por materia.',
    suggestedSubject: null,
    suggestedBlockIds: [],
    totalQuestions: 10,
    source: null,
    status: 'empty',
  },
  {
    mode: 'review',
    title: 'Revisao rapida',
    description: 'A revisao rapida aparece quando existir fila pendente ou baixa confianca.',
    suggestedSubject: null,
    suggestedBlockIds: [],
    totalQuestions: 5,
    source: null,
    status: 'empty',
  },
];

const PracticeContext = createContext<PracticeContextData | undefined>(undefined);

function normalizePracticeSessions(value: unknown): PracticeSession[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (isPracticeSession(entry)) return entry;
      return migrateLegacyPracticeSession(entry, 'completed');
    })
    .filter((entry): entry is PracticeSession => Boolean(entry))
    .sort((a, b) => {
      const aDate = a.finishedAt ?? a.startedAt;
      const bDate = b.finishedAt ?? b.startedAt;
      return bDate.localeCompare(aDate);
    });
}

function normalizeCurrentSession(value: unknown): PracticeSession | null {
  if (isPracticeSession(value)) return value;
  return migrateLegacyPracticeSession(value, 'in_progress');
}

export function PracticeProvider({ children }: { children: ReactNode }) {
  const { schedule, reviewQueue, setPracticeSignals } = useScheduleContext();
  const { aiAnalysis } = useAIContext();

  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [currentPracticeSession, setCurrentPracticeSession] =
    useState<PracticeSession | null>(null);
  const [isPracticeLoaded, setIsPracticeLoaded] = useState(false);

  useEffect(() => {
    async function hydratePractice() {
      try {
        const [storedSessions, legacySessions, storedCurrentSession, legacyCurrentSession] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
            AsyncStorage.getItem(STORAGE_KEYS.LEGACY_SESSIONS),
            AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION),
            AsyncStorage.getItem(STORAGE_KEYS.LEGACY_CURRENT_SESSION),
          ]);

        const rawSessions = storedSessions ?? legacySessions;
        const rawCurrentSession = storedCurrentSession ?? legacyCurrentSession;

        if (rawSessions) {
          const normalized = normalizePracticeSessions(JSON.parse(rawSessions) as unknown);
          setPracticeSessions(normalized);
          await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(normalized));
        }

        if (rawCurrentSession) {
          const normalizedCurrent = normalizeCurrentSession(
            JSON.parse(rawCurrentSession) as unknown
          );
          setCurrentPracticeSession(normalizedCurrent);

          if (normalizedCurrent) {
            await AsyncStorage.setItem(
              STORAGE_KEYS.CURRENT_SESSION,
              JSON.stringify(normalizedCurrent)
            );
          }
        }

        await AsyncStorage.multiRemove([
          STORAGE_KEYS.LEGACY_SESSIONS,
          STORAGE_KEYS.LEGACY_CURRENT_SESSION,
        ]);
      } catch (error) {
        console.warn('Erro ao hidratar PracticeContext', error);
        setPracticeSessions([]);
        setCurrentPracticeSession(null);
      } finally {
        setIsPracticeLoaded(true);
      }
    }

    hydratePractice();
  }, []);

  useEffect(() => {
    if (!isPracticeLoaded) return;

    async function persistPracticeSessions() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SESSIONS,
          JSON.stringify(practiceSessions)
        );
      } catch (error) {
        console.warn('Erro ao salvar sessoes de pratica', error);
      }
    }

    persistPracticeSessions();
  }, [practiceSessions, isPracticeLoaded]);

  useEffect(() => {
    if (!isPracticeLoaded) return;

    async function persistCurrentSession() {
      try {
        if (!currentPracticeSession) {
          await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
          return;
        }

        await AsyncStorage.setItem(
          STORAGE_KEYS.CURRENT_SESSION,
          JSON.stringify(currentPracticeSession)
        );
      } catch (error) {
        console.warn('Erro ao salvar sessao ativa de pratica', error);
      }
    }

    persistCurrentSession();
  }, [currentPracticeSession, isPracticeLoaded]);

  const subjectPerformance = useMemo(
    () => buildSubjectPerformance(practiceSessions),
    [practiceSessions]
  );

  const practiceSummary = useMemo(
    () => buildPracticeSummary(practiceSessions, subjectPerformance),
    [practiceSessions, subjectPerformance]
  );

  const adaptivePracticeSignals = useMemo<SubjectPracticeSignal[]>(() => {
    return subjectPerformance.map((item) => ({
      subject: item.subject,
      accuracy: item.accuracy,
      recentAccuracy: item.recentAccuracy,
      totalQuestions: item.totalQuestions,
      trend: item.trend,
      lastPracticedAt: item.lastPracticedAt,
    }));
  }, [subjectPerformance]);

  useEffect(() => {
    setPracticeSignals(adaptivePracticeSignals);
  }, [adaptivePracticeSignals, setPracticeSignals]);

  const practiceRecommendations = useMemo(
    () =>
      buildPracticeRecommendations({
        schedule,
        subjectPerformance,
        aiAnalysis,
        reviewQueue,
        sessions: practiceSessions,
      }),
    [schedule, subjectPerformance, aiAnalysis, reviewQueue, practiceSessions]
  );

  const startPracticeSession = useCallback(
    (options?: StartPracticeSessionOptions) => {
      if (currentPracticeSession) {
        return currentPracticeSession;
      }

      const mode = options?.mode ?? 'daily';
      const questionCount =
        options?.questionCount ??
        (mode === 'weak_subject' ? 10 : 5);
      const suggestion = buildPracticeSession({
        todaySchedule: getTodayScheduleDays(schedule),
        subjectPerformance,
        aiAnalysis,
        reviewQueue,
        mode,
        questionCount,
      });

      if (!suggestion) {
        return null;
      }

      const nextSession = createPracticeSessionFromSuggestion(suggestion);
      setCurrentPracticeSession(nextSession);
      return nextSession;
    },
    [currentPracticeSession, schedule, subjectPerformance, aiAnalysis, reviewQueue]
  );

  const answerPracticeQuestion = useCallback(
    (questionId: string, correct: boolean, difficulty?: number | null) => {
      setCurrentPracticeSession((prev) => {
        if (!prev) return prev;
        return registerQuestionResult(prev, questionId, correct, difficulty);
      });
    },
    []
  );

  const finishPracticeSession = useCallback(() => {
    if (!currentPracticeSession) return null;

    const finishedAt = new Date().toISOString();
    const completedSession = {
      ...currentPracticeSession,
      status: 'completed' as const,
      finishedAt,
      durationSeconds: Math.max(
        0,
        Math.round(
          (new Date(finishedAt).getTime() - new Date(currentPracticeSession.startedAt).getTime()) /
            1000
        )
      ),
    };

    const normalizedSession =
      completedSession.questionResults.length < completedSession.totalQuestions
        ? null
        : {
            ...completedSession,
            correctAnswers: completedSession.questionResults.filter((item) => item.correct)
              .length,
            wrongAnswers: completedSession.questionResults.filter((item) => !item.correct)
              .length,
            accuracy: Math.round(
              (completedSession.questionResults.filter((item) => item.correct).length /
                completedSession.totalQuestions) *
                100
            ),
          };

    if (!normalizedSession) {
      return null;
    }

    setPracticeSessions((prev) => [normalizedSession, ...prev]);
    setCurrentPracticeSession(null);
    return normalizedSession;
  }, [currentPracticeSession]);

  const abandonCurrentPracticeSession = useCallback(() => {
    if (!currentPracticeSession) return null;

    const abandonedSession = abandonPracticeSession(currentPracticeSession);
    setPracticeSessions((prev) => [abandonedSession, ...prev]);
    setCurrentPracticeSession(null);
    return abandonedSession;
  }, [currentPracticeSession]);

  const resetPractice = useCallback(() => {
    void AsyncStorage.multiRemove([
      STORAGE_KEYS.SESSIONS,
      STORAGE_KEYS.CURRENT_SESSION,
      STORAGE_KEYS.LEGACY_SESSIONS,
      STORAGE_KEYS.LEGACY_CURRENT_SESSION,
    ]);
    setPracticeSessions([]);
    setCurrentPracticeSession(null);
  }, []);

  const value = useMemo(
    () => ({
      practiceSessions,
      currentPracticeSession,
      subjectPerformance,
      practiceSummary: isPracticeLoaded ? practiceSummary : EMPTY_PRACTICE_SUMMARY,
      practiceRecommendations: isPracticeLoaded
        ? practiceRecommendations
        : EMPTY_RECOMMENDATIONS,
      isPracticeLoaded,
      startPracticeSession,
      answerPracticeQuestion,
      finishPracticeSession,
      abandonCurrentPracticeSession,
      resetPractice,
    }),
    [
      practiceSessions,
      currentPracticeSession,
      subjectPerformance,
      practiceSummary,
      practiceRecommendations,
      isPracticeLoaded,
      startPracticeSession,
      answerPracticeQuestion,
      finishPracticeSession,
      abandonCurrentPracticeSession,
      resetPractice,
    ]
  );

  return (
    <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>
  );
}

export function usePracticeContext() {
  const context = useContext(PracticeContext);

  if (!context) {
    throw new Error('usePracticeContext must be used within PracticeProvider');
  }

  return context;
}
