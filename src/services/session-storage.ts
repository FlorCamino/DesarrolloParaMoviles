import * as SecureStore from 'expo-secure-store';

import type { Sesion } from '@/types/auth';

const SESSION_KEY = 'auth_session';

function esSesionValida(value: unknown): value is Sesion {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const sesion = value as Sesion;

  return (
    typeof sesion.token === 'string' &&
    typeof sesion.usuario?.id === 'string' &&
    typeof sesion.usuario?.nombre === 'string' &&
    typeof sesion.usuario?.email === 'string'
  );
}

export async function guardarSesion(
  sesion: Sesion
): Promise<void> {
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify(sesion)
  );
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const value =
    await SecureStore.getItemAsync(SESSION_KEY);

  if (!value) {
    return null;
  }

  try {
    const data: unknown = JSON.parse(value);

    if (!esSesionValida(data)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function eliminarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}