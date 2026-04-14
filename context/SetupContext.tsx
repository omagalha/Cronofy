import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { normalizeAvailableDays, UserSetupData } from '../utils/scheduleEngine';

type SetupContextData = {
  setupData: UserSetupData;
  isSetupLoaded: boolean;
  updateSetupField: <K extends keyof UserSetupData>(
    field: K,
    value: UserSetupData[K]
  ) => void;
  addSubject: (subject: string) => void;
  removeSubject: (subject: string) => void;
  clearSubjects: () => void;
  toggleAvailableDay: (day: string) => void;
  clearAvailableDays: () => void;
};

const STORAGE_KEYS = {
  SETUP: '@cronofy/setup',
};

const initialSetupData: UserSetupData = {
  concurso: '',
  nivel: '',
  foco: '',
  disponibilidade: '',
  examDate: '',
  materias: [],
  diasDisponiveis: [],
};

const normalizedDayMap: Record<string, string> = {
  Segunda: 'Segunda-feira',
  'Segunda-feira': 'Segunda-feira',
  Terça: 'Terça-feira',
  'Terça-feira': 'Terça-feira',
  Quarta: 'Quarta-feira',
  'Quarta-feira': 'Quarta-feira',
  Quinta: 'Quinta-feira',
  'Quinta-feira': 'Quinta-feira',
  Sexta: 'Sexta-feira',
  'Sexta-feira': 'Sexta-feira',
  Sábado: 'Sábado',
  Domingo: 'Domingo',
};

function normalizeDaysForContext(days: string[]) {
  return Array.from(
    new Set(
      days
        .map((day) => normalizedDayMap[day] ?? day)
        .filter((day) => Boolean(day))
    )
  );
}

const SetupContext = createContext<SetupContextData | undefined>(undefined);

type SetupProviderProps = {
  children: ReactNode;
};

export function SetupProvider({ children }: SetupProviderProps) {
  const [setupData, setSetupData] = useState<UserSetupData>(initialSetupData);
  const [isSetupLoaded, setIsSetupLoaded] = useState(false);

  useEffect(() => {
    async function loadSetup() {
      try {
        const setupStored = await AsyncStorage.getItem(STORAGE_KEYS.SETUP);

        if (setupStored) {
          const parsedSetup = JSON.parse(setupStored) as UserSetupData;

          setSetupData({
            ...initialSetupData,
            ...parsedSetup,
            materias: Array.isArray(parsedSetup.materias)
              ? parsedSetup.materias
              : [],
            diasDisponiveis: normalizeAvailableDays(
              parsedSetup.diasDisponiveis ?? []
            ),
          });
        }
      } catch (error) {
        console.log('Erro ao carregar setup', error);
      } finally {
        setIsSetupLoaded(true);
      }
    }

    loadSetup();
  }, []);

  useEffect(() => {
    if (!isSetupLoaded) return;

    async function persistSetup() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SETUP,
          JSON.stringify(setupData)
        );
      } catch (error) {
        console.log('Erro ao salvar setup', error);
      }
    }

    persistSetup();
  }, [setupData, isSetupLoaded]);

  function updateSetupField<K extends keyof UserSetupData>(
    field: K,
    value: UserSetupData[K]
  ) {
    setSetupData((prev) => ({
      ...prev,
      [field]:
        field === 'diasDisponiveis'
          ? normalizeAvailableDays(value as UserSetupData['diasDisponiveis'])
          : value,
    }));
  }

  function addSubject(subject: string) {
    const trimmed = subject.trim();

    if (!trimmed) return;

    setSetupData((prev) => {
      if (prev.materias.includes(trimmed)) {
        return prev;
      }

      return {
        ...prev,
        materias: [...prev.materias, trimmed],
      };
    });
  }

  function removeSubject(subject: string) {
    setSetupData((prev) => ({
      ...prev,
      materias: prev.materias.filter((m) => m !== subject),
    }));
  }

  function clearSubjects() {
    setSetupData((prev) => ({
      ...prev,
      materias: [],
    }));
  }

  function toggleAvailableDay(day: string) {
    const normalizedDay = normalizedDayMap[day] ?? day;

    setSetupData((prev) => {
      const currentDays = normalizeDaysForContext(prev.diasDisponiveis);
      const alreadySelected = currentDays.includes(normalizedDay);

      return {
        ...prev,
        diasDisponiveis: alreadySelected
          ? currentDays.filter((item) => item !== normalizedDay)
          : [...currentDays, normalizedDay],
      };
    });
  }

  function clearAvailableDays() {
    setSetupData((prev) => ({
      ...prev,
      diasDisponiveis: [],
    }));
  }

  const value = useMemo(
    () => ({
      setupData,
      isSetupLoaded,
      updateSetupField,
      addSubject,
      removeSubject,
      clearSubjects,
      toggleAvailableDay,
      clearAvailableDays,
    }),
    [setupData, isSetupLoaded]
  );

  return (
    <SetupContext.Provider value={value}>
      {children}
    </SetupContext.Provider>
  );
}

export function useSetupContext() {
  const context = useContext(SetupContext);

  if (!context) {
    throw new Error('useSetupContext must be used within SetupProvider');
  }

  return context;
}
