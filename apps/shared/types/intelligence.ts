import type { IReviewItem, ReviewReason, ReviewStage } from './review';

export type BlockMode =
  | 'focus'
  | 'review'
  | 'questions'
  | 'simulado'
  | 'planning'
  | 'recovery';

export type BlockStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'rescheduled';

export type UserPhase =
  | 'building_base'
  | 'gaining_rhythm'
  | 'consolidating'
  | 'sprint_to_exam'
  | 'fatigue_risk';
export type { ReviewReason, ReviewStage } from './review';

export interface BlockExecution {
  id: string;
  blockId: string;
  startedAt?: string | null;
  completedAt?: string | null;
  interruptedAt?: string | null;
  interruptionCount: number;
  perceivedEnergyLevel: number | null; // 1-5
  perceivedDifficulty: number | null; // 1-5
  confidenceScore: number | null; // 1-5
  status: BlockStatus;
  reviewNote: string | null;
  wasRescheduled: boolean;
}

export type ReviewItem = IReviewItem;

export interface SubjectProgress {
  subject: string;
  completedSessions: number;
  targetSessions: number;
  completionRate: number; // 0..1
  lastTouchedAt?: string | null;
  daysSinceLastTouch?: number | null;
}

export interface ScheduleProgress {
  expectedProgress: number; // 0..1
  actualProgress: number; // 0..1
  minimumRequiredProgress: number; // 0..1
  variance: number; // actual - expected
  completedBlocks: number;
  totalBlocks: number;
  recoveryDebt: number; // quantidade de blocos perdidos ainda não absorvidos
  subjectProgressMap: Record<string, SubjectProgress>;
}

export interface AdaptiveState {
  phase: UserPhase;
  currentRiskLevel: 'low' | 'medium' | 'high';
  suggestedLoadFactor: number;
  shouldProtectConsistency: boolean;
  shouldReduceLoad: boolean;
  shouldInsertRecoveryBlock: boolean;
  shouldPrioritizeReviews: boolean;
  weakestSubject: string | null;
  bestStudyPeriod: 'morning' | 'afternoon' | 'night' | 'unknown' | null;
}
