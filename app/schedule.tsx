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

export default function ScheduleScreen() {
  const { schedule } = useAppContext();

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

        {schedule.map((dayItem) => (
          <View key={dayItem.id} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{dayItem.day}</Text>

            {dayItem.blocks.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum bloco planejado.</Text>
            ) : (
              dayItem.blocks.map((block) => (
                <View key={block.id} style={styles.blockCard}>
                  <View style={styles.blockHeader}>
                    <Text style={styles.subject}>{block.subject}</Text>
                    <Text style={styles.time}>{block.time}</Text>
                  </View>

                  <Text style={styles.duration}>Duração: {block.duration}</Text>
                </View>
              ))
            )}
          </View>
        ))}
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
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
});

