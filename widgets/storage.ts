import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetSnapshot } from './types';

const STORAGE_KEY = '@cronofy_widget_snapshot_v1';

export async function saveWidgetSnapshot(snapshot: WidgetSnapshot) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Erro ao salvar widget snapshot', error);
  }
}

export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.warn('Erro ao carregar widget snapshot', error);
    return null;
  }
}

export async function clearWidgetSnapshot() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Erro ao limpar widget snapshot', error);
  }
}