import type { ComercioResumen, ModoDemo, Promocion, RespuestaApi, Rubro, UsoDePromocion } from '@/types/promociones';
import type { Comercio } from '@/types/business';
import { solicitarApi } from './api';
import { json, listarTodo, tokenObligatorio } from './api-listas';
import { ordenarPromociones } from '@/utils/promociones';

export class ErrorApi extends Error {
  constructor(public codigo: string, mensaje: string) { super(mensaje); this.name = 'ErrorApi'; }
}

export async function listarPromociones(modo: ModoDemo = 'normal'): Promise<RespuestaApi<Promocion[]>> {
  if (modo === 'error') throw new ErrorApi('SIN_CONEXION', 'No pudimos actualizar las promociones.');
  if (modo === 'vacio') return { datos: [], meta: { total: 0, pagina: 1, porPagina: 20 } };
  const [vigentes, proximas] = await Promise.all([
    listarTodo<Promocion>('/promociones?estado=vigentes'),
    listarTodo<Promocion>('/promociones?estado=proximas'),
  ]);
  const todas = ordenarPromociones([...new Map([...vigentes, ...proximas].map(p => [p.id, p])).values()]);
  return { datos: todas, meta: { total: todas.length, pagina: 1, porPagina: todas.length } };
}

export async function obtenerPromocion(id: string): Promise<Promocion> {
  return (await solicitarApi<Promocion>(`/promociones/${encodeURIComponent(id)}`)).datos;
}

export async function listarRubros(): Promise<Rubro[]> {
  return (await listarTodo<Rubro>('/rubros')).sort((a,b) => a.orden - b.orden);
}

export async function listarComerciosResumen(): Promise<ComercioResumen[]> {
  const comercios = await listarTodo<Comercio>('/comercios');
  return comercios.map(({id,nombre,rubroId,direccion}) => ({id,nombre,rubroId,direccion}));
}

export async function obtenerCodigoDeUso(promocionId: string, usuarioId: string): Promise<UsoDePromocion> {
  const token = await tokenObligatorio();
  void usuarioId;
  return (await solicitarApi<UsoDePromocion>(`/promociones/${encodeURIComponent(promocionId)}/usos`, json('POST'), token)).datos;
}

export async function obtenerPromocionesVigentesPorComercio(comercioId: string): Promise<Promocion[]> {
  return listarTodo<Promocion>(`/promociones?estado=vigentes&comercioId=${encodeURIComponent(comercioId)}`);
}
