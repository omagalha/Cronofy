import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../context/AppContext';

type BlockItem = {
  id: string;
  subject?: string;
  completed?: boolean;
  duration?: string | number;
  time?: string;
  type?: string;
  reviewNote?: string | null;
};

type ScheduleDay = {
  day?: number | string;
  weekday?: string;
  date?: string;
  blocks?: BlockItem[];
};

type DifficultyOption = 'easy' | 'medium' | 'hard';
type ConfidenceOption = 'high' | 'medium' | 'low';

const weekDayMapPt: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

function normalizeText(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDuration(duration?: string | number) {
  if (typeof duration === 'number') return `${duration} min`;
  if (typeof duration === 'string' && duration.trim().length > 0) return duration;
  return 'Sessão';
}

function getDayLabel(day: ScheduleDay, index: number) {
  if (typeof day.day === 'number') return weekDayMapPt[day.day] || `Dia ${index + 1}`;
  if (typeof day.day === 'string' && day.day.trim()) return day.day;
  if (typeof day.weekday === 'string' && day.weekday.trim()) return day.weekday;
  return `Dia ${index + 1}`;
}

function mapDifficultyToScore(value: DifficultyOption): number {
  switch (value) {
    case 'easy':
      return 2;
    case 'medium':
      return 3;
    case 'hard':
      return 5;
    default:
      return 3;
  }
}

function mapConfidenceToScore(value: ConfidenceOption): number {
  switch (value) {
    case 'high':
      return 5;
    case 'medium':
      return 3;
    case 'low':
      return 1;
    default:
      return 3;
  }
}

export default function ScheduleScreen() {
  const {
    schedule,
    previewAdaptiveSchedule,
    adaptiveSuggestions,
    completeBlockById,
    applyAdaptivePlan,
  } = useAppContext();

  const [selectedBlock, setSelectedBlock] = useState<BlockItem | null>(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

  const [difficulty, setDifficulty] = useState<DifficultyOption>('medium');
  const [confidence, setConfidence] = useState<ConfidenceOption>('medium');
  const [reviewNote, setReviewNote] = useState('');

  function openFeedbackModal(block: BlockItem) {
    setSelectedBlock(block);
    setDifficulty('medium');
    setConfidence('medium');
    setReviewNote(block.reviewNote ?? '');
    setFeedbackModalVisible(true);
  }

  function closeFeedbackModal() {
    setFeedbackModalVisible(false);
    setSelectedBlock(null);
    setReviewNote('');
    setDifficulty('medium');
    setConfidence('medium');
  }

  function handleConfirmBlock() {
    if (!selectedBlock) return;

    completeBlockById(selectedBlock.id, {
      mode: selectedBlock.type === 'review' ? 'review' : 'focus',
      interruptionCount: 0,
      perceivedDifficulty: mapDifficultyToScore(difficulty),
      confidenceScore: mapConfidenceToScore(confidence),
      reviewNote: reviewNote.trim() || null,
    });

    closeFeedbackModal();
  }

  const scheduleDays = useMemo<ScheduleDay[]>(() => {
    const source = previewAdaptiveSchedule?.length ? previewAdaptiveSchedule : schedule;

    if (Array.isArray(source)) return source as ScheduleDay[];
    if (source && Array.isArray((source as any).days)) {
      return (source as any).days as ScheduleDay[];
    }
    return [];
  }, [previewAdaptiveSchedule, schedule]);

  const todayIndex = new Date().getDay();
  const todayDate = getTodayDateKey();

  const totals = useMemo(() => {
    let totalBlocks = 0;
    let completedBlocks = 0;

    for (const day of scheduleDays) {
      const blocks = day.blocks ?? [];
      totalBlocks += blocks.length;
      completedBlocks += blocks.filter((block) => block.completed).length;
    }

    const progress =
      totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

    return {
      totalBlocks,
      completedBlocks,
      progress,
    };
  }, [scheduleDays]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Cronograma</Text>
          </View>

          <Text style={styles.heroTitle}>Seu plano completo</Text>
          <Text style={styles.heroSubtitle}>
            Visualize os blocos, acompanhe o progresso e ajuste a rota com inteligência.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totals.totalBlocks}</Text>
            <Text style={styles.statLabel}>Blocos totais</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totals.completedBlocks}</Text>
            <Text style={styles.statLabel}>Concluídos</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progresso geral</Text>

          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${totals.progress}%` }]}
            />
          </View>

          <Text style={styles.progressText}>
            {totals.progress}% do cronograma concluído
          </Text>
        </View>

        {adaptiveSuggestions?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ajustes inteligentes</Text>

            {adaptiveSuggestions.slice(0, 3).map((item: any, index: number) => (
              <View key={`${item.title}-${index}`} style={styles.suggestionRow}>
                <Text style={styles.suggestionTitle}>{item.title}</Text>
                <Text style={styles.suggestionDescription}>
                  {item.description}
                </Text>
              </View>
            ))}

            <Pressable style={styles.applyButton} onPress={applyAdaptivePlan}>
              <Text style={styles.applyButtonText}>Aplicar ajustes</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.daysWrapper}>
          {scheduleDays.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Sem cronograma</Text>
              <Text style={styles.emptyText}>
                Gere ou atualize seu plano para visualizar os blocos aqui.
              </Text>
            </View>
          ) : (
            scheduleDays.map((day, index) => {
              const blocks = day.blocks ?? [];
              const completedCount = blocks.filter((block) => block.completed).length;
              const dayProgress =
                blocks.length > 0
                  ? Math.round((completedCount / blocks.length) * 100)
                  : 0;

              const isToday =
                normalizeText(String(day.date)) === normalizeText(todayDate) ||
                Number(day.day) === todayIndex;

              return (
                <View
                  key={`${String(day.day)}-${day.date ?? index}`}
                  style={[styles.dayCard, isToday && styles.dayCardToday]}
                >
                  <View style={styles.dayHeader}>
                    <View>
                      <Text style={styles.dayTitle}>{getDayLabel(day, index)}</Text>
                      {!!day.date && <Text style={styles.dayDate}>{day.date}</Text>}
                    </View>

                    {isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>Hoje</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.dayProgressRow}>
                    <Text style={styles.dayProgressText}>
                      {completedCount}/{blocks.length} concluídos
                    </Text>
                    <Text style={styles.dayProgressText}>{dayProgress}%</Text>
                  </View>

                  <View style={styles.dayProgressTrack}>
                    <View
                      style={[
                        styles.dayProgressFill,
                        { width: `${dayProgress}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.blocksWrapper}>
                    {blocks.length === 0 ? (
                      <Text style={styles.emptyBlockText}>Sem blocos neste dia.</Text>
                    ) : (
                      blocks.map((block) => (
                        <View key={block.id} style={styles.blockRow}>
                          <View style={styles.blockLeft}>
                            <Text style={styles.blockSubject}>
                              {block.subject || 'Bloco de estudo'}
                            </Text>

                            <Text style={styles.blockMeta}>
                              {block.time ? `${block.time} • ` : ''}
                              {formatDuration(block.duration)}
                              {block.type ? ` • ${block.type}` : ''}
                            </Text>

                            {!!block.reviewNote && (
                              <View style={styles.noteBadge}>
                                <Text style={styles.noteBadgeText}>
                                  dúvida salva para revisão
                                </Text>
                              </View>
                            )}
                          </View>

                          {block.completed ? (
                            <View style={styles.doneBadge}>
                              <Text style={styles.doneBadgeText}>Concluído</Text>
                            </View>
                          ) : (
                            <Pressable
                              style={styles.completeButton}
                              onPress={() => openFeedbackModal(block)}
                            >
                              <Text style={styles.completeButtonText}>Concluir</Text>
                            </Pressable>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={feedbackModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFeedbackModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>FINALIZAR BLOCO</Text>
            <Text style={styles.modalTitle}>Como foi esse bloco?</Text>

            {!!selectedBlock?.subject && (
              <Text style={styles.modalSubtitle}>
                {selectedBlock.subject}
                {selectedBlock.time ? ` • ${selectedBlock.time}` : ''}
              </Text>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Dificuldade</Text>
              <View style={styles.optionRow}>
                <OptionChip
                  label="Foi tranquilo"
                  active={difficulty === 'easy'}
                  onPress={() => setDifficulty('easy')}
                />
                <OptionChip
                  label="Exigiu atenção"
                  active={difficulty === 'medium'}
                  onPress={() => setDifficulty('medium')}
                />
                <OptionChip
                  label="Pegou bastante"
                  active={difficulty === 'hard'}
                  onPress={() => setDifficulty('hard')}
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Confiança</Text>
              <View style={styles.optionRow}>
                <OptionChip
                  label="Entendi bem"
                  active={confidence === 'high'}
                  onPress={() => setConfidence('high')}
                />
                <OptionChip
                  label="Entendi mais ou menos"
                  active={confidence === 'medium'}
                  onPress={() => setConfidence('medium')}
                />
                <OptionChip
                  label="Ainda estou inseguro"
                  active={confidence === 'low'}
                  onPress={() => setConfidence('low')}
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Dúvida para revisar depois</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Ex: regra de três, crase, interpretação de gráficos..."
                placeholderTextColor="#64748B"
                value={reviewNote}
                onChangeText={setReviewNote}
                multiline
              />
            </View>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalSecondaryButton} onPress={closeFeedbackModal}>
                <Text style={styles.modalSecondaryButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable style={styles.modalPrimaryButton} onPress={handleConfirmBlock}>
                <Text style={styles.modalPrimaryButtonText}>Salvar e concluir</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function OptionChip({
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
      style={[styles.optionChip, active && styles.optionChipActive]}
    >
      <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },

  hero: {
    backgroundColor: '#6366F1',
    padding: 20,
    borderRadius: 22,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  heroSubtitle: {
    color: '#E0E7FF',
    marginTop: 8,
    lineHeight: 20,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },

  card: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 18,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  progressTrack: {
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 12,
    backgroundColor: '#6366F1',
    borderRadius: 999,
  },
  progressText: {
    color: '#CBD5F5',
    marginTop: 10,
    fontSize: 13,
  },

  suggestionRow: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  suggestionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  suggestionDescription: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  applyButton: {
    marginTop: 6,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  daysWrapper: {
    gap: 14,
  },
  dayCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
  },
  dayCardToday: {
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },

  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dayTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dayDate: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },

  todayBadge: {
    backgroundColor: 'rgba(99,102,241,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  todayBadgeText: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '700',
  },

  dayProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayProgressText: {
    color: '#CBD5F5',
    fontSize: 13,
  },
  dayProgressTrack: {
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  dayProgressFill: {
    height: 10,
    backgroundColor: '#22C55E',
    borderRadius: 999,
  },

  blocksWrapper: {
    gap: 10,
  },
  blockRow: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockLeft: {
    flex: 1,
    paddingRight: 12,
  },
  blockSubject: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  blockMeta: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },

  noteBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99,102,241,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 10,
  },
  noteBadgeText: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '700',
  },

  doneBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  doneBadgeText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },

  completeButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  emptyCard: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 18,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#94A3B8',
    lineHeight: 20,
  },
  emptyBlockText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#111C30',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalEyebrow: {
    color: '#8FA1BC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },
  modalSection: {
    marginTop: 18,
  },
  modalSectionTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  optionRow: {
    gap: 10,
  },
  optionChip: {
    backgroundColor: '#0B1324',
    borderWidth: 1,
    borderColor: '#24324A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionChipActive: {
    backgroundColor: 'rgba(99,102,241,0.16)',
    borderColor: '#6366F1',
  },
  optionChipText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: '#FFFFFF',
  },
  noteInput: {
    minHeight: 92,
    backgroundColor: '#0B1324',
    borderWidth: 1,
    borderColor: '#24324A',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  modalPrimaryButton: {
    flex: 1.3,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});