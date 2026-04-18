import { questionBankSeed } from '../../data/questionBank/questionBank.seed';
import {
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
};

type SubjectHistorySnapshot = {
  recentQuestionIds: Set<string>;
  weakTopics: Set<string>;
  weakTags: Set<string>;
  preferredDifficulties: QuestionDifficulty[];
};

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

function scoreQuestion(
  question: QuestionBankItem,
  history: SubjectHistorySnapshot
): number {
  let score = 0;

  if (!history.recentQuestionIds.has(question.id)) {
    score += 6;
  } else {
    score -= 3;
  }

  if (history.weakTopics.has(normalizeText(question.topic))) {
    score += 5;
  }

  if (question.tags.some((tag) => history.weakTags.has(normalizeText(tag)))) {
    score += 3;
  }

  score += getDifficultyScore(question.difficulty, history.preferredDifficulties);

  return score;
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
    return [];
  }

  const history = getSubjectHistorySnapshot(input);

  return [...subjectBank]
    .sort((a, b) => {
      const scoreDiff = scoreQuestion(b, history) - scoreQuestion(a, history);
      if (scoreDiff !== 0) return scoreDiff;

      if (a.difficulty !== b.difficulty) {
        return getDifficultyScore(b.difficulty, history.preferredDifficulties) -
          getDifficultyScore(a.difficulty, history.preferredDifficulties);
      }

      return a.id.localeCompare(b.id);
    })
    .slice(0, input.totalQuestions);
}
