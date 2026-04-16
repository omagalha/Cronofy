import type { IReviewItem } from './review';

export type { ReviewReason, ReviewStage } from './review';

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

export type RiskLevel = 'low' | 'medium' | 'high';

export type StudyPeriod = 'morning' | 'afternoon' | 'night' | 'unknown';

export interface BlockExecution {
  id: string;
  blockId: string;
  mode?: BlockMode;
  startedAt?: string | null;
  completedAt?: string | null;
  interruptedAt?: string | null;
  interruptionCount: number;
  perceivedEnergyLevel: number | null;
  perceivedDifficulty: number | null;
  confidenceScore: number | null;
  status: BlockStatus;
  reviewNote: string | null;
  wasRescheduled: boolean;
}

export type ReviewItem = IReviewItem;

export interface SubjectProgress {
  subject: string;
  completedSessions: number;
  targetSessions: number;
  completionRate: number;
  lastTouchedAt?: string | null;
  daysSinceLastTouch?: number | null;
}

export interface ScheduleProgress {
  expectedProgress: number;
  actualProgress: number;
  minimumRequiredProgress: number;
  variance: number;
  completedBlocks: number;
  totalBlocks: number;
  recoveryDebt: number;
  progressBySubject: Record<string, SubjectProgress>;
}

export interface AdaptiveState {
  phase: UserPhase;
  currentRiskLevel: RiskLevel;
  suggestedLoadFactor: number;
  shouldProtectConsistency: boolean;
  shouldReduceLoad: boolean;
  shouldInsertRecoveryBlock: boolean;
  shouldPrioritizeReviews: boolean;
  weakestSubject: string | null;
  bestStudyPeriod: StudyPeriod | null;
}