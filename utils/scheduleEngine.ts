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

export type StudyBlock = {
  id: string;
  subject: string;
  time: string;
  duration: string;
  type?: StudyBlockType;
  tip?: string;

  completed?: boolean;
  completedAt?: string;
  skipped?: boolean;
};

export type ScheduleDay = {
  id: string;
  day: string;
  blocks: StudyBlock[];
};

export type ScheduleMeta = {
  generatedAt: string;
  engineVersion: string;
  setupHash: string;
};

export type PersistedSchedule = {
  days: ScheduleDay[];
  meta: ScheduleMeta;
};

const ENGINE_VERSION = '1.0.0';

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
  'terça': 'Terça-feira',
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
  'sábado': 'Sábado',

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
  const isReviewFocus = normalizeText(normalizedSetup.foco).includes('revisao');
  const isBaseForteFocus = normalizeText(normalizedSetup.foco).includes('base forte');

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
        tip: getTipForBlock('review', normalizedSetup.nivel, normalizedSetup.foco),
      });
    }

    schedule.push({
      id: createId('day', day, dayIndex + 1),
      day,
      blocks,
    });
  }

  return schedule;
};

export const buildPersistedSchedule = (
  setupData: UserSetupData
): PersistedSchedule => {
  const normalizedSetup = normalizeSetupData(setupData);
  const days = generateScheduleFromSubjects(normalizedSetup);

  return {
    days,
    meta: {
      generatedAt: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
      setupHash: createSetupHash(normalizedSetup),
    },
  };
};

export const isScheduleOutdated = (
  persistedSchedule: PersistedSchedule,
  currentSetupData: UserSetupData
): boolean => {
  return persistedSchedule.meta.setupHash !== createSetupHash(currentSetupData);
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
  blockId: string
): PersistedSchedule => {
  const updatedDays = schedule.days.map((day) => ({
    ...day,
    blocks: day.blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            completed: true,
            completedAt: new Date().toISOString(),
          }
        : block
    ),
  }));

  return {
    ...schedule,
    days: updatedDays,
  };
};

export const getSubjectProgressMap = (
  schedule: ScheduleDay[]
): Record<string, number> => {
  const stats: Record<string, { total: number; completed: number }> = {};

  for (const day of schedule) {
    for (const block of day.blocks) {
      const rawSubject = block.subject.replace(/^Revisão\s*-\s*/i, '').trim();

      if (!stats[rawSubject]) {
        stats[rawSubject] = {
          total: 0,
          completed: 0,
        };
      }

      stats[rawSubject].total += 1;

      if (block.completed) {
        stats[rawSubject].completed += 1;
      }
    }
  }

  const progressMap: Record<string, number> = {};

  for (const subject of Object.keys(stats)) {
    const { total, completed } = stats[subject];
    progressMap[subject] = total > 0 ? completed / total : 0;
  }

  return progressMap;
};
