import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { solicitarJson } from './http';

export function obtenerBaseApi(): string {
  const configurada = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configurada) return configurada;
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000`;
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  }
  throw new Error('Falta configurar EXPO_PUBLIC_API_URL para este build.');
}

export function solicitarApi<T>(ruta: string, opciones: RequestInit = {}, token?: string) {
  return solicitarJson<T>(obtenerBaseApi(), ruta, opciones, token);
}
