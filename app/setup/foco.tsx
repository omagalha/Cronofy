import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SetupShell from '../../components/setup/SetupShell';
import { useAppContext } from '../../context/AppContext';

const options = [
  {
    title: 'Aprovação rápida',
    description: 'Mais ritmo, avanço constante e estudo mais objetivo.',
  },
  {
    title: 'Base forte',
    description: 'Mais profundidade, compreensão e construção sólida.',
  },
  {
    title: 'Revisão',
    description: 'Mais reforço de conteúdo e retenção do que já foi estudado.',
  },
  {
    title: 'Constância diária',
    description: 'Carga mais sustentável para manter rotina sem sobrecarga.',
  },
];

export default function FocoScreen() {
  const { setupData, updateSetupField } = useAppContext();
  const { flow } = useLocalSearchParams<{ flow?: string }>();

  function handleSelect(value: string) {
    updateSetupField('foco', value);

    if (flow === 'wizard') {
      router.push('/setup/disponibilidade?flow=wizard');
      return;
    }

    router.back();
  }

  return (
    <SetupShell
      step={4}
      totalSteps={7}
      title="Qual é o seu foco principal?"
      subtitle="O Cronofy usa essa escolha para ajustar a estratégia do cronograma."
      primaryLabel="Escolha uma opção"
      primaryDisabled
      secondaryLabel="Voltar"
      onSecondaryPress={() => router.back()}
      footerHint="Essa escolha muda a forma como o plano distribui sua energia."
    >
      <View style={styles.optionsWrap}>
        {options.map((option) => {
          const selected = setupData.foco === option.title;

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