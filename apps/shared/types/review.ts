export type ReviewStage =
  | 'r1_24h'
  | 'r2_7d'
  | 'r3_30d'
  | 'reinforcement';

export type ReviewReason =
  | 'scheduled_review'
  | 'manual_doubt'
  | 'low_confidence'
  | 'high_difficulty'
  | 'missed_block_recovery';

export type ReviewStatus = 'pending' | 'completed' | 'skipped';

export interface IReviewItem {
  id: string;
  sourceBlockId: string;
  subject: string;
  stage: ReviewStage;
  createdAt: string;
  dueDate: string;
  status: ReviewStatus;
  priority: number;
  confidenceScore: number | null;
  completedAt: string | null;
  reviewNote: string | null;
  reviewReason: ReviewReason;
}
