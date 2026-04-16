import type { IReviewItem, ReviewReason } from '../apps/shared/types/review';
import type { StudyBlock } from './scheduleEngine';

function addDays(base: Date, days: number): string {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function getBasePriority(block: StudyBlock): number {
  let priority = 3;

  if ((block.perceivedDifficulty ?? 0) >= 4) priority += 1;
  if ((block.confidenceScore ?? 5) <= 2) priority += 1;
  if (block.reviewNote?.trim()) priority += 1;

  return Math.min(priority, 5);
}

function getReviewReason(block: StudyBlock): ReviewReason {
  if (block.reviewNote?.trim()) {
    return 'manual_doubt';
  }

  if ((block.confidenceScore ?? 5) <= 2) {
    return 'low_confidence';
  }

  if ((block.perceivedDifficulty ?? 0) >= 4) {
    return 'high_difficulty';
  }

  return 'scheduled_review';
}

export function generateReviewsFromCompletedBlock(block: StudyBlock): IReviewItem[] {
  if (!block.id || !block.subject) {
    return [];
  }

  const now = new Date();
  const reviewReason = getReviewReason(block);
  const basePriority = getBasePriority(block);

  const items: IReviewItem[] = [
    {
      id: `review-${block.id}-r1`,
      sourceBlockId: block.id,
      subject: block.subject,
      stage: 'r1_24h',
      createdAt: now.toISOString(),
      dueDate: addDays(now, 1),
      status: 'pending',
      priority: basePriority,
      confidenceScore: block.confidenceScore ?? null,
      completedAt: null,
      reviewNote: block.reviewNote ?? null,
      reviewReason,
    },
    {
      id: `review-${block.id}-r2`,
      sourceBlockId: block.id,
      subject: block.subject,
      stage: 'r2_7d',
      createdAt: now.toISOString(),
      dueDate: addDays(now, 7),
      status: 'pending',
      priority: Math.max(basePriority - 1, 1),
      confidenceScore: block.confidenceScore ?? null,
      completedAt: null,
      reviewNote: block.reviewNote ?? null,
      reviewReason: 'scheduled_review',
    },
    {
      id: `review-${block.id}-r3`,
      sourceBlockId: block.id,
      subject: block.subject,
      stage: 'r3_30d',
      createdAt: now.toISOString(),
      dueDate: addDays(now, 30),
      status: 'pending',
      priority: Math.max(basePriority - 2, 1),
      confidenceScore: block.confidenceScore ?? null,
      completedAt: null,
      reviewNote: block.reviewNote ?? null,
      reviewReason: 'scheduled_review',
    },
  ];

  const needsReinforcement =
    (block.confidenceScore ?? 5) <= 2 ||
    (block.perceivedDifficulty ?? 0) >= 4 ||
    Boolean(block.reviewNote?.trim());

  if (needsReinforcement) {
    items.unshift({
      id: `review-${block.id}-reinforcement`,
      sourceBlockId: block.id,
      subject: block.subject,
      stage: 'reinforcement',
      createdAt: now.toISOString(),
      dueDate: addDays(now, 2),
      status: 'pending',
      priority: 5,
      confidenceScore: block.confidenceScore ?? null,
      completedAt: null,
      reviewNote: block.reviewNote ?? null,
      reviewReason,
    });
  }

  return items;
}

export function mergeReviewQueue(
  currentQueue: IReviewItem[],
  nextItems: IReviewItem[]
): IReviewItem[] {
  const merged = new Map<string, IReviewItem>();

  for (const item of currentQueue) {
    merged.set(item.id, item);
  }

  for (const item of nextItems) {
    merged.set(item.id, item);
  }

  return Array.from(merged.values()).sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    return a.dueDate.localeCompare(b.dueDate);
  });
}
