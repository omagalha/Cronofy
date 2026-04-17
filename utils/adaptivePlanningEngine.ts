import type {
  BlockMode,
  BlockStatus,
  UserPhase,
} from '../apps/shared/types/intelligence';
import type { SubjectPracticeSignal } from '../apps/shared/types/practice';
import type { IReviewItem } from '../apps/shared/types/review';
import type { AIAnalysis, StudyLog } from '../context/AIContext';
import { getDaysUntilExam, resolveUserPhase } from './phaseEngine';
import {
  calculateActualProgressFromDays,
  calculateExpectedProgressFromDays,
  calculateMinimumRequiredProgress,
} from './progressEngine';
import { generateReviewsFromCompletedBlock } from './reviewEngine';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface StudyBlock {
  id: string;
  subject: string;
  duration: number;
  completed: boolean;
  difficulty?: number;
  scheduledDate?: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  confidenceScore?: number | null;
  reviewNote?: string | null;
  mode?: BlockMode;
  type?: 'new' | 'review' | 'practice';
  status?: BlockStatus;
  originBlockId?: string | null;
  isRecoveryInsertion?: boolean;
  isWeeklyRecoveryBlock?: boolean;
}

export interface ScheduleDay {
  id?: string;
  day?: string;
  date: string;
  weekday: Weekday;
  blocks: StudyBlock[];
  isRecoveryDay?: boolean;
  hasWeeklyRecoveryBlock?: boolean;
  expectedBlocksCount?: number;
  completedBlocksCount?: number;
  plannedLoadMinutes?: number;
  completedLoadMinutes?: number;
}

export interface UserSetupData {
  examDate?: string;
  studyDaysPerWeek?: number;
  availableHoursPerDay?: number;
  subjects?: Array<{
    name: string;
    priority?: number;
    difficulty?: number;
  }>;
}

export interface AdaptiveSuggestion {
  type:
    | 'rebalance_subject'
    | 'reduce_load'
    | 'recover_missed_blocks'
    | 'protect_consistency'
    | 'insert_review';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface AdaptivePlanningResult {
  updatedSchedule: ScheduleDay[];
  suggestions: AdaptiveSuggestion[];
  metadata: {
    delayedBlocksRecovered: number;
    loadReducedBlocks: number;
    reviewBlocksInserted: number;
    rebalanceActions: number;
    recoveryBlocksUsed: number;
    expectedProgress: number;
    actualProgress: number;
    minimumRequiredProgress: number;
    userPhase: UserPhase;
  };
}

export interface BuildAdaptivePlanInput {
  schedule: ScheduleDay[];
  studyLogs: StudyLog[];
  analysis?: AIAnalysis | null;
  setup?: UserSetupData;
  reviewQueue?: IReviewItem[];
  practiceSignals?: SubjectPracticeSignal[];
  generatedAt?: string;
}

export interface AdaptiveCompletionMetrics {
  interruptionCount?: number | null;
  perceivedEnergyLevel?: number | null;
  perceivedDifficulty?: number | null;
  confidenceScore?: number | null;
}

const DEFAULT_TIME_SLOTS = ['08:00', '10:00', '14:00', '16:00', '18:00', '20:00'];
const MIN_MEANINGFUL_PRACTICE_QUESTIONS = 5;
const LOW_PRACTICE_ACCURACY = 65;
const LOW_PRACTICE_RECENT_ACCURACY = 60;

const PRODUCT_COPY = {
  recoverMissedBlocks: (count: number): AdaptiveSuggestion => ({
    type: 'recover_missed_blocks',
    title: count >= 3 ? 'Atrasos redistribuídos no plano' : 'Blocos atrasados redistribuídos',
    description:
      'Blocos atrasados foram redistribuídos para manter seu ritmo.',
    impact: count >= 3 ? 'high' : 'medium',
  }),

  reduceLoad: (phase: UserPhase): AdaptiveSuggestion => ({
    type: 'reduce_load',
    title:
      phase === 'fatigue_risk'
        ? 'Carga reduzida para proteger constância'
        : 'Carga futura ajustada com inteligência',
    description:
      phase === 'fatigue_risk'
        ? 'O sistema encurtou os próximos blocos para reduzir fadiga e aumentar a chance de execução consistente.'
        : 'Os próximos blocos foram ajustados para manter o cronograma sustentável e mais fácil de seguir.',
    impact: phase === 'fatigue_risk' ? 'high' : 'medium',
  }),

  insertReview: (priority?: number): AdaptiveSuggestion => ({
    type: 'insert_review',
    title: 'Revisão espaçada priorizada',
    description:
      'Bloco curto de revisão inserido para melhorar retenção.',
    impact: priority === 5 ? 'high' : 'medium',
  }),

  rebalanceSubject: (subject: string, phase: UserPhase): AdaptiveSuggestion => ({
    type: 'rebalance_subject',
    title: `Mais foco em ${subject}`,
    description:
      phase === 'sprint_to_exam'
        ? 'O plano aumentou o reforço e os blocos de questões na matéria que mais precisa de resposta agora.'
        : 'O cronograma ampliou espaço para a matéria com pior sinal recente de desempenho.',
    impact: 'medium',
  }),

  protectConsistency: (): AdaptiveSuggestion => ({
    type: 'protect_consistency',
    title: 'Estrutura preservada',
    description:
      'O sistema manteve o plano atual para evitar atrito desnecessário e sustentar seu bom ritmo.',
    impact: 'low',
  }),

  sprintBelowMinimum: (): AdaptiveSuggestion => ({
    type: 'protect_consistency',
    title: 'Ritmo abaixo do mínimo necessário',
    description:
      'Seu progresso atual está abaixo da evolução mínima esperada até a prova. Vale priorizar execução e revisão nos próximos dias.',
    impact: 'high',
  }),
} as const;

const cloneSchedule = (schedule: ScheduleDay[]): ScheduleDay[] =>
  schedule.map((day) => ({
    ...day,
    blocks: day.blocks.map((block) => ({ ...block })),
  }));

const normalizeSubjectName = (value: string): string => value.trim().toLowerCase();

const normalizePracticeSignals = (
  practiceSignals: SubjectPracticeSignal[] = []
): SubjectPracticeSignal[] => {
  return practiceSignals
    .filter((signal) => typeof signal.subject === 'string' && signal.subject.trim().length > 0)
    .map((signal) => ({
      ...signal,
      totalQuestions: Math.max(0, signal.totalQuestions),
      accuracy: Math.max(0, Math.min(100, Math.round(signal.accuracy))),
      recentAccuracy: Math.max(0, Math.min(100, Math.round(signal.recentAccuracy))),
      recentConfidenceScore:
        typeof signal.recentConfidenceScore === 'number'
          ? Math.max(0, Math.min(5, Math.round(signal.recentConfidenceScore)))
          : null,
      recentDifficulty:
        typeof signal.recentDifficulty === 'number'
          ? Math.max(0, Math.min(5, Math.round(signal.recentDifficulty)))
          : null,
      linkedBlockCount:
        typeof signal.linkedBlockCount === 'number'
          ? Math.max(0, Math.round(signal.linkedBlockCount))
          : 0,
      confidenceMismatch: Boolean(signal.confidenceMismatch),
    }));
};

const getDayMetrics = (day: ScheduleDay): ScheduleDay => {
  const plannedLoadMinutes = day.blocks.reduce(
    (acc, block) => acc + Math.max(0, Math.round(block.duration || 0)),
    0
  );

  const completedLoadMinutes = day.blocks
    .filter((block) => block.completed)
    .reduce((acc, block) => acc + Math.max(0, Math.round(block.duration || 0)), 0);

  return {
    ...day,
    hasWeeklyRecoveryBlock: day.blocks.some((block) => block.isWeeklyRecoveryBlock),
    isRecoveryDay:
      day.blocks.length > 0 &&
      day.blocks.every((block) => (block.mode ?? 'focus') === 'recovery'),
    expectedBlocksCount: day.blocks.length,
    completedBlocksCount: day.blocks.filter((block) => block.completed).length,
    plannedLoadMinutes,
    completedLoadMinutes,
  };
};

const applyDayMetrics = (schedule: ScheduleDay[]): ScheduleDay[] =>
  schedule.map((day) => getDayMetrics(day));

const isPastDay = (date?: string): boolean => {
  if (!date) return false;

  const today = new Date();
  const target = new Date(date);

  if (Number.isNaN(target.getTime())) {
    return false;
  }

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return target.getTime() < today.getTime();
};

const isFutureOrToday = (date?: string): boolean => {
  if (!date) return false;

  const today = new Date();
  const target = new Date(date);

  if (Number.isNaN(target.getTime())) {
    return false;
  }

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return target.getTime() >= today.getTime();
};

const getIncompletePastBlocks = (
  schedule: ScheduleDay[]
): Array<{ day: ScheduleDay; block: StudyBlock }> => {
  return schedule.flatMap((day) =>
    isPastDay(day.date)
      ? day.blocks
          .filter((block) => !block.completed)
          .map((block) => ({ day, block }))
      : []
  );
};

const getFutureDays = (schedule: ScheduleDay[]): ScheduleDay[] => {
  return schedule.filter((day) => isFutureOrToday(day.date));
};

const getSubjectPerformance = (
  studyLogs: StudyLog[]
): Record<string, { appearances: number; completionRate: number }> => {
  const map: Record<string, { appearances: number; completed: number }> = {};

  for (const log of studyLogs) {
    for (const rawSubject of log.subjects) {
      const subject = rawSubject.trim();
      if (!subject) continue;

      if (!map[subject]) {
        map[subject] = { appearances: 0, completed: 0 };
      }

      map[subject].appearances += 1;

      if (log.completedBlocks >= log.plannedBlocks) {
        map[subject].completed += 1;
      }
    }
  }

  const result: Record<string, { appearances: number; completionRate: number }> = {};

  for (const [subject, data] of Object.entries(map)) {
    result[subject] = {
      appearances: data.appearances,
      completionRate:
        data.appearances === 0 ? 0 : data.completed / data.appearances,
    };
  }

  return result;
};

const getPracticeWeakSignal = (
  practiceSignals: SubjectPracticeSignal[] = []
): SubjectPracticeSignal | null => {
  const meaningfulSignals = normalizePracticeSignals(practiceSignals).filter(
    (signal) => signal.totalQuestions >= MIN_MEANINGFUL_PRACTICE_QUESTIONS
  );

  if (meaningfulSignals.length === 0) {
    return null;
  }

  const rankedSignals = [...meaningfulSignals].sort((a, b) => {
    const aHasMismatch = a.confidenceMismatch ? 1 : 0;
    const bHasMismatch = b.confidenceMismatch ? 1 : 0;
    const aIsFalling = a.trend === 'down' ? 1 : 0;
    const bIsFalling = b.trend === 'down' ? 1 : 0;

    if (aHasMismatch !== bHasMismatch) {
      return bHasMismatch - aHasMismatch;
    }

    if (aIsFalling !== bIsFalling) {
      return bIsFalling - aIsFalling;
    }

    if (a.recentAccuracy !== b.recentAccuracy) {
      return a.recentAccuracy - b.recentAccuracy;
    }

    if (a.accuracy !== b.accuracy) {
      return a.accuracy - b.accuracy;
    }

    return b.totalQuestions - a.totalQuestions;
  });

  const weakestSignal = rankedSignals[0];

  if (
    weakestSignal.confidenceMismatch ||
    weakestSignal.recentAccuracy <= LOW_PRACTICE_RECENT_ACCURACY ||
    weakestSignal.accuracy <= LOW_PRACTICE_ACCURACY ||
    weakestSignal.trend === 'down'
  ) {
    return weakestSignal;
  }

  return null;
};

const getWeakestSubject = (
  studyLogs: StudyLog[],
  analysis?: AIAnalysis | null,
  practiceSignals?: SubjectPracticeSignal[]
): string | null => {
  const meaningfulPracticeSignals = normalizePracticeSignals(practiceSignals).filter(
    (signal) => signal.totalQuestions >= MIN_MEANINGFUL_PRACTICE_QUESTIONS
  );
  const weakPracticeSignal = getPracticeWeakSignal(practiceSignals);

  if (weakPracticeSignal?.subject) {
    return weakPracticeSignal.subject;
  }

  if (meaningfulPracticeSignals.length > 0) {
    return null;
  }

  if (analysis?.hardestSubject) return analysis.hardestSubject;

  const performance = getSubjectPerformance(studyLogs);

  const ranked = Object.entries(performance)
    .map(([subject, data]) => ({
      subject,
      score: data.completionRate,
      appearances: data.appearances,
    }))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.appearances - a.appearances;
    });

  return ranked[0]?.subject ?? null;
};

const getRecentFailureTrend = (studyLogs: StudyLog[]): number => {
  const recent = studyLogs.slice(-5);

  if (recent.length === 0) return 0;

  const failures = recent.filter(
    (log) => log.completedBlocks < log.plannedBlocks
  ).length;

  return failures / recent.length;
};

const getReviewPriorityBlock = (reviewQueue: IReviewItem[]): IReviewItem | null => {
  const pendingItems = reviewQueue.filter((item) => item.status === 'pending');

  if (!pendingItems.length) return null;

  return [...pendingItems].sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    return a.dueDate.localeCompare(b.dueDate);
  })[0];
};

const shouldReduceLoad = (
  phase: UserPhase,
  analysis?: AIAnalysis | null,
  studyLogs?: StudyLog[]
): boolean => {
  const failureTrend = getRecentFailureTrend(studyLogs ?? []);

  if (phase === 'fatigue_risk') return true;
  if (phase === 'building_base' && (analysis?.consistencyScore ?? 1) < 0.6) {
    return true;
  }
  if (analysis?.currentRiskLevel === 'high') return true;
  if (failureTrend > 0.6) return true;
  if ((analysis?.completionRate ?? 1) < 0.55) return true;

  return false;
};

const shouldInsertReview = (
  phase: UserPhase,
  reviewQueue: IReviewItem[],
  analysis?: AIAnalysis | null,
  studyLogs?: StudyLog[],
  practiceSignals?: SubjectPracticeSignal[]
): boolean => {
  if (reviewQueue.some((item) => item.status === 'pending')) {
    return true;
  }

  if (getPracticeWeakSignal(practiceSignals)) {
    return true;
  }

  const failureTrend = getRecentFailureTrend(studyLogs ?? []);

  return (
    phase === 'consolidating' ||
    phase === 'sprint_to_exam' ||
    (phase === 'gaining_rhythm' &&
      ((analysis?.completionRate ?? 1) < 0.75 ||
        analysis?.currentRiskLevel === 'medium' ||
        failureTrend >= 0.4))
  );
};

const getPhaseLoadFactor = (
  phase: UserPhase,
  analysis?: AIAnalysis | null
): number => {
  if (phase === 'fatigue_risk') return 0.75;
  if (phase === 'building_base') return 0.85;
  if (phase === 'sprint_to_exam') return 0.85;

  return Math.min(Math.max(analysis?.suggestedLoadFactor ?? 0.95, 0.8), 1);
};

const safeTrimDuration = (duration: number, factor: number): number => {
  const trimmed = Math.round(duration * factor);
  return Math.max(25, trimmed);
};

const reduceFutureLoad = (
  schedule: ScheduleDay[],
  factor: number
): { schedule: ScheduleDay[]; affectedBlocks: number } => {
  const next = cloneSchedule(schedule);
  let affectedBlocks = 0;

  for (const day of next) {
    if (!isFutureOrToday(day.date)) continue;

    for (const block of day.blocks) {
      if (block.completed) continue;

      const oldDuration = Math.max(25, Math.round(block.duration || 0));
      const newDuration = safeTrimDuration(oldDuration, factor);

      if (newDuration < oldDuration) {
        block.duration = newDuration;
        affectedBlocks += 1;
      }
    }
  }

  return {
    schedule: applyDayMetrics(next),
    affectedBlocks,
  };
};

const getNextBlockTime = (blocks: StudyBlock[]): string => {
  return DEFAULT_TIME_SLOTS[Math.min(blocks.length, DEFAULT_TIME_SLOTS.length - 1)];
};

const recoverMissedBlocks = (
  schedule: ScheduleDay[]
): { schedule: ScheduleDay[]; recovered: number } => {
  const next = cloneSchedule(schedule);
  const missedBlocks = getIncompletePastBlocks(schedule).map(({ block }) => ({
    ...block,
  }));
  const futureDays = getFutureDays(next);

  if (missedBlocks.length === 0 || futureDays.length === 0) {
    return { schedule: applyDayMetrics(next), recovered: 0 };
  }

  let recovered = 0;
  let cursor = 0;

  for (const block of missedBlocks) {
    const preferredRecoveryDay =
      futureDays.find((day) => day.hasWeeklyRecoveryBlock) ??
      futureDays[cursor % futureDays.length];

    const alreadyRecovered = preferredRecoveryDay.blocks.some(
      (entry) =>
        entry.originBlockId === (block.originBlockId ?? block.id) &&
        entry.isRecoveryInsertion
    );

    if (alreadyRecovered) {
      cursor += 1;
      continue;
    }

    preferredRecoveryDay.blocks.push({
      ...block,
      id: `${block.id}-recovered-${recovered + 1}`,
      completed: false,
      status: 'pending',
      scheduledDate: preferredRecoveryDay.date,
      plannedStartTime:
        block.plannedStartTime ?? getNextBlockTime(preferredRecoveryDay.blocks),
      originBlockId: block.originBlockId ?? block.id,
      isRecoveryInsertion: true,
    });

    recovered += 1;
    cursor += 1;
  }

  return { schedule: applyDayMetrics(next), recovered };
};

const insertReviewBlock = (
  schedule: ScheduleDay[],
  reviewItem: Pick<IReviewItem, 'id' | 'sourceBlockId' | 'subject' | 'stage' | 'priority'>
): { schedule: ScheduleDay[]; inserted: number } => {
  const next = cloneSchedule(schedule);
  const futureDays = getFutureDays(next);

  if (futureDays.length === 0) {
    return { schedule: applyDayMetrics(next), inserted: 0 };
  }

  const targetDay =
    futureDays.find((day) => day.hasWeeklyRecoveryBlock) ?? futureDays[0];

  const reviewBlockId = `review-block-${reviewItem.id}`;
  const alreadyScheduled = targetDay.blocks.some(
    (block) =>
      block.id === reviewBlockId ||
      (block.originBlockId === reviewItem.sourceBlockId &&
        (block.mode ?? 'focus') === 'review')
  );

  if (alreadyScheduled) {
    return { schedule: applyDayMetrics(next), inserted: 0 };
  }

  targetDay.blocks.unshift({
    id: reviewBlockId,
    subject: `Revisão - ${reviewItem.subject}`,
    duration: reviewItem.stage === 'reinforcement' ? 25 : 30,
    completed: false,
    difficulty: 1,
    scheduledDate: targetDay.date,
    plannedStartTime: getNextBlockTime([]),
    confidenceScore: null,
    reviewNote: null,
    mode: 'review',
    type: 'review',
    status: 'pending',
    originBlockId: reviewItem.sourceBlockId,
  });

  return { schedule: applyDayMetrics(next), inserted: 1 };
};

const getSyntheticReviewTargetFromPractice = (
  practiceSignals: SubjectPracticeSignal[] = []
):
  | {
      id: string;
      sourceBlockId: string;
      subject: string;
      stage: 'reinforcement';
      priority: number;
    }
  | null => {
  const weakSignal = getPracticeWeakSignal(practiceSignals);

  if (!weakSignal) {
    return null;
  }

  return {
    id: `practice-review-${normalizeSubjectName(weakSignal.subject)}`,
    sourceBlockId: `practice-${normalizeSubjectName(weakSignal.subject)}`,
    subject: weakSignal.subject,
    stage: 'reinforcement',
    priority:
      weakSignal.confidenceMismatch ||
      weakSignal.recentAccuracy <= 50 ||
      weakSignal.trend === 'down'
        ? 5
        : 4,
  };
};

const rebalanceTowardWeakSubject = (
  schedule: ScheduleDay[],
  weakSubject: string | null,
  phase: UserPhase
): { schedule: ScheduleDay[]; actions: number } => {
  if (!weakSubject || phase === 'fatigue_risk') {
    return { schedule: applyDayMetrics(cloneSchedule(schedule)), actions: 0 };
  }

  const next = cloneSchedule(schedule);
  const futureDays = getFutureDays(next);

  if (futureDays.length === 0) {
    return { schedule: applyDayMetrics(next), actions: 0 };
  }

  const firstFutureDay = futureDays[0];

  const hasWeakSubjectAlready = firstFutureDay.blocks.some(
    (block) =>
      normalizeSubjectName(block.subject) === normalizeSubjectName(weakSubject)
  );

  if (hasWeakSubjectAlready) {
    return { schedule: applyDayMetrics(next), actions: 0 };
  }

  const donorDay = futureDays.find((day) =>
    day.blocks.some(
      (block) =>
        !block.completed &&
        normalizeSubjectName(block.subject) !== normalizeSubjectName(weakSubject)
    )
  );

  if (!donorDay) {
    return { schedule: applyDayMetrics(next), actions: 0 };
  }

  const donorBlock = donorDay.blocks.find(
    (block) =>
      !block.completed &&
      normalizeSubjectName(block.subject) !== normalizeSubjectName(weakSubject)
  );

  if (!donorBlock) {
    return { schedule: applyDayMetrics(next), actions: 0 };
  }

  const nextMode: BlockMode = phase === 'sprint_to_exam' ? 'questions' : 'focus';

  firstFutureDay.blocks.push({
    ...donorBlock,
    id: `${donorBlock.id}-rebalance-${normalizeSubjectName(weakSubject)}`,
    subject: weakSubject,
    duration:
      phase === 'sprint_to_exam'
        ? Math.max(25, Math.round(donorBlock.duration * 0.7))
        : Math.max(30, Math.round(donorBlock.duration * 0.85)),
    completed: false,
    difficulty: donorBlock.difficulty ?? 2,
    scheduledDate: firstFutureDay.date,
    plannedStartTime:
      donorBlock.plannedStartTime ?? getNextBlockTime(firstFutureDay.blocks),
    mode: nextMode,
    type: nextMode === 'questions' ? 'practice' : donorBlock.type ?? 'new',
    status: 'pending',
    originBlockId: donorBlock.originBlockId ?? donorBlock.id,
  });

  return { schedule: applyDayMetrics(next), actions: 1 };
};

const getRecoveryBlocksUsed = (
  schedule: ScheduleDay[],
  studyLogs: StudyLog[]
): number => {
  if (studyLogs.length > 0) {
    return studyLogs
      .slice(-7)
      .reduce((acc, log) => acc + (log.weeklyRecoveryBlockUsed ?? 0), 0);
  }

  return schedule.reduce(
    (acc, day) =>
      acc +
      day.blocks.filter(
        (block) => block.isWeeklyRecoveryBlock && block.completed
      ).length,
    0
  );
};

export function buildAdaptivePlan({
  schedule,
  studyLogs,
  analysis,
  setup,
  reviewQueue = [],
  practiceSignals = [],
  generatedAt,
}: BuildAdaptivePlanInput): AdaptivePlanningResult {
  let workingSchedule = applyDayMetrics(cloneSchedule(schedule));
  const suggestions: AdaptiveSuggestion[] = [];

  let delayedBlocksRecovered = 0;
  let loadReducedBlocks = 0;
  let reviewBlocksInserted = 0;
  let rebalanceActions = 0;

  const weakestSubject = getWeakestSubject(studyLogs, analysis, practiceSignals);
  const daysUntilExam = getDaysUntilExam(setup?.examDate);
  const userPhase = resolveUserPhase({
    analysis: analysis ?? null,
    daysUntilExam,
  });

  const recovered = recoverMissedBlocks(workingSchedule);
  workingSchedule = recovered.schedule;
  delayedBlocksRecovered = recovered.recovered;

  if (delayedBlocksRecovered > 0) {
    suggestions.push(PRODUCT_COPY.recoverMissedBlocks(delayedBlocksRecovered));
  }

  if (shouldReduceLoad(userPhase, analysis, studyLogs)) {
    const factor = getPhaseLoadFactor(userPhase, analysis);
    const reduced = reduceFutureLoad(workingSchedule, factor);
    workingSchedule = reduced.schedule;
    loadReducedBlocks = reduced.affectedBlocks;

    if (loadReducedBlocks > 0) {
      suggestions.push(PRODUCT_COPY.reduceLoad(userPhase));
    }
  }

  const priorityReview = getReviewPriorityBlock(reviewQueue);
  const practiceReviewTarget = getSyntheticReviewTargetFromPractice(practiceSignals);

  if (
    shouldInsertReview(
      userPhase,
      reviewQueue,
      analysis,
      studyLogs,
      practiceSignals
    )
  ) {
    const reviewTarget =
      priorityReview ??
      practiceReviewTarget ?? {
        id: `synthetic-review-${normalizeSubjectName(weakestSubject ?? 'review')}`,
        sourceBlockId: weakestSubject ?? 'review',
        subject: weakestSubject ?? 'Revisão estratégica',
        stage: 'reinforcement' as const,
        priority: 4,
      };

    const review = insertReviewBlock(workingSchedule, reviewTarget);
    workingSchedule = review.schedule;
    reviewBlocksInserted = review.inserted;

    if (reviewBlocksInserted > 0) {
      suggestions.push(
        PRODUCT_COPY.insertReview(
          priorityReview?.priority ?? practiceReviewTarget?.priority
        )
      );
    }
  }

  const rebalanced = rebalanceTowardWeakSubject(
    workingSchedule,
    weakestSubject,
    userPhase
  );
  workingSchedule = rebalanced.schedule;
  rebalanceActions = rebalanced.actions;

  if (rebalanceActions > 0 && weakestSubject) {
    suggestions.push(PRODUCT_COPY.rebalanceSubject(weakestSubject, userPhase));
  }

  const actualProgress = calculateActualProgressFromDays(workingSchedule);
  const expectedProgress = calculateExpectedProgressFromDays(workingSchedule);
  const minimumRequiredProgress = calculateMinimumRequiredProgress(
    setup?.examDate,
    generatedAt ?? workingSchedule[0]?.date
  );
  const recoveryBlocksUsed = getRecoveryBlocksUsed(workingSchedule, studyLogs);

  if (
    suggestions.length === 0 &&
    (analysis?.consistencyScore ?? 1) >= 0.75 &&
    (analysis?.completionRate ?? 1) >= 0.75
  ) {
    suggestions.push(PRODUCT_COPY.protectConsistency());
  }

  if (
    userPhase === 'sprint_to_exam' &&
    actualProgress + 0.15 < minimumRequiredProgress
  ) {
    suggestions.push(PRODUCT_COPY.sprintBelowMinimum());
  }

  return {
    updatedSchedule: applyDayMetrics(workingSchedule),
    suggestions,
    metadata: {
      delayedBlocksRecovered,
      loadReducedBlocks,
      reviewBlocksInserted,
      rebalanceActions,
      recoveryBlocksUsed,
      expectedProgress,
      actualProgress,
      minimumRequiredProgress,
      userPhase,
    },
  };
}

export class AdaptivePlanningEngine {
  generateOrAdjustSchedule(input: BuildAdaptivePlanInput): AdaptivePlanningResult {
    return buildAdaptivePlan(input);
  }

  calculateExpectedProgress(schedule: ScheduleDay[]): number {
    return calculateExpectedProgressFromDays(schedule);
  }

  createReviewItem(block: StudyBlock): IReviewItem[] {
    if (!block.id || !block.subject) return [];

    return generateReviewsFromCompletedBlock({
      id: block.id,
      subject: block.subject,
      time: block.plannedStartTime ?? '20:00',
      duration: `${Math.max(25, Math.round(block.duration || 0))}min`,
      type: block.type ?? 'new',
      mode: block.mode ?? 'focus',
      completed: block.completed,
      perceivedDifficulty: block.difficulty ?? null,
      confidenceScore: block.confidenceScore ?? null,
      reviewNote: block.reviewNote ?? null,
    });
  }

  updateReviewItem(item: IReviewItem): IReviewItem {
    return {
      ...item,
      status: item.status ?? 'pending',
    };
  }

  handleMissedBlocks(): void {}

  scheduleReviews(): void {}

  balanceSubjects(): void {}

  adjustDailyBlocks(): void {}

  generateInsights(): string[] {
    return [];
  }
}
