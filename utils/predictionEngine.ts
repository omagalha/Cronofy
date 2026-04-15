import {
    UserStudyLog,
    getAverageCompletionRate,
    getConsistencyScore,
    getCurrentFailureStreak,
    normalizeLogs,
} from './behaviorTracker';

export type FailureRisk = 'low' | 'medium' | 'high';

export function getFailureRisk(logs: UserStudyLog[]): FailureRisk {
  const normalized = normalizeLogs(logs);

  const consistency = getConsistencyScore(normalized);
  const recentLogs = normalized.slice(-5);
  const recentCompletion = getAverageCompletionRate(recentLogs);
  const streak = getCurrentFailureStreak(normalized);

  if (streak >= 2 || recentCompletion < 0.45 || consistency < 0.4) {
    return 'high';
  }

  if (streak === 1 || recentCompletion < 0.7 || consistency < 0.7) {
    return 'medium';
  }

  return 'low';
}

export function getSuggestedLoadFactor(logs: UserStudyLog[]): number {
  const normalized = normalizeLogs(logs);

  const recentLogs = normalized.slice(-7);
  const recentCompletion = getAverageCompletionRate(recentLogs);
  const streak = getCurrentFailureStreak(normalized);
  const consistency = getConsistencyScore(normalized);

  if (streak >= 3) return 0.5;
  if (streak >= 2 || recentCompletion < 0.45) return 0.7;
  if (consistency < 0.6 || recentCompletion < 0.7) return 0.85;

  return 1;
}