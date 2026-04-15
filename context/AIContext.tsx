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

const STORAGE_KEYS = {
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
  period: StudyPeriod;
}

export interface AIAnalysis {
  consistencyScore: number;
  completionRate: number;
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
    typeof candidate.period === 'string'
  );
}

function normalizeStudyLogs(value: unknown): StudyLog[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isStudyLog);
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

function getCompletionRate(logs: StudyLog[]): number {
  if (logs.length === 0) return 1;

  const totals = logs.reduce(
    (acc, log) => {
      acc.planned += log.plannedBlocks;
      acc.completed += log.completedBlocks;
      return acc;
    },
    { planned: 0, completed: 0 }
  );

  if (totals.planned === 0) return 1;
  return totals.completed / totals.planned;
}

function getConsistencyScore(logs: StudyLog[]): number {
  if (logs.length === 0) return 1;

  const recentLogs = logs.slice(-7);
  const productiveDays = recentLogs.filter((log) => log.completedBlocks > 0).length;

  return productiveDays / Math.min(recentLogs.length, 7);
}

function getBestStudyPeriod(logs: StudyLog[]): StudyPeriod | null {
  if (logs.length === 0) return null;

  const buckets: Record<StudyPeriod, number> = {
    morning: 0,
    afternoon: 0,
    night: 0,
    unknown: 0,
  };

  for (const log of logs) {
    buckets[log.period] += log.completedBlocks;
  }

  const ranked = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
  const winner = ranked[0];

  if (!winner || winner[1] === 0) return null;
  return winner[0] as StudyPeriod;
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

function getRiskLevel(
  consistencyScore: number,
  completionRate: number
): 'low' | 'medium' | 'high' {
  if (consistencyScore < 0.45 || completionRate < 0.55) {
    return 'high';
  }

  if (consistencyScore < 0.75 || completionRate < 0.75) {
    return 'medium';
  }

  return 'low';
}

function getSuggestedLoadFactor(
  riskLevel: 'low' | 'medium' | 'high'
): number {
  switch (riskLevel) {
    case 'high':
      return 0.8;
    case 'medium':
      return 0.9;
    case 'low':
    default:
      return 1;
  }
}

function buildAIAnalysis(logs: StudyLog[]): AIAnalysis | null {
  if (logs.length === 0) return null;

  const completionRate = getCompletionRate(logs);
  const consistencyScore = getConsistencyScore(logs);
  const currentRiskLevel = getRiskLevel(consistencyScore, completionRate);

  return {
    consistencyScore,
    completionRate,
    currentRiskLevel,
    suggestedLoadFactor: getSuggestedLoadFactor(currentRiskLevel),
    bestStudyPeriod: getBestStudyPeriod(logs),
    hardestSubject: getHardestSubject(logs),
  };
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
          AsyncStorage.getItem(STORAGE_KEYS.STUDY_LOGS),
          AsyncStorage.getItem(STORAGE_KEYS.AI_ENABLED),
          AsyncStorage.getItem(STORAGE_KEYS.STREAK),
        ]);

        if (storedLogs) {
          const parsedLogs = JSON.parse(storedLogs) as unknown;
          const normalizedLogs = normalizeStudyLogs(parsedLogs);
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
      const next = [...prev, log];
      setAIAnalysis(buildAIAnalysis(next));
      setStreak(buildStreakFromLogs(next));
      return next;
    });
  }, []);

  const upsertStudyLog = useCallback((log: StudyLog): StudyLog[] => {
    let nextLogs: StudyLog[] = [];

    setStudyLogs((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.date === log.date);

      if (existingIndex >= 0) {
        nextLogs = prev.map((entry, index) =>
          index === existingIndex ? log : entry
        );
      } else {
        nextLogs = [...prev, log];
      }

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
    ]);
    setStudyLogs([]);
    setAIAnalysis(null);
    setStreak(DEFAULT_STREAK);
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
