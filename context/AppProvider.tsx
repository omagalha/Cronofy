import React, { ReactNode } from 'react';
import { ScheduleProvider } from './ScheduleContext';
import { SetupProvider } from './SetupContext';

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <SetupProvider>
      <ScheduleProvider>{children}</ScheduleProvider>
    </SetupProvider>
  );
}