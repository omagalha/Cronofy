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
import { SubjectPracticeSignal } from '../apps/shared/types/practice';
import { IReviewItem } from '../apps/shared/types/review';
import {
  AdaptivePlanningResult,
  buildAdaptivePlan,
} from '../utils/adaptivePlanningEngine';
import { generateReviewsFromCompletedBlock, mergeReviewQueue } from '../utils/reviewEngine';
import {
  buildPersistedSchedule,
  completeBlock,
  createProgressSnapshotFromScheduleDays,
  formatMinutesToDuration,
  isScheduleOutdated,
  parseDurationToMinutes,
  PersistedSchedule,
  ScheduleDay,
  validateSetupBeforeSchedule,
} from '../utils/scheduleEngine';
import { StudyLog, useAIContext } from './AIContext';
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
  completeBlockById: (
    blockId: string,
    payload?: {
      mode?: ScheduleDay['blocks'][number]['mode'];
      status?: ScheduleDay['blocks'][number]['status'];
      interruptionCount?: number | null;
      perceivedEnergyLevel?: number | null;
      perceivedDifficulty?: number | null;
      confidenceScore?: number | null;
      reviewNote?: string | null;
      startedAt?: string | null;
      completedAt?: string;
      rescheduledTo?: string | null;
      skipped?: boolean;
    }
  ) => void;
  setPersistedScheduleState: (schedule: PersistedSchedule) => void;
  resetSchedule: () => void;
  clearSchedule: () => Promise<void>;
  reviewQueue: IReviewItem[];
  addReviewItem: (item: IReviewItem) => void;
  updateReviewItem: (item: IReviewItem) => void;
  previewAdaptiveSchedule: ScheduleDay[];
  adaptiveSuggestions: AdaptivePlanningResult['suggestions'];
  adaptiveMetadata: AdaptivePlanningResult['metadata'] | null;
  applyAdaptivePlan: () => void;
  setPracticeSignals: (signals: SubjectPracticeSignal[]) => void;
};

const STORAGE_KEYS = {
  SCHEDULE: '@aprovai/schedule',
  REVIEW_QUEUE: '@aprovai/review_queue_v1',
  LEGACY_TEXT_CLEANUP: '@aprovai/legacy_text_cleanup_v1',
};

// Preserva dados e marcadores de versões anteriores durante a migração de branding.
const LEGACY_STORAGE_KEYS = {
  SCHEDULE: '@cronofy/schedule',
  REVIEW_QUEUE: '@cronofy/review_queue_v1',
  LEGACY_TEXT_CLEANUP: '@cronofy/legacy_text_cleanup_v1',
};

const DEFAULT_BLOCK_TIMES = ['08:00', '10:00', '14:00', '16:00', '18:00', '20:00'];
const REVIEW_STAGES = new Set(['r1_24h', 'r2_7d', 'r3_30d', 'reinforcement']);
const REVIEW_REASONS = new Set([
  'scheduled_review',
  'manual_doubt',
  'low_confidence',
  'high_difficulty',
  'missed_block_recovery',
]);
const WEEKDAY_INDEX_MAP: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  'segunda-feira': 1,
  terca: 2,
  'terca-feira': 2,
  'terça-feira': 2,
  quarta: 3,
  'quarta-feira': 3,
  quinta: 4,
  'quinta-feira': 4,
  sexta: 5,
  'sexta-feira': 5,
  sabado: 6,
  sábado: 6,
};
const WEEKDAY_NAME_MAP: Record<number, import('../utils/adaptivePlanningEngine').Weekday> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

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

function isValidDateKey(value?: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function createDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getUpcomingDateFromDayLabel(dayLabel?: string, offset = 0): string | undefined {
  if (!dayLabel) return undefined;

  const normalized = normalizeText(dayLabel);
  const weekdayIndex = WEEKDAY_INDEX_MAP[normalized];

  if (typeof weekdayIndex !== 'number') {
    return undefined;
  }

  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const diff = (weekdayIndex - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff + offset * 7);

  return createDateKey(date);
}

function calculateRecoveryDebt(days: ScheduleDay[]): number {
  const today = createDateKey(new Date());

  return days.reduce((acc, day) => {
    if (!day.date || day.date >= today) {
      return acc;
    }

    return (
      acc +
      day.blocks.filter(
        (block) =>
          !block.completed && !block.isRecoveryInsertion && !block.isWeeklyRecoveryBlock
      ).length
    );
  }, 0);
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

function normalizeScheduleBlock(
  block: ScheduleDay['blocks'][number]
): ScheduleDay['blocks'][number] {
  const completed = Boolean(block.completed);
  const skipped = Boolean(block.skipped);
  const mode =
    block.mode ??
    (block.isWeeklyRecoveryBlock
      ? 'recovery'
      : block.type === 'review'
      ? 'review'
      : 'focus');

  return {
    ...block,
    time: block.time ?? '20:00',
    type:
      block.type ??
      (mode === 'review'
        ? 'review'
        : mode === 'questions' || mode === 'simulado'
        ? 'practice'
        : 'new'),
    mode,
    completed,
    skipped,
    status: block.status ?? (completed ? 'completed' : skipped ? 'skipped' : 'pending'),
    startedAt: block.startedAt ?? null,
    rescheduledTo: block.rescheduledTo ?? null,
    interruptionCount: block.interruptionCount ?? null,
    perceivedEnergyLevel: block.perceivedEnergyLevel ?? null,
    perceivedDifficulty: block.perceivedDifficulty ?? null,
    confidenceScore: block.confidenceScore ?? null,
    reviewNote: block.reviewNote ?? null,
    generatedReviewIds: Array.isArray(block.generatedReviewIds)
      ? Array.from(
          new Set(
            block.generatedReviewIds.filter(
              (entry): entry is string => typeof entry === 'string'
            )
          )
        )
      : [],
    originBlockId: block.originBlockId ?? null,
    isRecoveryInsertion: Boolean(block.isRecoveryInsertion),
    isWeeklyRecoveryBlock: Boolean(block.isWeeklyRecoveryBlock),
  };
}

function normalizeScheduleDay(day: ScheduleDay, index: number): ScheduleDay {
  const blocks = Array.isArray(day.blocks)
    ? day.blocks.map(normalizeScheduleBlock)
    : [];
  const date = isValidDateKey(day.date)
    ? day.date
    : getUpcomingDateFromDayLabel(day.day, index > 6 ? Math.floor(index / 7) : 0);
  const plannedLoadMinutes = blocks.reduce(
    (acc, block) => acc + parseDurationToMinutes(block.duration),
    0
  );
  const completedLoadMinutes = blocks
    .filter((block) => block.completed)
    .reduce((acc, block) => acc + parseDurationToMinutes(block.duration), 0);

  return {
    ...day,
    id: day.id ?? `day-${date ?? index + 1}`,
    day: day.day ?? `Dia ${index + 1}`,
    date,
    blocks,
    hasWeeklyRecoveryBlock: blocks.some((block) => block.isWeeklyRecoveryBlock),
    isRecoveryDay:
      blocks.length > 0 &&
      blocks.every((block) => (block.mode ?? 'focus') === 'recovery'),
    expectedBlocksCount: blocks.length,
    completedBlocksCount: blocks.filter((block) => block.completed).length,
    plannedLoadMinutes,
    completedLoadMinutes,
  };
}

function normalizeScheduleDays(days: ScheduleDay[]): ScheduleDay[] {
  return days.map((day, index) => normalizeScheduleDay(day, index));
}

function normalizeScheduleIntelligence(
  intelligence: unknown,
  days: ScheduleDay[]
): PersistedSchedule['intelligence'] {
  const candidate =
    intelligence && typeof intelligence === 'object'
      ? (intelligence as PersistedSchedule['intelligence'])
      : undefined;

  return {
    weeklyRecoveryBlockEnabled: candidate?.weeklyRecoveryBlockEnabled ?? true,
    weeklyRecoveryBlockUsed:
      typeof candidate?.weeklyRecoveryBlockUsed === 'number'
        ? Math.max(0, candidate.weeklyRecoveryBlockUsed)
        : 0,
    recoveryDebt:
      typeof candidate?.recoveryDebt === 'number'
        ? Math.max(0, candidate.recoveryDebt)
        : calculateRecoveryDebt(days),
    lastRebalancedAt:
      typeof candidate?.lastRebalancedAt === 'string'
        ? candidate.lastRebalancedAt
        : null,
    lastAdaptiveUpdateAt:
      typeof candidate?.lastAdaptiveUpdateAt === 'string'
        ? candidate.lastAdaptiveUpdateAt
        : null,
    userPhase:
      typeof candidate?.userPhase === 'string' ? candidate.userPhase : undefined,
  };
}

function hydratePersistedSchedule(
  schedule: Omit<PersistedSchedule, 'progress'> & {
    progress?: PersistedSchedule['progress'] | null;
    intelligence?: PersistedSchedule['intelligence'] | null;
  }
): PersistedSchedule {
  const days = normalizeScheduleDays(schedule.days);

  return {
    ...schedule,
    days,
    progress: normalizeProgressSnapshot(schedule.progress, days),
    expectedProgress:
      typeof schedule.expectedProgress === 'number'
        ? schedule.expectedProgress
        : undefined,
    intelligence: normalizeScheduleIntelligence(schedule.intelligence, days),
  };
}

function getStudyPeriodFromTime(
  time?: string
): 'morning' | 'afternoon' | 'night' | 'unknown' {
  if (!time) return 'unknown';

  const hour = Number(time.split(':')[0]);

  if (Number.isNaN(hour)) return 'unknown';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
}

function resolveAdaptiveWeekday(
  day: ScheduleDay
): import('../utils/adaptivePlanningEngine').Weekday {
  if (day.date) {
    const parsed = new Date(day.date);
    if (!Number.isNaN(parsed.getTime())) {
      return WEEKDAY_NAME_MAP[parsed.getDay()] ?? 'monday';
    }
  }

  const normalized = normalizeText(day.day);
  const weekdayIndex = WEEKDAY_INDEX_MAP[normalized];

  if (typeof weekdayIndex === 'number') {
    return WEEKDAY_NAME_MAP[weekdayIndex] ?? 'monday';
  }

  return 'monday';
}

function getDefaultBlockTime(index: number): string {
  return DEFAULT_BLOCK_TIMES[Math.min(index, DEFAULT_BLOCK_TIMES.length - 1)];
}

function getAdaptiveBlockTip(
  block: import('../utils/adaptivePlanningEngine').StudyBlock
): string | undefined {
  if (block.mode === 'recovery') {
    return 'Use este bloco para absorver atrasos ou revisar pontos crÃ­ticos.';
  }

  if (block.mode === 'review') {
    return 'Revise ativamente e recupere o conteÃºdo sem consultar material o tempo todo.';
  }

  if (block.mode === 'questions' || block.type === 'practice') {
    return 'Resolva questÃµes, corrija padrÃµes de erro e registre dÃºvidas recorrentes.';
  }

  return undefined;
}

function mapScheduleDayToAdaptive(
  day: ScheduleDay
): import('../utils/adaptivePlanningEngine').ScheduleDay {
  return {
    id: day.id,
    day: day.day,
    date: day.date ?? getUpcomingDateFromDayLabel(day.day) ?? createDateKey(new Date()),
    weekday: resolveAdaptiveWeekday(day),
    isRecoveryDay: day.isRecoveryDay,
    hasWeeklyRecoveryBlock: day.hasWeeklyRecoveryBlock,
    expectedBlocksCount: day.expectedBlocksCount,
    completedBlocksCount: day.completedBlocksCount,
    plannedLoadMinutes: day.plannedLoadMinutes,
    completedLoadMinutes: day.completedLoadMinutes,
    blocks: day.blocks.map((block) => ({
      id: block.id,
      subject: block.subject,
      duration: parseDurationToMinutes(block.duration),
      completed: Boolean(block.completed),
      difficulty: block.perceivedDifficulty ?? undefined,
      scheduledDate: day.date,
      plannedStartTime: block.time,
      confidenceScore: block.confidenceScore ?? null,
      reviewNote: block.reviewNote ?? null,
      mode: block.mode,
      type: block.type,
      status: block.status,
      originBlockId: block.originBlockId ?? null,
      isRecoveryInsertion: block.isRecoveryInsertion,
      isWeeklyRecoveryBlock: block.isWeeklyRecoveryBlock,
    })),
  };
}

function mapAdaptiveToScheduleDays(
  source: import('../utils/adaptivePlanningEngine').ScheduleDay[],
  fallback: ScheduleDay[]
): ScheduleDay[] {
  return source.map((adaptiveDay, dayIndex) => {
    const fallbackDay = fallback[dayIndex];
    const fallbackBlocksById = new Map(
      (fallbackDay?.blocks ?? []).map((block) => [block.id, block])
    );

    const blocks = adaptiveDay.blocks.map((adaptiveBlock, blockIndex) => {
      const fallbackBlock =
        fallbackBlocksById.get(adaptiveBlock.id) ?? fallbackDay?.blocks?.[blockIndex];
      const mode =
        adaptiveBlock.mode ??
        fallbackBlock?.mode ??
        (adaptiveBlock.type === 'review' ? 'review' : 'focus');
      const type =
        adaptiveBlock.type ??
        fallbackBlock?.type ??
        (mode === 'review'
          ? 'review'
          : mode === 'questions' || mode === 'simulado'
          ? 'practice'
          : 'new');

      return normalizeScheduleBlock({
        ...(fallbackBlock ?? {
          id: adaptiveBlock.id,
          subject: adaptiveBlock.subject,
          time: getDefaultBlockTime(blockIndex),
          duration: formatMinutesToDuration(adaptiveBlock.duration),
        }),
        id: adaptiveBlock.id,
        subject: adaptiveBlock.subject,
        time:
          adaptiveBlock.plannedStartTime ??
          fallbackBlock?.time ??
          getDefaultBlockTime(blockIndex),
        duration: formatMinutesToDuration(adaptiveBlock.duration),
        type,
        mode,
        tip: fallbackBlock?.tip ?? getAdaptiveBlockTip(adaptiveBlock),
        completed: adaptiveBlock.completed,
        skipped: adaptiveBlock.status === 'skipped' ? true : fallbackBlock?.skipped,
        status:
          adaptiveBlock.status ??
          (adaptiveBlock.completed ? 'completed' : fallbackBlock?.status ?? 'pending'),
        completedAt:
          adaptiveBlock.completed ? fallbackBlock?.completedAt : undefined,
        startedAt: fallbackBlock?.startedAt ?? null,
        rescheduledTo: fallbackBlock?.rescheduledTo ?? null,
        interruptionCount: fallbackBlock?.interruptionCount ?? null,
        perceivedEnergyLevel: fallbackBlock?.perceivedEnergyLevel ?? null,
        perceivedDifficulty:
          adaptiveBlock.difficulty ?? fallbackBlock?.perceivedDifficulty ?? null,
        confidenceScore:
          adaptiveBlock.confidenceScore ?? fallbackBlock?.confidenceScore ?? null,
        reviewNote: adaptiveBlock.reviewNote ?? fallbackBlock?.reviewNote ?? null,
        generatedReviewIds: fallbackBlock?.generatedReviewIds ?? [],
        originBlockId:
          adaptiveBlock.originBlockId ?? fallbackBlock?.originBlockId ?? null,
        isRecoveryInsertion:
          adaptiveBlock.isRecoveryInsertion ?? fallbackBlock?.isRecoveryInsertion,
        isWeeklyRecoveryBlock:
          adaptiveBlock.isWeeklyRecoveryBlock ?? fallbackBlock?.isWeeklyRecoveryBlock,
      });
    });

    return normalizeScheduleDay(
      {
        ...(fallbackDay ?? {
          id: adaptiveDay.id ?? `day-${adaptiveDay.date}-${dayIndex + 1}`,
          day: adaptiveDay.day ?? `Dia ${dayIndex + 1}`,
        }),
        id: fallbackDay?.id ?? adaptiveDay.id ?? `day-${adaptiveDay.date}-${dayIndex + 1}`,
        day: fallbackDay?.day ?? adaptiveDay.day ?? `Dia ${dayIndex + 1}`,
        date: adaptiveDay.date ?? fallbackDay?.date,
        blocks,
      },
      dayIndex
    );
  });
}

function normalizeReviewStatus(status: unknown): IReviewItem['status'] {
  if (status === 'completed') return 'completed';
  if (status === 'skipped' || status === 'expired') return 'skipped';
  return 'pending';
}

function inferReviewStage(candidate: Record<string, unknown>): IReviewItem['stage'] {
  if (typeof candidate.stage === 'string' && REVIEW_STAGES.has(candidate.stage)) {
    return candidate.stage as IReviewItem['stage'];
  }

  const identifier = String(candidate.id ?? '').toLowerCase();

  if (identifier.includes('reinforcement')) return 'reinforcement';
  if (identifier.includes('r3')) return 'r3_30d';
  if (identifier.includes('r2')) return 'r2_7d';

  return 'r1_24h';
}

function inferReviewReason(candidate: Record<string, unknown>): IReviewItem['reviewReason'] {
  if (
    typeof candidate.reviewReason === 'string' &&
    REVIEW_REASONS.has(candidate.reviewReason)
  ) {
    return candidate.reviewReason as IReviewItem['reviewReason'];
  }

  if (typeof candidate.reviewNote === 'string' && candidate.reviewNote.trim()) {
    return 'manual_doubt';
  }

  if (typeof candidate.confidenceScore === 'number' && candidate.confidenceScore <= 2) {
    return 'low_confidence';
  }

  return 'scheduled_review';
}

function inferReviewPriority(candidate: Record<string, unknown>): number {
  if (typeof candidate.priority === 'number') {
    return Math.max(1, Math.min(5, Math.round(candidate.priority)));
  }

  const reviewReason = inferReviewReason(candidate);

  if (reviewReason === 'manual_doubt') return 5;
  if (reviewReason === 'low_confidence' || reviewReason === 'high_difficulty') {
    return 4;
  }

  return 3;
}

function normalizeReviewItem(value: unknown): IReviewItem | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.id !== 'string' || typeof candidate.subject !== 'string') {
    return null;
  }

  return {
    id: candidate.id,
    sourceBlockId:
      typeof candidate.sourceBlockId === 'string'
        ? candidate.sourceBlockId
        : typeof candidate.blockId === 'string'
        ? candidate.blockId
        : candidate.id,
    subject: candidate.subject,
    stage: inferReviewStage(candidate),
    createdAt:
      typeof candidate.createdAt === 'string'
        ? candidate.createdAt
        : typeof candidate.dueDate === 'string'
        ? candidate.dueDate
        : new Date().toISOString(),
    dueDate:
      typeof candidate.dueDate === 'string'
        ? candidate.dueDate
        : new Date().toISOString(),
    status: normalizeReviewStatus(candidate.status),
    priority: inferReviewPriority(candidate),
    confidenceScore:
      typeof candidate.confidenceScore === 'number'
        ? candidate.confidenceScore
        : null,
    completedAt:
      typeof candidate.completedAt === 'string' ? candidate.completedAt : null,
    reviewNote:
      typeof candidate.reviewNote === 'string' ? candidate.reviewNote : null,
    reviewReason: inferReviewReason(candidate),
  };
}

function attachGeneratedReviewIds(
  schedule: PersistedSchedule,
  blockId: string,
  reviewIds: string[]
): PersistedSchedule {
  return hydratePersistedSchedule({
    ...schedule,
    days: schedule.days.map((day) => ({
      ...day,
      blocks: day.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              generatedReviewIds: Array.from(
                new Set([...(block.generatedReviewIds ?? []), ...reviewIds])
              ),
            }
          : block
      ),
    })),
  });
}

async function runLegacyScheduleCleanupOnce() {
  const [alreadyCleaned, legacyAlreadyCleaned] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.LEGACY_TEXT_CLEANUP),
    AsyncStorage.getItem(LEGACY_STORAGE_KEYS.LEGACY_TEXT_CLEANUP),
  ]);

  if (alreadyCleaned || legacyAlreadyCleaned) {
    if (!alreadyCleaned && legacyAlreadyCleaned) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LEGACY_TEXT_CLEANUP,
        legacyAlreadyCleaned
      );
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEYS.LEGACY_TEXT_CLEANUP);
    }
    return;
  }

  await AsyncStorage.multiRemove([
    STORAGE_KEYS.SCHEDULE,
    STORAGE_KEYS.REVIEW_QUEUE,
    LEGACY_STORAGE_KEYS.SCHEDULE,
    LEGACY_STORAGE_KEYS.REVIEW_QUEUE,
  ]);
  await AsyncStorage.setItem(
    STORAGE_KEYS.LEGACY_TEXT_CLEANUP,
    new Date().toISOString()
  );
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
  const [reviewQueue, setReviewQueue] = useState<IReviewItem[]>([]);
  const [practiceSignals, setPracticeSignals] = useState<SubjectPracticeSignal[]>([]);
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
        await runLegacyScheduleCleanupOnce();

        const [scheduleStored, reviewQueueStored] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SCHEDULE),
          AsyncStorage.getItem(STORAGE_KEYS.REVIEW_QUEUE),
        ]);

        if (scheduleStored) {
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
        }

        if (reviewQueueStored) {
          const parsedQueue = JSON.parse(reviewQueueStored) as unknown;

          if (Array.isArray(parsedQueue)) {
            setReviewQueue(
              mergeReviewQueue(
                [],
                parsedQueue
                  .map((entry) => normalizeReviewItem(entry))
                  .filter((entry): entry is IReviewItem => Boolean(entry))
              )
            );
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

  useEffect(() => {
    if (!isScheduleLoaded) return;

    async function persistReviewQueue() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.REVIEW_QUEUE,
          JSON.stringify(reviewQueue)
        );
      } catch (error) {
        console.log('Erro ao salvar fila de revisÃµes', error);
      }
    }

    persistReviewQueue();
  }, [reviewQueue, isScheduleLoaded]);

  const addReviewItem = useCallback((item: IReviewItem) => {
    setReviewQueue((prev) => mergeReviewQueue(prev, [item]));
  }, []);

  const updateReviewItem = useCallback((item: IReviewItem) => {
    setReviewQueue((prev) =>
      mergeReviewQueue(prev.filter((entry) => entry.id !== item.id), [item])
    );
  }, []);

  const setPersistedScheduleState = useCallback((schedule: PersistedSchedule) => {
    setPersistedSchedule(hydratePersistedSchedule(schedule));
  }, []);

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

    setPersistedSchedule(hydratePersistedSchedule(newPersistedSchedule));

    return {
      success: true,
    };
  }, [setupData, persistedSchedule]);

  const refreshSchedule = useCallback((): GenerateScheduleResult => {
    return generateScheduleFromSubjects();
  }, [generateScheduleFromSubjects]);

  const completeBlockById = useCallback(
    (
      blockId: string,
      payload?: {
        mode?: ScheduleDay['blocks'][number]['mode'];
        status?: ScheduleDay['blocks'][number]['status'];
        interruptionCount?: number | null;
        perceivedEnergyLevel?: number | null;
        perceivedDifficulty?: number | null;
        confidenceScore?: number | null;
        reviewNote?: string | null;
        startedAt?: string | null;
        completedAt?: string;
        rescheduledTo?: string | null;
        skipped?: boolean;
      }
    ) => {
      if (!persistedSchedule) return;

      const completedSchedule = completeBlock(persistedSchedule, blockId, payload);
      const dayWithBlock = completedSchedule.days.find((day) =>
        day.blocks.some((block) => block.id === blockId)
      );
      const completedBlock = dayWithBlock?.blocks.find((block) => block.id === blockId);

      let nextSchedule = completedSchedule;

      if (completedBlock && (payload?.mode ?? completedBlock.mode ?? 'focus') === 'focus') {
        const reviewItems = generateReviewsFromCompletedBlock(completedBlock);

        if (reviewItems.length > 0) {
          nextSchedule = attachGeneratedReviewIds(
            completedSchedule,
            blockId,
            reviewItems.map((item) => item.id)
          );

          setReviewQueue((prev) => mergeReviewQueue(prev, reviewItems));
        }
      }

      setPersistedSchedule(nextSchedule);

      if (!ai.isAIEnabled || !dayWithBlock || !completedBlock) return;

      const plannedBlocks = dayWithBlock.blocks.length;
      const completedBlocks = dayWithBlock.blocks.filter(
        (block) => block.completed
      ).length;

      const subjects = Array.from(
        new Set(
          dayWithBlock.blocks
            .map((block) => block.subject?.trim())
            .filter((subject): subject is string => Boolean(subject))
        )
      );

      const timeStudied = dayWithBlock.blocks
        .filter((block) => block.completed)
        .reduce(
          (acc, block) => acc + parseDurationToMinutes(block.duration),
          0
        );

      const log: StudyLog = {
        date: new Date().toISOString().slice(0, 10),
        plannedBlocks,
        completedBlocks,
        subjects,
        timeStudied,
        interruptionCount:
          dayWithBlock.blocks.reduce(
            (acc, block) => acc + (block.interruptionCount ?? 0),
            0
          ) ?? 0,
        weeklyRecoveryBlockUsed:
          completedBlock.isWeeklyRecoveryBlock || completedBlock.mode === 'recovery'
            ? 1
            : 0,
        period: getStudyPeriodFromTime(
          (completedBlock as ScheduleDay['blocks'][number] & { time?: string }).time
        ),
      };

      const nextLogs = ai.upsertStudyLog(log);
      ai.runAIAnalysis(nextLogs);
    },
    [persistedSchedule, ai]
  );

  const adaptivePlan = useMemo<AdaptivePlanningResult | null>(() => {
    if (!persistedSchedule) return null;
    if (!ai.isAIEnabled) return null;
    if (!ai.isHydrated) return null;

    return buildAdaptivePlan({
      schedule: persistedSchedule.days.map(mapScheduleDayToAdaptive),
      studyLogs: ai.studyLogs,
      analysis: ai.aiAnalysis,
      setup: setupData,
      reviewQueue,
      practiceSignals,
      generatedAt: persistedSchedule.meta.generatedAt,
    });
  }, [
    persistedSchedule,
    ai.isAIEnabled,
    ai.isHydrated,
    ai.studyLogs,
    ai.aiAnalysis,
    setupData,
    reviewQueue,
    practiceSignals,
  ]);

  const previewAdaptiveSchedule = useMemo(() => {
    if (!adaptivePlan) return schedule;
    if (!persistedSchedule) return schedule;

    return mapAdaptiveToScheduleDays(adaptivePlan.updatedSchedule, persistedSchedule.days);
  }, [adaptivePlan, schedule, persistedSchedule]);

  const adaptiveSuggestions = useMemo(() => {
    return adaptivePlan?.suggestions ?? [];
  }, [adaptivePlan]);

  const adaptiveMetadata = useMemo(() => {
    return adaptivePlan?.metadata ?? null;
  }, [adaptivePlan]);

  const applyAdaptivePlan = useCallback(() => {
    if (!persistedSchedule || !adaptivePlan) return;

    const now = new Date().toISOString();
    const mappedDays = mapAdaptiveToScheduleDays(
      adaptivePlan.updatedSchedule,
      persistedSchedule.days
    );

    const updatedPersistedSchedule: PersistedSchedule = hydratePersistedSchedule({
      ...persistedSchedule,
      days: mappedDays,
      meta: {
        ...persistedSchedule.meta,
        generatedAt: now,
        engineVersion: `${persistedSchedule.meta.engineVersion}-adaptive`,
      },
      progress: normalizeProgressSnapshot(persistedSchedule.progress, mappedDays),
      expectedProgress: adaptivePlan.metadata.expectedProgress,
      intelligence: {
        ...persistedSchedule.intelligence,
        weeklyRecoveryBlockEnabled:
          persistedSchedule.intelligence?.weeklyRecoveryBlockEnabled ?? true,
        weeklyRecoveryBlockUsed: Math.max(
          persistedSchedule.intelligence?.weeklyRecoveryBlockUsed ?? 0,
          adaptivePlan.metadata.recoveryBlocksUsed
        ),
        recoveryDebt: calculateRecoveryDebt(mappedDays),
        lastAdaptiveUpdateAt: now,
        lastRebalancedAt:
          adaptivePlan.metadata.rebalanceActions > 0
            ? now
            : persistedSchedule.intelligence?.lastRebalancedAt ?? null,
        userPhase: adaptivePlan.metadata.userPhase,
      },
    });

    setPersistedSchedule(updatedPersistedSchedule);
  }, [persistedSchedule, adaptivePlan]);

  const resetSchedule = useCallback(() => {
    void AsyncStorage.multiRemove([
      STORAGE_KEYS.SCHEDULE,
      STORAGE_KEYS.REVIEW_QUEUE,
      LEGACY_STORAGE_KEYS.SCHEDULE,
      LEGACY_STORAGE_KEYS.REVIEW_QUEUE,
    ]);
    setPersistedSchedule(null);
    setReviewQueue([]);
    setPracticeSignals([]);
  }, []);

  const clearSchedule = useCallback(async () => {
    resetSchedule();
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.REVIEW_QUEUE,
      LEGACY_STORAGE_KEYS.REVIEW_QUEUE,
    ]);
    setReviewQueue([]);
  }, [resetSchedule]);

  const value = useMemo(
    () => ({
      schedule,
      persistedSchedule,
      isScheduleLoaded,
      isScheduleStale,
      generateScheduleFromSubjects,
      refreshSchedule,
      completeBlockById,
      setPersistedScheduleState,
      resetSchedule,
      clearSchedule,
      reviewQueue,
      addReviewItem,
      updateReviewItem,
      previewAdaptiveSchedule,
      adaptiveSuggestions,
      adaptiveMetadata,
      applyAdaptivePlan,
      setPracticeSignals,
    }),
    [
      schedule,
      persistedSchedule,
      isScheduleLoaded,
      isScheduleStale,
      generateScheduleFromSubjects,
      refreshSchedule,
      completeBlockById,
      setPersistedScheduleState,
      resetSchedule,
      clearSchedule,
      reviewQueue,
      addReviewItem,
      updateReviewItem,
      previewAdaptiveSchedule,
      adaptiveSuggestions,
      adaptiveMetadata,
      applyAdaptivePlan,
      setPracticeSignals,
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
