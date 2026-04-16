const DEFAULT_EXAM_TITLE = 'Cronofy';

export function clampPercent(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getShortExamTitle(title?: string | null): string {
  if (!title || !title.trim()) return DEFAULT_EXAM_TITLE;
  return title.trim();
}

export function getDaysLeft(targetDate?: string | null): number | null {
  if (!targetDate) return null;

  const now = new Date();
  const examDate = new Date(targetDate);

  if (Number.isNaN(examDate.getTime())) return null;

  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfExam = new Date(
    examDate.getFullYear(),
    examDate.getMonth(),
    examDate.getDate()
  );

  const diffMs = startOfExam.getTime() - startOfNow.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatBlockTimeLabel(
  hour?: string | null,
  duration?: number | null
): string {
  if (!hour && !duration) return '--';
  if (hour && duration) return `${hour} • ${duration} min`;
  if (hour) return hour;
  return `${duration ?? 0} min`;
}

export function inferCountdownProgress(daysLeft: number | null): number {
  if (daysLeft === null) return 0;
  if (daysLeft <= 0) return 100;

  if (daysLeft >= 180) return 15;
  if (daysLeft >= 120) return 30;
  if (daysLeft >= 90) return 45;
  if (daysLeft >= 60) return 60;
  if (daysLeft >= 30) return 75;
  if (daysLeft >= 14) return 85;
  if (daysLeft >= 7) return 92;
  return 97;
}