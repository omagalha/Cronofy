import type { BlockStatus, UserPhase } from '../apps/shared/types/intelligence';
import { calculateExpectedProgressFromDays } from './progressEngine';

export type UserSetupData = {
  concurso: string;
  examDate: string;
  nivel: string;
  foco: string;
  disponibilidade: string;
  materias: string[];
  diasDisponiveis: string[];
};

export type StudyBlockType = 'new' | 'review' | 'practice';
export type ScheduleBlockMode =
  | 'focus'
  | 'review'
  | 'questions'
  | 'simulado'
  | 'planning'
  | 'recovery';

export type StudyBlock = {
  id: string;
  subject: string;
  time: string;
  duration: string;
  type?: StudyBlockType;
  mode?: ScheduleBlockMode;
  tip?: string;
  completed?: boolean;
  skipped?: boolean;
  status?: BlockStatus;
  completedAt?: string;
  startedAt?: string | null;
  rescheduledTo?: string | null;
  interruptionCount?: number | null;
  perceivedEnergyLevel?: number | null;
  perceivedDifficulty?: number | null;
  confidenceScore?: number | null;
  reviewNote?: string | null;
  generatedReviewIds?: string[];
  originBlockId?: string | null;
  isRecoveryInsertion?: boolean;
  isWeeklyRecoveryBlock?: boolean;
};

export type ScheduleDay = {
  id: string;
  day: string;
  date?: string;
  blocks: StudyBlock[];
  isRecoveryDay?: boolean;
  hasWeeklyRecoveryBlock?: boolean;
  expectedBlocksCount?: number;
  completedBlocksCount?: number;
  plannedLoadMinutes?: number;
  completedLoadMinutes?: number;
};

export type ScheduleMeta = {
  generatedAt: string;
  engineVersion: string;
  setupHash: string;
};

export type SubjectProgressSnapshot = {
  completedSessionKeys: string[];
  completedSessionsBySubject: Record<string, number>;
  targetSessionsBySubject: Record<string, number>;
};

export type ScheduleIntelligence = {
  weeklyRecoveryBlockEnabled: boolean;
  weeklyRecoveryBlockUsed: number;
  recoveryDebt: number;
  lastRebalancedAt?: string | null;
  lastAdaptiveUpdateAt?: string | null;
  userPhase?: UserPhase;
};

export type PersistedSchedule = {
  days: ScheduleDay[];
  meta: ScheduleMeta;
  progress: SubjectProgressSnapshot;
  expectedProgress?: number;
  intelligence?: ScheduleIntelligence;
};

const ENGINE_VERSION = '1.3.0';

const DEFAULT_DAYS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
] as const;

const DAY_LABEL_MAP: Record<string, string> = {
  seg: 'Segunda-feira',
  segunda: 'Segunda-feira',
  'segunda-feira': 'Segunda-feira',

  ter: 'Terça-feira',
  terca: 'Terça-feira',
  terça: 'Terça-feira',
  'terca-feira': 'Terça-feira',
  'terça-feira': 'Terça-feira',

  qua: 'Quarta-feira',
  quarta: 'Quarta-feira',
  'quarta-feira': 'Quarta-feira',

  qui: 'Quinta-feira',
  quinta: 'Quinta-feira',
  'quinta-feira': 'Quinta-feira',

  sex: 'Sexta-feira',
  sexta: 'Sexta-feira',
  'sexta-feira': 'Sexta-feira',

  sab: 'Sábado',
  sabado: 'Sábado',
  sábado: 'Sábado',

  dom: 'Domingo',
  domingo: 'Domingo',
};

const DAY_ORDER: Record<string, number> = {
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  Sábado: 6,
  Domingo: 7,
};

const SLOT_TIMES = ['08:00', '10:00', '14:00', '16:00', '18:00'] as const;
const RECOVERY_BLOCK_TIME = '20:00';
const JS_DAY_INDEX: Record<string, number> = {
  Domingo: 0,
  'Segunda-feira': 1,
  'TerÃ§a-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'SÃ¡bado': 6,
};

const normalizeText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const normalizeDay = (day: string): string | null => {
  const normalized = normalizeText(day);
  return DAY_LABEL_MAP[normalized] ?? null;
};

export const normalizeAvailableDays = (days: string[]): string[] => {
  const uniqueDays = new Set<string>();

  for (const day of days) {
    const normalizedDay = normalizeDay(day);
    if (normalizedDay) {
      uniqueDays.add(normalizedDay);
    }
  }

  return Array.from(uniqueDays).sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b]);
};

const sanitizeSubjects = (subjects: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const subject of subjects) {
    const trimmed = subject.trim();
    if (!trimmed) continue;

    const key = normalizeText(trimmed);
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
  }

  return result;
};

const normalizeSetupData = (setupData: UserSetupData): UserSetupData => {
  return {
    concurso: setupData.concurso.trim(),
    nivel: setupData.nivel.trim(),
    foco: setupData.foco.trim(),
    disponibilidade: setupData.disponibilidade.trim(),
    examDate: setupData.examDate.trim(),
    materias: sanitizeSubjects(setupData.materias),
    diasDisponiveis: normalizeAvailableDays(setupData.diasDisponiveis),
  };
};

const normalizeSubjectForProgress = (subject: string): string => {
  return subject.replace(/^Revis[aã]o\s*-\s*/i, '').trim();
};

const createLocalDateStamp = (value: string | Date): string | null => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseDurationToMinutes = (duration: string | number): number => {
  if (typeof duration === 'number') return duration;

  const value = duration.trim().toLowerCase();

  if (value.includes('h')) {
    const hoursMatch = value.match(/(\d+)\s*h/);
    const minutesMatch = value.match(/(\d+)\s*min/);

    const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;

    if (!Number.isNaN(hours) || !Number.isNaN(minutes)) {
      return hours * 60 + minutes;
    }
  }

  const numberOnly = parseInt(value.replace(/\D/g, ''), 10);
  return Number.isNaN(numberOnly) ? 0 : numberOnly;
};

export const formatMinutesToDuration = (minutes: number): string => {
  const safeMinutes = Math.max(0, Math.round(minutes));

  if (safeMinutes === 0) return '0min';
  if (safeMinutes < 60) return `${safeMinutes}min`;

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${remainingMinutes}min`;
};

const getUpcomingDateForDay = (dayLabel: string, baseDate: Date): string | undefined => {
  const targetDayIndex = JS_DAY_INDEX[dayLabel];

  if (typeof targetDayIndex !== 'number') {
    return undefined;
  }

  const next = new Date(baseDate);
  next.setHours(0, 0, 0, 0);

  const diff = (targetDayIndex - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + diff);

  return createLocalDateStamp(next) ?? undefined;
};

const sortDaysByDate = (days: ScheduleDay[]): ScheduleDay[] => {
  return [...days].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.day.localeCompare(b.day);
  });
};

const enrichScheduleDay = (day: ScheduleDay): ScheduleDay => {
  const plannedLoadMinutes = day.blocks.reduce(
    (acc, block) => acc + parseDurationToMinutes(block.duration),
    0
  );
  const completedLoadMinutes = day.blocks
    .filter((block) => block.completed)
    .reduce((acc, block) => acc + parseDurationToMinutes(block.duration), 0);
  const hasWeeklyRecoveryBlock = day.blocks.some(
    (block) => block.isWeeklyRecoveryBlock
  );
  const isRecoveryDay =
    day.blocks.length > 0 &&
    day.blocks.every((block) => (block.mode ?? 'focus') === 'recovery');

  return {
    ...day,
    hasWeeklyRecoveryBlock,
    isRecoveryDay,
    expectedBlocksCount: day.blocks.length,
    completedBlocksCount: day.blocks.filter((block) => block.completed).length,
    plannedLoadMinutes,
    completedLoadMinutes,
  };
};

const enrichScheduleDays = (days: ScheduleDay[]): ScheduleDay[] => {
  return days.map((day) => enrichScheduleDay(day));
};

const calculateRecoveryDebt = (days: ScheduleDay[]): number => {
  const todayStamp = createLocalDateStamp(new Date());

  if (!todayStamp) {
    return 0;
  }

  return days.reduce((acc, day) => {
    if (!day.date || day.date >= todayStamp) {
      return acc;
    }

    const pendingBlocks = day.blocks.filter(
      (block) =>
        !block.completed && !block.isRecoveryInsertion && !block.isWeeklyRecoveryBlock
    ).length;

    return acc + pendingBlocks;
  }, 0);
};

const createScheduleIntelligence = (
  days: ScheduleDay[],
  previous?: ScheduleIntelligence,
  overrides: Partial<ScheduleIntelligence> = {}
): ScheduleIntelligence => {
  return {
    weeklyRecoveryBlockEnabled:
      overrides.weeklyRecoveryBlockEnabled ??
      previous?.weeklyRecoveryBlockEnabled ??
      true,
    weeklyRecoveryBlockUsed:
      overrides.weeklyRecoveryBlockUsed ?? previous?.weeklyRecoveryBlockUsed ?? 0,
    recoveryDebt: overrides.recoveryDebt ?? calculateRecoveryDebt(days),
    lastRebalancedAt:
      overrides.lastRebalancedAt ?? previous?.lastRebalancedAt ?? null,
    lastAdaptiveUpdateAt:
      overrides.lastAdaptiveUpdateAt ?? previous?.lastAdaptiveUpdateAt ?? null,
    userPhase: overrides.userPhase ?? previous?.userPhase,
  };
};

const createCompletedSessionKey = (
  dayLabel: string,
  block: Pick<StudyBlock, 'subject' | 'time' | 'type'>,
  completedAt: string | Date
): string | null => {
  const dateStamp = createLocalDateStamp(completedAt);

  if (!dateStamp) {
    return null;
  }

  return [
    dateStamp,
    normalizeText(dayLabel),
    normalizeText(normalizeSubjectForProgress(block.subject)),
    block.time,
    block.type ?? 'new',
  ].join('|');
};

const applyCompletedSessionsToDays = (
  days: ScheduleDay[],
  completedSessionKeys: string[]
): ScheduleDay[] => {
  const completedSessionKeySet = new Set(completedSessionKeys);
  const now = new Date().toISOString();

  return enrichScheduleDays(
    days.map((day) => ({
      ...day,
      blocks: day.blocks.map((block) => {
        const completedSessionKey = createCompletedSessionKey(
          day.day,
          block,
          day.date ?? now
        );

        if (
          !completedSessionKey ||
          !completedSessionKeySet.has(completedSessionKey)
        ) {
          return block;
        }

        return {
          ...block,
          completed: true,
          skipped: false,
          status: 'completed',
          completedAt: block.completedAt ?? now,
        };
      }),
    }))
  );
};

const countSessionsBySubject = (days: ScheduleDay[]): Record<string, number> => {
  const sessionsBySubject: Record<string, number> = {};

  for (const day of days) {
    for (const block of day.blocks) {
      const subject = normalizeSubjectForProgress(block.subject);

      if (!subject) continue;

      sessionsBySubject[subject] = (sessionsBySubject[subject] ?? 0) + 1;
    }
  }

  return sessionsBySubject;
};

const countCompletedSessionsBySubject = (
  days: ScheduleDay[]
): {
  completedSessionKeys: string[];
  completedSessionsBySubject: Record<string, number>;
} => {
  const completedSessionKeys = new Set<string>();
  const completedSessionsBySubject: Record<string, number> = {};

  for (const day of days) {
    for (const block of day.blocks) {
      if (!block.completed) continue;

      const subject = normalizeSubjectForProgress(block.subject);

      if (!subject) continue;

      const completedSessionKey = createCompletedSessionKey(
        day.day,
        block,
        day.date ?? block.completedAt ?? new Date()
      );

      if (!completedSessionKey || completedSessionKeys.has(completedSessionKey)) {
        continue;
      }

      completedSessionKeys.add(completedSessionKey);
      completedSessionsBySubject[subject] =
        (completedSessionsBySubject[subject] ?? 0) + 1;
    }
  }

  return {
    completedSessionKeys: Array.from(completedSessionKeys),
    completedSessionsBySubject,
  };
};

const getPlanningCyclesUntilExam = (examDate: string): number => {
  const parsedExamDate = new Date(examDate);

  if (Number.isNaN(parsedExamDate.getTime())) {
    return 1;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedExamDate.setHours(0, 0, 0, 0);

  const diffMs = parsedExamDate.getTime() - today.getTime();
  const daysUntilExam = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return Math.max(1, Math.ceil(daysUntilExam / 7));
};

const buildTargetSessionsBySubject = (
  setupData: UserSetupData,
  days: ScheduleDay[]
): Record<string, number> => {
  const weeklySessionsBySubject = countSessionsBySubject(days);
  const planningCycles = getPlanningCyclesUntilExam(setupData.examDate);
  const targetSessionsBySubject: Record<string, number> = {};

  for (const [subject, weeklySessions] of Object.entries(weeklySessionsBySubject)) {
    targetSessionsBySubject[subject] = Math.max(1, weeklySessions * planningCycles);
  }

  return targetSessionsBySubject;
};

export const createProgressSnapshotFromScheduleDays = (
  days: ScheduleDay[]
): SubjectProgressSnapshot => {
  const { completedSessionKeys, completedSessionsBySubject } =
    countCompletedSessionsBySubject(days);
  const targetSessionsBySubject = countSessionsBySubject(days);

  for (const [subject, completedSessions] of Object.entries(
    completedSessionsBySubject
  )) {
    targetSessionsBySubject[subject] = Math.max(
      targetSessionsBySubject[subject] ?? 0,
      completedSessions,
      1
    );
  }

  return {
    completedSessionKeys,
    completedSessionsBySubject,
    targetSessionsBySubject,
  };
};

export const createSetupHash = (setupData: UserSetupData): string => {
  const normalizedSetup = normalizeSetupData(setupData);

  return JSON.stringify({
    concurso: normalizeText(normalizedSetup.concurso),
    nivel: normalizeText(normalizedSetup.nivel),
    foco: normalizeText(normalizedSetup.foco),
    disponibilidade: normalizeText(normalizedSetup.disponibilidade),
    examDate: normalizedSetup.examDate,
    materias: [...normalizedSetup.materias]
      .map((subject) => normalizeText(subject))
      .sort(),
    diasDisponiveis: [...normalizedSetup.diasDisponiveis].sort(
      (a, b) => DAY_ORDER[a] - DAY_ORDER[b]
    ),
  });
};

export const getBlocksPerDay = (disponibilidade: string): number => {
  const value = normalizeText(disponibilidade);

  if (
    value.includes('ate 1 hora') ||
    value.includes('ate 1h') ||
    value.includes('1 hora') ||
    value === '1h'
  ) {
    return 1;
  }

  if (
    value.includes('1 a 2 horas') ||
    value.includes('1 a 2h') ||
    value.includes('1-2h') ||
    value.includes('1–2h') ||
    value.includes('entre 1 e 2')
  ) {
    return 2;
  }

  if (
    value.includes('2 a 4 horas') ||
    value.includes('2 a 4h') ||
    value.includes('2-4h') ||
    value.includes('2–4h') ||
    value.includes('entre 2 e 4')
  ) {
    return 3;
  }

  if (
    value.includes('mais de 4 horas') ||
    value.includes('mais de 4') ||
    value.includes('+4h') ||
    value.includes('4+h') ||
    value.includes('4 ou mais')
  ) {
    return 4;
  }

  return 2;
};

export const getBlockDurationByLevel = (nivel: string): string => {
  const value = normalizeText(nivel);

  if (value.includes('iniciante')) return '45min';
  if (value.includes('intermediario')) return '1h';
  if (value.includes('avancado')) return '1h30';

  return '1h';
};

export const getReviewDurationByLevel = (nivel: string): string => {
  const value = normalizeText(nivel);

  if (value.includes('iniciante')) return '30min';
  if (value.includes('intermediario')) return '40min';
  if (value.includes('avancado')) return '45min';

  return '40min';
};

const getDailyFocusAdjustedBlocks = (foco: string, baseBlocks: number): number => {
  const normalizedFocus = normalizeText(foco);

  if (normalizedFocus.includes('constancia diaria')) {
    return Math.max(1, Math.min(baseBlocks, 2));
  }

  if (normalizedFocus.includes('aprovacao rapida')) {
    return Math.min(baseBlocks + 1, 4);
  }

  return baseBlocks;
};

const getBlockTypeByFocus = (
  foco: string,
  blockIndex: number
): StudyBlockType => {
  const normalizedFocus = normalizeText(foco);

  if (normalizedFocus.includes('aprovacao rapida')) {
    return blockIndex % 3 === 2 ? 'practice' : 'new';
  }

  return 'new';
};

const getTipForBlock = (
  type: StudyBlockType,
  nivel: string,
  foco: string
): string => {
  const normalizedLevel = normalizeText(nivel);
  const normalizedFocus = normalizeText(foco);

  if (type === 'review') {
    if (normalizedLevel.includes('iniciante')) {
      return 'Faça revisão ativa com resumos curtos e 5 perguntas-chave.';
    }
    if (normalizedLevel.includes('avancado')) {
      return 'Revise com questões e recuperação ativa sem consultar material.';
    }
    return 'Revise os pontos principais e teste sua memória sem apoio.';
  }

  if (type === 'practice') {
    return 'Resolva questões da matéria e marque erros recorrentes para revisão.';
  }

  if (normalizedFocus.includes('base forte')) {
    return 'Estude com calma, priorizando compreensão profunda e anotações úteis.';
  }

  if (normalizedFocus.includes('aprovacao rapida')) {
    return 'Use blocos objetivos com foco em rendimento e avanço constante.';
  }

  if (normalizedLevel.includes('iniciante')) {
    return 'Use Pomodoro simples e finalize com um resumo de 3 linhas.';
  }

  if (normalizedLevel.includes('avancado')) {
    return 'Priorize estudo profundo, questões e revisão dos erros do bloco anterior.';
  }

  return 'Mantenha foco total no bloco e evite trocar de matéria antes de concluir.';
};

const createId = (prefix: string, ...parts: Array<string | number>): string => {
  return [prefix, ...parts]
    .map((part) => String(part).trim().replace(/\s+/g, '-').toLowerCase())
    .join('_');
};

function createWeeklyRecoveryBlock(day: string, index: number): StudyBlock {
  return {
    id: `block_${day}_recovery_${index}`,
    subject: 'Bloco livre de recuperação',
    time: RECOVERY_BLOCK_TIME,
    duration: '30min',
    mode: 'recovery',
    type: 'review',
    tip: 'Use este bloco para recuperar atrasos, revisar duvidas ou reorganizar a semana.',
    completed: false,
    skipped: false,
    status: 'pending',
    generatedReviewIds: [],
    isWeeklyRecoveryBlock: true,
    isRecoveryInsertion: true,
  };
}

export const generateScheduleFromSubjects = (
  setupData: UserSetupData
): ScheduleDay[] => {
  const normalizedSetup = normalizeSetupData(setupData);
  const subjects = normalizedSetup.materias;

  if (subjects.length === 0) return [];

  const daysToUse =
    normalizedSetup.diasDisponiveis.length > 0
      ? normalizedSetup.diasDisponiveis
      : [...DEFAULT_DAYS];

  const baseBlocksPerDay = getBlocksPerDay(normalizedSetup.disponibilidade);
  const adjustedBlocksPerDay = getDailyFocusAdjustedBlocks(
    normalizedSetup.foco,
    baseBlocksPerDay
  );

  const regularBlockDuration = getBlockDurationByLevel(normalizedSetup.nivel);
  const reviewBlockDuration = getReviewDurationByLevel(normalizedSetup.nivel);
  const normalizedFocus = normalizeText(normalizedSetup.foco);
  const isReviewFocus = normalizedFocus.includes('revisao');
  const isBaseForteFocus = normalizedFocus.includes('base forte');

  const schedule: ScheduleDay[] = [];
  let subjectCursor = 0;
  const baseDate = new Date();

  for (let dayIndex = 0; dayIndex < daysToUse.length; dayIndex += 1) {
    const day = daysToUse[dayIndex];
    const blocks: StudyBlock[] = [];

    for (let blockIndex = 0; blockIndex < adjustedBlocksPerDay; blockIndex += 1) {
      let subject: string;

      if (isBaseForteFocus && subjects.length > 1) {
        const pairStart = (dayIndex * 2) % subjects.length;
        subject = subjects[(pairStart + (blockIndex % 2)) % subjects.length];
      } else {
        subject = subjects[subjectCursor % subjects.length];
        subjectCursor += 1;
      }

      const type = getBlockTypeByFocus(normalizedSetup.foco, blockIndex);
      const time = SLOT_TIMES[blockIndex] ?? '18:00';

      blocks.push({
        id: createId('block', day, blockIndex + 1, subject),
        subject,
        time,
        duration: regularBlockDuration,
        type,
        mode: type === 'review' ? 'review' : 'focus',
        tip: getTipForBlock(type, normalizedSetup.nivel, normalizedSetup.foco),
        completed: false,
        skipped: false,
        status: 'pending',
        generatedReviewIds: [],
      });
    }

    if (isReviewFocus && blocks.length > 0) {
      const lastRegularBlock = blocks[blocks.length - 1];
      const reviewTime =
        SLOT_TIMES[Math.min(blocks.length, SLOT_TIMES.length - 1)] ?? '18:00';

      blocks.push({
        id: createId('block', day, 'review', lastRegularBlock.subject),
        subject: `Revisão - ${lastRegularBlock.subject}`,
        time: reviewTime,
        duration: reviewBlockDuration,
        type: 'review',
        mode: 'review',
        tip: getTipForBlock('review', normalizedSetup.nivel, normalizedSetup.foco),
        completed: false,
        skipped: false,
        status: 'pending',
        generatedReviewIds: [],
      });
    }

    schedule.push({
      id: createId('day', day, dayIndex + 1),
      day,
      date: getUpcomingDateForDay(day, baseDate),
      blocks,
    });
  }

  const datedSchedule = sortDaysByDate(schedule);

  if (datedSchedule.length > 0) {
    const lastDayIndex = datedSchedule.length - 1;
    const targetDay = datedSchedule[lastDayIndex];

    targetDay.blocks.push(
      createWeeklyRecoveryBlock(targetDay.day, targetDay.blocks.length + 1)
    );
  }

  return enrichScheduleDays(datedSchedule);
};

export const buildPersistedSchedule = (
  setupData: UserSetupData,
  previousSchedule: PersistedSchedule | null = null
): PersistedSchedule => {
  const normalizedSetup = normalizeSetupData(setupData);
  const generatedDays = generateScheduleFromSubjects(normalizedSetup);
  const previousProgress =
    previousSchedule?.progress ??
    createProgressSnapshotFromScheduleDays(previousSchedule?.days ?? []);
  const completedSessionKeys = Array.from(
    new Set(previousProgress.completedSessionKeys ?? [])
  );
  const days = enrichScheduleDays(
    applyCompletedSessionsToDays(generatedDays, completedSessionKeys)
  );
  const targetSessionsBySubject = buildTargetSessionsBySubject(normalizedSetup, days);
  const completedSessionsBySubject: Record<string, number> = {};

  for (const subject of Object.keys(targetSessionsBySubject)) {
    const previousCompleted =
      previousProgress.completedSessionsBySubject[subject] ?? 0;

    completedSessionsBySubject[subject] = Math.min(
      previousCompleted,
      targetSessionsBySubject[subject]
    );
  }

  return {
    days,
    meta: {
      generatedAt: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
      setupHash: createSetupHash(normalizedSetup),
    },
    progress: {
      completedSessionKeys,
      completedSessionsBySubject,
      targetSessionsBySubject,
    },
    expectedProgress: calculateExpectedProgressFromDays(days),
    intelligence: createScheduleIntelligence(days, previousSchedule?.intelligence),
  };
};

export const isScheduleOutdated = (
  persistedSchedule: PersistedSchedule | null,
  currentSetupData: UserSetupData
): boolean => {
  if (!persistedSchedule) return true;

  return (
    persistedSchedule.meta.setupHash !== createSetupHash(currentSetupData) ||
    persistedSchedule.meta.engineVersion !== ENGINE_VERSION
  );
};

export const validateSetupBeforeSchedule = (
  setupData: UserSetupData
): {
  isValid: boolean;
  errors: string[];
} => {
  const normalizedSetup = normalizeSetupData(setupData);
  const errors: string[] = [];

  if (!normalizedSetup.nivel) {
    errors.push('Selecione seu nível.');
  }

  if (!normalizedSetup.foco) {
    errors.push('Selecione seu foco.');
  }

  if (!normalizedSetup.disponibilidade) {
    errors.push('Selecione sua disponibilidade.');
  }

  if (!normalizedSetup.materias.length) {
    errors.push('Adicione pelo menos uma matéria.');
  }

  if (!normalizedSetup.diasDisponiveis.length) {
    errors.push('Defina pelo menos um dia disponível.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const completeBlock = (
  schedule: PersistedSchedule,
  blockId: string,
  payload?: Partial<
    Pick<
      StudyBlock,
      | 'mode'
      | 'status'
      | 'startedAt'
      | 'rescheduledTo'
      | 'skipped'
      | 'interruptionCount'
      | 'perceivedEnergyLevel'
      | 'perceivedDifficulty'
      | 'confidenceScore'
      | 'reviewNote'
      | 'completedAt'
    >
  >
): PersistedSchedule => {
  let completedSubject: string | null = null;
  let completedSessionKey: string | null = null;
  let usedWeeklyRecoveryBlock = false;
  const completedAt = payload?.completedAt ?? new Date().toISOString();

  const updatedDays: ScheduleDay[] = schedule.days.map((day) => {
    const updatedBlocks: StudyBlock[] = day.blocks.map((block) => {
      if (block.id !== blockId) return block;
      if (block.completed) return block;

      completedSubject = normalizeSubjectForProgress(block.subject);
      completedSessionKey = createCompletedSessionKey(
        day.day,
        block,
        day.date ?? completedAt
      );
      usedWeeklyRecoveryBlock = Boolean(block.isWeeklyRecoveryBlock);

      return {
        ...block,
        completed: true,
        skipped: payload?.skipped ?? false,
        status: 'completed',
        mode: payload?.mode ?? block.mode ?? 'focus',
        startedAt: payload?.startedAt ?? block.startedAt ?? completedAt,
        rescheduledTo: payload?.rescheduledTo ?? block.rescheduledTo ?? null,
        interruptionCount: payload?.interruptionCount ?? block.interruptionCount,
        perceivedEnergyLevel:
          payload?.perceivedEnergyLevel ?? block.perceivedEnergyLevel,
        perceivedDifficulty:
          payload?.perceivedDifficulty ?? block.perceivedDifficulty,
        confidenceScore: payload?.confidenceScore ?? block.confidenceScore,
        reviewNote: payload?.reviewNote ?? block.reviewNote ?? null,
        completedAt: payload?.completedAt ?? completedAt,
      };
    });

    return enrichScheduleDay({
      ...day,
      blocks: updatedBlocks,
    });
  });

  const intelligence = createScheduleIntelligence(updatedDays, schedule.intelligence, {
    weeklyRecoveryBlockUsed:
      (schedule.intelligence?.weeklyRecoveryBlockUsed ?? 0) +
      (usedWeeklyRecoveryBlock ? 1 : 0),
  });
  const expectedProgress = calculateExpectedProgressFromDays(updatedDays);

  if (!completedSubject || !completedSessionKey) {
    return {
      ...schedule,
      days: updatedDays,
      expectedProgress,
      intelligence,
    };
  }

  if (schedule.progress.completedSessionKeys.includes(completedSessionKey)) {
    return {
      ...schedule,
      days: updatedDays,
      expectedProgress,
      intelligence,
    };
  }

  const targetSessions =
    schedule.progress.targetSessionsBySubject[completedSubject] ?? 1;
  const completedSessions =
    schedule.progress.completedSessionsBySubject[completedSubject] ?? 0;

  return {
    ...schedule,
    days: updatedDays,
    progress: {
      ...schedule.progress,
      completedSessionKeys: [
        ...schedule.progress.completedSessionKeys,
        completedSessionKey,
      ],
      completedSessionsBySubject: {
        ...schedule.progress.completedSessionsBySubject,
        [completedSubject]: Math.min(completedSessions + 1, targetSessions),
      },
    },
    expectedProgress,
    intelligence,
  };
};

export const getSubjectProgressMap = (
  schedule: PersistedSchedule | null
): Record<string, number> => {
  if (!schedule) return {};

  const progressMap: Record<string, number> = {};
  const progressSnapshot =
    schedule.progress ?? createProgressSnapshotFromScheduleDays(schedule.days);
  const subjects = new Set([
    ...Object.keys(progressSnapshot.targetSessionsBySubject),
    ...Object.keys(progressSnapshot.completedSessionsBySubject),
  ]);

  for (const subject of subjects) {
    const targetSessions = progressSnapshot.targetSessionsBySubject[subject] ?? 0;
    const completedSessions =
      progressSnapshot.completedSessionsBySubject[subject] ?? 0;

    progressMap[subject] =
      targetSessions > 0
        ? Math.max(0, Math.min(completedSessions / targetSessions, 1))
        : 0;
  }

  return progressMap;
};

export const getEngineVersion = (): string => ENGINE_VERSION;
