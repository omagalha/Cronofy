import { Stack } from 'expo-router';
import React from 'react';
import { AppProvider } from '../context/AppProvider';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="home" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="setup/index" />
        <Stack.Screen name="setup/concurso" />
        <Stack.Screen name="setup/data-prova" />
        <Stack.Screen name="setup/nivel" />
        <Stack.Screen name="setup/foco" />
        <Stack.Screen name="setup/disponibilidade" />
        <Stack.Screen name="setup/dias" />
        <Stack.Screen name="setup/materias" />
      </Stack>
    </AppProvider>
  );
}
