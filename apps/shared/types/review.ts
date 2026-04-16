export type ReviewStatus = 'pending' | 'scheduled' | 'completed' | 'expired';

export type ReviewReason =
  | 'scheduled_review'
  | 'high_difficulty'
  | 'low_confidence'
  | 'manual_doubt';

export interface IReviewItem {
  id: string;
  blockId: string;
  subject: string;
  dueDate: string;
  createdAt: string;
  status: ReviewStatus;
  confidenceScore?: number | null;
  completedAt?: string | null;

  reviewNote?: string | null;
  reviewReason?: ReviewReason;
}