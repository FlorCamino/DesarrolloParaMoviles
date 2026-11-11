import Almacenamiento from 'expo-sqlite/kv-store';
import { CachePromociones, PreferenciasPromociones } from '@/types/promociones';

const PREFIJO_PREFERENCIAS = 'promociones:preferencias:v2:';

function clavePreferencias(usuarioId: string): string {
  if (!usuarioId.trim()) throw new Error('Es necesario iniciar sesión.');
  return `${PREFIJO_PREFERENCIAS}${encodeURIComponent(usuarioId)}`;
}
const CLAVE_CACHE = 'promociones:cache:v1';

const PREFERENCIAS_INICIALES: PreferenciasPromociones = {
  promocionesGuardadas: [],
  comerciosFavoritos: [],
  rubrosDeInteres: [],
  avisosActivos: false,
};

export async function leerPreferencias(
  usuarioId: string,
  preferenciasDelUsuario: Partial<PreferenciasPromociones> = {},
): Promise<PreferenciasPromociones> {
  const guardado = await Almacenamiento.getItem(clavePreferencias(usuarioId));
  const iniciales = { ...PREFERENCIAS_INICIALES, ...preferenciasDelUsuario };
  if (!guardado) return iniciales;

  try {
    return { ...iniciales, ...JSON.parse(guardado) };
  } catch {
    return iniciales;
  }
}

export async function guardarPreferencias(
  usuarioId: string,
  preferencias: PreferenciasPromociones,
): Promise<void> {
  await Almacenamiento.setItem(clavePreferencias(usuarioId), JSON.stringify(preferencias));
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
