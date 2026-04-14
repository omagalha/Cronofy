import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';

const weekDays = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export default function DiasScreen() {
  const { setupData, toggleAvailableDay, clearAvailableDays } = useAppContext();
  const { flow } = useLocalSearchParams<{ flow?: string }>();

  function handleSaveDays() {
    if (flow === 'wizard') {
      router.push('/setup/materias?flow=wizard');
      return;
    }

    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dias disponíveis</Text>
        <Text style={styles.subtitle}>
          Escolha os dias em que você pode estudar.
        </Text>

        <View style={styles.grid}>
          {weekDays.map((day) => {
            const selected = setupData.diasDisponiveis.includes(day);

            return (
              <Pressable
                key={day}
                style={[styles.dayButton, selected && styles.dayButtonSelected]}
                onPress={() => toggleAvailableDay(day)}
              >
                <Text
                  style={[styles.dayButtonText, selected && styles.dayButtonTextSelected]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.secondaryButton}
          onPress={clearAvailableDays}
        >
          <Text style={styles.secondaryButtonText}>Limpar seleção</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={handleSaveDays}>
          <Text style={styles.primaryButtonText}>Salvar dias</Text>
        </Pressable>
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
    padding: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 24,
  },
  grid: {
    gap: 12,
    marginBottom: 24,
  },
  dayButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dayButtonSelected: {
    backgroundColor: '#EAF3FF',
    borderColor: '#1565C0',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  dayButtonTextSelected: {
    color: '#1565C0',
  },
  primaryButton: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#E0ECFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#1565C0',
    fontSize: 15,
    fontWeight: '600',
  },
});
