import React, { ReactNode, useMemo } from 'react';
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

  return useMemo(() => {
    function resetAll() {
      setup.resetSetup();
      schedule.resetSchedule();
      ai.resetAI();
    }

    function adjustSchedule() {
      schedule.applyAdaptivePlan();
    }

    return {
      ...auth,
      ...setup,
      ...schedule,
      ...ai,
      resetAll,
      adjustSchedule,
    };
  }, [auth, setup, schedule, ai]);
}
