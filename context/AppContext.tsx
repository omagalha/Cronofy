import { useScheduleContext } from './ScheduleContext';
import { useSetupContext } from './SetupContext';

export function useAppContext() {
  const setup = useSetupContext();
  const schedule = useScheduleContext();

  return {
    ...setup,
    ...schedule,
  };
}