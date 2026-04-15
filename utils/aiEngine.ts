import {
  UserStudyLog,
  getAverageCompletionRate,
  getBestStudyPeriod,
  getConsistencyScore,
  normalizeLogs,
} from './behaviorTracker';
import {
  FailureRisk,
  getFailureRisk,
  getSuggestedLoadFactor,
} from './predictionEngine';

export type CronofyInsight = {
  type: 'consistency' | 'risk' | 'best_period' | 'load';
  title: string;
  message: string;
};

export type CronofyAIAnalysis = {
  consistencyScore: number;
  averageCompletionRate: number;
  failureRisk: FailureRisk;
  bestPeriod: 'morning' | 'afternoon' | 'night' | 'unknown';
  suggestedLoadFactor: number;
  insights: CronofyInsight[];
};

function buildInsights(params: {
  consistencyScore: number;
  failureRisk: FailureRisk;
  bestPeriod: 'morning' | 'afternoon' | 'night' | 'unknown';
  suggestedLoadFactor: number;
}): CronofyInsight[] {
  const { consistencyScore, failureRisk, bestPeriod, suggestedLoadFactor } =
    params;

  const insights: CronofyInsight[] = [
    {
      type: 'consistency',
      title: 'Consistência',
      message: `Sua consistência está em ${Math.round(consistencyScore * 100)}%.`,
    },
    {
      type: 'risk',
      title: 'Risco atual',
      message:
        failureRisk === 'high'
          ? 'Seu risco de quebrar a rotina está alto.'
          : failureRisk === 'medium'
            ? 'Seu ritmo pede atenção.'
            : 'Seu ritmo atual está saudável.',
    },
  ];

  if (bestPeriod !== 'unknown') {
    insights.push({
      type: 'best_period',
      title: 'Melhor horário',
      message:
        bestPeriod === 'morning'
          ? 'Você tende a render melhor pela manhã.'
          : bestPeriod === 'afternoon'
            ? 'Você tende a render melhor à tarde.'
            : 'Você tende a render melhor à noite.',
    });
  }

  if (suggestedLoadFactor < 1) {
    insights.push({
      type: 'load',
      title: 'Ajuste sugerido',
      message: `A IA sugere reduzir a carga para ${Math.round(
        suggestedLoadFactor * 100,
      )}% temporariamente.`,
    });
  }

  return insights;
}

export function analyzeStudyHistory(logs: UserStudyLog[]): CronofyAIAnalysis {
  const normalized = normalizeLogs(logs);

  const consistencyScore = getConsistencyScore(normalized);
  const averageCompletionRate = getAverageCompletionRate(normalized);
  const failureRisk = getFailureRisk(normalized);
  const bestPeriod = getBestStudyPeriod(normalized);
  const suggestedLoadFactor = getSuggestedLoadFactor(normalized);

  const insights = buildInsights({
    consistencyScore,
    failureRisk,
    bestPeriod,
    suggestedLoadFactor,
  });

  return {
    consistencyScore,
    averageCompletionRate,
    failureRisk,
    bestPeriod,
    suggestedLoadFactor,
    insights,
  };
}

export interface StudyLog {
  date: string;
  plannedBlocks: number;
  completedBlocks: number;
  subjects: string[];
  timeStudied: number;
  period: 'morning' | 'afternoon' | 'night' | 'unknown';
}