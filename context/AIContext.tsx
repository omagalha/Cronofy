import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  analyzeStudyHistory,
  CronofyAIAnalysis,
} from '../utils/aiEngine';
import { UserStudyLog } from '../utils/behaviorTracker';

interface AIContextType {
  isAIEnabled: boolean;
  toggleAI: () => void;

  isLoadingAI: boolean;
  setIsLoadingAI: (loading: boolean) => void;

  errorAI: string | null;
  setErrorAI: (error: string | null) => void;

  studyLogs: UserStudyLog[];
  setStudyLogs: React.Dispatch<React.SetStateAction<UserStudyLog[]>>;
  addStudyLog: (log: UserStudyLog) => void;
  upsertStudyLog: (log: UserStudyLog) => UserStudyLog[];
  clearStudyLogs: () => void;

  aiAnalysis: CronofyAIAnalysis | null;
  setAIAnalysis: React.Dispatch<React.SetStateAction<CronofyAIAnalysis | null>>;
  runAIAnalysis: (logsOverride?: UserStudyLog[]) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [errorAI, setErrorAI] = useState<string | null>(null);

  const [studyLogs, setStudyLogs] = useState<UserStudyLog[]>([]);
  const [aiAnalysis, setAIAnalysis] = useState<CronofyAIAnalysis | null>(null);

  function toggleAI() {
    setIsAIEnabled((prev) => !prev);
  }

  function addStudyLog(log: UserStudyLog) {
    setStudyLogs((prev) => [...prev, log]);
  }

  function upsertStudyLog(log: UserStudyLog): UserStudyLog[] {
    let nextLogs: UserStudyLog[] = [];

    setStudyLogs((prev) => {
      const existingIndex = prev.findIndex((item) => item.date === log.date);

      if (existingIndex === -1) {
        nextLogs = [...prev, log];
        return nextLogs;
      }

      nextLogs = [...prev];
      nextLogs[existingIndex] = log;
      return nextLogs;
    });

    return nextLogs;
  }

  function clearStudyLogs() {
    setStudyLogs([]);
    setAIAnalysis(null);
    setErrorAI(null);
  }

  function runAIAnalysis(logsOverride?: UserStudyLog[]) {
    if (!isAIEnabled) return;

    try {
      setIsLoadingAI(true);
      setErrorAI(null);

      const logsToAnalyze = logsOverride ?? studyLogs;
      const result = analyzeStudyHistory(logsToAnalyze);
      setAIAnalysis(result);
    } catch {
      setErrorAI('Erro ao analisar o histórico de estudos.');
    } finally {
      setIsLoadingAI(false);
    }
  }

  const value = useMemo(
    () => ({
      isAIEnabled,
      toggleAI,
      isLoadingAI,
      setIsLoadingAI,
      errorAI,
      setErrorAI,
      studyLogs,
      setStudyLogs,
      addStudyLog,
      upsertStudyLog,
      clearStudyLogs,
      aiAnalysis,
      setAIAnalysis,
      runAIAnalysis,
    }),
    [isAIEnabled, isLoadingAI, errorAI, studyLogs, aiAnalysis]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export function useAIContext() {
  const context = useContext(AIContext);

  if (context === undefined) {
    throw new Error('useAIContext must be used within an AIProvider');
  }

  return context;
}