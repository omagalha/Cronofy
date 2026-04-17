import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetSnapshot } from './types';

const STORAGE_KEY = '@aprovai_widget_snapshot_v1';
// Lê snapshots antigos uma vez e migra para a nova chave.
const LEGACY_STORAGE_KEY = '@cronofy_widget_snapshot_v1';

export async function saveWidgetSnapshot(snapshot: WidgetSnapshot) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Erro ao salvar widget snapshot', error);
  }
}

export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const data =
      (await AsyncStorage.getItem(STORAGE_KEY)) ??
      (await AsyncStorage.getItem(LEGACY_STORAGE_KEY));
    if (!data) return null;
    await AsyncStorage.setItem(STORAGE_KEY, data);
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    return JSON.parse(data);
  } catch (error) {
    console.warn('Erro ao carregar widget snapshot', error);
    return null;
  }
}

export async function clearWidgetSnapshot() {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, LEGACY_STORAGE_KEY]);
  } catch (error) {
    console.warn('Erro ao limpar widget snapshot', error);
  }
}
