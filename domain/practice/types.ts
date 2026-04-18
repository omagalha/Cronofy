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

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type PracticeAnswerValue = string | boolean;

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionBankItem {
  // `questionId` is the canonical key. `id` remains as a compatibility alias
  // for persisted sessions created before the question bank migration.
  id: string;
  questionId: string;
  subject: string;
  topic: string;
  statement: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  tags: string[];
  estimatedTimeSeconds?: number;
}

export interface QuestionResult {
  questionId: string;
  subject: string;
  correct: boolean;
  answeredAt: string;
  difficulty?: number | null;
  questionDifficulty?: QuestionDifficulty | null;
  selectedOptionId?: string | null;
  correctOptionId?: string | null;
  topic?: string | null;
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
  questions?: QuestionBankItem[];
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

export interface SubjectPracticeSignal {
  subject: string;
  accuracy: number;
  recentAccuracy: number;
  totalQuestions: number;
  trend: 'up' | 'down' | 'stable';
  lastPracticedAt: string | null;
  confidenceMismatch?: boolean;
  recentConfidenceScore?: number | null;
  recentDifficulty?: number | null;
  linkedBlockCount?: number;
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
