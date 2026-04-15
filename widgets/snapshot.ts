import {
    selectAIDailySignalWidget,
    selectCountdownRingWidget,
    selectNextBlockWidget,
} from './selectors';
import { WidgetSnapshot } from './types';

type CreateWidgetSnapshotParams = {
  setupData?: {
    concurso?: string;
    dataProva?: string;
  } | null;
  schedule?: unknown;
  aiData?: {
    currentRiskLevel?: 'low' | 'medium' | 'high';
    bestStudyPeriod?: string;
    hardestSubject?: string;
    suggestedLoadFactor?: number;
  } | null;
};

export function createWidgetSnapshot({
  setupData,
  schedule,
  aiData,
}: CreateWidgetSnapshotParams): WidgetSnapshot {
  return {
    countdownRing: selectCountdownRingWidget(setupData),
    nextBlock: selectNextBlockWidget(schedule as any),
    aiDailySignal: selectAIDailySignalWidget(aiData),
    updatedAt: new Date().toISOString(),
  };
}