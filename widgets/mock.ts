import { WidgetSnapshot } from './types';

export function createMockSnapshot(): WidgetSnapshot {
  return {
    countdownRing: {
      examTitle: 'INSS',
      daysLeft: 39,
      progress: 75,
      status: 'active',
    },
    nextBlock: {
      subject: 'Matemática',
      timeLabel: '08:00 • 45 min',
      duration: 45,
      statusLabel: 'hora ideal',
      state: 'ideal',
    },
    aiDailySignal: {
      message: 'Você está bem hoje',
      supportLabel: 'melhor janela: manhã',
      riskLevel: 'low',
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyMockSnapshot(): WidgetSnapshot {
  return {
    countdownRing: {
      examTitle: 'Cronofy',
      daysLeft: null,
      progress: 0,
      status: 'empty',
    },
    nextBlock: {
      subject: 'Sem plano ativo',
      timeLabel: '--',
      duration: 0,
      statusLabel: 'Cronofy',
      state: 'empty',
    },
    aiDailySignal: {
      message: 'Estude hoje para ativar insights',
      supportLabel: 'Cronofy',
      riskLevel: 'empty',
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createHighRiskMockSnapshot(): WidgetSnapshot {
  return {
    countdownRing: {
      examTitle: 'INSS',
      daysLeft: 12,
      progress: 90,
      status: 'active',
    },
    nextBlock: {
      subject: 'Português',
      timeLabel: '19:00 • 30 min',
      duration: 30,
      statusLabel: 'em breve',
      state: 'upcoming',
    },
    aiDailySignal: {
      message: 'Reduza a carga hoje',
      supportLabel: 'risco alto',
      riskLevel: 'high',
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createDoneMockSnapshot(): WidgetSnapshot {
  return {
    countdownRing: {
      examTitle: 'INSS',
      daysLeft: 39,
      progress: 75,
      status: 'active',
    },
    nextBlock: {
      subject: 'Dia concluído',
      timeLabel: 'Tudo certo por hoje',
      duration: 0,
      statusLabel: 'bom trabalho',
      state: 'done',
    },
    aiDailySignal: {
      message: 'Boa consistência hoje',
      supportLabel: 'plano do dia concluído',
      riskLevel: 'low',
    },
    updatedAt: new Date().toISOString(),
  };
}