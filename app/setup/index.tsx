import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';

type SetupItem = {
  key: string;
  label: string;
  value: string;
  completed: boolean;
  route: "/setup/concurso" | "/setup/data-prova" | "/setup/nivel" | "/setup/foco" | "/setup/disponibilidade" | "/setup/dias" | "/setup/materias";
};

export default function SetupIndexScreen() {
  const { setupData, generateScheduleFromSubjects } = useAppContext();

  const items = useMemo<SetupItem[]>(() => {
    return [
      {
        key: 'concurso',
        label: 'Concurso',
        value: setupData.concurso || 'Não definido',
        completed: Boolean(setupData.concurso),
        route: '/setup/concurso',
      },
      {
        key: 'examDate',
        label: 'Data da prova',
        value: setupData.examDate || 'Não definida',
        completed: Boolean(setupData.examDate),
        route: '/setup/data-prova',
      },
      {
        key: 'nivel',
        label: 'Nível',
        value: setupData.nivel || 'Não definido',
        completed: Boolean(setupData.nivel),
        route: '/setup/nivel',
      },
      {
        key: 'foco',
        label: 'Foco',
        value: setupData.foco || 'Não definido',
        completed: Boolean(setupData.foco),
        route: '/setup/foco',
      },
      {
        key: 'disponibilidade',
        label: 'Disponibilidade',
        value: setupData.disponibilidade || 'Não definida',
        completed: Boolean(setupData.disponibilidade),
        route: '/setup/disponibilidade',
      },
      {
        key: 'dias',
        label: 'Dias disponíveis',
        value:
          setupData.diasDisponiveis.length > 0
            ? `${setupData.diasDisponiveis.length} selecionado(s)`
            : 'Não definidos',
        completed: setupData.diasDisponiveis.length > 0,
        route: '/setup/dias',
      },
      {
        key: 'materias',
        label: 'Matérias',
        value:
          setupData.materias.length > 0
            ? `${setupData.materias.length} adicionada(s)`
            : 'Nenhuma matéria',
        completed: setupData.materias.length > 0,
        route: '/setup/materias',
      },
    ];
  }, [setupData]);

  const completedSteps = items.filter((item) => item.completed).length;
  const totalSteps = items.length;
  const progress = completedSteps / totalSteps;

  const missingItems = items.filter((item) => !item.completed);

  function handleFinishSetup() {
    const result = generateScheduleFromSubjects();

    if (!result.success) {
      Alert.alert(
        'Setup incompleto',
        result.errors?.join('\n') ||
          'Revise seus dados antes de gerar o cronograma.'
      );
      return;
    }

    router.replace('/home');
  }

  function getProgressMessage() {
    if (completedSteps === 0) {
      return 'Comece preenchendo seu setup para o Cronofy montar um plano real para você.';
    }

    if (completedSteps < totalSteps) {
      return `${completedSteps} de ${totalSteps} etapas concluídas. Falta pouco para gerar seu cronograma.`;
    }

    return 'Tudo pronto. Agora o Cronofy já pode montar seu cronograma inicial.';
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SETUP</Text>
            </View>

            <Text style={styles.counterText}>
              {completedSteps}/{totalSteps}
            </Text>
          </View>

          <Text style={styles.title}>Revise seu plano inicial</Text>
          <Text style={styles.subtitle}>{getProgressMessage()}</Text>

          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedSteps}</Text>
            <Text style={styles.statLabel}>Etapas prontas</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{missingItems.length}</Text>
            <Text style={styles.statLabel}>Pendências</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{setupData.materias.length}</Text>
            <Text style={styles.statLabel}>Matérias</Text>
          </View>
        </View>

        {missingItems.length > 0 ? (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>Ainda faltam alguns pontos</Text>
            <Text style={styles.alertText}>
              Complete as etapas abaixo para gerar um cronograma mais confiável.
            </Text>
          </View>
        ) : (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Setup concluído</Text>
            <Text style={styles.successText}>
              Seu plano já tem base suficiente para ser gerado.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etapas do setup</Text>

          <View style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.route)}
                style={({ pressed }) => [
                  styles.itemCard,
                  pressed && styles.itemCardPressed,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    item.completed
                      ? styles.statusDotDone
                      : styles.statusDotPending,
                  ]}
                />

                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text
                    style={[
                      styles.itemValue,
                      !item.completed && styles.itemValuePending,
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    item.completed
                      ? styles.statusPillDone
                      : styles.statusPillPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      item.completed
                        ? styles.statusPillTextDone
                        : styles.statusPillTextPending,
                    ]}
                  >
                    {item.completed ? 'Pronto' : 'Falta'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.footerCard}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleFinishSetup}
          >
            <Text style={styles.primaryButtonText}>Gerar cronograma</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/setup/concurso')}
          >
            <Text style={styles.secondaryButtonText}>Editar setup</Text>
          </Pressable>

          <Text style={styles.footerHint}>
            Você poderá ajustar concurso, foco, matérias e rotina depois sem
            perder a estrutura do app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071120',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    backgroundColor: 'rgba(125,183,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(125,183,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#B7D7FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  counterText: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4DA1FF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FBFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCEBFF',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  alertTitle: {
    color: '#9A3412',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  alertText: {
    color: '#9A3412',
    fontSize: 14,
    lineHeight: 21,
  },
  successCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  successTitle: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  successText: {
    color: '#065F46',
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCEBFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginRight: 14,
  },
  statusDotDone: {
    backgroundColor: '#10B981',
  },
  statusDotPending: {
    backgroundColor: '#F59E0B',
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  itemValue: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  itemValuePending: {
    color: '#92400E',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillDone: {
    backgroundColor: '#DCFCE7',
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusPillTextDone: {
    color: '#166534',
  },
  statusPillTextPending: {
    color: '#92400E',
  },
  footerCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 14,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#071120',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.56)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
});
