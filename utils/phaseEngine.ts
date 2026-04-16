import type { UserPhase } from '../apps/shared/types/intelligence';
import type { AIAnalysis } from '../context/AIContext';

export function getDaysUntilExam(examDate?: string): number | null {
  if (!examDate) return null;

  const exam = new Date(examDate);
  if (Number.isNaN(exam.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);

  const diffMs = exam.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function resolveUserPhase(params: {
  analysis: AIAnalysis | null;
  daysUntilExam?: number | null;
}): UserPhase {
  const { analysis, daysUntilExam } = params;

  if (analysis?.currentRiskLevel === 'high') {
    return 'fatigue_risk';
  }

  if (typeof daysUntilExam === 'number' && daysUntilExam <= 45) {
    return 'sprint_to_exam';
  }

  if ((analysis?.consistencyScore ?? 0) < 0.45) {
    return 'building_base';
  }

  if ((analysis?.consistencyScore ?? 0) < 0.75) {
    return 'gaining_rhythm';
  }

  return 'consolidating';
}
