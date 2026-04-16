import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SetupShell from '../../components/setup/SetupShell';
import { useAppContext } from '../../context/AppContext';

const options = [
  {
    title: 'Iniciante',
    description: 'Para quem está começando ou retomando os estudos agora.',
  },
  {
    title: 'Intermediário',
    description: 'Para quem já tem alguma base e quer ganhar ritmo com equilíbrio.',
  },
  {
    title: 'Avançado',
    description: 'Para quem já estudou bastante e precisa de mais densidade e revisão.',
  },
];

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
    <SetupShell
      step={3}
      totalSteps={7}
      title="Qual é o seu nível hoje?"
      subtitle="Isso ajuda o Cronofy a definir carga, duração dos blocos e ritmo inicial."
      primaryLabel="Escolha uma opção"
      primaryDisabled
      secondaryLabel="Voltar"
      onSecondaryPress={() => router.back()}
      footerHint="Não precisa ser perfeito. O plano pode evoluir depois."
    >
      <View style={styles.optionsWrap}>
        {options.map((option) => {
          const selected = setupData.nivel === option.title;

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