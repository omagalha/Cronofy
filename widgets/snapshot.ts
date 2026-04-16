import {
  selectAIDailySignalWidget,
  selectCountdownRingWidget,
  selectNextBlockWidget,
} from './selectors';
import { WidgetSnapshot } from './types';

type CreateWidgetSnapshotParams = {
  setupData?: {
    concurso?: string;
    examDate?: string;
  } | null;
  schedule?: {
    days?: Array<{
      day?: string;
      date?: string;
      blocks?: Array<{
        subject?: string;
        completed?: boolean;
        duration?: string | number;
        time?: string;
      }>;
    }>;
  } | Array<{
    day?: string;
    date?: string;
    blocks?: Array<{
      subject?: string;
      completed?: boolean;
      duration?: string | number;
      time?: string;
    }>;
  }> | null;
  aiData?: {
    currentRiskLevel?: 'low' | 'medium' | 'high';
    bestStudyPeriod?: string | null;
    hardestSubject?: string | null;
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
    nextBlock: selectNextBlockWidget(schedule),
    aiDailySignal: selectAIDailySignalWidget(aiData),
    updatedAt: new Date().toISOString(),
  };
}