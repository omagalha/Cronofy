import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppContext } from '../../context/AppContext';
import { buildWidgetSnapshotFromAppContext } from '../../widgets/fromAppContext';
import {
  createDoneMockSnapshot,
  createEmptyMockSnapshot,
  createHighRiskMockSnapshot,
  createMockSnapshot,
} from '../../widgets/mock';
import { saveWidgetSnapshot } from '../../widgets/storage';

type PreviewMode = 'real' | 'normal' | 'empty' | 'highRisk' | 'done';

export default function WidgetsPreviewScreen() {
  const {
    setupData,
    schedule,
    persistedSchedule,
    aiAnalysis,
  } = useAppContext() as any;

  const [mode, setMode] = useState<PreviewMode>('real');

  const realSnapshot = useMemo(() => {
    try {
      return buildWidgetSnapshotFromAppContext({
        setupData,
        schedule,
        persistedSchedule,
        aiAnalysis,
      });
    } catch (error) {
      console.warn('Erro ao montar snapshot real', error);
      return null;
    }
  }, [setupData, schedule, persistedSchedule, aiAnalysis]);

  useEffect(() => {
    if (!realSnapshot) return;
    saveWidgetSnapshot(realSnapshot);
  }, [realSnapshot]);

  const snapshot = useMemo(() => {
    if (mode === 'real' && realSnapshot) {
      return realSnapshot;
    }

    switch (mode) {
      case 'empty':
        return createEmptyMockSnapshot();
      case 'highRisk':
        return createHighRiskMockSnapshot();
      case 'done':
        return createDoneMockSnapshot();
      case 'normal':
        return createMockSnapshot();
      case 'real':
      default:
        return realSnapshot ?? createMockSnapshot();
    }
  }, [mode, realSnapshot]);

  const riskTone = getRiskTone(snapshot.aiDailySignal.riskLevel);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Preview Lab</Text>
          <Text style={styles.screenTitle}>Galeria de widgets</Text>
          <Text style={styles.screenSubtitle}>
            Showcase visual do Cronofy para Home Screen.
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toggleRow}
      >
        <ModeChip
          label="Real"
          active={mode === 'real'}
          onPress={() => setMode('real')}
        />
        <ModeChip
          label="Normal"
          active={mode === 'normal'}
          onPress={() => setMode('normal')}
        />
        <ModeChip
          label="Empty"
          active={mode === 'empty'}
          onPress={() => setMode('empty')}
        />
        <ModeChip
          label="High Risk"
          active={mode === 'highRisk'}
          onPress={() => setMode('highRisk')}
        />
        <ModeChip
          label="Done"
          active={mode === 'done'}
          onPress={() => setMode('done')}
        />
      </ScrollView>

      <SectionHeader
        title="Small"
        subtitle="Glanceable, direto e nativo"
      />

      <View style={styles.smallGrid}>
        <CountdownRingWidget
          title="🎯 Prova"
          daysLeft={snapshot.countdownRing.daysLeft}
          examTitle={snapshot.countdownRing.examTitle}
          progress={snapshot.countdownRing.progress}
          tone={countdownToneFromStatus(snapshot.countdownRing.status)}
        />

        <StreakPulseWidget
          title="🔥 Streak"
          current={mode === 'empty' ? 0 : mode === 'done' ? 12 : 7}
          best={mode === 'empty' ? 0 : 18}
        />
      </View>

      <SectionHeader
        title="Medium"
        subtitle="Ação, contexto e status"
      />

      <View style={styles.stack}>
        <NextBlockWidget snapshot={snapshot} />
        <TodayProgressWidget
          completed={mode === 'empty' ? 0 : mode === 'done' ? 4 : 2}
          total={mode === 'empty' ? 0 : 4}
          percent={mode === 'empty' ? 0 : mode === 'done' ? 100 : 50}
        />
        <AIWidget snapshot={snapshot} tone={riskTone} />
      </View>

      <SectionHeader
        title="Large"
        subtitle="Editorial, inteligente e premium"
      />

      <View style={styles.stack}>
        <DayBoardLargeWidget
          snapshot={snapshot}
          progressPercent={mode === 'empty' ? 0 : mode === 'done' ? 100 : 50}
          completed={mode === 'empty' ? 0 : mode === 'done' ? 4 : 2}
          total={mode === 'empty' ? 0 : 4}
          tone={riskTone}
        />
      </View>
    </ScrollView>
  );
}

function ModeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function CountdownRingWidget({
  title,
  daysLeft,
  examTitle,
  progress,
  tone,
}: {
  title: string;
  daysLeft: number | null;
  examTitle: string;
  progress: number;
  tone: WidgetTone;
}) {
  return (
    <View style={styles.widgetSmall}>
      <Text style={styles.widgetTitle}>{title}</Text>

      <View style={styles.ringWrap}>
        <ProgressRing
          size={72}
          strokeWidth={7}
          progress={progress}
          trackColor="rgba(255,255,255,0.08)"
          progressColor={tone.accent}
        />
        <View style={styles.ringCenter}>
          <Text style={styles.smallPrimaryNumber}>
            {daysLeft === null ? '--' : daysLeft}
          </Text>
          <Text style={styles.microLabel}>
            {daysLeft === 0 ? 'hoje' : 'dias'}
          </Text>
        </View>
      </View>

      <Text style={styles.widgetFootLabel} numberOfLines={1}>
        {examTitle}
      </Text>
    </View>
  );
}

function StreakPulseWidget({
  title,
  current,
  best,
}: {
  title: string;
  current: number;
  best: number;
}) {
  return (
    <View style={styles.widgetSmallAlt}>
      <Text style={styles.widgetTitle}>{title}</Text>
      <Text style={styles.smallHero}>{current}</Text>
      <Text style={styles.smallHeroSub}>dias seguidos</Text>
      <Text style={styles.widgetFootLabel}>melhor: {best}</Text>
    </View>
  );
}

function NextBlockWidget({ snapshot }: { snapshot: any }) {
  const badgeTone = nextBlockBadgeTone(snapshot.nextBlock.state);

  return (
    <View style={styles.widgetMedium}>
      <View style={styles.cardTopRow}>
        <Text style={styles.widgetTitle}>📘 Próximo</Text>
        <Pill label={snapshot.nextBlock.statusLabel} tone={badgeTone} />
      </View>

      <Text style={styles.mediumHeadline}>{snapshot.nextBlock.subject}</Text>

      <Text style={styles.mediumSubline}>{snapshot.nextBlock.timeLabel}</Text>
    </View>
  );
}

function TodayProgressWidget({
  completed,
  total,
  percent,
}: {
  completed: number;
  total: number;
  percent: number;
}) {
  return (
    <View style={styles.widgetMedium}>
      <View style={styles.cardTopRow}>
        <Text style={styles.widgetTitle}>📈 Hoje</Text>
        <Text style={styles.topMetric}>{percent}%</Text>
      </View>

      <Text style={styles.mediumHeadline}>
        {completed}/{total} blocos
      </Text>

      <Text style={styles.mediumSubline}>progresso do dia</Text>

      <View style={styles.progressBarTrack}>
        <View
          style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(percent, 100))}%` }]}
        />
      </View>
    </View>
  );
}

function AIWidget({
  snapshot,
  tone,
}: {
  snapshot: any;
  tone: WidgetTone;
}) {
  return (
    <View style={styles.widgetMedium}>
      <View style={styles.cardTopRow}>
        <Text style={styles.widgetTitle}>🤖 IA</Text>
        <Pill label={tone.label} tone={tone} />
      </View>

      <Text style={styles.aiHeadline}>{snapshot.aiDailySignal.message}</Text>
      <Text style={styles.mediumSubline}>{snapshot.aiDailySignal.supportLabel}</Text>
    </View>
  );
}

function DayBoardLargeWidget({
  snapshot,
  progressPercent,
  completed,
  total,
  tone,
}: {
  snapshot: any;
  progressPercent: number;
  completed: number;
  total: number;
  tone: WidgetTone;
}) {
  return (
    <View style={styles.widgetLarge}>
      <View style={styles.cardTopRow}>
        <View>
          <Text style={styles.widgetTitle}>🧠 Day Board</Text>
          <Text style={styles.largeIntro}>Seu dia, seu plano, sua IA</Text>
        </View>
        <Pill label={tone.label} tone={tone} />
      </View>

      <View style={styles.largeMainRow}>
        <View style={styles.largeRingBlock}>
          <ProgressRing
            size={92}
            strokeWidth={9}
            progress={progressPercent}
            trackColor="rgba(255,255,255,0.08)"
            progressColor={tone.accent}
          />
          <View style={styles.largeRingCenter}>
            <Text style={styles.largeRingNumber}>{progressPercent}%</Text>
            <Text style={styles.largeRingLabel}>hoje</Text>
          </View>
        </View>

        <View style={styles.largeInfoColumn}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blocos</Text>
            <Text style={styles.infoValue}>
              {completed}/{total}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Próximo</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {snapshot.nextBlock.subject}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Horário</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {snapshot.nextBlock.timeLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.largeInsightCard, { borderColor: tone.border }]}>
        <Text style={styles.largeInsightTitle}>Sinal da IA</Text>
        <Text style={styles.largeInsightMessage}>
          {snapshot.aiDailySignal.message}
        </Text>
        <Text style={styles.largeInsightSupport}>
          {snapshot.aiDailySignal.supportLabel}
        </Text>
      </View>
    </View>
  );
}

function ProgressRing({
  size,
  strokeWidth,
  progress,
  trackColor,
  progressColor,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  trackColor: string;
  progressColor: string;
}) {
  const clamped = Math.max(0, Math.min(progress, 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        stroke={trackColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <Circle
        stroke={progressColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: WidgetTone;
}) {
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: tone.background,
          borderColor: tone.border,
        },
      ]}
    >
      <Text style={[styles.pillText, { color: tone.accent }]}>{label}</Text>
    </View>
  );
}

type WidgetTone = {
  accent: string;
  background: string;
  border: string;
  label: string;
};

function getRiskTone(
  risk: 'low' | 'medium' | 'high' | 'empty'
): WidgetTone {
  switch (risk) {
    case 'high':
      return {
        accent: '#F97373',
        background: 'rgba(249, 115, 115, 0.10)',
        border: 'rgba(249, 115, 115, 0.24)',
        label: 'alto risco',
      };
    case 'medium':
      return {
        accent: '#FBBF24',
        background: 'rgba(251, 191, 36, 0.10)',
        border: 'rgba(251, 191, 36, 0.24)',
        label: 'atenção',
      };
    case 'low':
      return {
        accent: '#34D399',
        background: 'rgba(52, 211, 153, 0.10)',
        border: 'rgba(52, 211, 153, 0.24)',
        label: 'estável',
      };
    case 'empty':
    default:
      return {
        accent: '#A78BFA',
        background: 'rgba(167, 139, 250, 0.10)',
        border: 'rgba(167, 139, 250, 0.22)',
        label: 'aguardando',
      };
  }
}

function countdownToneFromStatus(
  status: 'active' | 'today' | 'expired' | 'empty'
): WidgetTone {
  switch (status) {
    case 'today':
      return {
        accent: '#F97373',
        background: 'rgba(249, 115, 115, 0.10)',
        border: 'rgba(249, 115, 115, 0.24)',
        label: 'hoje',
      };
    case 'expired':
      return {
        accent: '#94A3B8',
        background: 'rgba(148, 163, 184, 0.10)',
        border: 'rgba(148, 163, 184, 0.20)',
        label: 'encerrado',
      };
    case 'empty':
      return {
        accent: '#A78BFA',
        background: 'rgba(167, 139, 250, 0.10)',
        border: 'rgba(167, 139, 250, 0.22)',
        label: 'sem data',
      };
    case 'active':
    default:
      return {
        accent: '#60A5FA',
        background: 'rgba(96, 165, 250, 0.10)',
        border: 'rgba(96, 165, 250, 0.22)',
        label: 'ativa',
      };
  }
}

function nextBlockBadgeTone(
  state: 'upcoming' | 'ideal' | 'now' | 'done' | 'empty'
): WidgetTone {
  switch (state) {
    case 'ideal':
      return {
        accent: '#34D399',
        background: 'rgba(52, 211, 153, 0.10)',
        border: 'rgba(52, 211, 153, 0.24)',
        label: 'ideal',
      };
    case 'now':
      return {
        accent: '#60A5FA',
        background: 'rgba(96, 165, 250, 0.10)',
        border: 'rgba(96, 165, 250, 0.22)',
        label: 'agora',
      };
    case 'done':
      return {
        accent: '#A78BFA',
        background: 'rgba(167, 139, 250, 0.10)',
        border: 'rgba(167, 139, 250, 0.22)',
        label: 'feito',
      };
    case 'empty':
      return {
        accent: '#94A3B8',
        background: 'rgba(148, 163, 184, 0.10)',
        border: 'rgba(148, 163, 184, 0.20)',
        label: 'vazio',
      };
    case 'upcoming':
    default:
      return {
        accent: '#60A5FA',
        background: 'rgba(96, 165, 250, 0.10)',
        border: 'rgba(96, 165, 250, 0.22)',
        label: 'em breve',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    marginBottom: 4,
  },
  eyebrow: {
    color: '#8B9BB4',
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  screenSubtitle: {
    color: '#8B9BB4',
    fontSize: 14,
    lineHeight: 20,
  },
  toggleRow: {
    gap: 10,
    paddingTop: 4,
    paddingBottom: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#132033',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: {
    backgroundColor: '#1F3150',
    borderColor: 'rgba(96,165,250,0.30)',
  },
  chipText: {
    color: '#B8C4D9',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#7E8CA4',
    fontSize: 13,
  },
  smallGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  stack: {
    gap: 14,
  },
  widgetSmall: {
    flex: 1,
    minHeight: 170,
    backgroundColor: '#101B2C',
    borderRadius: 30,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  widgetSmallAlt: {
    flex: 1,
    minHeight: 170,
    backgroundColor: '#121F34',
    borderRadius: 30,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  widgetMedium: {
    width: '100%',
    backgroundColor: '#101B2C',
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  widgetLarge: {
    width: '100%',
    backgroundColor: '#101B2C',
    borderRadius: 34,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    gap: 16,
  },
  widgetTitle: {
    color: '#8FA1BC',
    fontSize: 13,
    fontWeight: '600',
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPrimaryNumber: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  microLabel: {
    color: '#7E8CA4',
    fontSize: 11,
    marginTop: 2,
  },
  widgetFootLabel: {
    color: '#7E8CA4',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 'auto',
  },
  smallHero: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    marginTop: 12,
  },
  smallHeroSub: {
    color: '#A3B1C6',
    fontSize: 13,
    marginTop: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mediumHeadline: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 6,
  },
  mediumSubline: {
    color: '#8FA1BC',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  topMetric: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  progressBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#60A5FA',
  },
  aiHeadline: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    marginTop: 18,
    marginBottom: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  largeIntro: {
    color: '#8FA1BC',
    fontSize: 13,
    marginTop: 4,
  },
  largeMainRow: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
  },
  largeRingBlock: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeRingNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  largeRingLabel: {
    color: '#8FA1BC',
    fontSize: 12,
    marginTop: 2,
  },
  largeInfoColumn: {
    flex: 1,
    gap: 12,
  },
  infoRow: {
    gap: 2,
  },
  infoLabel: {
    color: '#7E8CA4',
    fontSize: 12,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  largeInsightCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  largeInsightTitle: {
    color: '#8FA1BC',
    fontSize: 12,
    marginBottom: 8,
  },
  largeInsightMessage: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  largeInsightSupport: {
    color: '#8FA1BC',
    fontSize: 13,
    marginTop: 6,
  },
});
