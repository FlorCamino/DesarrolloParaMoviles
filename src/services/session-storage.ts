import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { Sesion } from "@/types/auth";

const SESSION_KEY = "auth_session";

function esSesionValida(value: unknown): value is Sesion {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const sesion = value as Sesion;

  return (
    typeof sesion.token === "string" &&
    typeof sesion.usuario?.id === "string" &&
    typeof sesion.usuario?.nombre === "string" &&
    typeof sesion.usuario?.email === "string"
  );
}

export async function guardarSesion(sesion: Sesion): Promise<void> {
  const valor = JSON.stringify(sesion);

  if (Platform.OS === "web") {
    await AsyncStorage.setItem(SESSION_KEY, valor);
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, valor);
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const valor =
    Platform.OS === "web"
      ? await AsyncStorage.getItem(SESSION_KEY)
      : await SecureStore.getItemAsync(SESSION_KEY);

  if (!valor) {
    return null;
  }

  try {
    const data: unknown = JSON.parse(valor);

    if (!esSesionValida(data)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function eliminarSesion(): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}
