import type { Resena } from '@/types/business';
import { solicitarApi } from './api';
import { listarTodo, json, tokenObligatorio } from './api-listas';

type ResenaApi = Omit<Resena, 'usuarioNombre'>;
const adaptar = (r: ResenaApi): Resena => ({...r, usuarioNombre: `Usuario ${r.usuarioId}`});

export async function obtenerResenasPorComercio(comercioId: string): Promise<Resena[]> {
  const datos = await listarTodo<ResenaApi>(`/comercios/${encodeURIComponent(comercioId)}/resenas`);
  return datos.map(adaptar).sort((a,b) => b.creadaEn.localeCompare(a.creadaEn));
}

export async function crearResena(comercioId: string, estrellas: number, comentario: string): Promise<Resena> {
  const token = await tokenObligatorio();
  const r = await solicitarApi<ResenaApi>(`/comercios/${encodeURIComponent(comercioId)}/resenas`, json('POST', { estrellas, comentario }), token);
  return adaptar(r.datos);
}

export async function editarResena(id: string, estrellas: number, comentario: string): Promise<Resena> {
  const r = await solicitarApi<ResenaApi>(`/resenas/${encodeURIComponent(id)}`, json('PATCH',{estrellas,comentario}), await tokenObligatorio());
  return adaptar(r.datos);
}

export async function borrarResena(id: string): Promise<void> {
  await solicitarApi<void>(`/resenas/${encodeURIComponent(id)}`, json('DELETE'), await tokenObligatorio());
}

export async function reportarResena(id: string): Promise<Resena> {
  const r = await solicitarApi<ResenaApi>(`/resenas/${encodeURIComponent(id)}/reportes`, json('POST'), await tokenObligatorio());
  return adaptar(r.datos);
}
