import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppContext } from '../context/AppContext';

const formatBlockType = (type?: string) => {
  if (!type) return null;
  if (type === 'new') return 'Novo';
  if (type === 'review') return 'Revisão';
  if (type === 'practice') return 'Prática';
  return type;
};

export default function ScheduleScreen() {
  const { schedule } = useAppContext();

  const isEmpty = schedule.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Cronograma</Text>
        <Text style={styles.subtitle}>
          Aqui está seu plano de estudos da semana.
        </Text>

        {isEmpty ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Nenhum cronograma gerado</Text>
            <Text style={styles.emptyStateText}>
              Finalize seu setup para criar um plano de estudos.
            </Text>

            <Pressable
              style={styles.setupButton}
              onPress={() => router.replace('/setup')}
            >
              <Text style={styles.setupButtonText}>Ir para setup</Text>
            </Pressable>
          </View>
        ) : (
          schedule.map((dayItem) => (
            <View key={dayItem.id} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{dayItem.day}</Text>

              {dayItem.blocks.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum bloco planejado.</Text>
              ) : (
                dayItem.blocks.map((block) => {
                  const blockTypeLabel = formatBlockType(block.type);

                  return (
                    <View
                      key={block.id}
                      style={[
                        styles.blockCard,
                        block.completed && styles.blockCompleted,
                      ]}
                    >
                      <View style={styles.blockHeader}>
                        <Text style={styles.subject}>{block.subject}</Text>
                        <Text style={styles.time}>{block.time}</Text>
                      </View>

                      <Text style={styles.duration}>
                        {block.duration}
                        {blockTypeLabel ? ` • ${blockTypeLabel}` : ''}
                      </Text>

                      {!!block.tip && (
                        <Text style={styles.tip}>💡 {block.tip}</Text>
                      )}

                      {block.completed && (
                        <Text style={styles.completedText}>✅ Concluído</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  topBar: {
    marginBottom: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E0ECFF',
    borderRadius: 10,
  },
  backButtonText: {
    color: '#1565C0',
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 20,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCEBFF',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 14,
  },
  setupButton: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCEBFF',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  blockCard: {
    backgroundColor: '#EEF5FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  blockCompleted: {
    opacity: 0.62,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },
  subject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  time: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
  },
  duration: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 6,
  },
  tip: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  completedText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#1E8E5A',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
});