export type CountdownTone = 'empty' | 'neutral' | 'warning' | 'urgent';

export const getDaysUntilExam = (examDate: string): number | null => {
  if (!examDate?.trim()) return null;

  const today = new Date();
  const exam = new Date(examDate);

  if (Number.isNaN(exam.getTime())) {
    return null;
  }

  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);

  const diffMs = exam.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const formatExamDate = (examDate: string): string => {
  if (!examDate?.trim()) return 'Defina a data da prova';

  const date = new Date(examDate);

  if (Number.isNaN(date.getTime())) {
    return 'Data inválida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const getCountdownTone = (
  examDate: string
): CountdownTone => {
  const daysUntilExam = getDaysUntilExam(examDate);

  if (daysUntilExam === null) return 'empty';
  if (daysUntilExam === 0) return 'urgent';
  if (daysUntilExam < 30) return 'urgent';
  if (daysUntilExam <= 90) return 'warning';
  return 'neutral';
};

export const getCountdownLabel = (examDate: string): string => {
  const daysUntilExam = getDaysUntilExam(examDate);

  if (daysUntilExam === null) {
    return 'Defina a data da prova';
  }

  if (daysUntilExam < 0) {
    return 'A data da prova já passou';
  }

  if (daysUntilExam === 0) {
    return 'A prova é hoje';
  }

  if (daysUntilExam === 1) {
    return '1 dia restante';
  }

  return `${daysUntilExam} dias restantes`;
};