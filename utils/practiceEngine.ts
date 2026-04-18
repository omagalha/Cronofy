import { AIAnalysis } from '../context/AIContext';
import { IReviewItem } from '../apps/shared/types/review';
import {
  PracticeBuildMode,
  PracticeRecommendation,
  PracticeSession,
  PracticeSessionSource,
  PracticeSummary,
  QuestionBankItem,
  QuestionResult,
  SubjectPracticeSignal,
  SubjectPerformance,
} from '../apps/shared/types/practice';
import { selectQuestionBankItems } from './practice/questionBankEngine';
import { ScheduleDay } from './scheduleEngine';

export interface BuildPracticeSessionInput {
  todaySchedule: ScheduleDay[];
  subjectPerformance: SubjectPerformance[];
  practiceSessions?: PracticeSession[];
  aiAnalysis?: AIAnalysis | null;
  reviewQueue?: IReviewItem[];
  mode: PracticeBuildMode;
  questionCount: 5 | 10;
}

export interface BuildPracticeSessionResult {
  suggestedSubject: string;
  suggestedBlockIds: string[];
  totalQuestions: number;
  source: PracticeSessionSource;
  questions: QuestionBankItem[];
}

type SubjectCandidate = {
  subject: string;
  source: PracticeSessionSource;
  blockIds: string[];
};

type ScheduleBlock = ScheduleDay['blocks'][number];

type LegacyQuestion = {
  id?: string;
  index?: number;
  subject?: string;
  status?: 'pending' | 'correct' | 'incorrect';
};

type LegacySessionLike = {
  id?: string;
  createdAt?: string;
  completedAt?: string;
  questionCount?: number;
  subject?: string;
  subjects?: string[];
  source?: string;
  questions?: LegacyQuestion[];
  correctAnswers?: number;
  incorrectAnswers?: number;
  recommendationLabel?: string;
};

const WEEKDAY_LABELS = [
  'domingo',
  'segunda-feira',
  'terca-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sabado',
] as const;

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizePracticeSubject(subject?: string | null): string {
  return (subject ?? '')
    .replace(/^revis[aã]o\s*-\s*/i, '')
    .trim();
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function toQuestionCount(value?: number): 5 | 10 {
  return value === 10 ? 10 : 5;
}

export function getTodayScheduleDays(schedule: ScheduleDay[]): ScheduleDay[] {
  const todayDateKey = getLocalDateKey();
  const weekdayLabel = WEEKDAY_LABELS[new Date().getDay()];

  return schedule.filter(
    (day) =>
      normalizeText(day.date) === todayDateKey ||
      normalizeText(day.day) === weekdayLabel
  );
}

function uniqueSubjects(subjects: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const subject of subjects) {
    const normalized = normalizeText(subject);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(subject.trim());
  }

  return result;
}

function getBlocksFromDays(days: ScheduleDay[]) {
  return days.flatMap((day) => day.blocks ?? []);
}

function getCompletedPracticeBlockIdsToday(
  sessions: PracticeSession[] = []
): Set<string> {
  const todayDateKey = getLocalDateKey();

  return new Set(
    sessions
      .filter(
        (session) =>
          session.status === 'completed' &&
          session.finishedAt &&
          getLocalDateKey(new Date(session.finishedAt)) === todayDateKey
      )
      .flatMap((session) => session.relatedBlockIds)
  );
}

function getRelatedBlockIdsFromDays(days: ScheduleDay[], subject: string): string[] {
  return getBlocksFromDays(days)
    .filter((block) => normalizeText(normalizePracticeSubject(block.subject)) === normalizeText(subject))
    .map((block) => block.id);
}

function isValidationEligibleBlock(block: ScheduleBlock): boolean {
  if (!block.completed) return false;
  if ((block.mode ?? 'focus') === 'review') return false;
  if (block.type === 'review') return false;
  if (block.type === 'practice') return false;
  return Boolean(normalizePracticeSubject(block.subject));
}

function getBlockValidationPriority(block: ScheduleBlock): number {
  let score = 0;

  if ((block.mode ?? 'focus') === 'focus') score += 4;
  if ((block.type ?? 'new') === 'new') score += 3;
  if ((block.confidenceScore ?? 0) >= 4) score += 2;
  if ((block.perceivedDifficulty ?? 0) >= 4) score += 2;
  if (block.reviewNote?.trim()) score += 1;
  if (block.completedAt) score += 1;

  return score;
}

function sortBlocksForValidation(a: ScheduleBlock, b: ScheduleBlock) {
  const priorityDiff = getBlockValidationPriority(b) - getBlockValidationPriority(a);

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const aCompletedAt = a.completedAt ?? '';
  const bCompletedAt = b.completedAt ?? '';

  if (aCompletedAt !== bCompletedAt) {
    return bCompletedAt.localeCompare(aCompletedAt);
  }

  return a.id.localeCompare(b.id);
}

function getDailyPendingCandidate(todaySchedule: ScheduleDay[]): SubjectCandidate | null {
  const pendingBlock = getBlocksFromDays(todaySchedule).find((block) => !block.completed);
  const subject = normalizePracticeSubject(pendingBlock?.subject);

  if (!subject) return null;

  return {
    subject,
    source: 'daily_plan',
    blockIds: getRelatedBlockIdsFromDays(todaySchedule, subject),
  };
}

function getDailyStudiedCandidate(
  todaySchedule: ScheduleDay[],
  practiceSessions: PracticeSession[] = []
): SubjectCandidate | null {
  const practicedBlockIdsToday = getCompletedPracticeBlockIdsToday(practiceSessions);
  const completedBlock = getBlocksFromDays(todaySchedule)
    .filter(isValidationEligibleBlock)
    .sort(sortBlocksForValidation)
    .find((block) => !practicedBlockIdsToday.has(block.id));
  const subject = normalizePracticeSubject(completedBlock?.subject);

  if (!subject) return null;

  return {
    subject,
    source: 'daily_plan',
    blockIds: completedBlock ? [completedBlock.id] : [],
  };
}

function getLowConfidenceCandidate(todaySchedule: ScheduleDay[]): SubjectCandidate | null {
  const lowConfidenceBlock = getBlocksFromDays(todaySchedule)
    .filter((block) => {
      const confidence = block.confidenceScore ?? null;
      const difficulty = block.perceivedDifficulty ?? null;
      const hasReviewNote = Boolean(block.reviewNote?.trim());

      return (
        (confidence !== null && confidence <= 2) ||
        (difficulty !== null && difficulty >= 4) ||
        hasReviewNote
      );
    })
    .sort(sortBlocksForValidation)[0];

  const subject = normalizePracticeSubject(lowConfidenceBlock?.subject);

  if (!subject) return null;

  return {
    subject,
    source: 'revision_boost',
    blockIds: lowConfidenceBlock ? [lowConfidenceBlock.id] : [],
  };
}

function sortSubjectPerformance(items: SubjectPerformance[]): SubjectPerformance[] {
  return [...items].sort((a, b) => {
    if (a.accuracy !== b.accuracy) {
      return a.accuracy - b.accuracy;
    }

    if (a.recentAccuracy !== b.recentAccuracy) {
      return a.recentAccuracy - b.recentAccuracy;
    }

    if (a.totalQuestions !== b.totalQuestions) {
      return b.totalQuestions - a.totalQuestions;
    }

    return a.subject.localeCompare(b.subject);
  });
}

function getWeakSubjectCandidate(
  subjectPerformance: SubjectPerformance[],
  fallbackSubject?: string | null
): SubjectCandidate | null {
  const weakest = sortSubjectPerformance(subjectPerformance)[0]?.subject;
  const subject = weakest ?? normalizePracticeSubject(fallbackSubject);

  if (!subject) return null;

  return {
    subject,
    source: 'weak_subject',
    blockIds: [],
  };
}

function getUrgentReviewCandidate(reviewQueue?: IReviewItem[]): SubjectCandidate | null {
  const pendingReviews = (reviewQueue ?? [])
    .filter((item) => item.status === 'pending')
    .sort((a, b) => {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }

      return b.priority - a.priority;
    });

  const topReview = pendingReviews[0];
  const subject = normalizePracticeSubject(topReview?.subject);

  if (!subject || !topReview) return null;

  return {
    subject,
    source: 'revision_boost',
    blockIds: pendingReviews
      .filter((item) => normalizeText(item.subject) === normalizeText(subject))
      .map((item) => item.sourceBlockId),
  };
}

function dedupeCandidates(candidates: Array<SubjectCandidate | null>): SubjectCandidate[] {
  const seen = new Set<string>();
  const result: SubjectCandidate[] = [];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const key = `${candidate.source}:${normalizeText(candidate.subject)}`;
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(candidate);
  }

  return result;
}

function getCandidateOrder(input: BuildPracticeSessionInput): SubjectCandidate[] {
  const dailyPending = getDailyPendingCandidate(input.todaySchedule);
  const dailyStudied = getDailyStudiedCandidate(
    input.todaySchedule,
    input.practiceSessions
  );
  const lowConfidence = getLowConfidenceCandidate(input.todaySchedule);
  const weakSubject = getWeakSubjectCandidate(
    input.subjectPerformance,
    input.aiAnalysis?.hardestSubject
  );
  const urgentReview = getUrgentReviewCandidate(input.reviewQueue);

  switch (input.mode) {
    case 'weak_subject':
      return dedupeCandidates([
        weakSubject,
        lowConfidence,
        urgentReview,
        dailyPending,
        dailyStudied,
      ]);
    case 'review':
      return dedupeCandidates([
        urgentReview,
        lowConfidence,
        weakSubject,
        dailyPending,
        dailyStudied,
      ]);
    case 'daily':
    default:
      return dedupeCandidates([
        dailyStudied,
        lowConfidence,
        dailyPending,
        weakSubject,
        urgentReview,
      ]);
  }
}

export function buildPracticeSession(
  input: BuildPracticeSessionInput
): BuildPracticeSessionResult | null {
  const candidates = getCandidateOrder(input);
  for (const candidate of candidates) {
    const questions = selectQuestionBankItems({
      subject: candidate.subject,
      totalQuestions: input.questionCount,
      mode: input.mode,
      practiceSessions: input.practiceSessions,
      subjectPerformance: input.subjectPerformance,
    });

    if (questions.length === 0) {
      continue;
    }

    return {
      suggestedSubject: candidate.subject,
      suggestedBlockIds: candidate.blockIds,
      totalQuestions: questions.length,
      source: candidate.source,
      questions,
    };
  }

  return null;
}

function calculateSessionStats(questionResults: QuestionResult[]) {
  const correctAnswers = questionResults.filter((item) => item.correct).length;
  const wrongAnswers = questionResults.length - correctAnswers;
  const accuracy =
    questionResults.length > 0
      ? Math.round((correctAnswers / questionResults.length) * 100)
      : 0;

  return {
    correctAnswers,
    wrongAnswers,
    accuracy,
  };
}

export function createPracticeSessionFromSuggestion(
  result: BuildPracticeSessionResult
): PracticeSession {
  return {
    id: `practice-session-${Date.now()}`,
    subject: result.suggestedSubject,
    relatedBlockIds: result.suggestedBlockIds,
    source: result.source,
    status: 'in_progress',
    totalQuestions: result.totalQuestions,
    correctAnswers: 0,
    wrongAnswers: 0,
    accuracy: 0,
    startedAt: getCurrentTimestamp(),
    finishedAt: null,
    durationSeconds: null,
    questionResults: [],
    questions: result.questions,
  };
}

export function buildPracticeQuestionIds(session: PracticeSession): string[] {
  if (Array.isArray(session.questions) && session.questions.length > 0) {
    return session.questions.map((question) => question.id);
  }

  return Array.from({ length: session.totalQuestions }, (_, index) => {
    return `${session.id}-question-${index + 1}`;
  });
}

export function registerQuestionResult(
  session: PracticeSession,
  questionId: string,
  correct: boolean,
  difficulty?: number | null
): PracticeSession {
  const sessionQuestion = session.questions?.find((item) => item.id === questionId);
  const otherResults = session.questionResults.filter(
    (item) => item.questionId !== questionId
  );

  const questionResults = [
    ...otherResults,
    {
      questionId,
      subject: session.subject,
      correct,
      answeredAt: getCurrentTimestamp(),
      difficulty: difficulty ?? null,
      selectedOptionId: null,
      correctOptionId: sessionQuestion?.correctOptionId ?? null,
      topic: sessionQuestion?.topic ?? null,
    },
  ].sort((a, b) => a.questionId.localeCompare(b.questionId));

  const stats = calculateSessionStats(questionResults);

  return {
    ...session,
    questionResults,
    correctAnswers: stats.correctAnswers,
    wrongAnswers: stats.wrongAnswers,
    accuracy: stats.accuracy,
  };
}

export function completePracticeSession(session: PracticeSession): PracticeSession | null {
  if (session.questionResults.length < session.totalQuestions) {
    return null;
  }

  const finishedAt = getCurrentTimestamp();
  const stats = calculateSessionStats(session.questionResults);
  const durationSeconds = Math.max(
    0,
    Math.round(
      (new Date(finishedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
    )
  );

  return {
    ...session,
    ...stats,
    status: 'completed',
    finishedAt,
    durationSeconds,
  };
}

export function abandonPracticeSession(session: PracticeSession): PracticeSession {
  const finishedAt = getCurrentTimestamp();
  const stats = calculateSessionStats(session.questionResults);
  const durationSeconds = Math.max(
    0,
    Math.round(
      (new Date(finishedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
    )
  );

  return {
    ...session,
    ...stats,
    status: 'abandoned',
    finishedAt,
    durationSeconds,
  };
}

function calculateAccuracyFromSessions(sessions: PracticeSession[]): number {
  const totalQuestions = sessions.reduce((acc, session) => acc + session.totalQuestions, 0);
  const correctAnswers = sessions.reduce((acc, session) => acc + session.correctAnswers, 0);

  return totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;
}

function calculateTrend(recentAccuracy: number, historicalAccuracy: number | null) {
  if (historicalAccuracy === null) return 'stable';
  if (recentAccuracy >= historicalAccuracy + 5) return 'up';
  if (recentAccuracy <= historicalAccuracy - 5) return 'down';
  return 'stable';
}

export function buildSubjectPerformance(
  sessions: PracticeSession[]
): SubjectPerformance[] {
  const completedSessions = sessions
    .filter((session) => session.status === 'completed')
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));
  const subjects = uniqueSubjects(completedSessions.map((session) => session.subject));

  return subjects.map((subject) => {
    const subjectSessions = completedSessions.filter(
      (session) => normalizeText(session.subject) === normalizeText(subject)
    );
    const recentSessions = subjectSessions.slice(0, 2);
    const historicalSessions = subjectSessions.slice(2);
    const totalQuestions = subjectSessions.reduce(
      (acc, session) => acc + session.totalQuestions,
      0
    );
    const correctAnswers = subjectSessions.reduce(
      (acc, session) => acc + session.correctAnswers,
      0
    );
    const wrongAnswers = subjectSessions.reduce(
      (acc, session) => acc + session.wrongAnswers,
      0
    );
    const accuracy =
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const recentAccuracy = calculateAccuracyFromSessions(recentSessions);
    const historicalAccuracy =
      historicalSessions.length > 0
        ? calculateAccuracyFromSessions(historicalSessions)
        : null;

    return {
      subject,
      totalSessions: subjectSessions.length,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      accuracy,
      recentAccuracy,
      lastPracticedAt: subjectSessions[0]?.finishedAt ?? null,
      trend: calculateTrend(recentAccuracy, historicalAccuracy),
    };
  });
}

function getWeakestSubject(subjectPerformance: SubjectPerformance[]): string | null {
  return sortSubjectPerformance(subjectPerformance)[0]?.subject ?? null;
}

function getStrongestSubject(subjectPerformance: SubjectPerformance[]): string | null {
  return [...subjectPerformance]
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) {
        return b.accuracy - a.accuracy;
      }

      if (a.recentAccuracy !== b.recentAccuracy) {
        return b.recentAccuracy - a.recentAccuracy;
      }

      return a.subject.localeCompare(b.subject);
    })[0]?.subject ?? null;
}

export function buildPracticeSummary(
  sessions: PracticeSession[],
  subjectPerformance: SubjectPerformance[]
): PracticeSummary {
  const completedSessions = sessions.filter((session) => session.status === 'completed');
  const totalQuestions = completedSessions.reduce(
    (acc, session) => acc + session.totalQuestions,
    0
  );
  const correctAnswers = completedSessions.reduce(
    (acc, session) => acc + session.correctAnswers,
    0
  );
  const wrongAnswers = completedSessions.reduce(
    (acc, session) => acc + session.wrongAnswers,
    0
  );

  return {
    totalSessions: completedSessions.length,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    accuracy:
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    weakestSubject: getWeakestSubject(subjectPerformance),
    strongestSubject: getStrongestSubject(subjectPerformance),
    lastPracticedAt: completedSessions[0]?.finishedAt ?? null,
  };
}

function getAverageValue(values: Array<number | null | undefined>): number | null {
  const numericValues = values.filter(
    (value): value is number => typeof value === 'number' && !Number.isNaN(value)
  );

  if (numericValues.length === 0) {
    return null;
  }

  return Math.round(
    numericValues.reduce((total, value) => total + value, 0) / numericValues.length
  );
}

export function buildPracticeSignals(params: {
  schedule: ScheduleDay[];
  sessions: PracticeSession[];
  subjectPerformance: SubjectPerformance[];
}): SubjectPracticeSignal[] {
  const completedSessions = params.sessions
    .filter((session) => session.status === 'completed')
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));
  const scheduleBlocksById = new Map(
    params.schedule.flatMap((day) =>
      (day.blocks ?? []).map((block) => [block.id, block] as const)
    )
  );

  return params.subjectPerformance.map((item) => {
    const recentSessions = completedSessions
      .filter((session) => normalizeText(session.subject) === normalizeText(item.subject))
      .slice(0, 2);
    const relatedBlocks = recentSessions.flatMap((session) =>
      session.relatedBlockIds
        .map((blockId) => scheduleBlocksById.get(blockId))
        .filter((block): block is ScheduleBlock => Boolean(block))
    );
    const recentConfidenceScore = getAverageValue(
      relatedBlocks.map((block) => block.confidenceScore ?? null)
    );
    const recentDifficulty = getAverageValue(
      relatedBlocks.map((block) => block.perceivedDifficulty ?? null)
    );
    const confidenceMismatch =
      recentConfidenceScore !== null &&
      recentConfidenceScore >= 4 &&
      item.recentAccuracy <= 60;

    return {
      subject: item.subject,
      accuracy: item.accuracy,
      recentAccuracy: item.recentAccuracy,
      totalQuestions: item.totalQuestions,
      trend: item.trend,
      lastPracticedAt: item.lastPracticedAt,
      confidenceMismatch,
      recentConfidenceScore,
      recentDifficulty,
      linkedBlockCount: relatedBlocks.length,
    };
  });
}

function mapRecommendationTitle(mode: PracticeBuildMode): string {
  switch (mode) {
    case 'weak_subject':
      return 'Reforcar materia fraca';
    case 'review':
      return 'Revisao rapida';
    case 'daily':
    default:
      return 'Pratica do dia';
  }
}

function mapRecommendationDescription(
  mode: PracticeBuildMode,
  result: BuildPracticeSessionResult | null
): string {
  if (!result) {
    switch (mode) {
      case 'weak_subject':
        return 'Resolva uma sessao curta assim que surgir historico suficiente por materia.';
      case 'review':
        return 'A revisao rapida aparece quando existir fila pendente ou sinal de baixa confianca.';
      case 'daily':
      default:
        return 'A pratica do dia aparece depois de um bloco concluido ou quando houver materia do dia pedindo consolidacao.';
    }
  }

  switch (mode) {
    case 'weak_subject':
      return `Foco direto em ${result.suggestedSubject}, sua materia mais sensivel agora.`;
    case 'review':
      return `Sessao curta para recuperar ${result.suggestedSubject} antes de esquecer.`;
    case 'daily':
    default:
      return result.source === 'daily_plan' && result.suggestedBlockIds.length > 0
        ? `Sessao curta para validar o bloco que voce acabou de estudar em ${result.suggestedSubject}.`
        : `Sessao curta conectada ao seu plano de hoje em ${result.suggestedSubject}.`;
  }
}

export function buildPracticeRecommendations(params: {
  schedule: ScheduleDay[];
  subjectPerformance: SubjectPerformance[];
  aiAnalysis?: AIAnalysis | null;
  reviewQueue?: IReviewItem[];
  sessions: PracticeSession[];
}): PracticeRecommendation[] {
  const todaySchedule = getTodayScheduleDays(params.schedule);
  const completedToday = params.sessions.some(
    (session) =>
      session.status === 'completed' &&
      session.finishedAt &&
      getLocalDateKey(new Date(session.finishedAt)) === getLocalDateKey()
  );

  const definitions: Array<{ mode: PracticeBuildMode; questionCount: 5 | 10 }> = [
    { mode: 'daily', questionCount: 5 },
    { mode: 'weak_subject', questionCount: 10 },
    { mode: 'review', questionCount: 5 },
  ];

  return definitions.map(({ mode, questionCount }) => {
    const result = buildPracticeSession({
      todaySchedule,
      subjectPerformance: params.subjectPerformance,
      practiceSessions: params.sessions,
      aiAnalysis: params.aiAnalysis,
      reviewQueue: params.reviewQueue,
      mode,
      questionCount,
    });

    return {
      mode,
      title: mapRecommendationTitle(mode),
      description: mapRecommendationDescription(mode, result),
      suggestedSubject: result?.suggestedSubject ?? null,
      suggestedBlockIds: result?.suggestedBlockIds ?? [],
      totalQuestions: questionCount,
      source: result?.source ?? null,
      status:
        mode === 'daily' && completedToday && result
          ? 'completed_today'
          : result
          ? 'ready'
          : 'empty',
    };
  });
}

function isQuestionBankItem(value: unknown): value is QuestionBankItem {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as QuestionBankItem;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.subject === 'string' &&
    typeof candidate.topic === 'string' &&
    typeof candidate.statement === 'string' &&
    Array.isArray(candidate.options) &&
    candidate.options.every(
      (option) =>
        Boolean(option) &&
        typeof option.id === 'string' &&
        typeof option.text === 'string'
    ) &&
    typeof candidate.correctOptionId === 'string' &&
    typeof candidate.explanation === 'string' &&
    (candidate.difficulty === 'easy' ||
      candidate.difficulty === 'medium' ||
      candidate.difficulty === 'hard') &&
    Array.isArray(candidate.tags) &&
    candidate.tags.every((tag) => typeof tag === 'string')
  );
}

function isQuestionResult(value: unknown): value is QuestionResult {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as QuestionResult;

  return (
    typeof candidate.questionId === 'string' &&
    typeof candidate.subject === 'string' &&
    typeof candidate.correct === 'boolean' &&
    typeof candidate.answeredAt === 'string' &&
    (typeof candidate.difficulty === 'number' ||
      candidate.difficulty === null ||
      typeof candidate.difficulty === 'undefined') &&
    (typeof candidate.selectedOptionId === 'string' ||
      candidate.selectedOptionId === null ||
      typeof candidate.selectedOptionId === 'undefined') &&
    (typeof candidate.correctOptionId === 'string' ||
      candidate.correctOptionId === null ||
      typeof candidate.correctOptionId === 'undefined') &&
    (typeof candidate.topic === 'string' ||
      candidate.topic === null ||
      typeof candidate.topic === 'undefined')
  );
}

export function isPracticeSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as PracticeSession;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.subject === 'string' &&
    Array.isArray(candidate.relatedBlockIds) &&
    candidate.relatedBlockIds.every((item) => typeof item === 'string') &&
    (candidate.source === 'daily_plan' ||
      candidate.source === 'weak_subject' ||
      candidate.source === 'revision_boost' ||
      candidate.source === 'manual') &&
    (candidate.status === 'idle' ||
      candidate.status === 'in_progress' ||
      candidate.status === 'completed' ||
      candidate.status === 'abandoned') &&
    typeof candidate.totalQuestions === 'number' &&
    typeof candidate.correctAnswers === 'number' &&
    typeof candidate.wrongAnswers === 'number' &&
    typeof candidate.accuracy === 'number' &&
    typeof candidate.startedAt === 'string' &&
    (typeof candidate.finishedAt === 'string' ||
      candidate.finishedAt === null ||
      typeof candidate.finishedAt === 'undefined') &&
    (typeof candidate.durationSeconds === 'number' ||
      candidate.durationSeconds === null ||
      typeof candidate.durationSeconds === 'undefined') &&
    (Array.isArray(candidate.questions)
      ? candidate.questions.every(isQuestionBankItem)
      : typeof candidate.questions === 'undefined') &&
    Array.isArray(candidate.questionResults) &&
    candidate.questionResults.every(isQuestionResult)
  );
}

function mapLegacySource(source?: string): PracticeSessionSource {
  if (source === 'today_schedule') return 'daily_plan';
  if (source === 'setup_fallback') return 'manual';
  if (source === 'weak_subject') return 'weak_subject';
  if (source === 'revision_boost') return 'revision_boost';
  return 'manual';
}

export function migrateLegacyPracticeSession(
  value: unknown,
  fallbackStatus: PracticeSession['status']
): PracticeSession | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as LegacySessionLike;
  const source = mapLegacySource(candidate.source);
  const subject =
    normalizePracticeSubject(candidate.subject) ||
    normalizePracticeSubject(candidate.subjects?.[0]) ||
    normalizePracticeSubject(candidate.questions?.[0]?.subject);

  if (!candidate.id || !subject) {
    return null;
  }

  const questionResults = (candidate.questions ?? [])
    .filter((question) => question.status === 'correct' || question.status === 'incorrect')
    .map((question, index) => ({
      questionId:
        question.id ??
        `${candidate.id}-question-${question.index ?? index + 1}`,
      subject,
      correct: question.status === 'correct',
      answeredAt: candidate.completedAt ?? candidate.createdAt ?? getCurrentTimestamp(),
      difficulty: null,
    }));

  const stats = calculateSessionStats(questionResults);

  return {
    id: candidate.id,
    subject,
    relatedBlockIds: [],
    source,
    status: candidate.completedAt ? 'completed' : fallbackStatus,
    totalQuestions: Math.max(
      questionResults.length,
      candidate.questionCount ?? questionResults.length ?? 0
    ),
    correctAnswers:
      typeof candidate.correctAnswers === 'number'
        ? candidate.correctAnswers
        : stats.correctAnswers,
    wrongAnswers:
      typeof candidate.incorrectAnswers === 'number'
        ? candidate.incorrectAnswers
        : stats.wrongAnswers,
    accuracy:
      candidate.questionCount && candidate.questionCount > 0
        ? Math.round(
            ((candidate.correctAnswers ?? stats.correctAnswers) / candidate.questionCount) * 100
          )
        : stats.accuracy,
    startedAt: candidate.createdAt ?? getCurrentTimestamp(),
    finishedAt: candidate.completedAt ?? null,
    durationSeconds: null,
    questionResults,
    questions: [],
  };
}
