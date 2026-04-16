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
export type ScheduleBlockMode = 'focus' | 'review' | 'recovery';

export type StudyBlock = {
  id: string;
  subject: string;
  time: string;
  duration: string;
  type?: StudyBlockType;
  mode?: ScheduleBlockMode;
  tip?: string;
  completed?: boolean;
  completedAt?: string;
  skipped?: boolean;
  interruptionCount?: number | null;
  perceivedEnergyLevel?: number | null;
  perceivedDifficulty?: number | null;
  confidenceScore?: number | null;
};

export type ScheduleDay = {
  id: string;
  day: string;
  blocks: StudyBlock[];
  isRecoveryDay?: boolean;
  expectedBlocksCount?: number;
  completedBlocksCount?: number;
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

export type PersistedSchedule = {
  days: ScheduleDay[];
  meta: ScheduleMeta;
  progress: SubjectProgressSnapshot;
  expectedProgress?: number;
};

const ENGINE_VERSION = '1.2.0';

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
  const todayStamp = createLocalDateStamp(new Date());

  if (!todayStamp) {
    return days;
  }

  return days.map((day) => ({
    ...day,
    blocks: day.blocks.map((block) => {
      const completedSessionKey = createCompletedSessionKey(day.day, block, todayStamp);

      if (!completedSessionKey || !completedSessionKeySet.has(completedSessionKey)) {
        return block;
      }

      return {
        ...block,
        completed: true,
        completedAt: new Date().toISOString(),
      };
    }),
  }));
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
        block.completedAt ?? new Date()
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
      });
    }

    schedule.push({
      id: createId('day', day, dayIndex + 1),
      day,
      blocks,
      isRecoveryDay: false,
      expectedBlocksCount: blocks.length,
      completedBlocksCount: blocks.filter((block) => block.completed).length,
    });
  }

  return schedule;
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
  const days = applyCompletedSessionsToDays(generatedDays, completedSessionKeys);
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
    expectedProgress: 0,
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
      | 'interruptionCount'
      | 'perceivedEnergyLevel'
      | 'perceivedDifficulty'
      | 'confidenceScore'
      | 'completedAt'
    >
  >
): PersistedSchedule => {
  let completedSubject: string | null = null;
  let completedSessionKey: string | null = null;
  const completedAt = new Date().toISOString();

  const updatedDays = schedule.days.map((day) => {
    const updatedBlocks = day.blocks.map((block) => {
      if (block.id !== blockId) return block;
      if (block.completed) return block;

      completedSubject = normalizeSubjectForProgress(block.subject);
      completedSessionKey = createCompletedSessionKey(day.day, block, completedAt);

      return {
        ...block,
        completed: true,
        mode: payload?.mode ?? block.mode ?? 'focus',
        interruptionCount: payload?.interruptionCount ?? block.interruptionCount,
        perceivedEnergyLevel:
          payload?.perceivedEnergyLevel ?? block.perceivedEnergyLevel,
        perceivedDifficulty:
          payload?.perceivedDifficulty ?? block.perceivedDifficulty,
        confidenceScore: payload?.confidenceScore ?? block.confidenceScore,
        completedAt: payload?.completedAt ?? completedAt,
      };
    });

    return {
      ...day,
      blocks: updatedBlocks,
      completedBlocksCount: updatedBlocks.filter((block) => block.completed).length,
      expectedBlocksCount: day.expectedBlocksCount ?? day.blocks.length,
      isRecoveryDay: day.isRecoveryDay ?? false,
    };
  });

  if (!completedSubject || !completedSessionKey) {
    return {
      ...schedule,
      days: updatedDays,
    };
  }

  if (schedule.progress.completedSessionKeys.includes(completedSessionKey)) {
    return {
      ...schedule,
      days: updatedDays,
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
