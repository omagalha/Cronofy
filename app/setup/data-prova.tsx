import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';

export default function DataProvaScreen() {
  const { setupData, updateSetupField } = useAppContext();
  const [value, setValue] = useState(setupData.examDate || '');

  const handleContinue = () => {
    updateSetupField('examDate', value.trim());
    router.push('/setup/nivel');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View>
          <Text style={styles.title}>Quando é sua prova?</Text>
          <Text style={styles.subtitle}>
            Isso ajuda a montar um plano com senso de prazo e contagem regressiva.
          </Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Ex: 2026-03-15"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continuar</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9FC',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#123B7A',
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: '#536273',
    lineHeight: 22,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EEF9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: '#0F172A',
  },
  button: {
    backgroundColor: '#123B7A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});