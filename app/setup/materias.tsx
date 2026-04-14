import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

  function handleAddSubject() {
    const trimmed = input.trim();
    if (!trimmed) return;
    addSubject(trimmed);
    setInput('');
  }

  function handleSelectSuggestion(subject: string) {
    addSubject(subject);
  }

  function handleFinish() {
    if (flow === 'wizard') {
      router.replace('/setup');
      return;
    }

    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Setup</Text>
            <Text style={styles.title}>Escolha suas matérias</Text>
            <Text style={styles.subtitle}>
              Adicione as matérias que vão compor seu cronograma inicial.
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{setupData.materias.length}</Text>
                <Text style={styles.heroStatLabel}>Selecionadas</Text>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>
                  {Math.max(0, SUGGESTED_SUBJECTS.length - setupData.materias.length)}
                </Text>
                <Text style={styles.heroStatLabel}>Sugestões</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputCard}>
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
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Adicionar matéria</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sugestões rápidas</Text>

            <View style={styles.chipsWrap}>
              {availableSuggestions.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Todas as sugestões já foram adicionadas.
                  </Text>
                </View>
              ) : (
                availableSuggestions.map((subject) => (
                  <Pressable
                    key={subject}
                    onPress={() => handleSelectSuggestion(subject)}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      pressed && styles.chipPressed,
                    ]}
                  >
                    <Text style={styles.suggestionChipText}>{subject}</Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Suas matérias</Text>

              {setupData.materias.length > 0 && (
                <Pressable
                  onPress={clearSubjects}
                  style={({ pressed }) => [
                    styles.clearPill,
                    pressed && styles.pillPressed,
                  ]}
                >
                  <Text style={styles.clearPillText}>Limpar</Text>
                </Pressable>
              )}
            </View>

            {setupData.materias.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>Nada por aqui ainda</Text>
                <Text style={styles.emptyStateText}>
                  Adicione pelo menos uma matéria para gerar o cronograma.
                </Text>
              </View>
            ) : (
              setupData.materias.map((materia, index) => (
                <View key={`${materia}-${index}`} style={styles.subjectItem}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectBadgeText}>{index + 1}</Text>
                  </View>

                  <View style={styles.subjectContent}>
                    <Text style={styles.subjectText}>{materia}</Text>
                    <Text style={styles.subjectSubtext}>Pronta para entrar no plano</Text>
                  </View>

                  <Pressable
                    onPress={() => removeSubject(materia)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.removeButtonPressed,
                    ]}
                  >
                    <Text style={styles.removeButtonText}>Remover</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => [
                styles.footerPrimaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.footerPrimaryButtonText}>Concluir</Text>
            </Pressable>

            <Text style={styles.footerHint}>
              Depois você poderá usar IA para sugerir matérias e ajustar o cronograma.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF5FF',
  },
  keyboard: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#1565C0',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DCEBFF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#EAF3FF',
    marginBottom: 20,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 13,
    color: '#DCEBFF',
    fontWeight: '600',
  },
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: 8,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCEBFF',
    marginBottom: 18,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#1565C0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFE2FF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionChipText: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 16,
    padding: 14,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
  },
  clearPill: {
    backgroundColor: '#E0ECFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearPillText: {
    color: '#1565C0',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
    lineHeight: 20,
    color: '#64748B',
  },
  subjectItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCEBFF',
    marginBottom: 10,
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
  subjectText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subjectSubtext: {
    fontSize: 13,
    color: '#64748B',
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
  footer: {
    marginTop: 6,
  },
  footerPrimaryButton: {
    backgroundColor: '#1565C0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  footerPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footerHint: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  chipPressed: {
    opacity: 0.88,
  },
  pillPressed: {
    opacity: 0.88,
  },
  removeButtonPressed: {
    opacity: 0.88,
  },
});
