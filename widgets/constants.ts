export const DEFAULT_EXAM_TITLE = 'Cronofy';

export const AI_SIGNAL_MESSAGES = {
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
    supportLabel: 'Cronofy',
  },
} as const;