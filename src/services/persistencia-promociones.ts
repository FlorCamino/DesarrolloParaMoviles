import Almacenamiento from 'expo-sqlite/kv-store';
import { CachePromociones, PreferenciasPromociones } from '@/types/promociones';

const CLAVE_PREFERENCIAS = 'promociones:preferencias:v1';
const CLAVE_CACHE = 'promociones:cache:v1';

const PREFERENCIAS_INICIALES: PreferenciasPromociones = {
  promocionesGuardadas: [],
  comerciosFavoritos: [],
  rubrosDeInteres: [],
  avisosActivos: false,
};

export async function leerPreferencias(
  preferenciasDelUsuario: Partial<PreferenciasPromociones> = {},
): Promise<PreferenciasPromociones> {
  const guardado = await Almacenamiento.getItem(CLAVE_PREFERENCIAS);
  const iniciales = { ...PREFERENCIAS_INICIALES, ...preferenciasDelUsuario };
  if (!guardado) return iniciales;

  try {
    return { ...iniciales, ...JSON.parse(guardado) };
  } catch {
    return iniciales;
  }
}

export async function guardarPreferencias(
  preferencias: PreferenciasPromociones,
): Promise<void> {
  await Almacenamiento.setItem(CLAVE_PREFERENCIAS, JSON.stringify(preferencias));
}

export async function guardarCachePromociones(cache: CachePromociones): Promise<void> {
  await Almacenamiento.setItem(CLAVE_CACHE, JSON.stringify(cache));
}

export async function leerCachePromociones(): Promise<CachePromociones | null> {
  const guardado = await Almacenamiento.getItem(CLAVE_CACHE);
  if (!guardado) return null;

  try {
    return JSON.parse(guardado) as CachePromociones;
  } catch {
    return null;
  }
}
