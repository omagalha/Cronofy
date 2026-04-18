import {
  buildPracticeSession,
  buildSubjectPerformance,
  completePracticeSession,
  createPracticeSessionFromSuggestion,
  registerQuestionResult,
} from '../utils/practiceEngine';
import type {
  PracticeBuildMode,
  PracticeSession,
} from '../apps/shared/types/practice';
import type { ScheduleDay, StudyBlock } from '../utils/scheduleEngine';

const BASE_TIME = new Date('2026-04-17T09:00:00.000Z');
let sessionCounter = 0;

function createBlock(
  id: string,
  subject: string,
  overrides: Partial<StudyBlock> = {}
): StudyBlock {
  return {
    id,
    subject,
    time: overrides.time ?? '09:00',
    duration: overrides.duration ?? '1h',
    type: overrides.type ?? 'new',
    mode: overrides.mode ?? 'focus',
    completed: overrides.completed ?? false,
    skipped: overrides.skipped ?? false,
    status: overrides.status ?? (overrides.completed ? 'completed' : 'pending'),
    completedAt: overrides.completedAt,
    startedAt: overrides.startedAt ?? null,
    rescheduledTo: overrides.rescheduledTo ?? null,
    interruptionCount: overrides.interruptionCount ?? null,
    perceivedEnergyLevel: overrides.perceivedEnergyLevel ?? null,
    perceivedDifficulty: overrides.perceivedDifficulty ?? null,
    confidenceScore: overrides.confidenceScore ?? null,
    reviewNote: overrides.reviewNote ?? null,
    generatedReviewIds: overrides.generatedReviewIds ?? [],
    originBlockId: overrides.originBlockId ?? null,
    isRecoveryInsertion: overrides.isRecoveryInsertion ?? false,
    isWeeklyRecoveryBlock: overrides.isWeeklyRecoveryBlock ?? false,
    tip: overrides.tip,
  };
}

function createTodaySchedule(blocks: StudyBlock[]): ScheduleDay[] {
  return [
    {
      id: 'day-today',
      day: 'sexta-feira',
      date: '2026-04-17',
      blocks,
    },
  ];
}

function getWrongOptionId(session: PracticeSession, questionId: string): string {
  const question = session.questions?.find((item) => item.questionId === questionId);

  if (!question) {
    throw new Error(`Questao ${questionId} nao encontrada na sessao`);
  }

  const wrongOption = question.options.find(
    (option) => option.id !== question.correctOptionId
  );

  if (!wrongOption) {
    throw new Error(`Nao encontrei alternativa errada para ${questionId}`);
  }

  return wrongOption.id;
}

function finalizeSession(
  sessionResult: NonNullable<ReturnType<typeof buildPracticeSession>>,
  correctRatio: number
): PracticeSession {
  const startedAt = new Date(BASE_TIME.getTime() + sessionCounter * 60_000).toISOString();
  let session = {
    ...createPracticeSessionFromSuggestion(sessionResult),
    startedAt,
  };

  const totalQuestions = session.questions?.length ?? 0;
  const targetCorrect = Math.max(
    0,
    Math.min(totalQuestions, Math.round(totalQuestions * correctRatio))
  );

  for (const [index, question] of (session.questions ?? []).entries()) {
    const answer =
      index < targetCorrect
        ? question.correctOptionId
        : getWrongOptionId(session, question.questionId);

    session = registerQuestionResult(session, question.questionId, answer);
  }

  const completed = completePracticeSession(session);

  if (!completed) {
    throw new Error('Sessao nao foi concluida corretamente');
  }

  sessionCounter += 1;
  const finishedAt = new Date(BASE_TIME.getTime() + sessionCounter * 60_000).toISOString();

  return {
    ...completed,
    startedAt,
    finishedAt,
    durationSeconds: 60,
  };
}

function logScenarioHeader(title: string) {
  console.log(`\n=== ${title} ===`);
}

function logSessionSummary(
  scenarioLabel: string,
  index: number,
  session: PracticeSession
) {
  const topics = (session.questions ?? []).map((question) => question.topic);
  const difficulties = (session.questions ?? []).map((question) => question.difficulty);

  console.log(
    `[${scenarioLabel}] sessao ${index + 1}:`,
    JSON.stringify(
      {
        subject: session.subject,
        source: session.source,
        accuracy: session.accuracy,
        topics,
        difficulties,
      },
      null,
      2
    )
  );
}

function runScenarioA() {
  logScenarioHeader('Cenario A - sem contexto forte');

  const sessions: PracticeSession[] = [];

  for (let index = 0; index < 5; index += 1) {
    const subjectPerformance = buildSubjectPerformance(sessions);
    const result = buildPracticeSession({
      todaySchedule: [],
      subjectPerformance,
      practiceSessions: sessions,
      mode: 'daily',
      questionCount: 5,
      allowSubjectFallback: true,
      debug: true,
    });

    if (!result) {
      throw new Error('Cenario A falhou ao montar sessao');
    }

    const session = finalizeSession(result, 0.6);
    sessions.unshift(session);
    logSessionSummary('cenario A', index, session);
  }
}

function runScenarioB() {
  logScenarioHeader('Cenario B - materia do dia em Portugues');

  const schedule = createTodaySchedule([
    createBlock('pt-focus', 'Portugues', {
      completed: true,
      completedAt: '2026-04-17T08:30:00.000Z',
      confidenceScore: 4,
      perceivedDifficulty: 3,
      type: 'new',
      mode: 'focus',
    }),
    createBlock('mat-pending', 'Matematica', {
      completed: false,
      confidenceScore: null,
      perceivedDifficulty: null,
      type: 'new',
      mode: 'focus',
    }),
  ]);
  const sessions: PracticeSession[] = [];

  for (let index = 0; index < 5; index += 1) {
    const subjectPerformance = buildSubjectPerformance(sessions);
    const result = buildPracticeSession({
      todaySchedule: schedule,
      subjectPerformance,
      practiceSessions: sessions,
      mode: 'daily',
      questionCount: 5,
      allowSubjectFallback: true,
      debug: true,
    });

    if (!result) {
      throw new Error('Cenario B falhou ao montar sessao');
    }

    const session = finalizeSession(result, 0.8);
    sessions.unshift(session);
    logSessionSummary('cenario B', index, session);
  }
}

function buildWeakSubjectHistory(): PracticeSession[] {
  const sessions: PracticeSession[] = [];
  const seedRuns: Array<{
    mode: PracticeBuildMode;
    subject: string;
    accuracyRatio: number;
  }> = [
    { mode: 'daily', subject: 'Raciocinio Logico', accuracyRatio: 0.2 },
    { mode: 'daily', subject: 'Raciocinio Logico', accuracyRatio: 0.4 },
    { mode: 'daily', subject: 'Portugues', accuracyRatio: 0.8 },
    { mode: 'daily', subject: 'Informatica', accuracyRatio: 1 },
  ];

  for (const seedRun of seedRuns) {
    const result = buildPracticeSession({
      todaySchedule: [],
      subjectPerformance: buildSubjectPerformance(sessions),
      practiceSessions: sessions,
      mode: seedRun.mode,
      questionCount: 5,
      allowSubjectFallback: true,
      debug: false,
    });

    if (!result || result.suggestedSubject !== seedRun.subject) {
      const forcedResult = buildPracticeSession({
        todaySchedule: createTodaySchedule([
          createBlock(`force-${seedRun.subject}`, seedRun.subject, {
            completed: true,
            completedAt: '2026-04-17T08:30:00.000Z',
            confidenceScore: 2,
            perceivedDifficulty: 4,
            type: 'new',
            mode: 'focus',
          }),
        ]),
        subjectPerformance: buildSubjectPerformance(sessions),
        practiceSessions: sessions,
        mode: 'daily',
        questionCount: 5,
        allowSubjectFallback: true,
        debug: false,
      });

      if (!forcedResult) {
        throw new Error(`Nao consegui semear historico para ${seedRun.subject}`);
      }

      sessions.unshift(finalizeSession(forcedResult, seedRun.accuracyRatio));
      continue;
    }

    sessions.unshift(finalizeSession(result, seedRun.accuracyRatio));
  }

  return sessions;
}

function runScenarioC() {
  logScenarioHeader('Cenario C - materia fraca em Raciocinio Logico');

  const sessions = buildWeakSubjectHistory();

  for (let index = 0; index < 5; index += 1) {
    const subjectPerformance = buildSubjectPerformance(sessions);
    const result = buildPracticeSession({
      todaySchedule: [],
      subjectPerformance,
      practiceSessions: sessions,
      mode: 'weak_subject',
      questionCount: 10,
      debug: true,
    });

    if (!result) {
      throw new Error('Cenario C falhou ao montar sessao');
    }

    const session = finalizeSession(result, 0.4);
    sessions.unshift(session);
    logSessionSummary('cenario C', index, session);
  }
}

function runScenarioD() {
  logScenarioHeader('Cenario D - penalidade por repeticao recente');

  const sessions: PracticeSession[] = [];

  for (let index = 0; index < 3; index += 1) {
    const result = buildPracticeSession({
      todaySchedule: createTodaySchedule([
        createBlock(`pt-repeat-${index}`, 'Portugues', {
          completed: true,
          completedAt: '2026-04-17T08:30:00.000Z',
          confidenceScore: 2,
          perceivedDifficulty: 4,
          type: 'new',
          mode: 'focus',
        }),
      ]),
      subjectPerformance: buildSubjectPerformance(sessions),
      practiceSessions: sessions,
      mode: 'daily',
      questionCount: 5,
      allowSubjectFallback: true,
      debug: false,
    });

    if (!result) {
      throw new Error('Nao consegui montar historico repetido de Portugues');
    }

    sessions.unshift(finalizeSession(result, 0.6));
  }

  const result = buildPracticeSession({
    todaySchedule: [],
    subjectPerformance: buildSubjectPerformance(sessions),
    practiceSessions: sessions,
    mode: 'daily',
    questionCount: 5,
    allowSubjectFallback: true,
    debug: true,
  });

  if (!result) {
    throw new Error('Cenario D falhou ao montar sessao');
  }

  const session = finalizeSession(result, 0.6);
  sessions.unshift(session);
  logSessionSummary('cenario D', 0, session);
}

runScenarioA();
runScenarioB();
runScenarioC();
runScenarioD();
