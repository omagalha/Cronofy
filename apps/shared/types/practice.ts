export type PracticeSessionSource =
  | 'daily_plan'
  | 'weak_subject'
  | 'revision_boost'
  | 'manual';

export type PracticeSessionStatus =
  | 'idle'
  | 'in_progress'
  | 'completed'
  | 'abandoned';

export type PracticeBuildMode = 'daily' | 'weak_subject' | 'review';

export interface QuestionResult {
  questionId: string;
  subject: string;
  correct: boolean;
  answeredAt: string;
  difficulty?: number | null;
}

export interface PracticeSession {
  id: string;
  subject: string;
  relatedBlockIds: string[];
  source: PracticeSessionSource;
  status: PracticeSessionStatus;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  startedAt: string;
  finishedAt?: string | null;
  durationSeconds?: number | null;
  questionResults: QuestionResult[];
}

export interface SubjectPerformance {
  subject: string;
  totalSessions: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  recentAccuracy: number;
  lastPracticedAt: string | null;
  trend: 'up' | 'down' | 'stable';
}

export interface PracticeSummary {
  totalSessions: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  weakestSubject: string | null;
  strongestSubject: string | null;
  lastPracticedAt: string | null;
}

export interface PracticeRecommendation {
  mode: PracticeBuildMode;
  title: string;
  description: string;
  suggestedSubject: string | null;
  suggestedBlockIds: string[];
  totalQuestions: 5 | 10;
  source: PracticeSessionSource | null;
  status: 'ready' | 'empty' | 'completed_today';
}
