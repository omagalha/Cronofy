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
  getAverageCompletionRate,
  getBestStudyPeriod as getBestStudyPeriodFromLogs,
  getConsistencyScore as getConsistencyScoreFromLogs,
} from '../utils/behaviorTracker';
import {
  getFailureRisk,
  getSuggestedLoadFactor as getSuggestedLoadFactorFromLogs,
} from '../utils/predictionEngine';

const STORAGE_KEYS = {
  STUDY_LOGS: '@aprovai/study_logs_v2',
  AI_ENABLED: '@aprovai/ai_enabled_v1',
  STREAK: '@aprovai/streak_v1',
};

// Preserva dados de versões anteriores durante a migração de branding.
const LEGACY_STORAGE_KEYS = {
  STUDY_LOGS: '@cronofy/study_logs_v2',
  AI_ENABLED: '@cronofy/ai_enabled_v1',
  STREAK: '@cronofy/streak_v1',
};

export type StudyPeriod = 'morning' | 'afternoon' | 'night' | 'unknown';

export interface StudyLog {
  date: string;
  plannedBlocks: number;
  completedBlocks: number;
  subjects: string[];
  timeStudied: number;
  interruptionCount?: number;
  weeklyRecoveryBlockUsed?: number;
  period: StudyPeriod;
}

export interface AIAnalysis {
  consistencyScore: number;
  completionRate: number;
  weeklyRecoveryBlockUsed: number;
  currentRiskLevel: 'low' | 'medium' | 'high';
  suggestedLoadFactor: number;
  bestStudyPeriod: StudyPeriod | null;
  hardestSubject: string | null;
}

export interface StudyStreak {
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
}

interface AIContextType {
  isAIEnabled: boolean;
  toggleAI: () => void;
  studyLogs: StudyLog[];
  aiAnalysis: AIAnalysis | null;
  isHydrated: boolean;
  streak: StudyStreak;
  addStudyLog: (log: StudyLog) => void;
  upsertStudyLog: (log: StudyLog) => StudyLog[];
  runAIAnalysis: (logs?: StudyLog[]) => AIAnalysis | null;
  resetAI: () => void;
  clearLogs: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

const DEFAULT_STREAK: StudyStreak = {
  currentStreak: 0,
  bestStreak: 0,
  lastStudyDate: null,
};

async function getStoredValue(currentKey: string, legacyKey: string) {
  const currentValue = await AsyncStorage.getItem(currentKey);
  if (currentValue !== null) return currentValue;

  const legacyValue = await AsyncStorage.getItem(legacyKey);
  if (legacyValue === null) return null;

  await AsyncStorage.setItem(currentKey, legacyValue);
  await AsyncStorage.removeItem(legacyKey);
  return legacyValue;
}

function isStudyLog(value: unknown): value is StudyLog {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as StudyLog;

  return (
    typeof candidate.date === 'string' &&
    typeof candidate.plannedBlocks === 'number' &&
    typeof candidate.completedBlocks === 'number' &&
    Array.isArray(candidate.subjects) &&
    candidate.subjects.every((subject) => typeof subject === 'string') &&
    typeof candidate.timeStudied === 'number' &&
    (typeof candidate.interruptionCount === 'number' ||
      typeof candidate.interruptionCount === 'undefined') &&
    (typeof candidate.weeklyRecoveryBlockUsed === 'number' ||
      typeof candidate.weeklyRecoveryBlockUsed === 'undefined') &&
    typeof candidate.period === 'string'
  );
}

function normalizeStudyLogs(value: unknown): StudyLog[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isStudyLog);
}

function normalizeAndSortStudyLogs(logs: StudyLog[]): StudyLog[] {
  const deduped = new Map<string, StudyLog>();

  for (const log of logs) {
    if (!log?.date) continue;

    const normalized: StudyLog = {
      ...log,
      plannedBlocks: Math.max(0, log.plannedBlocks || 0),
      completedBlocks: Math.max(0, log.completedBlocks || 0),
      timeStudied: Math.max(0, log.timeStudied || 0),
      subjects: Array.isArray(log.subjects) ? log.subjects.filter(Boolean) : [],
      interruptionCount:
        typeof log.interruptionCount === 'number'
          ? Math.max(0, log.interruptionCount)
          : undefined,
      weeklyRecoveryBlockUsed:
        typeof log.weeklyRecoveryBlockUsed === 'number'
          ? Math.max(0, log.weeklyRecoveryBlockUsed)
          : undefined,
      period: log.period ?? 'unknown',
    };

    if (deduped.has(normalized.date)) deduped.delete(normalized.date);
    deduped.set(normalized.date, normalized);
  }

  return Array.from(deduped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function isStudyStreak(value: unknown): value is StudyStreak {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as StudyStreak;

  return (
    typeof candidate.currentStreak === 'number' &&
    typeof candidate.bestStreak === 'number' &&
    (typeof candidate.lastStudyDate === 'string' || candidate.lastStudyDate === null)
  );
}

function normalizeStreak(value: unknown): StudyStreak {
  if (!isStudyStreak(value)) {
    return DEFAULT_STREAK;
  }

  return {
    currentStreak: Math.max(0, value.currentStreak),
    bestStreak: Math.max(0, value.bestStreak),
    lastStudyDate: value.lastStudyDate,
  };
}

function getWeeklyRecoveryBlockUsed(logs: StudyLog[]): number {
  const recentLogs = logs.slice(-7);
  return recentLogs.reduce(
    (acc, log) => acc + (log.weeklyRecoveryBlockUsed ?? 0),
    0
  );
}

function getHardestSubject(logs: StudyLog[]): string | null {
  if (logs.length === 0) return null;

  const subjectLoad: Record<string, { appearances: number; completed: number }> = {};

  for (const log of logs) {
    for (const subject of log.subjects) {
      if (!subjectLoad[subject]) {
        subjectLoad[subject] = { appearances: 0, completed: 0 };
      }

      subjectLoad[subject].appearances += 1;

      if (log.completedBlocks >= log.plannedBlocks) {
        subjectLoad[subject].completed += 1;
      }
    }
  }

  const ranked = Object.entries(subjectLoad)
    .map(([subject, stats]) => {
      const completionRatio =
        stats.appearances === 0 ? 0 : stats.completed / stats.appearances;

      return {
        subject,
        score: completionRatio,
      };
    })
    .sort((a, b) => a.score - b.score);

  return ranked[0]?.subject ?? null;
}

function buildAIAnalysis(logs: StudyLog[]): AIAnalysis | null {
  const normalizedLogs = normalizeAndSortStudyLogs(logs);
  if (normalizedLogs.length === 0) return null;

  const completionRate = getAverageCompletionRate(normalizedLogs);
  const consistencyScore = getConsistencyScoreFromLogs(normalizedLogs);
  const currentRiskLevel = getFailureRisk(normalizedLogs);
  const suggestedLoadFactor = getSuggestedLoadFactorFromLogs(normalizedLogs);
  const weeklyRecoveryBlockUsed = getWeeklyRecoveryBlockUsed(normalizedLogs);

  const bestPeriod = getBestStudyPeriodFromLogs(normalizedLogs);

  return {
    consistencyScore,
    completionRate,
    weeklyRecoveryBlockUsed,
    currentRiskLevel,
    suggestedLoadFactor,
    bestStudyPeriod: bestPeriod === 'unknown' ? null : bestPeriod,
    hardestSubject: getHardestSubject(normalizedLogs),
  };
}

function computeNextLogs(prev: StudyLog[], incoming: StudyLog): StudyLog[] {
  const next = normalizeAndSortStudyLogs([...prev, incoming]);
  return next;
}

function computeNextLogsUpsert(prev: StudyLog[], incoming: StudyLog): StudyLog[] {
  const nextRaw = prev.map((entry) => (entry.date === incoming.date ? incoming : entry));
  const hadExisting = prev.some((entry) => entry.date === incoming.date);
  const next = normalizeAndSortStudyLogs(hadExisting ? nextRaw : [...prev, incoming]);
  return next;
}

function toDayStart(dateString: string): Date {
  const date = new Date(`${dateString}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDayDiff(fromDate: string, toDate: string): number {
  const from = toDayStart(fromDate).getTime();
  const to = toDayStart(toDate).getTime();
  const diffMs = to - from;
  return Math.round(diffMs / 86400000);
}

function buildStreakFromLogs(logs: StudyLog[]): StudyStreak {
  const productiveDates = Array.from(
    new Set(
      logs
        .filter((log) => log.completedBlocks > 0)
        .map((log) => log.date)
        .filter(Boolean)
    )
  ).sort();

  if (productiveDates.length === 0) {
    return DEFAULT_STREAK;
  }

  let bestStreak = 1;
  let runningStreak = 1;

  for (let index = 1; index < productiveDates.length; index += 1) {
    const previousDate = productiveDates[index - 1];
    const currentDate = productiveDates[index];
    const diff = getDayDiff(previousDate, currentDate);

    if (diff === 1) {
      runningStreak += 1;
    } else if (diff > 1) {
      runningStreak = 1;
    }

    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }
  }

  const lastStudyDate = productiveDates[productiveDates.length - 1];
  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);
  const diffFromLastStudy = getDayDiff(lastStudyDate, todayDate);

  let currentStreak = 0;

  if (diffFromLastStudy === 0 || diffFromLastStudy === 1) {
    currentStreak = 1;

    for (let index = productiveDates.length - 1; index > 0; index -= 1) {
      const currentDate = productiveDates[index];
      const previousDate = productiveDates[index - 1];
      const diff = getDayDiff(previousDate, currentDate);

      if (diff === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    bestStreak,
    lastStudyDate,
  };
}

export function AIProvider({ children }: { children: ReactNode }) {
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [streak, setStreak] = useState<StudyStreak>(DEFAULT_STREAK);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function hydrateAI() {
      try {
        const [storedLogs, storedEnabled, storedStreak] = await Promise.all([
          getStoredValue(
            STORAGE_KEYS.STUDY_LOGS,
            LEGACY_STORAGE_KEYS.STUDY_LOGS
          ),
          getStoredValue(
            STORAGE_KEYS.AI_ENABLED,
            LEGACY_STORAGE_KEYS.AI_ENABLED
          ),
          getStoredValue(STORAGE_KEYS.STREAK, LEGACY_STORAGE_KEYS.STREAK),
        ]);

        if (storedLogs) {
          const parsedLogs = JSON.parse(storedLogs) as unknown;
          const normalizedLogs = normalizeAndSortStudyLogs(
            normalizeStudyLogs(parsedLogs)
          );
          setStudyLogs(normalizedLogs);
          setAIAnalysis(buildAIAnalysis(normalizedLogs));
          setStreak(buildStreakFromLogs(normalizedLogs));
        } else if (storedStreak) {
          const parsedStreak = JSON.parse(storedStreak) as unknown;
          setStreak(normalizeStreak(parsedStreak));
        }

        if (storedEnabled !== null) {
          setIsAIEnabled(storedEnabled === 'true');
        }
      } catch (error) {
        console.warn('Erro ao hidratar AIContext', error);
        setStudyLogs([]);
        setAIAnalysis(null);
        setStreak(DEFAULT_STREAK);
      } finally {
        setIsHydrated(true);
      }
    }

    hydrateAI();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    async function persistLogs() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.STUDY_LOGS,
          JSON.stringify(studyLogs)
        );
      } catch (error) {
        console.warn('Erro ao salvar studyLogs', error);
      }
    }

    persistLogs();
  }, [studyLogs, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    async function persistAIEnabled() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.AI_ENABLED,
          String(isAIEnabled)
        );
      } catch (error) {
        console.warn('Erro ao salvar isAIEnabled', error);
      }
    }

    persistAIEnabled();
  }, [isAIEnabled, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    async function persistStreak() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.STREAK,
          JSON.stringify(streak)
        );
      } catch (error) {
        console.warn('Erro ao salvar streak', error);
      }
    }

    persistStreak();
  }, [streak, isHydrated]);

  const toggleAI = useCallback(() => {
    setIsAIEnabled((prev) => !prev);
  }, []);

  const addStudyLog = useCallback((log: StudyLog) => {
    setStudyLogs((prev) => {
      const next = computeNextLogs(prev, log);
      setAIAnalysis(buildAIAnalysis(next));
      setStreak(buildStreakFromLogs(next));
      return next;
    });
  }, []);

  const upsertStudyLog = useCallback((log: StudyLog): StudyLog[] => {
    let nextLogs: StudyLog[] = [];

    setStudyLogs((prev) => {
      nextLogs = computeNextLogsUpsert(prev, log);

      setAIAnalysis(buildAIAnalysis(nextLogs));
      setStreak(buildStreakFromLogs(nextLogs));

      return nextLogs;
    });

    return nextLogs;
  }, []);

  const runAIAnalysis = useCallback((logs?: StudyLog[]) => {
    const source = logs ?? studyLogs;
    const result = buildAIAnalysis(source);
    setAIAnalysis(result);
    setStreak(buildStreakFromLogs(source));
    return result;
  }, [studyLogs]);

  const resetAI = useCallback(() => {
    void AsyncStorage.multiRemove([
      STORAGE_KEYS.STUDY_LOGS,
      STORAGE_KEYS.STREAK,
      STORAGE_KEYS.AI_ENABLED,
      LEGACY_STORAGE_KEYS.STUDY_LOGS,
      LEGACY_STORAGE_KEYS.STREAK,
      LEGACY_STORAGE_KEYS.AI_ENABLED,
    ]);
    setStudyLogs([]);
    setAIAnalysis(null);
    setStreak(DEFAULT_STREAK);
    setIsAIEnabled(true);
  }, []);

  const clearLogs = useCallback(() => {
    resetAI();
  }, [resetAI]);

  const value = useMemo(
    () => ({
      isAIEnabled,
      toggleAI,
      studyLogs,
      aiAnalysis,
      isHydrated,
      streak,
      addStudyLog,
      upsertStudyLog,
      runAIAnalysis,
      resetAI,
      clearLogs,
    }),
    [
      isAIEnabled,
      studyLogs,
      aiAnalysis,
      isHydrated,
      streak,
      toggleAI,
      addStudyLog,
      upsertStudyLog,
      runAIAnalysis,
      resetAI,
      clearLogs,
    ]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAIContext() {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error('useAIContext must be used within AIProvider');
  }

  return context;
}
