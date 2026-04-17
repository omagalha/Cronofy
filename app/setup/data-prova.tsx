import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
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

function getDaysUntil(dateString: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;

  const target = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / 86400000);
}

function formatPreview(dateString: string): string {
  const days = getDaysUntil(dateString);

  if (days === null) {
    return 'Informe uma data no formato YYYY-MM-DD para ativar a contagem regressiva.';
  }

  if (days < 0) {
    return 'Essa data já passou. Revise a data da prova para gerar um plano coerente.';
  }

  if (days === 0) {
    return 'Sua prova é hoje. O AprovAI vai priorizar urgência máxima.';
  }

  if (days <= 30) {
    return `Faltam ${days} dias. Seu plano vai ganhar mais urgência e foco.`;
  }

  if (days <= 90) {
    return `Faltam ${days} dias. Seu plano terá equilíbrio entre avanço e revisão.`;
  }

  return `Faltam ${days} dias. Seu plano poderá priorizar constância e construção de base.`;
}

export default function DataProvaScreen() {
  const { setupData, updateSetupField } = useAppContext();
  const [value, setValue] = useState(setupData.examDate || '');

  const previewMessage = useMemo(() => formatPreview(value.trim()), [value]);

  function handleContinue() {
    updateSetupField('examDate', value.trim());
    router.push('/setup/nivel?flow=wizard');
  }

  function handleSkip() {
    updateSetupField('examDate', '');
    router.push('/setup/nivel?flow=wizard');
  }

  return (
    <SetupShell
      step={2}
      totalSteps={7}
      title="Quando é sua prova?"
      subtitle="Essa informação ajuda o AprovAI a calibrar urgência, ritmo e contagem regressiva."
      primaryLabel="Continuar"
      onPrimaryPress={handleContinue}
      secondaryLabel="Pular por agora"
      onSecondaryPress={handleSkip}
      footerHint="Você pode definir ou alterar essa data depois."
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.sectionTitle}>Digite a data</Text>

        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Ex: 2026-03-15"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.helperText}>Formato esperado: YYYY-MM-DD</Text>

        <View style={styles.previewCard}>
          <Text style={styles.previewEyebrow}>Preview do plano</Text>
          <Text style={styles.previewText}>{previewMessage}</Text>
        </View>

        <Pressable onPress={() => setValue('')}>
          <Text style={styles.clearText}>Limpar data</Text>
        </Pressable>
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
  helperText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  previewCard: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 18,
    padding: 16,
  },
  previewEyebrow: {
    color: '#1565C0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  previewText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  clearText: {
    marginTop: 14,
    color: '#1565C0',
    fontSize: 14,
    fontWeight: '700',
  },
});
