import type { PersistedSchedule, ScheduleDay } from './scheduleEngine';

type ProgressBlockLike = {
  completed?: boolean;
  status?: string;
};

type ProgressDayLike = {
  date?: ScheduleDay['date'];
  blocks: ProgressBlockLike[];
};

function toDateOnly(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function isCompleted(block: ProgressDayLike['blocks'][number]): boolean {
  return block.completed === true || block.status === 'completed';
}

export function calculateActualProgressFromDays(days: ProgressDayLike[]): number {
  const allBlocks = days.flatMap((day) => day.blocks);
  if (!allBlocks.length) return 0;

  const completed = allBlocks.filter((block) => isCompleted(block)).length;
  return completed / allBlocks.length;
}

export function calculateExpectedProgressFromDays(days: ProgressDayLike[]): number {
  const today = toDateOnly(new Date());
  const allBlocks = days.flatMap((day) => day.blocks);

  if (!allBlocks.length) return 0;

  let expectedCount = 0;

  for (const day of days) {
    const dayDate = parseDate(day.date);
    if (!dayDate) continue;

    if (dayDate.getTime() <= today.getTime()) {
      expectedCount += day.blocks.length;
    }
  }

  return expectedCount / allBlocks.length;
}

export function calculateActualProgress(schedule: PersistedSchedule | null): number {
  if (!schedule) return 0;
  return calculateActualProgressFromDays(schedule.days);
}

export function calculateExpectedProgress(
  schedule: PersistedSchedule | null
): number {
  if (!schedule) return 0;
  return calculateExpectedProgressFromDays(schedule.days);
}

export function calculateMinimumRequiredProgress(
  examDate?: string,
  generatedAt?: string
): number {
  const exam = parseDate(examDate);
  const start = parseDate(generatedAt);

  if (!exam || !start) return 0;

  const today = toDateOnly(new Date());
  const totalWindow = exam.getTime() - start.getTime();
  const elapsed = today.getTime() - start.getTime();

  if (totalWindow <= 0) return 1;

  const ratio = elapsed / totalWindow;
  return Math.max(0, Math.min(ratio, 1));
}
