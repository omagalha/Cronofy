import { AI_SIGNAL_MESSAGES } from './constants';
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

type SetupLike = {
  concurso?: string;
  dataProva?: string;
};

type BlockLike = {
  id?: string;
  subject?: string;
  title?: string;
  completed?: boolean;
  duration?: number;
  time?: string;
  hour?: string;
  startsAt?: string;
};

type ScheduleDayLike = {
  day?: string;
  blocks?: BlockLike[];
};

type ScheduleLike =
  | ScheduleDayLike[]
  | {
      days?: ScheduleDayLike[];
    }
  | null
  | undefined;

type AILike = {
  currentRiskLevel?: WidgetRiskLevel | 'low' | 'medium' | 'high';
  bestStudyPeriod?: string;
  hardestSubject?: string;
  suggestedLoadFactor?: number;
};

function normalizeSchedule(schedule: ScheduleLike): ScheduleDayLike[] {
  if (!schedule) return [];
  if (Array.isArray(schedule)) return schedule;
  if (Array.isArray(schedule.days)) return schedule.days;
  return [];
}

function getTodayWeekdayName(): string {
  const weekdays = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  return weekdays[new Date().getDay()];
}

function findTodayBlocks(schedule: ScheduleLike): BlockLike[] {
  const days = normalizeSchedule(schedule);
  const today = getTodayWeekdayName();

  const todayEntry = days.find((day) => day.day === today);
  if (!todayEntry?.blocks) return [];

  return todayEntry.blocks;
}

function getBlockSubject(block: BlockLike): string {
  return block.subject || block.title || 'Bloco de estudo';
}

function getBlockHour(block: BlockLike): string | null {
  return block.hour || block.time || block.startsAt || null;
}

function isBlockCompleted(block: BlockLike): boolean {
  return Boolean(block.completed);
}

function inferNextBlockState(timeLabel: string, isTodayDone: boolean): NextBlockWidgetData['state'] {
  if (isTodayDone) return 'done';
  if (!timeLabel || timeLabel === '--') return 'upcoming';

  const currentHour = new Date().getHours();

  if (timeLabel.includes('08:') || timeLabel.includes('09:') || timeLabel.includes('10:')) {
    if (currentHour >= 8 && currentHour <= 10) return 'ideal';
  }

  return 'upcoming';
}

function getNextBlockStatusLabel(state: NextBlockWidgetData['state']): string {
  switch (state) {
    case 'ideal':
      return 'hora ideal';
    case 'now':
      return 'comece agora';
    case 'done':
      return 'bom trabalho';
    case 'empty':
      return 'Cronofy';
    case 'upcoming':
    default:
      return 'em breve';
  }
}

export function selectCountdownRingWidget(
  setupData?: SetupLike | null
): CountdownRingWidgetData {
  const examTitle = getShortExamTitle(setupData?.concurso);
  const daysLeft = getDaysLeft(setupData?.dataProva);

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

export function selectNextBlockWidget(schedule?: ScheduleLike): NextBlockWidgetData {
  const todayBlocks = findTodayBlocks(schedule);

  if (todayBlocks.length === 0) {
    return {
      subject: 'Sem plano ativo',
      timeLabel: '--',
      duration: 0,
      statusLabel: 'Cronofy',
      state: 'empty',
    };
  }

  const pendingBlocks = todayBlocks.filter((block) => !isBlockCompleted(block));

  if (pendingBlocks.length === 0) {
    return {
      subject: 'Dia concluído',
      timeLabel: 'Tudo certo por hoje',
      duration: 0,
      statusLabel: 'bom trabalho',
      state: 'done',
    };
  }

  const nextBlock = pendingBlocks[0];
  const subject = getBlockSubject(nextBlock);
  const time = getBlockHour(nextBlock);
  const duration = nextBlock.duration ?? 0;
  const timeLabel = formatBlockTimeLabel(time, duration);

  const state = inferNextBlockState(timeLabel, false);

  return {
    subject,
    timeLabel,
    duration,
    statusLabel: getNextBlockStatusLabel(state),
    state,
  };
}

export function selectAIDailySignalWidget(aiData?: AILike | null): AIDailySignalWidgetData {
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
      supportLabel:
        aiData.bestStudyPeriod
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
          ? `carga sugerida: ${Math.round(aiData.suggestedLoadFactor)}%`
          : AI_SIGNAL_MESSAGES.medium.supportLabel,
      riskLevel: 'medium',
    };
  }

  return {
    message:
      aiData.hardestSubject
        ? `Revise ${aiData.hardestSubject} hoje`
        : AI_SIGNAL_MESSAGES.low.message,
    supportLabel:
      aiData.bestStudyPeriod
        ? `melhor janela: ${aiData.bestStudyPeriod}`
        : AI_SIGNAL_MESSAGES.low.supportLabel,
    riskLevel: 'low',
  };
}