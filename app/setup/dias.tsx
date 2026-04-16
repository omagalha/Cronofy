import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SetupShell from '../../components/setup/SetupShell';
import { useAppContext } from '../../context/AppContext';

const weekDays = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

function getDaysMessage(count: number): string {
  if (count === 0) {
    return 'Selecione os dias em que você realmente consegue estudar.';
  }

  if (count === 1) {
    return '1 dia selecionado. Seu plano ficará mais concentrado.';
  }

  if (count <= 3) {
    return `${count} dias selecionados. Bom para uma rotina objetiva e sustentável.`;
  }

  if (count <= 5) {
    return `${count} dias selecionados. Ótimo equilíbrio entre constância e volume.`;
  }

  return `${count} dias selecionados. Seu plano terá bastante flexibilidade.`;
}

export default function DiasScreen() {
  const { setupData, toggleAvailableDay, clearAvailableDays } = useAppContext();
  const { flow } = useLocalSearchParams<{ flow?: string }>();

  const selectedCount = setupData.diasDisponiveis.length;
  const helperMessage = getDaysMessage(selectedCount);

  function handleContinue() {
    if (flow === 'wizard') {
      router.push('/setup/materias?flow=wizard');
      return;
    }

    router.back();
  }

  return (
    <SetupShell
      step={6}
      totalSteps={7}
      title="Quais dias você tem disponíveis?"
      subtitle="Escolha os dias em que o plano pode distribuir seus blocos de estudo."
      primaryLabel="Continuar"
      onPrimaryPress={handleContinue}
      primaryDisabled={selectedCount === 0}
      secondaryLabel="Limpar seleção"
      onSecondaryPress={clearAvailableDays}
      footerHint={helperMessage}
    >
      <View style={styles.counterCard}>
        <Text style={styles.counterLabel}>Dias selecionados</Text>
        <Text style={styles.counterValue}>{selectedCount}</Text>
      </View>

      <View style={styles.grid}>
        {weekDays.map((day) => {
          const selected = setupData.diasDisponiveis.includes(day);

          return (
            <Pressable
              key={day}
              style={({ pressed }) => [
                styles.dayCard,
                selected && styles.dayCardSelected,
                pressed && styles.dayCardPressed,
              ]}
              onPress={() => toggleAvailableDay(day)}
            >
              <Text
                style={[
                  styles.dayTitle,
                  selected && styles.dayTitleSelected,
                ]}
              >
                {day}
              </Text>

              <Text
                style={[
                  styles.daySubtitle,
                  selected && styles.daySubtitleSelected,
                ]}
              >
                {selected ? 'Selecionado' : 'Toque para ativar'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SetupShell>
  );
}

const styles = StyleSheet.create({
  counterCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  counterLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  counterValue: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
  },
  grid: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dayCardSelected: {
    backgroundColor: '#EAF3FF',
    borderColor: '#1565C0',
  },
  dayCardPressed: {
    opacity: 0.9,
  },
  dayTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  dayTitleSelected: {
    color: '#1565C0',
  },
  daySubtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  daySubtitleSelected: {
    color: '#1E3A8A',
  },
});