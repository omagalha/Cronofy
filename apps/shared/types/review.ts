export type ReviewStatus = 'pending' | 'scheduled' | 'completed' | 'expired';

export interface IReviewItem {
  id: string;
  blockId: string;
  subject: string;
  dueDate: string;
  createdAt: string;
  status: ReviewStatus;
  confidenceScore?: number | null;
  completedAt?: string | null;
}
