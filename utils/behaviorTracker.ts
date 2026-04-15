export type StudyPeriod = 'morning' | 'afternoon' | 'night' | 'unknown';

export type UserStudyLog = {
  date: string;
  plannedBlocks: number;
  completedBlocks: number;
  subjects: string[];
  timeStudied: number;
  period?: StudyPeriod;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function normalizeLogs(logs: UserStudyLog[]): UserStudyLog[] {
  return [...logs]
    .filter((log) => Boolean(log.date))
    .map((log) => ({
      ...log,
      plannedBlocks: Math.max(0, log.plannedBlocks || 0),
      completedBlocks: Math.max(0, log.completedBlocks || 0),
      timeStudied: Math.max(0, log.timeStudied || 0),
      subjects: Array.isArray(log.subjects) ? log.subjects.filter(Boolean) : [],
      period: log.period ?? 'unknown',
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getConsistencyScore(logs: UserStudyLog[]): number {
  const normalized = normalizeLogs(logs);
  if (!normalized.length) return 0;

  const activeDays = normalized.filter((log) => log.completedBlocks > 0).length;
  return round(clamp(activeDays / normalized.length, 0, 1));
}

export function getAverageCompletionRate(logs: UserStudyLog[]): number {
  const normalized = normalizeLogs(logs);
  if (!normalized.length) return 0;

  const rates = normalized.map((log) => {
    if (log.plannedBlocks <= 0) return log.completedBlocks > 0 ? 1 : 0;
    return clamp(log.completedBlocks / log.plannedBlocks, 0, 1);
  });

  const average =
    rates.reduce((acc, rate) => acc + rate, 0) / normalized.length;

  return round(average);
}

export function getCurrentFailureStreak(logs: UserStudyLog[]): number {
  const normalized = normalizeLogs(logs);
  let streak = 0;

  for (let i = normalized.length - 1; i >= 0; i -= 1) {
    const log = normalized[i];
    const rate =
      log.plannedBlocks > 0 ? log.completedBlocks / log.plannedBlocks : 0;

    const failed = log.completedBlocks === 0 || rate < 0.4;

    if (!failed) break;
    streak += 1;
  }

  return streak;
}

export function getBestStudyPeriod(logs: UserStudyLog[]): StudyPeriod {
  const normalized = normalizeLogs(logs);
  const validLogs = normalized.filter(
    (log) => log.period && log.period !== 'unknown',
  );

  if (!validLogs.length) return 'unknown';

  const periods: Record<'morning' | 'afternoon' | 'night', number[]> = {
    morning: [],
    afternoon: [],
    night: [],
  };

  validLogs.forEach((log) => {
    const rate =
      log.plannedBlocks > 0
        ? clamp(log.completedBlocks / log.plannedBlocks, 0, 1)
        : 0;

    if (log.period && log.period !== 'unknown') {
      periods[log.period].push(rate);
    }
  });

  let best: StudyPeriod = 'unknown';
  let bestAvg = -1;

  (Object.keys(periods) as Array<'morning' | 'afternoon' | 'night'>).forEach(
    (period) => {
      const values = periods[period];
      if (!values.length) return;

      const avg = values.reduce((acc, value) => acc + value, 0) / values.length;

      if (avg > bestAvg) {
        bestAvg = avg;
        best = period;
      }
    },
  );

  return best;
}