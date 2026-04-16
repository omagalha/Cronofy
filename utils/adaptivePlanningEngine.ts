import { IReviewItem } from '../apps/shared/types/review';

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
}
export interface ScheduleDay {
  date: string;
  weekday: Weekday;
  blocks: StudyBlock[];
}

export interface StudyLog {
  date: string;
  plannedBlocks: number;
  completedBlocks: number;
  subjects: string[];
  timeStudied: number;
  period: 'morning' | 'afternoon' | 'night' | 'unknown';
}

export interface AIAnalysis {
  consistencyScore?: number;
  completionRate?: number;
  currentRiskLevel?: 'low' | 'medium' | 'high';
  suggestedLoadFactor?: number;
  bestStudyPeriod?: string | null;
  hardestSubject?: string | null;
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
  };
}

interface BuildAdaptivePlanInput {
  schedule: ScheduleDay[];
  studyLogs: StudyLog[];
  analysis?: AIAnalysis | null;
  setup?: UserSetupData;
}

export interface AdaptiveCompletionMetrics {
  interruptionCount?: number | null;
  perceivedEnergyLevel?: number | null;
  perceivedDifficulty?: number | null;
  confidenceScore?: number | null;
}

const cloneSchedule = (schedule: ScheduleDay[]): ScheduleDay[] =>
  schedule.map((day) => ({
    ...day,
    blocks: day.blocks.map((block) => ({ ...block })),
  }));

const normalizeSubjectName = (value: string): string =>
  value.trim().toLowerCase();

const isPastDay = (date: string): boolean => {
  const today = new Date();
  const target = new Date(date);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return target.getTime() < today.getTime();
};

const isFutureOrToday = (date: string): boolean => {
  const today = new Date();
  const target = new Date(date);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return target.getTime() >= today.getTime();
};

const getIncompletePastBlocks = (schedule: ScheduleDay[]): StudyBlock[] => {
  return schedule
    .filter((day) => isPastDay(day.date))
    .flatMap((day) => day.blocks.filter((block) => !block.completed));
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

const getWeakestSubject = (
  studyLogs: StudyLog[],
  analysis?: AIAnalysis | null
): string | null => {
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

const shouldReduceLoad = (
  analysis?: AIAnalysis | null,
  studyLogs?: StudyLog[]
): boolean => {
  if (!analysis) return false;

  const failureTrend = getRecentFailureTrend(studyLogs ?? []);

  if (analysis.currentRiskLevel === 'high') return true;
  if (failureTrend > 0.6) return true;
  if ((analysis.consistencyScore ?? 1) < 0.5) return true;
  if ((analysis.completionRate ?? 1) < 0.55) return true;
  if ((analysis.suggestedLoadFactor ?? 1) < 0.9) return true;

  return false;
};

const shouldInsertReview = (
  analysis?: AIAnalysis | null,
  studyLogs?: StudyLog[]
): boolean => {
  const weakestSubject = getWeakestSubject(studyLogs ?? [], analysis);
  if (!weakestSubject) return false;

  const failureTrend = getRecentFailureTrend(studyLogs ?? []);

  return (
    (analysis?.completionRate ?? 1) < 0.75 ||
    analysis?.currentRiskLevel === 'medium' ||
    failureTrend >= 0.4
  );
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

      const oldDuration = block.duration;
      const newDuration = safeTrimDuration(oldDuration, factor);

      if (newDuration < oldDuration) {
        block.duration = newDuration;
        affectedBlocks += 1;
      }
    }
  }

  return { schedule: next, affectedBlocks };
};

const recoverMissedBlocks = (
  schedule: ScheduleDay[]
): { schedule: ScheduleDay[]; recovered: number } => {
  const next = cloneSchedule(schedule);
  const missedBlocks = getIncompletePastBlocks(schedule).map((block) => ({
    ...block,
  }));
  const futureDays = getFutureDays(next);

  if (missedBlocks.length === 0 || futureDays.length === 0) {
    return { schedule: next, recovered: 0 };
  }

  let recovered = 0;
  let cursor = 0;

  for (const block of missedBlocks) {
    const targetDay = futureDays[cursor % futureDays.length];

    targetDay.blocks.push({
      ...block,
      id: `${block.id}-recovered-${recovered + 1}`,
      completed: false,
      scheduledDate: targetDay.date,
    });

    recovered += 1;
    cursor += 1;
  }

  return { schedule: next, recovered };
};

const insertReviewBlock = (
  schedule: ScheduleDay[],
  subject: string
): { schedule: ScheduleDay[]; inserted: number } => {
  const next = cloneSchedule(schedule);
  const futureDays = getFutureDays(next);

  if (futureDays.length === 0) {
    return { schedule: next, inserted: 0 };
  }

  const targetDay = futureDays[0];

  const alreadyHasReview = targetDay.blocks.some(
    (block) =>
      normalizeSubjectName(block.subject) ===
      normalizeSubjectName(`${subject} - Revisão`)
  );

  if (alreadyHasReview) {
    return { schedule: next, inserted: 0 };
  }

  targetDay.blocks.unshift({
    id: `review-${normalizeSubjectName(subject)}-${targetDay.date}`,
    subject: `${subject} - Revisão`,
    duration: 30,
    completed: false,
    difficulty: 1,
    scheduledDate: targetDay.date,
  });

  return { schedule: next, inserted: 1 };
};

const rebalanceTowardWeakSubject = (
  schedule: ScheduleDay[],
  weakSubject: string | null
): { schedule: ScheduleDay[]; actions: number } => {
  if (!weakSubject) {
    return { schedule: cloneSchedule(schedule), actions: 0 };
  }

  const next = cloneSchedule(schedule);
  const futureDays = getFutureDays(next);

  if (futureDays.length === 0) {
    return { schedule: next, actions: 0 };
  }

  const firstFutureDay = futureDays[0];

  const hasWeakSubjectAlready = firstFutureDay.blocks.some(
    (block) =>
      normalizeSubjectName(block.subject) === normalizeSubjectName(weakSubject)
  );

  if (hasWeakSubjectAlready) {
    return { schedule: next, actions: 0 };
  }

  const donorDay = futureDays.find((day) =>
    day.blocks.some(
      (block) =>
        !block.completed &&
        normalizeSubjectName(block.subject) !== normalizeSubjectName(weakSubject)
    )
  );

  if (!donorDay) {
    return { schedule: next, actions: 0 };
  }

  const donorBlock = donorDay.blocks.find(
    (block) =>
      !block.completed &&
      normalizeSubjectName(block.subject) !== normalizeSubjectName(weakSubject)
  );

  if (!donorBlock) {
    return { schedule: next, actions: 0 };
  }

  firstFutureDay.blocks.push({
    ...donorBlock,
    id: `${donorBlock.id}-rebalance-${normalizeSubjectName(weakSubject)}`,
    subject: weakSubject,
    duration: Math.max(30, Math.round(donorBlock.duration * 0.8)),
    completed: false,
    difficulty: donorBlock.difficulty ?? 2,
    scheduledDate: firstFutureDay.date,
  });

  return { schedule: next, actions: 1 };
};

export function buildAdaptivePlan({
  schedule,
  studyLogs,
  analysis,
}: BuildAdaptivePlanInput): AdaptivePlanningResult {
  let workingSchedule = cloneSchedule(schedule);
  const suggestions: AdaptiveSuggestion[] = [];

  let delayedBlocksRecovered = 0;
  let loadReducedBlocks = 0;
  let reviewBlocksInserted = 0;
  let rebalanceActions = 0;

  const weakestSubject = getWeakestSubject(studyLogs, analysis);

  const recovered = recoverMissedBlocks(workingSchedule);
  workingSchedule = recovered.schedule;
  delayedBlocksRecovered = recovered.recovered;

  if (delayedBlocksRecovered > 0) {
    suggestions.push({
      type: 'recover_missed_blocks',
      title: 'Blocos perdidos redistribuídos',
      description:
        'O plano recuperou automaticamente blocos atrasados e os redistribuiu nos próximos dias.',
      impact: delayedBlocksRecovered >= 3 ? 'high' : 'medium',
    });
  }

  if (shouldReduceLoad(analysis, studyLogs)) {
    const factor = Math.min(
      Math.max(analysis?.suggestedLoadFactor ?? 0.85, 0.7),
      0.95
    );

    const reduced = reduceFutureLoad(workingSchedule, factor);
    workingSchedule = reduced.schedule;
    loadReducedBlocks = reduced.affectedBlocks;

    if (loadReducedBlocks > 0) {
      suggestions.push({
        type: 'reduce_load',
        title: 'Carga futura reduzida',
        description:
          'O sistema reduziu levemente a duração dos próximos blocos para proteger consistência e evitar sobrecarga.',
        impact: analysis?.currentRiskLevel === 'high' ? 'high' : 'medium',
      });
    }
  }

  const rebalanced = rebalanceTowardWeakSubject(workingSchedule, weakestSubject);
  workingSchedule = rebalanced.schedule;
  rebalanceActions = rebalanced.actions;

  if (rebalanceActions > 0 && weakestSubject) {
    suggestions.push({
      type: 'rebalance_subject',
      title: `Mais foco em ${weakestSubject}`,
      description:
        'O cronograma aumentou o foco na matéria com mais sinais de dificuldade recente.',
      impact: 'medium',
    });
  }

  if (shouldInsertReview(analysis, studyLogs) && weakestSubject) {
    const review = insertReviewBlock(workingSchedule, weakestSubject);
    workingSchedule = review.schedule;
    reviewBlocksInserted = review.inserted;

    if (reviewBlocksInserted > 0) {
      suggestions.push({
        type: 'insert_review',
        title: 'Revisão estratégica inserida',
        description:
          'Foi inserido um bloco curto de revisão para reforçar retenção na matéria mais frágil.',
        impact: 'medium',
      });
    }
  }

  if (
    suggestions.length === 0 &&
    (analysis?.consistencyScore ?? 1) >= 0.75 &&
    (analysis?.completionRate ?? 1) >= 0.75
  ) {
    suggestions.push({
      type: 'protect_consistency',
      title: 'Plano mantido',
      description:
        'O comportamento recente está saudável. O sistema preservou a estrutura atual para não gerar atrito desnecessário.',
      impact: 'low',
    });
  }

  return {
    updatedSchedule: workingSchedule,
    suggestions,
    metadata: {
      delayedBlocksRecovered,
      loadReducedBlocks,
      reviewBlocksInserted,
      rebalanceActions,
    },
  };
}

export class AdaptivePlanningEngine {
  generateOrAdjustSchedule(input: BuildAdaptivePlanInput): AdaptivePlanningResult {
    return buildAdaptivePlan(input);
  }

  calculateExpectedProgress(schedule: ScheduleDay[]): number {
    const totalBlocks = schedule.reduce((acc, day) => acc + day.blocks.length, 0);

    if (totalBlocks === 0) return 0;

    const completedBlocks = schedule.reduce(
      (acc, day) => acc + day.blocks.filter((block) => block.completed).length,
      0
    );

    return Number((completedBlocks / totalBlocks).toFixed(2));
  }

  createReviewItem(block: StudyBlock): IReviewItem[] {
    if (!block.id || !block.subject) return [];

    const now = new Date();
    const dueDate = new Date(now);

    const hasManualDoubt = Boolean(block.reviewNote?.trim());
    const hasLowConfidence =
      typeof block.confidenceScore === 'number' && block.confidenceScore <= 2;
    const hasHighDifficulty =
      typeof block.difficulty === 'number' && block.difficulty >= 4;

    if (hasManualDoubt) {
      dueDate.setDate(dueDate.getDate() + 1);
    } else if (hasLowConfidence || hasHighDifficulty) {
      dueDate.setDate(dueDate.getDate() + 2);
    } else {
      dueDate.setDate(dueDate.getDate() + 7);
    }

    return [
      {
        id: `review-item-${block.id}-${now.getTime()}`,
        blockId: block.id,
        subject: block.subject,
        createdAt: now.toISOString(),
        dueDate: dueDate.toISOString(),
        status: 'pending',
        confidenceScore: block.confidenceScore ?? null,
        completedAt: null,
        reviewNote: block.reviewNote ?? null,
        reviewReason: hasManualDoubt
          ? 'manual_doubt'
          : hasLowConfidence
          ? 'low_confidence'
          : hasHighDifficulty
          ? 'high_difficulty'
          : 'scheduled_review',
      },
    ];
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
