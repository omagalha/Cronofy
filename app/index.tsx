import { Redirect } from 'expo-router';
import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function Index() {
  const {
    setupData,
    isSetupLoaded,
    persistedSchedule,
    isScheduleLoaded,
  } = useAppContext();

  if (!isSetupLoaded || !isScheduleLoaded) {
    return null;
  }

  const hasMinimumSetup =
    Boolean(setupData.nivel) &&
    Boolean(setupData.foco) &&
    Boolean(setupData.disponibilidade) &&
    setupData.materias.length > 0 &&
    setupData.diasDisponiveis.length > 0;

  if (!hasMinimumSetup) {
    return <Redirect href="/setup" />;
  }

  if (!persistedSchedule || persistedSchedule.days.length === 0) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/home" />;
}