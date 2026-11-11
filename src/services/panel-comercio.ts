import type { Comercio, Coordenadas, Horario, Resena } from '@/types/business';
import type { Promocion, UsoDePromocion } from '@/types/promociones';
import { solicitarApi } from './api';
import { json, listarTodo, tokenObligatorio } from './api-listas';
import { obtenerResenasPorComercio } from './reviews';

export interface DatosPromocion {
  titulo: string; detalle: string; descuento: number | null; hasta: string; soloApp: boolean;
  desde?: string; imagenUrl?: string | null;
}
export interface DatosComercio {
  descripcion: string; direccion: string; coordenadas: Coordenadas;
  telefono: string | null; whatsapp: string | null; instagram: string | null;
  mediosDePago: string[]; imagenes: string[]; videoUrl: string | null;
}

export async function listarMisPromociones(comercioId: string): Promise<Promocion[]> {
  void comercioId;
  return listarTodo<Promocion>('/mi-comercio/promociones', true);
}
export async function obtenerMiPromocion(comercioId: string, id: string): Promise<Promocion> {
  const lista = await listarMisPromociones(comercioId);
  const promo = lista.find(p => p.id === id);
  if (!promo) throw new Error('Promoción no encontrada en tu comercio.');
  return promo;
}
export async function crearPromocion(comercioId: string, datos: DatosPromocion): Promise<Promocion> {
  void comercioId;
  return (await solicitarApi<Promocion>('/mi-comercio/promociones', json('POST',datos), await tokenObligatorio())).datos;
}
export async function editarPromocion(comercioId: string, id: string, datos: DatosPromocion): Promise<Promocion> {
  void comercioId;
  return (await solicitarApi<Promocion>(`/mi-comercio/promociones/${encodeURIComponent(id)}`, json('PATCH',datos), await tokenObligatorio())).datos;
}
export async function darDeBajaPromocion(comercioId: string, id: string): Promise<void> {
  void comercioId;
  await solicitarApi<void>(`/mi-comercio/promociones/${encodeURIComponent(id)}`, json('DELETE'), await tokenObligatorio());
}
export async function validarCodigo(comercioId: string, codigoLeido: string): Promise<{promocion: Promocion | null; uso: UsoDePromocion}> {
  void comercioId;
  const uso = (await solicitarApi<UsoDePromocion>('/mi-comercio/usos/validar',json('POST',{codigo:codigoLeido.trim()}),await tokenObligatorio())).datos;
  try {
    const promociones = await listarMisPromociones('');
    return {promocion: promociones.find(p => p.id === uso.promocionId) ?? null, uso};
  } catch {
    return {promocion: null, uso};
  }
}

export async function obtenerMiComercio(comercioId: string): Promise<Comercio> {
  void comercioId;
  return (await solicitarApi<Comercio>('/mi-comercio', {}, await tokenObligatorio())).datos;
}
export async function editarMiComercio(comercioId: string, cambios: DatosComercio): Promise<Comercio> {
  void comercioId;
  return (await solicitarApi<Comercio>('/mi-comercio', json('PATCH',cambios),await tokenObligatorio())).datos;
}
export async function editarMisHorarios(comercioId: string, horarios: Horario[]): Promise<Comercio> {
  void comercioId;
  return (await solicitarApi<Comercio>('/mi-comercio',json('PATCH',{horarios}),await tokenObligatorio())).datos;
}
export async function listarMisRenas(comercioId: string): Promise<Resena[]> {
  return obtenerResenasPorComercio(comercioId);
}
export async function responderResena(comercioId: string, resenaId: string, respuesta: string): Promise<Resena> {
  void comercioId;
  return (await solicitarApi<Resena>(`/resenas/${encodeURIComponent(resenaId)}/respuesta`, json('POST',{respuesta}),await tokenObligatorio())).datos;
}
export async function reportarResena(resenaId: string): Promise<Resena> {
  return (await solicitarApi<Resena>(`/resenas/${encodeURIComponent(resenaId)}/reportes`, json('POST'),await tokenObligatorio())).datos;
}

export async function agregarImagen(uriLocal: string): Promise<string> {
  const mime = /\.png(?:[?#]|$)/i.test(uriLocal) ? 'image/png' : /\.webp(?:[?#]|$)/i.test(uriLocal) ? 'image/webp' : 'image/jpeg';
  return subirArchivo(uriLocal,mime);
}
export async function subirVideo(uriLocal: string): Promise<string> { return subirArchivo(uriLocal,'video/mp4'); }
async function subirArchivo(uri: string, mime: string): Promise<string> {
  const token = await tokenObligatorio();
  const { obtenerBaseApi } = await import('./api');
  const datos = new FormData();
  const nombre = uri.split('/').pop() || (mime.startsWith('image') ? 'foto.jpg' : 'video.mp4');
  datos.append('archivo', { uri, name: nombre, type: mime } as unknown as Blob);
  const respuesta = await fetch(`${obtenerBaseApi().replace(/\/$/,'')}/archivos`, {
    method:'POST', headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}, body:datos,
  });
  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !cuerpo?.datos?.url) throw new Error(cuerpo?.error?.mensaje ?? 'No se pudo subir el archivo.');
  return cuerpo.datos.url as string;
}
