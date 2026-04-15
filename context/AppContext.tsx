import React, { ReactNode, useMemo } from 'react';

import { AIProvider, useAIContext } from './AIContext';
import { ScheduleProvider, useScheduleContext } from './ScheduleContext';
import { SetupProvider, useSetupContext } from './SetupContext';

export type AppContextData =
  ReturnType<typeof useSetupContext> &
  ReturnType<typeof useScheduleContext> &
  ReturnType<typeof useAIContext> & {
    resetAll: () => void;
  };

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <SetupProvider>
      <AIProvider>
        <ScheduleProvider>{children}</ScheduleProvider>
      </AIProvider>
    </SetupProvider>
  );
}

export function useAppContext(): AppContextData {
  const setup = useSetupContext();
  const schedule = useScheduleContext();
  const ai = useAIContext();

  return useMemo(
    () => {
      function resetAll() {
        setup.resetSetup();
        schedule.resetSchedule();
        ai.resetAI();
      }

      return {
        ...setup,
        ...schedule,
        ...ai,
        resetAll,
      };
    },
    [setup, schedule, ai]
  );
}
