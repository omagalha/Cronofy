import { router, useLocalSearchParams } from 'expo-router';
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

const SUGGESTED_SUBJECTS = [
  'Matemática',
  'Português',
  'Redação',
  'História',
  'Geografia',
  'Biologia',
  'Física',
  'Química',
  'Informática',
  'Direito Constitucional',
  'Direito Administrativo',
  'Raciocínio Lógico',
];

export default function MateriasScreen() {
  const { setupData, addSubject, removeSubject, clearSubjects } = useAppContext();
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const [input, setInput] = useState('');

  const availableSuggestions = useMemo(() => {
    return SUGGESTED_SUBJECTS.filter(
      (subject) => !setupData.materias.includes(subject)
    );
  }, [setupData.materias]);

  const selectedCount = setupData.materias.length;

  function handleAddSubject() {
    const trimmed = input.trim();
    if (!trimmed) return;

    addSubject(trimmed);
    setInput('');
  }

  function handleSelectSuggestion(subject: string) {
    addSubject(subject);
  }

  function handleContinue() {
    if (flow === 'wizard') {
      router.replace('/setup');
      return;
    }

    router.back();
  }

  function getFooterHint() {
    if (selectedCount === 0) {
      return 'Adicione pelo menos uma matéria para gerar seu cronograma.';
    }

    if (selectedCount === 1) {
      return '1 matéria selecionada. Você já pode seguir, mas o plano ficará mais simples.';
    }

    if (selectedCount <= 4) {
      return `${selectedCount} matérias selecionadas. Bom começo para um plano equilibrado.`;
    }

    return `${selectedCount} matérias selecionadas. Seu plano terá mais diversidade e rotação.`;
  }

  return (
    <SetupShell
      step={7}
      totalSteps={7}
      title="Quais matérias entram no seu plano?"
      subtitle="Adicione as matérias que o AprovAI vai distribuir no seu cronograma inicial."
      primaryLabel="Concluir setup"
      onPrimaryPress={handleContinue}
      primaryDisabled={selectedCount === 0}
      secondaryLabel={selectedCount > 0 ? 'Limpar matérias' : 'Voltar'}
      onSecondaryPress={
        selectedCount > 0 ? clearSubjects : () => router.back()
      }
      footerHint={getFooterHint()}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{selectedCount}</Text>
            <Text style={styles.statLabel}>Selecionadas</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{availableSuggestions.length}</Text>
            <Text style={styles.statLabel}>Sugestões</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adicionar manualmente</Text>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ex: Matemática"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleAddSubject}
          />

          <Pressable
            onPress={handleAddSubject}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.addButtonText}>Adicionar matéria</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sugestões rápidas</Text>

          <View style={styles.chipsWrap}>
            {availableSuggestions.length === 0 ? (
              <View style={styles.emptyInlineCard}>
                <Text style={styles.emptyInlineText}>
                  Todas as sugestões já foram adicionadas.
                </Text>
              </View>
            ) : (
              availableSuggestions.map((subject) => (
                <Pressable
                  key={subject}
                  onPress={() => handleSelectSuggestion(subject)}
                  style={({ pressed }) => [
                    styles.chip,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text style={styles.chipText}>{subject}</Text>
                </Pressable>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suas matérias</Text>

            {selectedCount > 0 ? (
              <Text style={styles.sectionCounter}>{selectedCount}</Text>
            ) : null}
          </View>

          {selectedCount === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>Nada por aqui ainda</Text>
              <Text style={styles.emptyStateText}>
                Adicione pelo menos uma matéria para o AprovAI montar seu plano.
              </Text>
            </View>
          ) : (
            <View style={styles.subjectsList}>
              {setupData.materias.map((materia, index) => (
                <View key={`${materia}-${index}`} style={styles.subjectCard}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectBadgeText}>{index + 1}</Text>
                  </View>

                  <View style={styles.subjectContent}>
                    <Text style={styles.subjectTitle}>{materia}</Text>
                    <Text style={styles.subjectSubtitle}>
                      Pronta para entrar no cronograma
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => removeSubject(materia)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.removeButtonText}>Remover</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SetupShell>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#DCEBFF',
    marginHorizontal: 10,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  sectionCounter: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#EAF3FF',
    color: '#1565C0',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 13,
    fontWeight: '800',
    paddingTop: 5,
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
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#1565C0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFE2FF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '700',
  },
  chipPressed: {
    opacity: 0.88,
  },
  emptyInlineCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 16,
    padding: 14,
  },
  emptyInlineText: {
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCEBFF',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
  },
  subjectsList: {
    gap: 10,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCEBFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subjectBadgeText: {
    color: '#1565C0',
    fontSize: 14,
    fontWeight: '800',
  },
  subjectContent: {
    flex: 1,
    marginRight: 12,
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subjectSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  removeButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
