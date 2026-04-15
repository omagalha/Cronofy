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
import { UserStudyLog } from '../utils/behaviorTracker';
import {
  buildPersistedSchedule,
  completeBlock,
  createProgressSnapshotFromScheduleDays,
  isScheduleOutdated,
  PersistedSchedule,
  ScheduleDay,
  validateSetupBeforeSchedule,
} from '../utils/scheduleEngine';
import { useAIContext } from './AIContext';
import { useSetupContext } from './SetupContext';

type GenerateScheduleResult = {
  success: boolean;
  errors?: string[];
};

type ScheduleContextData = {
  schedule: ScheduleDay[];
  persistedSchedule: PersistedSchedule | null;
  isScheduleLoaded: boolean;
  isScheduleStale: boolean;
  generateScheduleFromSubjects: () => GenerateScheduleResult;
  refreshSchedule: () => GenerateScheduleResult;
  completeBlockById: (blockId: string) => void;
  clearSchedule: () => Promise<void>;
};

const STORAGE_KEYS = {
  SCHEDULE: '@cronofy/schedule',
};

function isPersistedScheduleShape(value: unknown): value is PersistedSchedule {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as PersistedSchedule;

  return (
    Array.isArray(candidate.days) &&
    !!candidate.meta &&
    typeof candidate.meta.generatedAt === 'string' &&
    typeof candidate.meta.engineVersion === 'string' &&
    typeof candidate.meta.setupHash === 'string'
  );
}

function isNumericRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object') return false;

  return Object.values(value).every((entry) => typeof entry === 'number');
}

function normalizeProgressSnapshot(
  progress: unknown,
  days: ScheduleDay[]
): PersistedSchedule['progress'] {
  const fallback = createProgressSnapshotFromScheduleDays(days);

  if (!progress || typeof progress !== 'object') {
    return fallback;
  }

  const candidate = progress as Partial<PersistedSchedule['progress']>;
  const completedSessionKeys = Array.isArray(candidate.completedSessionKeys)
    ? Array.from(
        new Set(
          candidate.completedSessionKeys.filter(
            (entry): entry is string => typeof entry === 'string'
          )
        )
      )
    : fallback.completedSessionKeys;

  const completedSessionsBySubject = isNumericRecord(
    candidate.completedSessionsBySubject
  )
    ? candidate.completedSessionsBySubject
    : fallback.completedSessionsBySubject;

  const targetSessionsBySubject = isNumericRecord(candidate.targetSessionsBySubject)
    ? candidate.targetSessionsBySubject
    : fallback.targetSessionsBySubject;

  return {
    completedSessionKeys,
    completedSessionsBySubject,
    targetSessionsBySubject,
  };
}

function hydratePersistedSchedule(
  schedule: Omit<PersistedSchedule, 'progress'> & {
    progress?: PersistedSchedule['progress'] | null;
  }
): PersistedSchedule {
  return {
    ...schedule,
    progress: normalizeProgressSnapshot(schedule.progress, schedule.days),
  };
}

function getStudyPeriodFromTime(
  time: string
): 'morning' | 'afternoon' | 'night' | 'unknown' {
  const hour = Number(time.split(':')[0]);

  if (Number.isNaN(hour)) return 'unknown';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
}

function parseDurationToMinutes(duration: string): number {
  const value = duration.trim().toLowerCase();

  if (value.includes('h')) {
    const hoursMatch = value.match(/(\d+)\s*h/);
    const minutesMatch = value.match(/(\d+)\s*min/);

    const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;

    if (!Number.isNaN(hours) || !Number.isNaN(minutes)) {
      return hours * 60 + minutes;
    }
  }

  const numberOnly = parseInt(value.replace(/\D/g, ''), 10);
  return Number.isNaN(numberOnly) ? 0 : numberOnly;
}

const ScheduleContext = createContext<ScheduleContextData | undefined>(undefined);

type ScheduleProviderProps = {
  children: ReactNode;
};

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const { setupData, isSetupLoaded } = useSetupContext();
  const ai = useAIContext();

  const [persistedSchedule, setPersistedSchedule] =
    useState<PersistedSchedule | null>(null);
  const [isScheduleLoaded, setIsScheduleLoaded] = useState(false);

  const schedule = useMemo(() => persistedSchedule?.days ?? [], [persistedSchedule]);

  const isScheduleStale = useMemo(() => {
    if (!persistedSchedule) return false;
    if (!isSetupLoaded) return false;

    return isScheduleOutdated(persistedSchedule, setupData);
  }, [persistedSchedule, setupData, isSetupLoaded]);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const scheduleStored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULE);

        if (!scheduleStored) {
          setIsScheduleLoaded(true);
          return;
        }

        const parsedSchedule = JSON.parse(scheduleStored) as unknown;

        if (isPersistedScheduleShape(parsedSchedule)) {
          setPersistedSchedule(hydratePersistedSchedule(parsedSchedule));
        } else if (Array.isArray(parsedSchedule)) {
          setPersistedSchedule(
            hydratePersistedSchedule({
              days: parsedSchedule as ScheduleDay[],
              meta: {
                generatedAt: new Date().toISOString(),
                engineVersion: 'legacy',
                setupHash: '',
              },
            })
          );
        }
      } catch (error) {
        console.log('Erro ao carregar cronograma', error);
      } finally {
        setIsScheduleLoaded(true);
      }
    }

    loadSchedule();
  }, []);

  useEffect(() => {
    if (!isScheduleLoaded) return;

    async function persistSchedule() {
      try {
        if (!persistedSchedule) {
          await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULE);
          return;
        }

        await AsyncStorage.setItem(
          STORAGE_KEYS.SCHEDULE,
          JSON.stringify(persistedSchedule)
        );
      } catch (error) {
        console.log('Erro ao salvar cronograma', error);
      }
    }

    persistSchedule();
  }, [persistedSchedule, isScheduleLoaded]);

  const generateScheduleFromSubjects = useCallback((): GenerateScheduleResult => {
    const validation = validateSetupBeforeSchedule(setupData);

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    const newPersistedSchedule = buildPersistedSchedule(
      setupData,
      persistedSchedule
    );
    setPersistedSchedule(newPersistedSchedule);

    return {
      success: true,
    };
  }, [setupData, persistedSchedule]);

  const refreshSchedule = useCallback((): GenerateScheduleResult => {
    return generateScheduleFromSubjects();
  }, [generateScheduleFromSubjects]);

  const completeBlockById = useCallback(
    (blockId: string) => {
      if (!persistedSchedule) return;

      const updatedSchedule = completeBlock(persistedSchedule, blockId);
      setPersistedSchedule(updatedSchedule);

      if (!ai.isAIEnabled) return;

      const dayWithBlock = updatedSchedule.days.find((day) =>
        day.blocks.some((block) => block.id === blockId)
      );

      if (!dayWithBlock) return;

      const completedBlock = dayWithBlock.blocks.find(
        (block) => block.id === blockId
      );

      if (!completedBlock) return;

      const plannedBlocks = dayWithBlock.blocks.length;
      const completedBlocks = dayWithBlock.blocks.filter(
        (block) => block.completed
      ).length;

      const subjects = dayWithBlock.blocks.map((block) => block.subject);

      const timeStudied = dayWithBlock.blocks
        .filter((block) => block.completed)
        .reduce((acc, block) => acc + parseDurationToMinutes(block.duration), 0);

      const log: UserStudyLog = {
        date: new Date().toISOString().slice(0, 10),
        plannedBlocks,
        completedBlocks,
        subjects,
        timeStudied,
        period: getStudyPeriodFromTime(completedBlock.time),
      };

      const nextLogs = ai.upsertStudyLog(log);
      ai.runAIAnalysis(nextLogs);
    },
    [persistedSchedule, ai]
  );

  const clearSchedule = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULE);
      setPersistedSchedule(null);
    } catch (error) {
      console.log('Erro ao limpar cronograma', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      schedule,
      persistedSchedule,
      isScheduleLoaded,
      isScheduleStale,
      generateScheduleFromSubjects,
      refreshSchedule,
      completeBlockById,
      clearSchedule,
    }),
    [
      schedule,
      persistedSchedule,
      isScheduleLoaded,
      isScheduleStale,
      generateScheduleFromSubjects,
      refreshSchedule,
      completeBlockById,
      clearSchedule,
    ]
  );

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useScheduleContext() {
  const context = useContext(ScheduleContext);

  if (!context) {
    throw new Error('useScheduleContext must be used within ScheduleProvider');
  }

  return context;
}