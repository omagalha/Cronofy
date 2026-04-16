import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import SetupShell from '../../components/setup/SetupShell';
import { useAppContext } from '../../context/AppContext';

const QUICK_OPTIONS = [
  'Banco do Brasil',
  'Caixa',
  'INSS',
  'TJ',
  'PRF',
  'PF',
];

export default function ConcursoScreen() {
  const { setupData, updateSetupField } = useAppContext();
  const [value, setValue] = useState(setupData.concurso);

  function handleContinue() {
    updateSetupField('concurso', value.trim());
    router.push('/setup/data-prova?flow=wizard');
  }

  return (
    <SetupShell
      step={1}
      totalSteps={7}
      title="Qual concurso você está mirando?"
      subtitle="Isso ajuda o Cronofy a começar seu plano com mais contexto e organização."
      primaryLabel="Continuar"
      onPrimaryPress={handleContinue}
      secondaryLabel="Voltar"
      onSecondaryPress={() => router.back()}
      primaryDisabled={!value.trim()}
      footerHint="Você pode ajustar isso depois sem perder sua evolução."
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.sectionTitle}>Digite o concurso</Text>

        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Ex: INSS, Caixa, TJ, PRF..."
          placeholderTextColor="#94A3B8"
          style={styles.input}
          autoCorrect={false}
        />

        <View style={styles.spacer} />

        <Text style={styles.sectionTitle}>Sugestões rápidas</Text>

        <View style={styles.chipsWrap}>
          {QUICK_OPTIONS.map((option) => {
            const selected = value.trim() === option;

            return (
              <Pressable
                key={option}
                onPress={() => setValue(option)}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </KeyboardAvoidingView>
    </SetupShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    color: '#0F172A',
  },
  spacer: {
    height: 22,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: '#EAF3FF',
    borderColor: '#1565C0',
  },
  chipText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#1565C0',
  },
  chipPressed: {
    opacity: 0.88,
  },
});