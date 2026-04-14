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
  buildPersistedSchedule,
  completeBlock,
  isScheduleOutdated,
  PersistedSchedule,
  ScheduleDay,
  validateSetupBeforeSchedule,
} from '../utils/scheduleEngine';
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
};

const STORAGE_KEYS = {
  SCHEDULE: '@cronofy/schedule',
};

function isPersistedScheduleShape(
  value: unknown
): value is PersistedSchedule {
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

const ScheduleContext = createContext<ScheduleContextData | undefined>(undefined);

type ScheduleProviderProps = {
  children: ReactNode;
};

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const { setupData, isSetupLoaded } = useSetupContext();
  const [persistedSchedule, setPersistedSchedule] =
    useState<PersistedSchedule | null>(null);
  const [isScheduleLoaded, setIsScheduleLoaded] = useState(false);

  const schedule = useMemo(() => persistedSchedule?.days ?? [], [persistedSchedule]);

  const isScheduleStale = useMemo(() => {
    if (!persistedSchedule) return false;
    return isScheduleOutdated(persistedSchedule, setupData);
  }, [persistedSchedule, setupData]);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const scheduleStored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULE);

        if (scheduleStored) {
          const parsedSchedule = JSON.parse(scheduleStored) as unknown;

          if (isPersistedScheduleShape(parsedSchedule)) {
            setPersistedSchedule(parsedSchedule);
          } else if (Array.isArray(parsedSchedule)) {
            setPersistedSchedule({
              days: parsedSchedule as ScheduleDay[],
              meta: {
                generatedAt: new Date().toISOString(),
                engineVersion: 'legacy',
                setupHash: '',
              },
            });
          }
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
      setPersistedSchedule(null);
      return {
        success: false,
        errors: validation.errors,
      };
    }

    const newPersistedSchedule = buildPersistedSchedule(setupData);
    setPersistedSchedule(newPersistedSchedule);

    return {
      success: true,
    };
  }, [setupData]);

  const refreshSchedule = useCallback((): GenerateScheduleResult => {
    return generateScheduleFromSubjects();
  }, [generateScheduleFromSubjects]);

  const completeBlockById = useCallback((blockId: string) => {
    if (!persistedSchedule) return;

    const updatedSchedule = completeBlock(persistedSchedule, blockId);
    setPersistedSchedule(updatedSchedule);
  }, [persistedSchedule]);

  const value = useMemo(
    () => ({
      schedule,
      persistedSchedule,
      isScheduleLoaded,
      isScheduleStale,
      generateScheduleFromSubjects,
      refreshSchedule,
      completeBlockById,
    }),
    [
      schedule,
      persistedSchedule,
      isScheduleLoaded,
      isScheduleStale,
      generateScheduleFromSubjects,
      refreshSchedule,
      completeBlockById,
    ]
  );

  if (!isSetupLoaded || !isScheduleLoaded) {
    return null;
  }

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

export const getSubjectProgress = (schedule: ScheduleDay[]) => {
  const map: Record<string, { total: number; done: number }> = {};

  schedule.forEach((day) => {
    day.blocks.forEach((block) => {
      if (!map[block.subject]) {
        map[block.subject] = { total: 0, done: 0 };
      }

      map[block.subject].total += 1;

      if (block.completed) {
        map[block.subject].done += 1;
      }
    });
  });

  const result: Record<string, number> = {};

  Object.keys(map).forEach((subject) => {
    const { total, done } = map[subject];
    result[subject] = total === 0 ? 0 : done / total;
  });

  return result;
};
