export type WidgetRiskLevel = 'low' | 'medium' | 'high' | 'empty';

export type CountdownStatus = 'active' | 'today' | 'expired' | 'empty';

export type NextBlockState = 'upcoming' | 'ideal' | 'now' | 'done' | 'empty';

export type CountdownRingWidgetData = {
  examTitle: string;
  daysLeft: number | null;
  progress: number;
  status: CountdownStatus;
};

export type NextBlockWidgetData = {
  subject: string;
  timeLabel: string;
  duration: number;
  statusLabel: string;
  state: NextBlockState;
};

export type AIDailySignalWidgetData = {
  message: string;
  supportLabel: string;
  riskLevel: WidgetRiskLevel;
};

export type WidgetSnapshot = {
  countdownRing: CountdownRingWidgetData;
  nextBlock: NextBlockWidgetData;
  aiDailySignal: AIDailySignalWidgetData;
  updatedAt: string;
};