import AsyncStorage from "@react-native-async-storage/async-storage";

const CLAVE_FAVORITOS = "directorio-comercios:favoritos";

function normalizarFavoritos(valor: unknown): string[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  const ids = valor.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0,
  );

  return [...new Set(ids.map((id) => id.trim()))];
}

export async function obtenerFavoritos(): Promise<string[]> {
  const datos = await AsyncStorage.getItem(CLAVE_FAVORITOS);

  if (datos === null) {
    return [];
  }

  try {
    const favoritos: unknown = JSON.parse(datos);
    return normalizarFavoritos(favoritos);
  } catch {
    return [];
  }
}

export async function guardarFavoritos(ids: string[]): Promise<void> {
  const favoritos = normalizarFavoritos(ids);

  await AsyncStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
}

export async function alternarFavorito(comercioId: string): Promise<string[]> {
  const id = comercioId.trim();

  if (!id) {
    throw new Error("El ID del comercio no puede estar vacío.");
  }

  const actuales = await obtenerFavoritos();

  const actualizados = actuales.includes(id)
    ? actuales.filter((favoritoId) => favoritoId !== id)
    : [...actuales, id];

  await guardarFavoritos(actualizados);

  return actualizados;
}
