import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />

          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />

          <Stack.Screen name="setup/index" />
          <Stack.Screen name="setup/concurso" />
          <Stack.Screen name="setup/data-prova" />
          <Stack.Screen name="setup/nivel" />
          <Stack.Screen name="setup/foco" />
          <Stack.Screen name="setup/disponibilidade" />
          <Stack.Screen name="setup/dias" />
          <Stack.Screen name="setup/materias" />

          <Stack.Screen name="onboarding" />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
