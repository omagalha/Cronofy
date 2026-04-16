import React, { ReactNode, useMemo } from 'react';

import { AdaptivePlanningEngine } from '../utils/adaptivePlanningEngine';
import { AIProvider, useAIContext } from './AIContext';
import { AuthProvider, useAuthContext } from './AuthContext';
import { ScheduleProvider, useScheduleContext } from './ScheduleContext';
import { SetupProvider, useSetupContext } from './SetupContext';

export type AppContextData =
  ReturnType<typeof useAuthContext> &
  ReturnType<typeof useSetupContext> &
  ReturnType<typeof useScheduleContext> &
  ReturnType<typeof useAIContext> & {
    resetAll: () => void;
    adjustSchedule: () => void;
  };

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <AuthProvider>
      <SetupProvider>
        <AIProvider>
          <ScheduleProvider>{children}</ScheduleProvider>
        </AIProvider>
      </SetupProvider>
    </AuthProvider>
  );
}

export function useAppContext(): AppContextData {
  const auth = useAuthContext();
  const setup = useSetupContext();
  const schedule = useScheduleContext();
  const ai = useAIContext();

  const adaptivePlanningEngine = useMemo(
    () => new AdaptivePlanningEngine(),
    []
  );

  return useMemo(() => {
    function resetAll() {
      setup.resetSetup();
      schedule.resetSchedule();
      ai.resetAI();
    }

    function adjustSchedule() {
      if (!schedule.persistedSchedule) return;

      const result = adaptivePlanningEngine.generateOrAdjustSchedule({
        schedule: schedule.persistedSchedule.days.map((day) => ({
          date: day.day,
          weekday: 'monday',
          blocks: day.blocks.map((block) => ({
            id: block.id,
            subject: block.subject,
            duration:
              typeof block.duration === 'number'
                ? block.duration
                : Number.parseInt(String(block.duration), 10) || 30,
            completed: Boolean(block.completed),
          })),
        })),
        studyLogs: ai.studyLogs,
        analysis: ai.aiAnalysis,
        setup: setup.setupData,
      });

      const expectedProgress = adaptivePlanningEngine.calculateExpectedProgress(
        result.updatedSchedule
      );

      schedule.setPersistedScheduleState({
        ...schedule.persistedSchedule,
        days: schedule.persistedSchedule.days.map((day, dayIndex) => {
          const updatedDay = result.updatedSchedule[dayIndex];
          const updatedBlocks = updatedDay?.blocks ?? [];

          return {
            ...day,
            blocks: day.blocks.map((block, blockIndex) => ({
              ...block,
              completed: updatedBlocks[blockIndex]?.completed ?? block.completed,
            })),
            completedBlocksCount: day.blocks.filter((block) => block.completed)
              .length,
          };
        }),
        expectedProgress,
      });
    }

    return {
      ...auth,
      ...setup,
      ...schedule,
      ...ai,
      resetAll,
      adjustSchedule,
    };
  }, [auth, setup, schedule, ai, adaptivePlanningEngine]);
}