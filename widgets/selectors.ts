import {
  formatBlockTimeLabel,
  getDaysLeft,
  getShortExamTitle,
  inferCountdownProgress,
} from './formatters';
import {
  AIDailySignalWidgetData,
  CountdownRingWidgetData,
  NextBlockWidgetData,
  WidgetRiskLevel,
} from './types';

type WidgetSetupSource = {
  concurso?: string;
  examDate?: string;
};

type WidgetBlockSource = {
  subject?: string;
  completed?: boolean;
  duration?: string | number;
  time?: string;
};

type WidgetDaySource = {
  day?: string;
  date?: string;
  blocks?: WidgetBlockSource[];
};

type WidgetScheduleSource = {
  days?: WidgetDaySource[];
} | WidgetDaySource[] | null | undefined;

type WidgetAISource = {
  currentRiskLevel?: 'low' | 'medium' | 'high';
  bestStudyPeriod?: string | null;
  hardestSubject?: string | null;
  suggestedLoadFactor?: number;
} | null | undefined;

const AI_SIGNAL_MESSAGES = {
  high: {
    message: 'Reduza a carga hoje',
    supportLabel: 'risco alto',
  },
  medium: {
    message: 'Mantenha ritmo leve',
    supportLabel: 'preserve constância',
  },
  low: {
    message: 'Você está bem hoje',
    supportLabel: 'boa janela de estudo',
  },
  empty: {
    message: 'Estude hoje para ativar insights',
    supportLabel: 'AprovAI',
  },
} as const;

function normalizeSchedule(schedule: WidgetScheduleSource): WidgetDaySource[] {
  if (!schedule) return [];
  if (Array.isArray(schedule)) return schedule;
  if (Array.isArray(schedule.days)) return schedule.days;
  return [];
}

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTodayWeekdayName(): string {
  const weekdays = [
    'domingo',
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado',
  ];
  return weekdays[new Date().getDay()];
}

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseDuration(duration?: string | number): number {
  if (typeof duration === 'number') return duration;
  if (!duration) return 0;

  const value = duration.toLowerCase().trim();

  if (value.includes('h')) {
    const hours = Number(value.match(/(\d+)\s*h/)?.[1] ?? 0);
    const minutes = Number(value.match(/(\d+)\s*min/)?.[1] ?? 0);
    return hours * 60 + minutes;
  }

  const parsed = Number.parseInt(value.replace(/\D/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function findTodayBlocks(schedule: WidgetScheduleSource): WidgetBlockSource[] {
  const days = normalizeSchedule(schedule);
  const todayDate = getTodayDateKey();
  const todayWeekday = getTodayWeekdayName();

  const todayEntry =
    days.find((day) => normalizeText(day.date) === todayDate) ??
    days.find((day) => normalizeText(day.day) === todayWeekday);

  return todayEntry?.blocks ?? [];
}

function inferNextBlockState(
  timeLabel: string,
  isTodayDone: boolean
): NextBlockWidgetData['state'] {
  if (isTodayDone) return 'done';
  if (!timeLabel || timeLabel === '--') return 'upcoming';

  const currentHour = new Date().getHours();

  if (
    timeLabel.includes('08:') ||
    timeLabel.includes('09:') ||
    timeLabel.includes('10:')
  ) {
    if (currentHour >= 8 && currentHour <= 10) return 'ideal';
  }

  return 'upcoming';
}

function getNextBlockStatusLabel(
  state: NextBlockWidgetData['state']
): string {
  switch (state) {
    case 'ideal':
      return 'hora ideal';
    case 'now':
      return 'comece agora';
    case 'done':
      return 'bom trabalho';
    case 'empty':
      return 'AprovAI';
    default:
      return 'em breve';
  }
}

export function selectCountdownRingWidget(
  setupData?: WidgetSetupSource | null
): CountdownRingWidgetData {
  const examTitle = getShortExamTitle(setupData?.concurso);
  const daysLeft = getDaysLeft(setupData?.examDate);

  if (daysLeft === null) {
    return {
      examTitle,
      daysLeft: null,
      progress: 0,
      status: 'empty',
    };
  }

  if (daysLeft < 0) {
    return {
      examTitle,
      daysLeft,
      progress: 100,
      status: 'expired',
    };
  }

  if (daysLeft === 0) {
    return {
      examTitle,
      daysLeft: 0,
      progress: 100,
      status: 'today',
    };
  }

  return {
    examTitle,
    daysLeft,
    progress: inferCountdownProgress(daysLeft),
    status: 'active',
  };
}

export function selectNextBlockWidget(
  schedule?: WidgetScheduleSource
): NextBlockWidgetData {
  const todayBlocks = findTodayBlocks(schedule);

  if (!todayBlocks.length) {
    return {
      subject: 'Sem plano ativo',
      timeLabel: '--',
      duration: 0,
      statusLabel: 'AprovAI',
      state: 'empty',
    };
  }

  const pendingBlocks = todayBlocks.filter((block) => !block.completed);

  if (!pendingBlocks.length) {
    return {
      subject: 'Dia concluído',
      timeLabel: 'Tudo certo por hoje',
      duration: 0,
      statusLabel: 'bom trabalho',
      state: 'done',
    };
  }

  const nextBlock = pendingBlocks[0];
  const duration = parseDuration(nextBlock.duration);
  const timeLabel = formatBlockTimeLabel(nextBlock.time, duration);
  const state = inferNextBlockState(timeLabel, false);

  return {
    subject: nextBlock.subject || 'Bloco de estudo',
    timeLabel,
    duration,
    statusLabel: getNextBlockStatusLabel(state),
    state,
  };
}

export function selectAIDailySignalWidget(
  aiData?: WidgetAISource
): AIDailySignalWidgetData {
  if (!aiData?.currentRiskLevel) {
    return {
      message: AI_SIGNAL_MESSAGES.empty.message,
      supportLabel: AI_SIGNAL_MESSAGES.empty.supportLabel,
      riskLevel: 'empty',
    };
  }

  const riskLevel = aiData.currentRiskLevel as WidgetRiskLevel;

  if (riskLevel === 'high') {
    return {
      message: AI_SIGNAL_MESSAGES.high.message,
      supportLabel: aiData.bestStudyPeriod
        ? `melhor janela: ${aiData.bestStudyPeriod}`
        : AI_SIGNAL_MESSAGES.high.supportLabel,
      riskLevel: 'high',
    };
  }

  if (riskLevel === 'medium') {
    return {
      message: AI_SIGNAL_MESSAGES.medium.message,
      supportLabel:
        typeof aiData.suggestedLoadFactor === 'number'
          ? `carga sugerida: ${Math.round(aiData.suggestedLoadFactor * 100)}%`
          : AI_SIGNAL_MESSAGES.medium.supportLabel,
      riskLevel: 'medium',
    };
  }

  return {
    message: aiData.hardestSubject
      ? `Revise ${aiData.hardestSubject} hoje`
      : AI_SIGNAL_MESSAGES.low.message,
    supportLabel: aiData.bestStudyPeriod
      ? `melhor janela: ${aiData.bestStudyPeriod}`
      : AI_SIGNAL_MESSAGES.low.supportLabel,
    riskLevel: 'low',
  };
}
