import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';

const options = ['Iniciante', 'Intermediário', 'Avançado'];

export default function NivelScreen() {
  const { setupData, updateSetupField } = useAppContext();
  const { flow } = useLocalSearchParams<{ flow?: string }>();

  function handleSelect(value: string) {
    updateSetupField('nivel', value);

    if (flow === 'wizard') {
      router.push('/setup/foco?flow=wizard');
      return;
    }

    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Qual seu nível?</Text>
        <Text style={styles.subtitle}>
          Isso ajuda a calibrar melhor o cronograma.
        </Text>

        {options.map((option) => {
          const selected = setupData.nivel === option;

          return (
            <Pressable
              key={option}
              style={[styles.optionCard, selected && styles.optionCardSelected]}
              onPress={() => handleSelect(option)}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {option}
              </Text>
            </Pressable>
          );
        })}

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Voltar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  optionCardSelected: {
    backgroundColor: '#EAF3FF',
    borderColor: '#1565C0',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  optionTextSelected: {
    color: '#1565C0',
  },
  secondaryButton: {
    backgroundColor: '#E0ECFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#1565C0',
    fontSize: 15,
    fontWeight: '600',
  },
});
