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
  resetSetup: () => Promise<void>;
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

const normalizeText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

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

        if (!setupStored) {
          setIsSetupLoaded(true);
          return;
        }

        const parsedSetup = JSON.parse(setupStored) as Partial<UserSetupData>;

        setSetupData({
          ...initialSetupData,
          ...parsedSetup,
          concurso: typeof parsedSetup.concurso === 'string' ? parsedSetup.concurso : '',
          nivel: typeof parsedSetup.nivel === 'string' ? parsedSetup.nivel : '',
          foco: typeof parsedSetup.foco === 'string' ? parsedSetup.foco : '',
          disponibilidade:
            typeof parsedSetup.disponibilidade === 'string'
              ? parsedSetup.disponibilidade
              : '',
          examDate: typeof parsedSetup.examDate === 'string' ? parsedSetup.examDate : '',
          materias: Array.isArray(parsedSetup.materias)
            ? parsedSetup.materias
                .map((subject) => String(subject).trim())
                .filter(Boolean)
            : [],
          diasDisponiveis: Array.isArray(parsedSetup.diasDisponiveis)
            ? normalizeAvailableDays(parsedSetup.diasDisponiveis.map(String))
            : [],
        });
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
        await AsyncStorage.setItem(STORAGE_KEYS.SETUP, JSON.stringify(setupData));
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
    setSetupData((prev) => {
      if (field === 'diasDisponiveis') {
        return {
          ...prev,
          diasDisponiveis: normalizeAvailableDays(
            value as UserSetupData['diasDisponiveis']
          ),
        };
      }

      if (field === 'materias') {
        const uniqueSubjects: string[] = [];
        const seen = new Set<string>();

        for (const subject of value as UserSetupData['materias']) {
          const trimmed = subject.trim();
          if (!trimmed) continue;

          const normalized = normalizeText(trimmed);
          if (seen.has(normalized)) continue;

          seen.add(normalized);
          uniqueSubjects.push(trimmed);
        }

        return {
          ...prev,
          materias: uniqueSubjects,
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  }

  function addSubject(subject: string) {
    const trimmed = subject.trim();
    if (!trimmed) return;

    setSetupData((prev) => {
      const alreadyExists = prev.materias.some(
        (item) => normalizeText(item) === normalizeText(trimmed)
      );

      if (alreadyExists) {
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
      materias: prev.materias.filter(
        (item) => normalizeText(item) !== normalizeText(subject)
      ),
    }));
  }

  function clearSubjects() {
    setSetupData((prev) => ({
      ...prev,
      materias: [],
    }));
  }

  function toggleAvailableDay(day: string) {
    setSetupData((prev) => {
      const normalizedTarget = normalizeAvailableDays([day])[0];
      if (!normalizedTarget) return prev;

      const currentDays = normalizeAvailableDays(prev.diasDisponiveis);
      const alreadySelected = currentDays.includes(normalizedTarget);

      const nextDays = alreadySelected
        ? currentDays.filter((item) => item !== normalizedTarget)
        : [...currentDays, normalizedTarget];

      return {
        ...prev,
        diasDisponiveis: normalizeAvailableDays(nextDays),
      };
    });
  }

  function clearAvailableDays() {
    setSetupData((prev) => ({
      ...prev,
      diasDisponiveis: [],
    }));
  }

  async function resetSetup() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SETUP);
      setSetupData(initialSetupData);
    } catch (error) {
      console.log('Erro ao resetar setup', error);
    }
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
      resetSetup,
    }),
    [setupData, isSetupLoaded]
  );

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
}

export function useSetupContext() {
  const context = useContext(SetupContext);

  if (!context) {
    throw new Error('useSetupContext must be used within SetupProvider');
  }

  return context;
}