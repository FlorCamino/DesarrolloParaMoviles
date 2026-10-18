import * as SecureStore from 'expo-secure-store';

import type { Sesion } from '@/types/auth';

const SESSION_KEY = 'auth_session';

export async function guardarSesion(
  sesion: Sesion
): Promise<void> {
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify(sesion)
  );
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const value = await SecureStore.getItemAsync(SESSION_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as Sesion;
}

export async function eliminarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}