import { solicitarApi } from './api';
import { obtenerSesion } from './session-storage';

export async function listarTodo<T>(ruta: string, autenticado = false): Promise<T[]> {
  const token = autenticado ? (await obtenerSesion())?.token : undefined;
  if (autenticado && !token) throw new Error('Iniciá sesión para realizar esta operación.');
  const resultado: T[] = [];
  const separador = ruta.includes('?') ? '&' : '?';
  for (let pagina = 1; pagina <= 100; pagina++) {
    const respuesta = await solicitarApi<T[]>(`${ruta}${separador}pagina=${pagina}&porPagina=100`, {}, token);
    resultado.push(...respuesta.datos);
    if (!respuesta.meta || resultado.length >= respuesta.meta.total || respuesta.datos.length === 0) return resultado;
  }
  throw new Error('El listado supera el límite de páginas admitido.');
}

export async function tokenObligatorio(): Promise<string> {
  const token = (await obtenerSesion())?.token;
  if (!token) throw new Error('Iniciá sesión para realizar esta operación.');
  return token;
}

export const json = (method: string, valor?: unknown): RequestInit => ({
  method,
  ...(valor === undefined ? {} : { body: JSON.stringify(valor) }),
});
