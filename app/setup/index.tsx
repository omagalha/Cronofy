import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';

const setupSteps = [
  { label: 'Definir concurso', route: '/setup/concurso' },
  { label: 'Definir nível', route: '/setup/nivel' },
  { label: 'Definir foco', route: '/setup/foco' },
  { label: 'Definir disponibilidade', route: '/setup/disponibilidade' },
  { label: 'Definir dias disponíveis', route: '/setup/dias' },
  { label: 'Adicionar matérias', route: '/setup/materias' },
] as const;

export default function SetupIndexScreen() {
  const { setupData, generateScheduleFromSubjects } = useAppContext();

  function handleFinishSetup() {
    if (setupData.materias.length === 0) {
      Alert.alert(
        'Adicione matérias',
        'Você precisa adicionar pelo menos uma matéria antes de gerar o cronograma.'
      );
      return;
    }

    if (setupData.diasDisponiveis.length === 0) {
      Alert.alert(
        'Selecione os dias disponíveis',
        'Escolha pelo menos um dia da semana para gerar o cronograma.'
      );
      return;
    }

    generateScheduleFromSubjects();
    router.replace('/home');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Setup do Cronofy</Text>
        <Text style={styles.subtitle}>
          Preencha suas informações para montar seu cronograma inicial.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo atual</Text>

          <Text style={styles.label}>
            Concurso:{' '}
            <Text style={styles.value}>
              {setupData.concurso || 'Não definido'}
            </Text>
          </Text>

          <Text style={styles.label}>
            Nível:{' '}
            <Text style={styles.value}>{setupData.nivel || 'Não definido'}</Text>
          </Text>

          <Text style={styles.label}>
            Foco:{' '}
            <Text style={styles.value}>{setupData.foco || 'Não definido'}</Text>
          </Text>

          <Text style={styles.label}>
            Disponibilidade:{' '}
            <Text style={styles.value}>
              {setupData.disponibilidade || 'Não definida'}
            </Text>
          </Text>

          <Text style={styles.label}>
            Dias disponíveis:{' '}
            <Text style={styles.value}>
              {setupData.diasDisponiveis.length > 0
                ? setupData.diasDisponiveis.join(', ')
                : 'Não definidos'}
            </Text>
          </Text>

          <Text style={styles.label}>
            Matérias:{' '}
            <Text style={styles.value}>{setupData.materias.length}</Text>
          </Text>
        </View>

        {setupSteps.map((step) => (
          <Pressable
            key={step.route}
            style={styles.secondaryButton}
            onPress={() => router.push(step.route)}
          >
            <Text style={styles.secondaryButtonText}>{step.label}</Text>
          </Pressable>
        ))}

        <Pressable style={styles.primaryButton} onPress={handleFinishSetup}>
          <Text style={styles.primaryButtonText}>Gerar cronograma</Text>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCEBFF',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 10,
  },
  value: {
    fontWeight: '600',
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#E0ECFF',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#1565C0',
    fontSize: 15,
    fontWeight: '600',
  },
});