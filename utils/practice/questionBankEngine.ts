import { questionBankSeed } from '../../data/questionBank/questionBank.seed';
import type {
  PracticeBuildMode,
  PracticeSession,
  QuestionBankItem,
  QuestionDifficulty,
  SubjectPerformance,
} from '../../domain/practice/types';

export type SelectQuestionBankItemsInput = {
  subject: string;
  totalQuestions: number;
  mode?: PracticeBuildMode;
  practiceSessions?: PracticeSession[];
  subjectPerformance?: SubjectPerformance[];
  excludeQuestionIds?: string[];
  todayTopics?: string[];
  debug?: boolean;
};

type SubjectHistorySnapshot = {
  recentQuestionIds: Set<string>;
  weakTopics: Set<string>;
  weakTags: Set<string>;
  studiedTodayTopics: Set<string>;
  preferredDifficulties: QuestionDifficulty[];
};

type RankedQuestion = {
  question: QuestionBankItem;
  score: number;
  reasons: string[];
};

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getQuestionBankItemId(question: Pick<QuestionBankItem, 'id' | 'questionId'>): string {
  return question.questionId || question.id;
}

function matchesSubject(candidate: string, requested: string) {
  return normalizeText(candidate) === normalizeText(requested);
}

function getSubjectBank(subject: string): QuestionBankItem[] {
  return questionBankSeed.filter((item) => matchesSubject(item.subject, subject));
}

function getSubjectHistorySnapshot(input: SelectQuestionBankItemsInput): SubjectHistorySnapshot {
  const sessions = input.practiceSessions ?? [];
  const normalizedSubject = normalizeText(input.subject);
  const subjectSessions = sessions
    .filter((session) => normalizeText(session.subject) === normalizedSubject)
    .sort((a, b) => (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt));

  const recentQuestionIds = new Set(
    subjectSessions
      .slice(0, 4)
      .flatMap((session) => session.questionResults.map((result) => result.questionId))
  );

  const weakResults = subjectSessions
    .slice(0, 6)
    .flatMap((session) => session.questionResults)
    .filter((result) => result.correct === false);

  const weakTopics = new Set(
    weakResults
      .map((result) => normalizeText(result.topic))
      .filter(Boolean)
  );
  const weakTags = new Set<string>();

  subjectSessions
    .slice(0, 6)
    .flatMap((session) => session.questions ?? [])
    .forEach((question) => {
      if (!weakTopics.has(normalizeText(question.topic))) return;

      question.tags.forEach((tag) => {
        const normalizedTag = normalizeText(tag);
        if (normalizedTag) {
          weakTags.add(normalizedTag);
        }
      });
    });

  const subjectPerformance = (input.subjectPerformance ?? []).find((item) =>
    matchesSubject(item.subject, input.subject)
  );
  const accuracy = subjectPerformance?.recentAccuracy ?? subjectPerformance?.accuracy ?? null;

  let preferredDifficulties: QuestionDifficulty[] = ['medium', 'easy', 'hard'];

  if (accuracy !== null) {
    if (accuracy < 60) {
      preferredDifficulties = ['easy', 'medium', 'hard'];
    } else if (accuracy >= 80) {
      preferredDifficulties = ['medium', 'hard', 'easy'];
    }
  }

  if (input.mode === 'weak_subject' || input.mode === 'review') {
    preferredDifficulties = ['easy', 'medium', 'hard'];
  }

  return {
    recentQuestionIds,
    weakTopics,
    weakTags,
    studiedTodayTopics: new Set((input.todayTopics ?? []).map((topic) => normalizeText(topic))),
    preferredDifficulties,
  };
}

function getDifficultyScore(
  difficulty: QuestionDifficulty,
  preferredDifficulties: QuestionDifficulty[]
) {
  const index = preferredDifficulties.indexOf(difficulty);
  return index === -1 ? 0 : preferredDifficulties.length - index;
}

function formatScoreReason(delta: number, reason: string): string {
  return `${delta >= 0 ? '+' : ''}${delta} ${reason}`;
}

function scoreQuestion(
  question: QuestionBankItem,
  history: SubjectHistorySnapshot
): RankedQuestion {
  let score = 0;
  const reasons: string[] = [];

  if (!history.recentQuestionIds.has(getQuestionBankItemId(question))) {
    score += 6;
    reasons.push(formatScoreReason(6, 'nao vista recentemente'));
  } else {
    score -= 3;
    reasons.push(formatScoreReason(-3, 'questao vista recentemente'));
  }

  if (history.weakTopics.has(normalizeText(question.topic))) {
    score += 5;
    reasons.push(formatScoreReason(5, `topico fraco: ${question.topic}`));
  }

  if (question.tags.some((tag) => history.weakTags.has(normalizeText(tag)))) {
    score += 3;
    reasons.push(formatScoreReason(3, 'tag ligada a erro recente'));
  }

  if (history.studiedTodayTopics.has(normalizeText(question.topic))) {
    score += 2;
    reasons.push(formatScoreReason(2, `topico estudado hoje: ${question.topic}`));
  }

  const difficultyScore = getDifficultyScore(
    question.difficulty,
    history.preferredDifficulties
  );
  score += difficultyScore;
  reasons.push(
    formatScoreReason(
      difficultyScore,
      `dificuldade ${question.difficulty} alinhada a ${history.preferredDifficulties.join(
        ' > '
      )}`
    )
  );

  return {
    question,
    score,
    reasons,
  };
}

function logQuestionBankSelection(params: {
  input: SelectQuestionBankItemsInput;
  history: SubjectHistorySnapshot;
  rankedQuestions: RankedQuestion[];
  finalQuestions: QuestionBankItem[];
}) {
  console.log('[questionBankEngine] selected subject:', params.input.subject);
  console.log('[questionBankEngine] subject context:', {
    mode: params.input.mode ?? 'daily',
    totalQuestions: params.input.totalQuestions,
    recentQuestionIds: Array.from(params.history.recentQuestionIds),
    weakTopics: Array.from(params.history.weakTopics),
    weakTags: Array.from(params.history.weakTags),
    studiedTodayTopics: Array.from(params.history.studiedTodayTopics),
    preferredDifficulties: params.history.preferredDifficulties,
  });
  console.log(
    '[questionBankEngine] ranked questions:',
    params.rankedQuestions.slice(0, 10).map((item) => ({
      id: item.question.id,
      topic: item.question.topic,
      difficulty: item.question.difficulty,
      score: item.score,
      reasons: item.reasons,
    }))
  );
  console.log(
    '[questionBankEngine] selected questions:',
    params.finalQuestions.map((question) => ({
      id: question.id,
      subject: question.subject,
      topic: question.topic,
      difficulty: question.difficulty,
    }))
  );
}

export function hasQuestionBankCoverage(subject: string): boolean {
  return getSubjectBank(subject).length > 0;
}

export function listQuestionBankSubjects(): string[] {
  return Array.from(new Set(questionBankSeed.map((item) => item.subject))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function selectQuestionBankItems(
  input: SelectQuestionBankItemsInput
): QuestionBankItem[] {
  const subjectBank = getSubjectBank(input.subject);

  if (subjectBank.length === 0) {
    if (input.debug) {
      console.log('[questionBankEngine] selected subject:', input.subject);
      console.log('[questionBankEngine] ranked questions:', []);
      console.log('[questionBankEngine] selected questions:', []);
    }
    return [];
  }

  const history = getSubjectHistorySnapshot(input);
  const excludedIds = new Set(input.excludeQuestionIds ?? []);

  const rankedQuestions = [...subjectBank]
    .filter((question) => !excludedIds.has(getQuestionBankItemId(question)))
    .map((question) => scoreQuestion(question, history))
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;

      if (a.question.difficulty !== b.question.difficulty) {
        return (
          getDifficultyScore(b.question.difficulty, history.preferredDifficulties) -
          getDifficultyScore(a.question.difficulty, history.preferredDifficulties)
        );
      }

      return getQuestionBankItemId(a.question).localeCompare(getQuestionBankItemId(b.question));
    });

  const finalQuestions = rankedQuestions
    .slice(0, input.totalQuestions)
    .map((item) => item.question);

  if (input.debug) {
    logQuestionBankSelection({
      input,
      history,
      rankedQuestions,
      finalQuestions,
    });
  }

  return finalQuestions;
}

export const questionBankEngine = {
  getAvailableSubjects: listQuestionBankSubjects,
  hasCoverage: hasQuestionBankCoverage,
  selectQuestions: selectQuestionBankItems,
};
