import React, { ReactNode } from 'react';
import { AIProvider } from './AIContext';
import { ScheduleProvider } from './ScheduleContext';
import { SetupProvider } from './SetupContext';

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
