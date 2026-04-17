import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SetupShell from '../../components/setup/SetupShell';
import { useAppContext } from '../../context/AppContext';

const options = [
  {
    title: 'Até 1 hora por dia',
    description: 'Plano mais leve, ideal para encaixar estudo com baixa fricção.',
  },
  {
    title: '1 a 2 horas por dia',
    description: 'Bom equilíbrio entre constância e avanço.',
  },
  {
    title: '2 a 4 horas por dia',
    description: 'Permite um cronograma mais robusto com maior volume.',
  },
  {
    title: 'Mais de 4 horas por dia',
    description: 'Maior intensidade para quem consegue sustentar carga alta.',
  },
];

export default function DisponibilidadeScreen() {
  const { setupData, updateSetupField } = useAppContext();
  const { flow } = useLocalSearchParams<{ flow?: string }>();

  function handleSelect(value: string) {
    updateSetupField('disponibilidade', value);

    if (flow === 'wizard') {
      router.push('/setup/dias?flow=wizard');
      return;
    }

    router.back();
  }

  return (
    <SetupShell
      step={5}
      totalSteps={7}
      title="Quanto tempo você tem por dia?"
      subtitle="O AprovAI usa isso para definir quantos blocos cabem na sua rotina."
      primaryLabel="Escolha uma opção"
      primaryDisabled
      secondaryLabel="Voltar"
      onSecondaryPress={() => router.back()}
      footerHint="É melhor começar com um ritmo sustentável do que exagerar agora."
    >
      <View style={styles.optionsWrap}>
        {options.map((option) => {
          const selected = setupData.disponibilidade === option.title;

          return (
            <Pressable
              key={option.title}
              style={({ pressed }) => [
                styles.optionCard,
                selected && styles.optionCardSelected,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => handleSelect(option.title)}
            >
              <Text
                style={[
                  styles.optionTitle,
                  selected && styles.optionTitleSelected,
                ]}
              >
                {option.title}
              </Text>

              <Text
                style={[
                  styles.optionDescription,
                  selected && styles.optionDescriptionSelected,
                ]}
              >
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SetupShell>
  );
}

const styles = StyleSheet.create({
  optionsWrap: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 18,
    padding: 18,
  },
  optionCardSelected: {
    backgroundColor: '#EAF3FF',
    borderColor: '#1565C0',
  },
  optionCardPressed: {
    opacity: 0.9,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  optionTitleSelected: {
    color: '#1565C0',
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    fontWeight: '500',
  },
  optionDescriptionSelected: {
    color: '#1E3A8A',
  },
});
