import { createWidgetSnapshot } from './snapshot';
import { WidgetSnapshot } from './types';

type AppContextLike = {
  setupData?: {
    concurso?: string;
    dataProva?: string;
  } | null;
  schedule?: unknown;
  persistedSchedule?: unknown;
  aiAnalysis?: {
    currentRiskLevel?: 'low' | 'medium' | 'high';
    bestStudyPeriod?: string;
    hardestSubject?: string;
    suggestedLoadFactor?: number;
  } | null;
};

export function buildWidgetSnapshotFromAppContext(
  app: AppContextLike
): WidgetSnapshot {
  return createWidgetSnapshot({
    setupData: app.setupData ?? null,
    schedule: app.persistedSchedule ?? app.schedule ?? null,
    aiData: app.aiAnalysis ?? null,
  });
}